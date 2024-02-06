import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: '200.html' // Important: This tells the adapter to create a fallback page.
    }),
    // vite: {
    //   resolve: {
    //     alias: {
    //       "@vf-ui/graphql-client-holochain": "/home/leo/hApps/hREA/modules/graphql-client/build",
    //       "@valueflows/vf-graphql-holochain": "/home/leo/hApps/hREA/modules/vf-graphql-holochain/build"
    //     }
    //   }
    // }
    // other options...
  },
  optimizeDeps: {
    include: ["@vf-ui/graphql-client-holochain", "@valueflows/vf-graphql-holochain"]
  }
}

export default config;
