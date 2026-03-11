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
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
