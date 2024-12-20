<script lang="ts">
  import { clickOutside } from '../../utils'
  import { onMount } from 'svelte';
  import { createRecipeExchange, updateRecipeExchange } from '../../crud/commit'
  import { getAllRecipeExchanges } from '../../crud/fetch'
  import { goto } from '$app/navigation'

  // public CustomElement attributes
  export let open = false
  export let recipeExchange;

  $: validToCreate = recipeExchange?.name?.length > 0

  function checkKey(e: any) {
    if (e.key === "Escape" && !e.shiftKey) {
      e.preventDefault();
      open = false;
    }
  }

  onMount(() => {
    window.addEventListener("keydown", checkKey);
    return () => {
      window.removeEventListener("keydown", checkKey);
    };
  });
</script>

<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  <!--
    Background backdrop, show/hide based on modal state.

    Entering: "ease-out duration-300"
      From: "opacity-0"
      To: "opacity-100"
    Leaving: "ease-in duration-200"
      From: "opacity-100"
      To: "opacity-0"
  -->
  <div
    class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
    class:hidden={!open}
  />

  <div class="fixed inset-0 z-10 overflow-y-auto" class:hidden={!open}>
    <div
      class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
    >
      <!--
        Modal panel, show/hide based on modal state.

        Entering: "ease-out duration-300"
          From: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          To: "opacity-100 translate-y-0 sm:scale-100"
        Leaving: "ease-in duration-200"
          From: "opacity-100 translate-y-0 sm:scale-100"
          To: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      -->
      <div
        class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
        class:hidden={!open}
        use:clickOutside
      >
        <div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
              Recipe Exchange
            </h3>
            <div class="mt-4 text-left">
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Exchange name</label
                >
                <div class="relative mt-2 rounded-md shadow-sm">
                  <input
                    bind:value={recipeExchange.name}
                    on:input={(e) => (recipeExchange.name = e.target.value)}
                    type="text"
                    name="name"
                    id="name"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder=""
                    required
                    aria-invalid="true"
                    aria-describedby="name-error"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4 text-left">
              <div class="col-span-full">
                <label
                  for="note"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Description</label
                >
                <div class="mt-2">
                  <textarea
                    bind:value={recipeExchange.note}
                    on:input={(e) => (recipeExchange.note = e.target.value)}
                    id="note"
                    name="note"
                    rows="3"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          {#if recipeExchange?.revisionId}
            <button
              type="button"
              class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
              on:click={async () => {
                console.log("recipe exchange 1", recipeExchange)
                const res = await updateRecipeExchange(recipeExchange)
                console.log("recipe exchange 2", res)
                open = false
                getAllRecipeExchanges()
              }}
            >
              Update
            </button>
          {:else}
            <button
              disabled={!validToCreate}
              type="button"
              class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
              on:click={async () => {
                console.log("recipe exchange 1", recipeExchange)
                const res = await createRecipeExchange(recipeExchange)
                console.log("recipe exchange 2", res)
                open = false
                goto(`/recipe_exchanges/edit/${encodeURIComponent(res.data.createRecipeExchange.recipeExchange.id)}`)
              }}
            >
              Create
            </button>
          {/if}
          <button
            type="button"
            on:click={() => (open = false)}
            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
            >Cancel</button
          >
        </div>
      </div>
    </div>
  </div>
</div>
