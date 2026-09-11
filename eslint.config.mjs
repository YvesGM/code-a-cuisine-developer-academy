import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/**', 'dist/**', '.angular/**', '.npm-cache/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/app/**/*.ts'],
    ignores: ['src/app/**/*.spec.ts'],
    rules: {
      'max-lines-per-function': [
        'error',
        { max: 14, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
    },
  },
);
