// @ts-check
import tsPlugin from 'typescript-eslint';


export default tsPlugin.config(
  {
    ignores: ['dist'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsPlugin.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);