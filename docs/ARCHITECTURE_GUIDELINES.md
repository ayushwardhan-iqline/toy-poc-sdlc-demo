# Codebase Architecture & Design Reference

This document serves as the single source of truth for our backend architecture, API design patterns, and codebase organization. It is designed to be consumed by human developers and AI coding agents to ensure consistency, maintainability, and scalability across the repository.

---

## 1. Industry Standard Paradigms & Architecture

To establish a shared vocabulary, our architecture is a pragmatic fusion of several industry-standard patterns. 

1. **Vertical Slice Architecture:** Instead of grouping code by technical concerns (e.g., all controllers in one folder, all services in another), we group code by **Business Domain** (e.g., `feature-intake`, `feature-clinical`). This maximizes cohesion and allows entire features to be extracted into standalone microservices with near-zero refactoring.
2. **Clean Architecture / Ports & Adapters (Hexagonal):** We strictly separate core business logic from external delivery mechanisms (HTTP/Express) and infrastructure (Databases/Drizzle). The business logic dictates the rules; the database is merely a plugin.
3. **Task-Based (Intentful) APIs:** We reject standard noun-based CRUD (Create, Read, Update, Delete) APIs. Instead, APIs are modeled after real-world business intents and workflows (e.g., `POST /admit-patient` rather than `POST /visits`).
4. **Functional & Procedural Programming (FP):** We reject heavy Object-Oriented Programming (OOP) boilerplate. We do not use deep inheritance, abstract classes, or massive `Service` classes holding internal state (`this`). We rely on pure functions, immutable data pipelines, and explicit dependency passing.

---

## 2. Core Philosophies & Preferences

### A. Functions over Classes (No Service Bloat)
A traditional `PatientService` class inevitably grows to thousands of lines, becoming a git-conflict nightmare. In our codebase, **every API use-case gets its own file**. 
* **Bad:** `PatientService.ts` containing `admit`, `discharge`, `update`.
* **Good:** `admit-patient.ts`, `discharge-patient.ts`. 
This results in linear cognitive load: you open a file, and it does exactly one thing.

### B. The API Contract is King (No DB Schemas in the UI)
We never share Database schemas (Drizzle/SQL tables) with the frontend. Database tables contain implementation details (soft deletes, password hashes, foreign keys). We use **Zod** to define API Contracts. These Contracts define the *Input* and *Output* of our APIs and are the only types shared between the React SPA and the Express backend.

### C. SQL/ORM Logic is Hidden from Business Logic
Business logic files (`use-cases`) should read like a standard operating procedure manual. They must never contain SQL `JOIN`s, `WHERE` clauses, or ORM-specific syntax. All database interactions are abstracted behind Data Access (Repository) functions. If we switch from PostgreSQL to MongoDB, the business logic remains entirely untouched.

### D. Future-Proofing: Microservices & Local-First
Because features are vertically sliced into independent Nx libraries, moving a feature (e.g., "Reports") to its own microservice only requires creating a new Express app and importing the existing library. Furthermore, because our business logic is decoupled from both HTTP and the DB, we can achieve **Local-First architecture** in the future simply by passing local browser databases (like IndexedDB) into our use-cases instead of PostgreSQL repositories.

---

## 3. Codebase Organization (Nx Monorepo)

Our Nx monorepo strictly enforces dependency boundaries. Apps consume Libs. Libs do not consume Apps. Shared Libs cannot consume Backend Libs.

```text
monorepo-workspace/
├── apps/
│   ├── frontend-web/            # React SPA (Consumes libs/shared)
│   └── api-monolith/            # Express.js Server (Mounts routers, consumes libs/backend & features)
│
└── libs/
    ├── shared/                  # 🟢 SHARED ZONE: Safe for Frontend & Backend
    │   └── contracts/           # The API boundary. Zod schemas & TypeScript types. No DB code.
    │       ├── intake.contracts.ts
    │       └── clinical.contracts.ts
    │
    ├── backend/                 # 🔴 BACKEND CORE: Private to the Node.js environment
    │   ├── db/                  # Drizzle ORM configuration, migrations, and Table definitions
    │   │   └── schema.ts        # e.g., patients, visits, users tables
    │   └── core/                # Express cross-cutting middlewares (Auth, Roles, Error Handlers)
    │
    ├── feature-intake/          # 🔵 VERTICAL SLICE: Business Domain 1
    │   ├── use-cases/           # Pure business rules (One file per action)
    │   ├── data-access/         # Database queries (Drizzle/SQL)
    │   └── http-handlers/       # Express Request/Response parsers
    │
    └── feature-clinical/        # 🔵 VERTICAL SLICE: Business Domain 2
        ├── use-cases/
        ├── data-access/
        └── http-handlers/
```

### Layer Terminology & Responsibilities

1. **Contracts (`libs/shared/contracts/`)**: Define the exact shape of HTTP requests (`req.body`, `req.query`) and responses.
2. **Handlers (`http-handlers/`)**: The "Translators". They live at the edge. They extract data from Express `req`, validate it via Zod Contracts, pass the typed data to the Use Case, and format the Express `res`. **No business logic allowed.**
3. **Use Cases (`use-cases/`)**: The "Rulebooks". They enforce business rules, orchestrate workflows, and make decisions. They do not know about HTTP statuses or SQL syntax.
4. **Data Access / Repositories (`data-access/`)**: The "Librarians". They execute Drizzle/SQL queries. They do not enforce business rules. They just fetch or save data based on exactly what they are told.

---

## 4. Concrete Examples

> **Note:** The following examples use an HIMS (Hospital Information Management System) context to illustrate complex scenarios. However, these structural patterns apply to any domain (E-commerce, FinTech, SaaS).

### Example A: Intentful API & Complex Flow (Registering a Visit)
*Scenario:* A front desk user registers a patient. The system must accept either an existing patient ID OR new patient details. It must atomically create a Visit, but deny the action if the patient already has an open visit with the same doctor.

**1. The Shared Contract (Zod)**
```typescript
// libs/shared/contracts/intake.contracts.ts
import { z } from 'zod';

export const RegisterVisitSchema = z.object({
  patientId: z.string().optional(), 
  newPatientDetails: z.object({
    firstName: z.string(),
    phone: z.string(),
  }).optional(),
  departmentId: z.string(),
  doctorId: z.string(),
}).refine(data => data.patientId || data.newPatientDetails, {
  message: "Must provide either an existing patientId or newPatientDetails"
});

export type RegisterVisitInput = z.infer<typeof RegisterVisitSchema>;
```

**2. The Data Access (Procedural SQL wrappers)**
```typescript
// libs/feature-intake/data-access/visit.repo.ts
import { db } from '@my-org/backend/db';
import { visits } from '@my-org/backend/db/schema';
import { and, eq } from 'drizzle-orm';

export const findOpenVisit = async (patientId: string, doctorId: string) => {
  const result = await db.select().from(visits).where(
    and(
      eq(visits.patientId, patientId),
      eq(visits.doctorId, doctorId),
      eq(visits.status, 'OPEN')
    )
  );
  return result[0]; // Returns raw DB row or undefined
};
```

**3. The Use Case (Pure Procedural Business Logic)**
```typescript
// libs/feature-intake/use-cases/register-visit.ts
import { RegisterVisitInput } from '@my-org/shared/contracts';
import * as PatientRepo from '../data-access/patient.repo';
import * as VisitRepo from '../data-access/visit.repo';

// Notice how this reads like plain English. No SQL or HTTP logic.
export const registerVisit = async (input: RegisterVisitInput) => {
  let finalPatientId = input.patientId;

  // 1. Resolve Patient
  if (!finalPatientId && input.newPatientDetails) {
    const newPatient = await PatientRepo.createPatient(input.newPatientDetails);
    finalPatientId = newPatient.id;
  }

  // 2. Enforce Business Rule
  const existingVisit = await VisitRepo.findOpenVisit(finalPatientId!, input.doctorId);
  if (existingVisit) {
    throw new Error("Patient already has an open visit with this doctor.");
  }

  // 3. Execute Action
  return await VisitRepo.createVisit({
    patientId: finalPatientId!,
    doctorId: input.doctorId,
    status: 'OPEN',
  });
};
```

**4. The HTTP Handler**
```typescript
// libs/feature-intake/http-handlers/intake.handlers.ts
import { Request, Response, NextFunction } from 'express';
import { RegisterVisitSchema } from '@my-org/shared/contracts';
import { registerVisit } from '../use-cases/register-visit';

export const handleRegisterVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Validate boundary
    const payload = RegisterVisitSchema.parse(req.body);
    
    // 2. Call Use Case
    const visit = await registerVisit(payload);
    
    // 3. Return generic response
    res.status(201).json({ message: "Visit registered", data: visit });
  } catch (error) {
    next(error); // Global middleware catches Zod/Business errors
  }
};
```

### Example B: Shared Read/Query Flows (Dashboard Filters)
*Scenario:* Both Doctors and Frontdesk staff view a table of visits. Doctors only see their own by default, while Frontdesk sees all.

**Backend Principle:** The backend provides a generic, powerful search API. It does **not** hardcode "Doctor Defaults" vs "Frontdesk Defaults". Default filters are a UI concern.

**Data Access:**
```typescript
// libs/feature-intake/data-access/visit.repo.ts
export const listVisits = async (filters: { doctorId?: string; date?: string }) => {
  const conditions = [];
  if (filters.doctorId) conditions.push(eq(visits.doctorId, filters.doctorId));
  if (filters.date) { /* add date range conditions */ }

  return await db.select().from(visits).where(and(...conditions)); 
};
```

**Frontend Principle (React):** The UI reads the User Role and passes the correct defaults to the shared API contract.
```tsx
// apps/frontend-web/src/pages/Dashboard.tsx
const defaultFilters = {
  date: today(),
  doctorId: user.role === 'DOCTOR' ? user.id : undefined,
};
const { data } = useQuery(['visits', defaultFilters], () => fetchVisits(defaultFilters));
```

---

## 5. Developer Guide: How to Add a New Feature

When assigned a new feature, **do not start by writing database tables or Express routes**. Follow this exact flow (Outside-In Development):

### Step 1: Define the Intent & Contract
1. Ask: *What is the user trying to achieve?* Name your feature based on that intent (e.g., `discharge-patient`, not `update-visit`).
2. Go to `libs/shared/contracts/` and write the Zod schema representing the input payload.

### Step 2: Write the Data Access (The Librarian)
1. Go to the relevant vertical slice's `data-access/` folder.
2. Write small, procedural functions that execute the exact SQL queries you will need (e.g., `findRecordById`, `updateStatus`).
3. Keep them stupid. Do not throw business errors here.

### Step 3: Write the Use Case (The Rulebook)
1. Go to the `use-cases/` folder. **Create a new file for this specific action.**
2. Import the Zod Contract Type for your function arguments.
3. Import the required Data Access functions.
4. Write the logic: Validate state -> Enforce rules -> Call Data Access to save -> Return result.

### Step 4: Wire the Handler & Route (The Translator)
1. Go to `http-handlers/`. Create an Express Request handler.
2. Call `.parse()` on your Zod schema to clean `req.body` or `req.query`.
3. Pass the clean payload to your Use Case.
4. Finally, go to the API app (`apps/api-monolith/`) and bind the handler to a Semantic Route (e.g., `router.post('/:id/discharge', handleDischarge)`).

*Following this guide ensures your code is immediately testable, immune to database-vendor lock-in, safe from Git merge conflicts, and perfectly aligned with the broader architecture.*