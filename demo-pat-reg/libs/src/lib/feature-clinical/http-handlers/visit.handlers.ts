import { Request, Response, RequestHandler } from 'express';
import { ListVisitsRequestSchema } from '../../contracts/clinical.contracts.js';
import { listRecentVisits } from '../use-cases/list-recent-visits.js';
import { asyncHandler } from '../../backend/core/async-handler.js';
import { db } from '../../backend/db.js';

export const handleListVisits: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const validatedQuery = ListVisitsRequestSchema.parse(req.query);
  const result = await listRecentVisits(db, validatedQuery);
  res.json(result);
});
