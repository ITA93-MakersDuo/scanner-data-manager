import { Request, Response } from 'express';
import { TagModel, TagSchema } from '../models';

export const tagController = {
  async getAll(req: Request, res: Response) {
    try {
      const tags = TagModel.findAll();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const tag = TagModel.findById(id);

      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }

      res.json(tag);
    } catch (error) {
      console.error('Error fetching tag:', error);
      res.status(500).json({ error: 'Failed to fetch tag' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const validatedData = TagSchema.omit({ id: true }).parse(req.body);

      // Check for duplicate name
      const existing = TagModel.findByName(validatedData.name);
      if (existing) {
        return res.status(409).json({ error: 'Tag with this name already exists' });
      }

      const tag = TagModel.create(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      console.error('Error creating tag:', error);
      res.status(500).json({ error: 'Failed to create tag' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const existingTag = TagModel.findById(id);

      if (!existingTag) {
        return res.status(404).json({ error: 'Tag not found' });
      }

      const validatedData = TagSchema.omit({ id: true }).partial().parse(req.body);

      // Check for duplicate name if name is being changed
      if (validatedData.name && validatedData.name !== existingTag.name) {
        const duplicate = TagModel.findByName(validatedData.name);
        if (duplicate) {
          return res.status(409).json({ error: 'Tag with this name already exists' });
        }
      }

      const tag = TagModel.update(id, validatedData);
      res.json(tag);
    } catch (error) {
      console.error('Error updating tag:', error);
      res.status(500).json({ error: 'Failed to update tag' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const tag = TagModel.findById(id);

      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }

      TagModel.delete(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting tag:', error);
      res.status(500).json({ error: 'Failed to delete tag' });
    }
  },
};
