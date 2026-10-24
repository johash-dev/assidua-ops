import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      '.artifacts/**',
      'next-env.d.ts',
      // Harness tooling is not application code
      '.claude/**',
      'scripts/harness/**',
      'scripts/deploy/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
