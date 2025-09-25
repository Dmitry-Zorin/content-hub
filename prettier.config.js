/** @type {import("prettier").Config} */
export default {
	semi: false,
	useTabs: true,
	singleQuote: true,
	experimentalTernaries: true,
	plugins: ['prettier-plugin-tailwindcss'],
	tailwindFunctions: ['cn', 'tv'],
	endOfLine: 'auto',
}
