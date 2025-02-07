<script lang="ts">
  // import recipes from '$lib/data/recipes.json'
  import { onMount } from 'svelte';
  import Header from '$lib/Header.svelte'
  import Loading from '$lib/Loading.svelte';
  import { goto } from '$app/navigation'
  import { allRecipes, allProcessSpecifications, allHashChanges } from '../../crud/store'
  import { getAllProcessSpecifications, getAllRecipes, getAllHashChanges, getAllResourceSpecifications } from '../../crud/fetch';
  import { deleteRecipeProcess, deleteRecipeFlow, addHashChange, createRecipeProcess, createRecipeFlow } from '../../crud/commit';
  import RecipeProcessModal from './RecipeProcessModal.svelte'
  import Export from '$lib/Export.svelte';
  import SvgIcon from '$lib/SvgIcon.svelte';

  let hashChanges: any = {}
  allHashChanges.subscribe((res) => {
    hashChanges = res
  })

  let recipes: any[] = []
  allRecipes.subscribe(value => {
    recipes = value
  })

  let processSpecifications: any[] = []
  allProcessSpecifications.subscribe(value => {
    processSpecifications = value
  })

  let recipeProcessModalOpen = false
  let exportOpen = false
  let importing = false

  const newRecipeProcess = {
    name: '',
    note: '',
    processConformsTo: '',
  };
  let currentRecipeProcess = {...newRecipeProcess};

  let loading: boolean = false
  let fetching: boolean = false

  async function refresh() {
    fetching = true
    await getAllProcessSpecifications()
    await getAllResourceSpecifications()
    await getAllRecipes()
    fetching = false
  }

  onMount(async () => {
    loading = recipes.length === 0 || processSpecifications.length === 0
    if (loading) {
      await getAllProcessSpecifications()
      await getAllResourceSpecifications()
      await getAllRecipes()
      console.log('recipes', recipes)
      console.log('processSpecifications', processSpecifications)
      loading = false
    }
  })
</script>

<!-- <div style="height: 8vh"> -->
  <Header title="Recipes" description="The instructions for manufacturing a resource." />
<!-- </div> -->

<RecipeProcessModal bind:open={recipeProcessModalOpen} recipeProcess={currentRecipeProcess} {processSpecifications} />

{#if loading}
  <Loading />
{/if}

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <!-- <h1 class="text-base font-semibold leading-6 text-gray-900">Offers</h1>
      <p class="mt-2 text-sm text-gray-700">
        The goods or services you are offering within the network, now or generally.
      </p> -->
    </div>

    <!-- refresh button -->
    <div class="mt-4 sm:ml-4 sm:mt-0 sm:flex-none">
      <button
      type="button"
      disabled={fetching}
      on:click={refresh}
      class="flex items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <span class="flex items-center" class:animate-spin={fetching}>
          <SvgIcon icon="faRefresh" color="#fff" />
        </span>
      </button>
    </div>

    <div class="mt-4 sm:ml-3 sm:mt-0 sm:flex-none">
      <!-- <button
        type="button"
        on:click={() => goto('/recipes/new')}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a recipe</button
      > -->
      <button
        type="button"
        on:click={() => {
          recipeProcessModalOpen = true
        }}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a recipe</button
      >
    </div>
    <!-- <Export dataName={"list of recipes"} fileName={"recipes"} data={recipes} 
      bind:open={exportOpen}
      bind:importing
      on:import={async (event) => {
        await importData(event.detail)
        exportOpen = false;
      }}
    /> -->
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
                >Inputs</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Process</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Outputs</th
              >
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            {#each recipes as recipe_process, index}
              <tr class={index % 2 == 0 ? 'bg-gray-100' : ''}>
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-3"
                  >
                  {#each recipe_process.recipeInputs.map(it => it) as recipeInput}
                    {recipeInput?.action?.id} 
                    {recipeInput?.resourceQuantity?.hasNumericalValue} 
                    {recipeInput?.resourceConformsTo?.name}
                    <br />
                  {/each}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >{recipe_process.name}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >
                  {#each recipe_process.recipeOutputs.map(it => it) as recipeOutput}
                    {recipeOutput?.action?.id} 
                    {recipeOutput?.resourceQuantity?.hasNumericalValue} 
                    {recipeOutput?.resourceConformsTo?.name}
                    <br />
                  {/each}
                </td>
                <td
                  class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                >
                  <button type="button" class="text-indigo-600 hover:text-indigo-900"
                    on:click={() => {
                      goto(`/recipes/edit/${encodeURIComponent(recipe_process.id)}`)
                    }}
                    >Edit<span class="sr-only">, Lindsay Walton</span></button
                  >
                  &nbsp;
                  <button type="button" class="text-indigo-600 hover:text-indigo-900"
                    on:click={async () => {
                      // prompt('Are you sure you want to delete this recipe?')
                      let confirmDelete = confirm('Are you sure you want to delete this recipe?')
                      if (!confirmDelete) return
                      console.log('delete', recipe_process.id)
                      let recipeInputs = recipe_process.recipeInputs
                      let recipeOutputs = recipe_process.recipeOutputs
                      await deleteRecipeProcess(recipe_process.id)
                      for (let recipeInput of recipeInputs) {
                        await deleteRecipeFlow(recipeInput.id)
                      }
                      for (let recipeOutput of recipeOutputs) {
                        await deleteRecipeFlow(recipeOutput.id)
                      }
                      await getAllRecipes()
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
