// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');

const unusedVars = {
  vars: 'all',
  args: 'after-used',
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
  ignoreRestSiblings: true,
  caughtErrors: 'all',
  caughtErrorsIgnorePattern: '^_',
};

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/order': 'off',
      'sort-imports': 'off',
      'no-unused-vars': ['warn', unusedVars],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', unusedVars],
    },
  },
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
]);
