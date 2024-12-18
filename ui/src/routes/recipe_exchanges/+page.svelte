<script lang="ts">
  // import recipes from '$lib/data/recipes.json'
  import { onMount } from 'svelte';
  import Header from '$lib/Header.svelte'
  import { goto } from '$app/navigation'
  import { allRecipeExchanges } from '../../crud/store'
  import { getAllRecipeExchanges } from '../../crud/fetch';
  import { deleteRecipeExchange, deleteRecipeFlow } from '../../crud/commit';
  import RecipeExchangeModal from '$lib/RecipeExchangeModal.svelte'
  import Export from '$lib/Export.svelte';

  let recipeExchanges: any[] = []
  allRecipeExchanges.subscribe(value => {
    recipeExchanges = value
  })

  let recipeExchangeModalOpen = false

  const newRecipeExchange = {
    name: '',
    note: '',
  };
  let currentRecipeExchange = {...newRecipeExchange};

  onMount(async () => {
    await getAllRecipeExchanges()
    console.log("recipe exchanges", recipeExchanges)
  })
</script>

<!-- <div style="height: 8vh"> -->
  <Header title="Recipe Exchanges" description="The exchanges for manufacturing a resource." />
<!-- </div> -->

<RecipeExchangeModal bind:open={recipeExchangeModalOpen} recipeExchange={currentRecipeExchange} />

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <!-- <h1 class="text-base font-semibold leading-6 text-gray-900">Offers</h1>
      <p class="mt-2 text-sm text-gray-700">
        The goods or services you are offering within the network, now or generally.
      </p> -->
    </div>
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <!-- <button
        type="button"
        on:click={() => goto('/recipes/new')}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a recipe</button
      > -->
      <button
        type="button"
        on:click={() => {
          recipeExchangeModalOpen = true
        }}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a recipe exchange</button
      >
    </div>
    <Export dataName={"list of recipe exchanges"} fileName={"recipe-exchanges"} data={recipeExchanges} />
  </div>
  <div class="mt-8 flow-root">
    <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
        <table class="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th
                scope="col"
                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                >Clause</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Exchange</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Reciprocal Clause</th
              >
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            {#each recipeExchanges as recipe_exchange, index}
              <tr class={index % 2 == 0 ? 'bg-gray-100' : ''}>
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-3"
                  >
                  {#each recipe_exchange.recipeClauses.map(it => it.resourceConformsTo.name) as inputName}
                    {inputName}<br />
                  {/each}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >{recipe_exchange.name}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >
                  {#each recipe_exchange.recipeReciprocalClauses.map(it => it.resourceConformsTo.name) as outputName}
                    {outputName}<br />
                  {/each}
                </td>
                <td
                  class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                >
                  <button type="button" class="text-indigo-600 hover:text-indigo-900"
                    on:click={() => {
                      goto(`/recipe_exchanges/edit/${encodeURIComponent(recipe_exchange.id)}`)
                    }}
                    >Edit<span class="sr-only">, Lindsay Walton</span></button
                  >
                  &nbsp;
                  <button type="button" class="text-indigo-600 hover:text-indigo-900"
                    on:click={async () => {
                      // prompt('Are you sure you want to delete this recipe?')
                      let confirmDelete = confirm('Are you sure you want to delete this recipe?')
                      if (!confirmDelete) return
                      console.log('delete', recipe_exchange.id)
                      let recipeClauses = recipe_exchange.Clauses
                      let recipeReciprocalClauses = recipe_exchange.recipeReciprocalClauses
                      await deleteRecipeExchange(recipe_exchange.revisionId)
                      for (let recipeInput of recipeClauses) {
                        await deleteRecipeFlow(recipeInput.revisionId)
                      }
                      for (let recipeOutput of recipeReciprocalClauses) {
                        await deleteRecipeFlow(recipeOutput.revisionId)
                      }
                      await getAllRecipeExchanges()
                    }}
                  >
                    Delete</button
                  >
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
