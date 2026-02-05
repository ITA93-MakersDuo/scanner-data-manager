import { Request, Response } from 'express';
import { ScanModel, ScanSchema, ScanUpdateSchema, ScanVersionModel } from '../models';
import { uploadFile, getPublicUrl, deleteFile } from '../config/storage';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const CONTENT_TYPES: Record<string, string> = {
  stl: 'model/stl',
  ply: 'application/x-ply',
  obj: 'text/plain',
  step: 'model/step',
  stp: 'model/step',
  iges: 'model/iges',
  igs: 'model/iges',
};

export const scanController = {
  async getAll(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const { limit = '50', offset = '0', project_id, search } = req.query;

      const scans = await ScanModel.findAll({
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        project_id: project_id ? parseInt(project_id as string, 10) : undefined,
        search: search as string | undefined,
        user_id: userId,
      });

      const total = await ScanModel.count({
        project_id: project_id ? parseInt(project_id as string, 10) : undefined,
        search: search as string | undefined,
        user_id: userId,
      });

      res.json({
        data: scans,
        pagination: {
          total,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        },
      });
    } catch (error) {
      console.error('Error fetching scans:', error);
      res.status(500).json({ error: 'Failed to fetch scans' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const id = parseInt(req.params.id, 10);
      const scan = await ScanModel.findById(id);

      if (!scan || scan.user_id !== userId) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      const versions = await ScanVersionModel.findByScanId(id);
      res.json({ ...scan, versions });
    } catch (error) {
      console.error('Error fetching scan:', error);
      res.status(500).json({ error: 'Failed to fetch scan' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const userName = authReq.user!.name;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const mainFile = files?.file?.[0];

      if (!mainFile) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Fix multer's latin1 encoding for Japanese/non-ASCII filenames
      const originalFilename = Buffer.from(mainFile.originalname, 'latin1').toString('utf8');
      const fileExt = path.extname(originalFilename).toLowerCase().slice(1);
      const allowedFormats = ['stl', 'ply', 'step', 'stp', 'iges', 'igs', 'obj'];

      if (!allowedFormats.includes(fileExt)) {
        fs.unlinkSync(mainFile.path);
        return res.status(400).json({ error: `Invalid file format. Allowed: ${allowedFormats.join(', ')}` });
      }

      // Check for duplicate object_name
      const objectName = req.body.object_name || originalFilename.replace(/\.[^/.]+$/, '');
      const isDuplicate = await ScanModel.findByNameAndUser(objectName, userId);
      if (isDuplicate) {
        fs.unlinkSync(mainFile.path);
        if (files?.thumbnail?.[0]) fs.unlinkSync(files.thumbnail[0].path);
        return res.status(409).json({ error: `同じ名称「${objectName}」のスキャンが既に存在します` });
      }

      // Upload 3D file
      const storagePath = `${uuidv4()}.${fileExt}`;
      const fileBuffer = fs.readFileSync(mainFile.path);
      await uploadFile(storagePath, fileBuffer, mainFile.mimetype || 'application/octet-stream');
      fs.unlinkSync(mainFile.path);

      // Upload thumbnail if provided
      let thumbnailPath: string | null = null;
      const thumbFile = files?.thumbnail?.[0];
      if (thumbFile) {
        thumbnailPath = `thumbs/${uuidv4()}.png`;
        const thumbBuffer = fs.readFileSync(thumbFile.path);
        await uploadFile(thumbnailPath, thumbBuffer, 'image/png');
        fs.unlinkSync(thumbFile.path);
      }

      const scanData = {
        filename: originalFilename,
        object_name: objectName,
        scan_date: req.body.scan_date || null,
        notes: req.body.notes || null,
        scanner_model: req.body.scanner_model || null,
        resolution: req.body.resolution || null,
        accuracy: req.body.accuracy || null,
        file_path: storagePath,
        file_format: fileExt.toUpperCase(),
        file_size: mainFile.size,
        thumbnail_path: thumbnailPath,
        current_version: 1,
        project_id: req.body.project_id ? parseInt(req.body.project_id, 10) : null,
        created_by: userName,
        user_id: userId,
      };

      const validatedData = ScanSchema.omit({ id: true }).parse(scanData);
      const scan = await ScanModel.create(validatedData);

      await ScanVersionModel.create({
        scan_id: scan!.id!,
        version_number: 1,
        file_path: storagePath,
        file_size: mainFile.size,
        change_notes: 'Initial upload',
      });

      if (req.body.tags) {
        const tagIds = JSON.parse(req.body.tags);
        if (Array.isArray(tagIds)) {
          await ScanModel.setTags(scan!.id!, tagIds);
        }
      }

      const createdScan = await ScanModel.findById(scan!.id!);
      res.status(201).json(createdScan);
    } catch (error) {
      console.error('Error creating scan:', error);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      if (files?.file?.[0] && fs.existsSync(files.file[0].path)) fs.unlinkSync(files.file[0].path);
      if (files?.thumbnail?.[0] && fs.existsSync(files.thumbnail[0].path)) fs.unlinkSync(files.thumbnail[0].path);
      res.status(500).json({ error: 'Failed to create scan' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const id = parseInt(req.params.id, 10);
      const existingScan = await ScanModel.findById(id);

      if (!existingScan || existingScan.user_id !== userId) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      const updateData = ScanUpdateSchema.parse(req.body);
      await ScanModel.update(id, updateData);

      if (req.body.tags !== undefined) {
        const tagIds = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
        await ScanModel.setTags(id, tagIds);
      }

      const updatedScan = await ScanModel.findById(id);
      res.json(updatedScan);
    } catch (error) {
      console.error('Error updating scan:', error);
      res.status(500).json({ error: 'Failed to update scan' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const id = parseInt(req.params.id, 10);
      const scan = await ScanModel.findById(id);

      if (!scan || scan.user_id !== userId) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      await deleteFile(scan.file_path);
      if (scan.thumbnail_path) await deleteFile(scan.thumbnail_path);

      const versions = await ScanVersionModel.findByScanId(id);
      for (const version of versions) {
        await deleteFile(version.file_path);
      }

      await ScanModel.delete(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting scan:', error);
      res.status(500).json({ error: 'Failed to delete scan' });
    }
  },

  async uploadNewVersion(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.id;
      const id = parseInt(req.params.id, 10);
      const existingScan = await ScanModel.findById(id);

      if (!existingScan || existingScan.user_id !== userId) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileExt = path.extname(req.file.originalname).toLowerCase().slice(1);
      const storagePath = `${uuidv4()}.${fileExt}`;
      const fileBuffer = fs.readFileSync(req.file.path);
      await uploadFile(storagePath, fileBuffer, req.file.mimetype || 'application/octet-stream');
      fs.unlinkSync(req.file.path);

      const currentVersion = await ScanVersionModel.getLatestVersion(id);
      const newVersionNumber = currentVersion + 1;

      await ScanVersionModel.create({
        scan_id: id,
        version_number: newVersionNumber,
        file_path: storagePath,
        file_size: req.file.size,
        change_notes: req.body.change_notes || `Version ${newVersionNumber}`,
      });

      await ScanModel.update(id, { current_version: newVersionNumber });

      const updatedScan = await ScanModel.findById(id);
      res.json(updatedScan);
    } catch (error) {
      console.error('Error uploading new version:', error);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Failed to upload new version' });
    }
  },

  async serveFile(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const scan = await ScanModel.findById(id);
      if (!scan) return res.status(404).json({ error: 'Scan not found' });

      const publicUrl = getPublicUrl(scan.file_path);
      const response = await fetch(publicUrl);
      if (!response.ok) return res.status(502).json({ error: 'Failed to fetch file' });

      const ext = scan.file_format.toLowerCase();
      res.setHeader('Content-Type', CONTENT_TYPES[ext] || 'application/octet-stream');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ error: 'Failed to serve file' });
    }
  },

  async serveThumbnail(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const scan = await ScanModel.findById(id);
      if (!scan || !scan.thumbnail_path) return res.status(404).json({ error: 'Thumbnail not found' });

      const publicUrl = getPublicUrl(scan.thumbnail_path);
      const response = await fetch(publicUrl);
      if (!response.ok) return res.status(404).json({ error: 'Thumbnail not found' });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Error serving thumbnail:', error);
      res.status(500).json({ error: 'Failed to serve thumbnail' });
    }
  },

  async download(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const scan = await ScanModel.findById(id);
      if (!scan) return res.status(404).json({ error: 'Scan not found' });

      const publicUrl = getPublicUrl(scan.file_path);
      const response = await fetch(publicUrl);
      if (!response.ok) return res.status(502).json({ error: 'Failed to fetch file' });

      const encodedFilename = encodeURIComponent(scan.filename || `scan_${id}`);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      res.setHeader('Content-Type', 'application/octet-stream');
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Error downloading scan:', error);
      res.status(500).json({ error: 'Failed to download scan' });
    }
  },

  async getFileUrl(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const scan = await ScanModel.findById(id);
      if (!scan) return res.status(404).json({ error: 'Scan not found' });

      const publicUrl = getPublicUrl(scan.file_path);
      res.json({ url: publicUrl });
    } catch (error) {
      console.error('Error getting file URL:', error);
      res.status(500).json({ error: 'Failed to get file URL' });
    }
  },
};
