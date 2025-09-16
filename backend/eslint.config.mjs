import { createRequire } from 'module'

const require = createRequire(import.meta.url)
require('@rushstack/eslint-patch/modern-module-resolution')

import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import { dirname } from 'path'
import globals from 'globals'
import { fileURLToPath } from 'url'
import tseslint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const reactRecommended = {
  name: 'react/recommended',
  plugins: {
    react: reactPlugin,
  },
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  rules: reactPlugin.configs.recommended.rules,
}

const reactHooksRecommended =
  reactHooksPlugin.configs['recommended-latest'] ?? {
    name: 'react-hooks/recommended',
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: reactHooksPlugin.configs.recommended.rules,
  }

const jsxA11yRecommended =
  jsxA11yPlugin.flatConfigs?.recommended ?? {
    name: 'jsx-a11y/recommended',
    plugins: {
      'jsx-a11y': jsxA11yPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: jsxA11yPlugin.configs.recommended.rules,
  }

export default tseslint.config(
  {
    ignores: ['.next/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  nextPlugin.flatConfig.coreWebVitals,
  reactRecommended,
  reactHooksRecommended,
  jsxA11yRecommended,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
)
