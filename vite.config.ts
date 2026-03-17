import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	server: {
		port: 3000,
		strictPort: true,
		host: '0.0.0.0',
		hmr: process.env.DISABLE_HMR !== 'true'
	},
	preview: {
		port: 4173,
		strictPort: true,
		host: '0.0.0.0',
		allowedHosts: ['os.sysmar.dev.br']
	}
});