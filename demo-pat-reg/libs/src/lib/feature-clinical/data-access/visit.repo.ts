import { visits, patients } from '../../schemas/index.js';
import { desc, eq, ilike, or, count } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';

/**
 * The minimal db interface required by this repository.
 *
 * Typed as the return of `drizzle()` — the concrete Postgres adapter at runtime,
 * but any compatible adapter (SQLite, libSQL, IndexedDB shim) can be injected
 * instead, enabling offline / local-first use-cases without touching this file.
 */
export type VisitRepoDb = ReturnType<typeof drizzle>;

export const listVisits = async (
  db: VisitRepoDb,
  searchOptions: {
    search?: string;
    limit: number;
    offset: number;
  },
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
