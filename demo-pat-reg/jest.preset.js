const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'apps/frontend/src/design-system/defaults/',
    'apps/frontend/src/components/ui/',
    'apps/frontend/src/hooks/shadcn/',
    'apps/frontend/src/lib/shadcn/',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
