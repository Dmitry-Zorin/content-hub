import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { checker } from 'vite-plugin-checker'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
		checker({
			typescript: true,
			enableBuild: false,
			eslint: {
				useFlatConfig: true,
				lintCommand:
					'eslint --cache --cache-location ./node_modules/.cache/eslint .',
			},
		}),
	],
	build: {
		sourcemap: true,
		cssMinify: 'lightningcss',
	},
	server: {
		proxy: {
			// anything starting with /yt will be proxied to YouTube
			'/yt': {
				target: 'https://www.youtube.com',
				changeOrigin: true,
				secure: true,
				rewrite: (path) => path.replace(/^\/yt/, ''),
			},
		},
	},
})
