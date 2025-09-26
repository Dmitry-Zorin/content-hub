import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys'
import valtio from 'eslint-plugin-valtio'
import { defineConfig, globalIgnores } from 'eslint/config'
import * as tseslint from 'typescript-eslint'

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default defineConfig([
	globalIgnores(['**/.*', 'build/**']),
	js.configs.recommended,
	importPlugin.flatConfigs.recommended,
	importPlugin.flatConfigs.typescript,
	valtio.configs['flat/recommended'],
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
		settings: {
			'import/resolver': {
				typescript: true,
				node: true,
			},
		},
		plugins: {
			'sort-destructure-keys': sortDestructureKeys,
		},
		rules: {
			curly: 'error',
			'implicit-arrow-linebreak': 'error',
			'sort-destructure-keys/sort-destructure-keys': 'error',
		},
	},
	...tseslint.configs.strict.map((config) => ({
		...config,
		files: ['**/*.{ts,tsx}'],
	})),
	...tseslint.configs.stylistic.map((config) => ({
		...config,
		files: ['**/*.{ts,tsx}'],
	})),
	{
		files: ['**/*.{ts,tsx}'],
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			'@typescript-eslint/restrict-template-expressions': 'off',
			'@typescript-eslint/no-unnecessary-type-parameters': 'off',
			'@typescript-eslint/no-confusing-void-expression': [
				'error',
				{ ignoreArrowShorthand: true },
			],
		},
	},
	{
		files: ['**/*.{jsx,tsx}'],
		...jsxA11y.flatConfigs.strict,
		...importPlugin.flatConfigs.react,
		...reactPlugin.configs.flat.recommended,
		...reactPlugin.configs.flat['jsx-runtime'],
		...reactHooks.configs['recommended-latest'],
		...reactRefresh.configs.vite,
		rules: {
			'react/prop-types': 'off',
			'jsx-a11y/no-autofocus': 'off',
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
	eslintPluginPrettier,
])
