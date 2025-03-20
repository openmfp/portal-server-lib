// @ts-check
import openMfpConfig from '@openmfp/eslint-config-typescript';
import angularPlugin from 'angular-eslint';
import tsPlugin from 'typescript-eslint';

export default tsPlugin.config(
  {
    ignores: ['dist'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...openMfpConfig,
  {
    files: ['**/*.ts'],
    extends: [...angularPlugin.configs.tsRecommended],
    processor: angularPlugin.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angularPlugin.configs.templateRecommended,
      ...angularPlugin.configs.templateAccessibility,
    ],
    rules: {
      '@angular-eslint/template/elements-content': 'off',
      '@angular-eslint/template/prefer-control-flow': 'error',
      // TODO enable for accessibility
      '@angular-eslint/template/label-has-associated-control': 'off',
      '@angular-eslint/template/click-events-have-key-events': 'off',
      '@angular-eslint/template/interactive-supports-focus': 'off',
    },
  },
);