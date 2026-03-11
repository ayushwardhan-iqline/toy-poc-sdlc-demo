import nx from '@nx/eslint-plugin';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/vite.config.*.timestamp*',
      'apps/frontend/src/design-system/defaults/**',
      'apps/frontend/src/components/ui/**',
      'apps/frontend/src/hooks/shadcn/**',
      'apps/frontend/src/lib/shadcn/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    plugins: {
      security,
      sonarjs,
    },
    rules: {
      ...(security.configs?.recommended?.rules ?? {}),
      ...(sonarjs.configs?.recommended?.rules ?? {}),
      'no-console': 'warn',
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      complexity: ['error', 10],
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/cors': 'off',
      'sonarjs/slow-regex': 'off',
      'sonarjs/x-powered-by': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'security/detect-object-injection': 'off',
    },
  },
  {
    files: ['scripts/**/*.{js,mjs,cjs,ts,mts,cts}'],
    rules: {
      'no-console': 'off',
    },
  },
];
