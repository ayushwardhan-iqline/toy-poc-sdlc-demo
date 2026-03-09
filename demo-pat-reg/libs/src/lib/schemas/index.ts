import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const patients = pgTable('patients', {
  id: text('id').primaryKey(),
  salutation: text('salutation').notNull(),
  name: text('name').notNull(),
  gender: text('gender').notNull(),
  phoneNumber: text('phone_number').notNull(),
  address: text('address').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const visits = pgTable('visits', {
  id: text('id').primaryKey(),
  visitNumber: text('visit_number').notNull(),
  status: text('status').notNull().default('registered'),
  type: text('type').notNull(),
  patientId: text('patient_id')
    .notNull()
    .references(() => patients.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patients, {
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const selectPatientSchema = createSelectSchema(patients, {
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Patient = z.infer<typeof selectPatientSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export const insertVisitSchema = createInsertSchema(visits, {
  id: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const selectVisitSchema = createSelectSchema(visits, {
  id: z.string(),
  status: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Visit = z.infer<typeof selectVisitSchema>;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
