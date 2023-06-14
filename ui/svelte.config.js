import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: '200.html' // Important: This tells the adapter to create a fallback page.
    }),
    // other options...
  }
}

export default config;
