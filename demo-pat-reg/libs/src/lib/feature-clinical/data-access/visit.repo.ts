import { db } from '../../backend/db.js';
import { visits, patients } from '../../schemas/index.js';
import { desc, eq, ilike, or, count } from 'drizzle-orm';

export const listVisits = async (
  searchOptions: {
    search?: string;
    limit: number;
    offset: number;
  }
) => {
  const conditions = searchOptions.search ? [
    or(
      ilike(patients.name, `%${searchOptions.search}%`),
      ilike(visits.visitNumber, `%${searchOptions.search}%`)
    )
  ] : [];

  const dataQuery = db
    .select({
      visit: visits,
      patient: patients,
    })
    .from(visits)
    .innerJoin(patients, eq(visits.patientId, patients.id))
    .where(conditions[0])
    .orderBy(desc(visits.createdAt))
    .limit(searchOptions.limit)
    .offset(searchOptions.offset);
    
  const countQuery = db
    .select({ count: count() })
    .from(visits)
    .innerJoin(patients, eq(visits.patientId, patients.id))
    .where(conditions[0]);

  const [records, totalResult] = await Promise.all([
    dataQuery,
    countQuery
  ]);

  return {
    records,
    total: totalResult[0].count
  };
};
