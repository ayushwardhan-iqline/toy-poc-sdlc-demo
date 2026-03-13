import express from 'express';
import cors from 'cors';
import { patients, visits, insertPatientSchema, insertVisitSchema, db } from '@demo-pat-reg/shared';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Hello API' });
});

// Patients API
app.get('/api/patients', async (_req, res) => {
  try {
    const allPatients = await db.select().from(patients);
    res.json(allPatients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const validatedData = insertPatientSchema.parse(req.body);
    const patientData = {
      id: crypto.randomUUID(),
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertedPatient = await db
      .insert(patients)
      .values(patientData)
      .returning();
    res.json(insertedPatient[0]);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Visits API
app.get('/api/visits', async (_req, res) => {
  try {
    const allVisits = await db.select().from(visits);
    res.json(allVisits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

app.post('/api/visits', async (req, res) => {
  try {
    const validatedData = insertVisitSchema.parse(req.body);
    const visitData = {
      id: crypto.randomUUID(),
      ...validatedData,
      status: 'registered',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertedVisit = await db
      .insert(visits)
      .values(visitData)
      .returning();
    res.json(insertedVisit[0]);
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
