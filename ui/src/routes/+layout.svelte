<script lang="ts">
  import { browser } from '$app/environment'
  import { setClient } from 'svelte-apollo'

  import '../global.css'
  import { page } from '$app/stores'

  // import Initialize from '$lib/Initialize.svelte'
  import Nav from '$lib/Nav.svelte'

  /** @type {import('./$types').LayoutData} */
  export let data: any
  // if (browser) {
  //   setClient(data.client)
  // }
</script>

<div class="grid">
  <nav class="nav">
    <Nav path={$page.url.pathname} />
  </nav>

  <main class="main h-full">
    <slot />
  </main>
</div>

<style>
  /* minmax on the nav is used for expansion on mobile */
  /* minmax on the main is used for long main content */
  .grid {
    display: grid;
    grid-template-rows: 10vh minmax(90vh, auto);
    grid-template-areas:
      'nav'
      'main';
  }

  .nav {
    grid-area: nav;
  }

  .main {
    grid-area: main;
  }
</style>
