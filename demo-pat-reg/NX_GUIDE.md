# Nx Monorepo Guide — demo-pat-reg

> Quick reference for working with this Nx workspace. All commands are run from the project root.

---

## 📁 Project Structure

```
demo-pat-reg/
├── apps/
│   ├── frontend/          # React + Vite app
│   └── backend/           # Express + Drizzle API
├── libs/                  # Shared types & Zod schemas (@demo-pat-reg/shared)
├── nx.json                # Nx workspace config (plugins, caching, targets)
├── tsconfig.base.json     # Base TypeScript config (all apps extend this)
└── package.json           # Root dependencies + workspace definitions
```

---

## 🚀 Running Locally

```bash
# Start both frontend + backend together (recommended)
bun nx run-many -t serve

# Or start them individually
bun nx serve backend       # Express API on port 3000
bun nx serve frontend      # Vite dev server on port 4200
```

Nx runs them in parallel within a single terminal UI — you can press `Enter` to go full screen on a specific task, or press `q` to quit. No need for multiple terminals.

---

## 🔨 Building

```bash
# Build everything
bun nx run-many -t build

# Build a specific project
bun nx build frontend
bun nx build backend

# Build only projects affected by your changes (useful in CI)
bun nx affected -t build
```

---

## 🔍 Dependency Graph

```bash
# Open an interactive graph of your workspace in the browser
bun nx graph
```

This shows which projects depend on which, and helps you understand the impact of changes.

---

## 📦 Installing NPM Packages

```bash
# Add a dependency everyone uses (or the backend/frontend via hoisting)
bun add <package-name>

# Add a dev dependency
bun add -d <package-name>

# Add a dependency scoped to a specific app (e.g. backend only)
# Edit that app's package.json directly, then run:
bun install
```

> **Note**: This workspace uses bun workspaces. Dependencies in the root `package.json` are available to all apps. If a dependency is only needed by one app, add it to that app's `package.json`.

---

## 🔗 Shared Logic / Schemas

The shared library lives at `libs/` and is published internally as `@demo-pat-reg/shared`.

### Using shared code in your app

```typescript
import { Patient, insertPatientSchema } from '@demo-pat-reg/shared';
```

### Adding new shared types or schemas

1. Edit `libs/src/lib/schemas/index.ts` (or create new files in that folder)
2. Export them from `libs/src/index.ts`
3. They're immediately available in both frontend and backend

### Example: Adding a new shared schema

```typescript
// libs/src/lib/schemas/index.ts
export const insertDoctorSchema = z.object({
  name: z.string(),
  specialization: z.string(),
});
export type Doctor = z.infer<typeof insertDoctorSchema>;
```

```typescript
// libs/src/index.ts — make sure to export the file
export * from './lib/schemas/index.js';   // already exporting this
```

---

## 🗄️ Database Management

Unlike MongoDB, PostgreSQL requires you to explicitly create a database before connecting.

### 1. Create the Database
In **pgAdmin**, right-click `Databases -> Create -> Database...` and name it `demo_pat_reg`.

### 2. Sync the Schema (Development)
For quick local development, sync your code directly to the database:
```bash
bun db:push
```

### 3. Formal Migrations (Production/Version Control)
When you're ready to commit schema changes or deploy to another environment:

1. **Generate Migration**: This creates a SQL file in `apps/backend/drizzle` based on your schema changes.
   ```bash
   bun db:generate
   ```
2. **Apply Migration**: This runs the generated SQL files against your database.
   ```bash
   bun db:migrate
   ```

### 4. Drizzle Studio (Visual Editor)
If you want to view or edit your data in a browser (like a lightweight pgAdmin):
```bash
bun db:studio
```

---

## 🌱 Environment Variables

### Backend
- Defined in `.env` at the project root
- Accessed via `process.env.VARIABLE_NAME`
- Current vars: `HOST`, `PORT`, `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`

### Frontend
- Defined in `apps/frontend/.env`
- **Must be prefixed with `VITE_`** to be exposed to browser code
- Accessed via `import.meta.env.VITE_VARIABLE_NAME`
- Current vars: `VITE_API_URL`

---

## ➕ Adding New Apps / Libraries

```bash
# Add a new React frontend app
bun nx g @nx/react:app apps/my-new-frontend

# Add a new Node/Express backend app
bun nx g @nx/node:app apps/my-new-backend

# Add a new shared library
bun nx g @nx/js:lib libs/my-new-lib
```

After generating, update the root `package.json` workspaces array if needed.

---

## ✅ Type-Checking (TypeScript)

Type-checking ensures your TypeScript code is valid across the boundaries of your apps and libraries.

```bash
# Typecheck everything (all apps and libs)
bun nx run-many -t typecheck

# Typecheck a specific project
bun nx typecheck backend
bun nx typecheck frontend
bun nx typecheck shared
```

> **Note**: In this monorepo, `typecheck` is a separate target from `build` to allow for faster development loops (since esbuild/Vite handle the actual code emission).

---

## 🧪 Testing & Linting

```bash
# Run tests for all projects
bun nx run-many -t test

# Run tests for a specific project
bun nx test backend

# Lint all projects
bun nx run-many -t lint

# Lint a specific project
bun nx lint frontend
```

---

## ⚡ Useful Nx Commands

| Command | What it does |
|---|---|
| `bun nx graph` | Visual dependency graph |
| `bun nx show projects` | List all projects |
| `bun nx show project backend` | Show all targets for a project |
| `bun nx affected -t test` | Only test what changed |
| `bun nx run-many -t build test lint` | Run multiple targets at once |
| `bun nx reset` | Clear the Nx cache (fixes weird issues) |

---

## 💡 Tips

- **Nx caches everything**. If you run a build twice with no changes, the second run is instant.
- **`affected` commands** only run targets for projects impacted by your git changes — great for CI.
- **Each app has its own `package.json`** with an `nx.targets` section. This is where build/serve/test configurations live (instead of `project.json` files).
- **The shared library resolution** works via `customConditions` in `tsconfig.base.json` + the `exports` field in `libs/package.json`. You don't need TS `paths` — Nx handles it.
