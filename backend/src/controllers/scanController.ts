import { Request, Response } from 'express';
import { ScanModel, ScanSchema, ScanUpdateSchema, ScanVersionModel } from '../models';
import { uploadFile, getPublicUrl, deleteFile } from '../config/storage';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const scanController = {
  async getAll(req: Request, res: Response) {
    try {
      const { limit = '50', offset = '0', project_id, search } = req.query;

      const scans = await ScanModel.findAll({
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        project_id: project_id ? parseInt(project_id as string, 10) : undefined,
        search: search as string | undefined,
      });

      const total = await ScanModel.count({
        project_id: project_id ? parseInt(project_id as string, 10) : undefined,
        search: search as string | undefined,
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
      const id = parseInt(req.params.id, 10);
      const scan = await ScanModel.findById(id);

      if (!scan) {
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
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileExt = path.extname(req.file.originalname).toLowerCase().slice(1);
      const allowedFormats = ['stl', 'ply', 'step', 'stp', 'iges', 'igs', 'obj'];

      if (!allowedFormats.includes(fileExt)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: `Invalid file format. Allowed: ${allowedFormats.join(', ')}` });
      }

      // Upload to Supabase Storage
      const storagePath = `${uuidv4()}.${fileExt}`;
      const fileBuffer = fs.readFileSync(req.file.path);
      await uploadFile(storagePath, fileBuffer, req.file.mimetype || 'application/octet-stream');

      // Remove temp file
      fs.unlinkSync(req.file.path);

      const scanData = {
        filename: req.file.originalname,
        object_name: req.body.object_name || req.file.originalname.replace(/\.[^/.]+$/, ''),
        scan_date: req.body.scan_date || null,
        notes: req.body.notes || null,
        scanner_model: req.body.scanner_model || null,
        resolution: req.body.resolution || null,
        accuracy: req.body.accuracy || null,
        file_path: storagePath,
        file_format: fileExt.toUpperCase(),
        file_size: req.file.size,
        thumbnail_path: null,
        current_version: 1,
        project_id: req.body.project_id ? parseInt(req.body.project_id, 10) : null,
        created_by: req.body.created_by || null,
      };

      const validatedData = ScanSchema.omit({ id: true }).parse(scanData);
      const scan = await ScanModel.create(validatedData);

      // Create initial version record
      await ScanVersionModel.create({
        scan_id: scan!.id!,
        version_number: 1,
        file_path: storagePath,
        file_size: req.file.size,
        change_notes: 'Initial upload',
      });

      // Handle tags if provided
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
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to create scan' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const existingScan = await ScanModel.findById(id);

      if (!existingScan) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      const updateData = ScanUpdateSchema.parse(req.body);
      await ScanModel.update(id, updateData);

      // Handle tags if provided
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
      const id = parseInt(req.params.id, 10);
      const scan = await ScanModel.findById(id);

      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      // Delete file from Supabase Storage
      await deleteFile(scan.file_path);

      // Delete version files
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
      const id = parseInt(req.params.id, 10);
      const existingScan = await ScanModel.findById(id);

      if (!existingScan) {
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
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to upload new version' });
    }
  },

  async download(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const scan = await ScanModel.findById(id);

      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      const publicUrl = getPublicUrl(scan.file_path);
      res.redirect(publicUrl);
    } catch (error) {
      console.error('Error downloading scan:', error);
      res.status(500).json({ error: 'Failed to download scan' });
    }
  },

  async getFileUrl(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const scan = await ScanModel.findById(id);

      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      const publicUrl = getPublicUrl(scan.file_path);
      res.json({ url: publicUrl });
    } catch (error) {
      console.error('Error getting file URL:', error);
      res.status(500).json({ error: 'Failed to get file URL' });
    }
  },
};
