<script lang="ts">
import { browser } from '$app/environment'
import { setClient } from 'svelte-apollo'
import { WeClient, isWeContext, initializeHotReload, type WAL} from '@lightningrodlabs/we-applet';
import { getAllHashChanges, addHashChange } from '../utils';
import { allHashChanges } from '../store';

import "../global.css"
import { page } from '$app/stores'

import Initialize from '$lib/Initialize.svelte'
import Nav from '$lib/Nav.svelte'

/** @type {import('./$types').LayoutData} */
export let data: any;
if (browser) {
  if (isWeContext()) {
    setClient(data.client)
    getAllHashChanges()
  }
  else {
    setClient(data.client)
  }
}
</script>
{#if !data || !data.client}
  <section class="overflow-x-hidden w-screen relative">
    <div class="fade-in h-screen flex flex-col items-center justify-center">
      <h1 class="font-sans text-white sm:text-xl lg:text-3xl">
        loader here?
      </h1>
    </div>
  </section>
  {:else}
  <div class="grid">
    <nav class="nav">
      <Nav path={$page.url.pathname} />
    </nav>

    <main class="main h-full">
      <Initialize>
        <slot />
      </Initialize>
    </main>
  </div>
{/if}

<style>
  /* minmax on the nav is used for expansion on mobile */
  /* minmax on the main is used for long main content */
  .grid {
    display: grid;
    grid-template-rows: 10vh minmax(90vh, auto);
    grid-template-areas:
      'nav'
      'main'
  }

  .nav {
    grid-area: nav;
  }

  .main {
    grid-area: main;
  }

</style>
