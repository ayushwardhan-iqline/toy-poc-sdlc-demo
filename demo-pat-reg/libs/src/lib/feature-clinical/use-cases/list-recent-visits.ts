import { ListVisitsRequest, ListVisitsResponse, VisitStatusSchema } from '../../contracts/clinical.contracts.js';
import * as VisitRepo from '../data-access/visit.repo.js';

export const listRecentVisits = async (
  input: ListVisitsRequest
): Promise<ListVisitsResponse> => {
  const page = input.page || 1;
  const pageSize = input.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const result = await VisitRepo.listVisits({
    search: input.search,
    limit: pageSize,
    offset,
  });

  const totalPages = Math.ceil(result.total / pageSize);

  const mappedData = result.records.map((record) => {
    return {
      id: record.visit.id,
      visitNumber: record.visit.visitNumber,
      patientName: record.patient.name,
      visitDate: record.visit.createdAt.toISOString(),
      visitReason: record.visit.type, // Mapping 'type' to 'visitReason'
      visitStatus: VisitStatusSchema.parse(record.visit.status),
    };
  });

  return {
    data: mappedData,
    pagination: {
      total: result.total,
      page,
      pageSize,
      totalPages,
    },
  };
};
