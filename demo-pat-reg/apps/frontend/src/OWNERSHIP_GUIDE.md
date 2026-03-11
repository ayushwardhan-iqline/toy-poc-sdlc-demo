# Frontend Ownership Guide

## Primarily App-Editable
- `src/app/**`: page-level behavior and business rendering.
- `src/components/blocks/**`: app-facing block wrappers and composition.
- `src/lib/sidebar-config.ts`: sidebar items/groups to show in the app.
- `src/lib/notifications.ts`: app notification data source defaults.

## Design-System Defaults (Rarely Edited)
- `src/design-system/defaults/**`: default behavior implementations copied/adapted from design-system patterns.
- `src/components/ui/**`: low-level UI primitives.
- `src/hooks/shadcn/**`: design-system-specific hooks.
- `src/lib/shadcn/**`: design-system-specific utility/constants.

## Compatibility Re-exports
- `src/hooks/use-*.ts`
- `src/lib/utils.ts`
- `src/lib/constants.ts`

These exist to keep imports stable while maintaining the ownership split above.
