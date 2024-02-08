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
	}//,
	// build: {
  //   rollupOptions: {
  //     external: ['@vf-ui/graphql-client-holochain', '@valueflows/vf-graphql-holochain']
  //   }
  // },
});

// import { defineConfig } from 'vite';
// import { svelte } from '@sveltejs/vite-plugin-svelte';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [svelte()],
// });

