import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import vueSetupExtend from 'vite-plugin-vue-setup-extend';

const pathResolve = (dir: string) => resolve(__dirname, '.', dir);

export default defineConfig({
	plugins: [vue(), vueJsx(), vueSetupExtend()],
	resolve: {
		alias: [
			{ find: '/@/api/taurus/record', replacement: pathResolve('./src/api/taurus/record/api.ts') },
			{ find: '/@', replacement: pathResolve('./src/') },
			{ find: '@', replacement: pathResolve('./src/') },
			{ find: '@views', replacement: pathResolve('./src/views') },
		],
	},
	define: {
		'import.meta.env.VITE_PUBLIC_PATH': JSON.stringify('/'),
		import: { meta: { env: {} } },
	},
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['tests/**/*.test.ts'],
	},
});