// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'commitlint.config.mjs',
      'dist',
      'drizzle',
      'coverage',
      'node_modules',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // NFR-MNT-01: chỉ Repository (và src/database) được dùng Drizzle / pg.
  // `import type` vẫn được phép (ví dụ kiểu Tx, Db).
  {
    files: ['src/**/*.ts'],
    ignores: [
      'src/database/**',
      '**/*.repository.ts',
      'eslint.config.mjs',
      'commitlint.config.mjs',
      'dist',
      'drizzle',
      'coverage',
      'node_modules',
    ],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['drizzle-orm', 'drizzle-orm/*', 'pg'],
              allowTypeImports: true,
              message:
                'Chỉ được dùng Drizzle/pg trong *.repository.ts (NFR-MNT-01). Service gọi Repository.',
            },
          ],
        },
      ],
    },
  },
);
