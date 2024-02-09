import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
// import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [sveltekit()],
        define: {
                'process.env': process.env
        },
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	build: {
    rollupOptions: {
      external: ['@vf-ui/graphql-client-holochain', '@valueflows/vf-graphql-holochain']
    }
  },
  // needed for any external Nodejs modules to work when linked through `pnpm link`
  server: { fs: { allow: (process.env.ADDITIONAL_MODULE_DIRS || '').split(':') } },
});

// import { defineConfig } from 'vite';
// import { svelte } from '@sveltejs/vite-plugin-svelte';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [svelte()],
// });
