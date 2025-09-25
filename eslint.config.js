import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import a11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys'
import valtio from 'eslint-plugin-valtio'
import * as tseslint from 'typescript-eslint'

/** @type {import("eslint").Linter.Config[]} */
export default [
	{
		ignores: [
			'*.json',
			'*.min.js',
			'node_modules',
			'dist',
			'build',
			'.vercel',
			'.react-router/**',
		],
	},

	// Base JS
	js.configs.recommended,
	{
		files: ['**/*.js'],
		languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
		plugins: {
			import: importPlugin,
			'sort-destructure-keys': sortDestructureKeys,
			valtio,
		},
		settings: { 'import/resolver': { node: { extensions: ['.js'] } } },
		rules: {
			'sort-destructure-keys/sort-destructure-keys': 'warn',
		},
	},

	// TypeScript (UNtyped / fast)
	...tseslint.configs.recommended,
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: { parser: tseslint.parser },
		plugins: { import: importPlugin },
		settings: { 'import/resolver': { typescript: { project: true } } },
		rules: {
			'import/no-unresolved': ['error', { ignore: ['/\\+types'] }],
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			'@typescript-eslint/restrict-template-expressions': 'off',
			'@typescript-eslint/no-unnecessary-type-parameters': 'off',

			// Disable typed rules here (no type info)
			'@typescript-eslint/await-thenable': 'off',
			'@typescript-eslint/no-confusing-void-expression': 'off',
		},
	},

	// TypeScript (TYPED / accurate)
	{
		files: [
			'app/**/*.{ts,tsx}',
			'src/**/*.{ts,tsx}',
			'vite.config.ts',
			'react-router.config.ts',
		],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				projectService: true,
			},
		},
		rules: {
			'@typescript-eslint/await-thenable': 'error',
			'@typescript-eslint/no-confusing-void-expression': [
				'error',
				{ ignoreArrowShorthand: true },
			],
		},
	},

	// React layer
	{
		files: ['**/*.{jsx,tsx}'],
		plugins: {
			react,
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
			'jsx-a11y': a11y,
			valtio,
		},
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: { ecmaFeatures: { jsx: true } },
		},
		settings: { react: { version: 'detect' } },
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			...a11y.configs.recommended.rules,

			'react/react-in-jsx-scope': 'off',
			'react/jsx-uses-react': 'off',
			'react-refresh/only-export-components': [
				'error',
				{
					allowConstantExport: true,
					allowExportNames: ['meta', 'links', 'loader', 'action'],
				},
			],
		},
	},

	eslintConfigPrettier,
]
