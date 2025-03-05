import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginImportHelpers from 'eslint-plugin-import-helpers';
import eslintPluginJest from 'eslint-plugin-jest';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginSonarjs from 'eslint-plugin-sonarjs';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'lib/**', 'node_modules/**'],
  },
  // Base config for TS/JS files
  {
    files: ['**/*.ts', '**/*.js'],
    plugins: {
      '@typescript-eslint': tseslint,
      sonarjs: eslintPluginSonarjs,
      import: eslintPluginImport,
      'import-helpers': eslintPluginImportHelpers,
      'unused-imports': eslintPluginUnusedImports,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      ...tseslint.configs['recommended-requiring-type-checking'].rules,
      ...eslintPluginSonarjs.configs.recommended.rules,
      'import-helpers/order-imports': [
        'error',
        {
          newlinesBetween: 'always',
          groups: ['module', ['parent', 'sibling', 'index']],
          alphabetize: {
            order: 'asc',
            ignoreCase: true,
          },
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'unused-imports/no-unused-imports': ['error'],
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Test files config
  {
    files: ['**/*.spec.ts'],
    plugins: {
      jest: eslintPluginJest,
    },
    languageOptions: {
      globals: {
        ...eslintPluginJest.environments.globals.globals,
      },
    },
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      'sonarjs/no-duplicate-string': 'warn',
    },
  },
  // Prettier config for all files
  {
    files: [
      '**/*.ts',
      '**/*.js',
      '**/*.md',
      '**/*.yml',
      '**/*.yaml',
      '**/*.json',
    ],
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...prettierConfig.rules,
    },
  },
];
