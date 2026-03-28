const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

module.exports = [
  {
    ignores: ['build/**', 'node_modules/**', 'coverage/**']
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: "VariableDeclarator[id.name='getErrorMessage']",
          message:
            'Use shared/errors/apiError getErrorMessage parser instead of local helper declarations.'
        },
        {
          selector: "VariableDeclarator[id.name='readErrorMessage']",
          message:
            'Use shared/errors/apiError getErrorMessage parser instead of local helper declarations.'
        },
        {
          selector: "FunctionDeclaration[id.name='getErrorMessage']",
          message:
            'Use shared/errors/apiError getErrorMessage parser instead of local helper declarations.'
        },
        {
          selector: "FunctionDeclaration[id.name='readErrorMessage']",
          message:
            'Use shared/errors/apiError getErrorMessage parser instead of local helper declarations.'
        }
      ]
    }
  },
  {
    files: ['src/shared/errors/apiError.ts'],
    rules: {
      'no-restricted-syntax': 'off'
    }
  }
];
