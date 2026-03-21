import { Request, Response } from 'express';
import { z } from 'zod';
import { ListVisitsRequestSchema } from '../../contracts/clinical.contracts.js';
import { listRecentVisits } from '../use-cases/list-recent-visits.js';

export const handleListVisits = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedQuery = ListVisitsRequestSchema.parse(req.query);
    const result = await listRecentVisits(validatedQuery);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation Error', details: error.issues });
    } else {
      // eslint-disable-next-line no-console
      console.error('Error in handleListVisits:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
