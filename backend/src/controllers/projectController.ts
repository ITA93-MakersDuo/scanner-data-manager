import { Request, Response } from 'express';
import { ProjectModel, ProjectSchema } from '../models';

export const projectController = {
  async getAll(req: Request, res: Response) {
    try {
      const projects = await ProjectModel.findAll();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const project = await ProjectModel.findById(id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const validatedData = ProjectSchema.omit({ id: true }).parse(req.body);

      const existing = await ProjectModel.findByName(validatedData.name);
      if (existing) {
        return res.status(409).json({ error: 'Project with this name already exists' });
      }

      const project = await ProjectModel.create(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const existingProject = await ProjectModel.findById(id);

      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const validatedData = ProjectSchema.omit({ id: true }).partial().parse(req.body);

      if (validatedData.name && validatedData.name !== existingProject.name) {
        const duplicate = await ProjectModel.findByName(validatedData.name);
        if (duplicate) {
          return res.status(409).json({ error: 'Project with this name already exists' });
        }
      }

      const project = await ProjectModel.update(id, validatedData);
      res.json(project);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const project = await ProjectModel.findById(id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      await ProjectModel.delete(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  },
};
