import express from 'express';
import cors from 'cors';
import { handleListVisits, globalErrorHandler } from '@demo-pat-reg/shared';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Hello API' });
});

// Visits API
app.get('/api/visits', handleListVisits);

// Global error handler — must be registered LAST, after all routes
app.use(globalErrorHandler);

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`); // eslint-disable-line no-console
});

