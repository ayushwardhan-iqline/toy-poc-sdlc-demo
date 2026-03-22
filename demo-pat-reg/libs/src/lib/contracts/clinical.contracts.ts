import { z } from 'zod';

export const VisitStatusSchema = z.enum(['registered', 'in-progress', 'completed', 'cancelled']);
export type VisitStatus = z.infer<typeof VisitStatusSchema>;

export const ListVisitsRequestSchema = z.object({
  search: z.string().max(255).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
export type ListVisitsRequest = z.infer<typeof ListVisitsRequestSchema>;

export const VisitSummarySchema = z.object({
  id: z.string(),
  visitNumber: z.string(),
  patientName: z.string(),
  visitDate: z.string().datetime(),
  visitReason: z.string().nullable(),
  visitStatus: VisitStatusSchema,
});
export type VisitSummary = z.infer<typeof VisitSummarySchema>;

export const ListVisitsResponseSchema = z.object({
  data: z.array(VisitSummarySchema),
  pagination: z.object({
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalPages: z.number().int().min(0),
  }),
});
export type ListVisitsResponse = z.infer<typeof ListVisitsResponseSchema>;
