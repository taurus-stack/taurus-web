import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig, loadEnv, ConfigEnv } from 'vite';
import vueSetupExtend from 'vite-plugin-vue-setup-extend';
import vueJsx from '@vitejs/plugin-vue-jsx';
import mockDevServerPlugin from 'vite-plugin-mock-dev-server';
import { codeInspectorPlugin } from 'code-inspector-plugin';

const pathResolve = (dir: string) => {
	return resolve(__dirname, '.', dir);
};

const alias: Record<string, string> = {
	'/@': pathResolve('./src/'),
	'@views': pathResolve('./src/views'),
	'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
	'@dvaformflow': pathResolve('./src/viwes/plugins/dvaadmin_form_flow/src/'),
};

const viteConfig = defineConfig((mode: ConfigEnv) => {
	const env = loadEnv(mode.mode, process.cwd());
	return {
		plugins: [
			vue(),
			vueJsx(),
			vueSetupExtend(),
			codeInspectorPlugin({
				bundler: 'vite',
			}),
			mockDevServerPlugin({
				log: 'debug',
				reload: true,
				prefix: '^/api',
				cors: true,
			}),
		],
		root: process.cwd(),
		resolve: { alias },
		base: mode.command === 'serve' ? './' : env.VITE_PUBLIC_PATH,
		optimizeDeps: {
			include: [
				'element-plus/es/locale/lang/zh-cn',
				'element-plus/es/locale/lang/en',
				'element-plus/es/locale/lang/zh-tw',
				'echarts/core',
				'echarts/charts',
				'echarts/components',
				'echarts/renderers',
				'vue-web-terminal',
			],
		},
		server: {
			host: '0.0.0.0',
			port: env.VITE_PORT as unknown as number,
			open: false,
			hmr: true,
			proxy: {
				'^/api': {
					target: 'http://127.0.0.1:8000',
					changeOrigin: true,
				},
				'^/ws': {
					target: 'ws://127.0.0.1:8765',
					changeOrigin: true,
					ws: true,
				},
				'^/api/schema': {
					target: 'http://127.0.0.1:8000',
					changeOrigin: true,
				},
				'^/media': {
					target: 'http://127.0.0.1:8000',
					changeOrigin: true,
				},
			},
		},
		build: {
			outDir: env.VITE_DIST_PATH || 'dist',
			chunkSizeWarningLimit: 1500,
			rollupOptions: {
				output: {
					entryFileNames: `assets/[name].[hash].js`,
					chunkFileNames: `assets/[name].[hash].js`,
					assetFileNames: `assets/[name].[hash].[ext]`,
					compact: true,
					manualChunks(id) {
						if (id.includes('node_modules')) {
							if (id.includes('echarts')) return 'echarts';
							if (id.includes('element-plus')) return 'element-plus';
							if (id.includes('vxe-table') || id.includes('xe-utils')) return 'vxe-table';
							if (id.includes('@fast-crud')) return 'fast-crud';
							if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) return 'vue';
							if (id.includes('lodash') || id.includes('axios') || id.includes('qs')) return 'utils';
						}
					},
				},
			},
		},
		css: { preprocessorOptions: { css: { charset: false } } },
		define: {
			__VUE_I18N_LEGACY_API__: JSON.stringify(false),
			__VUE_I18N_FULL_INSTALL__: JSON.stringify(false),
			__INTLIFY_PROD_DEVTOOLS__: JSON.stringify(false),
			__VERSION__: JSON.stringify(process.env.npm_package_version),
		},
	};
});

export default viteConfig;