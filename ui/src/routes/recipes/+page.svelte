<script lang="ts">
  import RecipeModal from '$lib/RecipeModal.svelte'
  import recipes from '$lib/data/recipes.json'
  import Header from '$lib/Header.svelte'
  import { goto } from '$app/navigation'

  // component UI state
  let modalOpen = false
  let editing = false
  let name = ''
</script>

<div style="height: 8vh">
  <Header title="Recipes" description="The instructions for manufacturing a resource." />
</div>

<RecipeModal bind:open={modalOpen} />

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <!-- <h1 class="text-base font-semibold leading-6 text-gray-900">Offers</h1>
      <p class="mt-2 text-sm text-gray-700">
        The goods or services you are offering within the network, now or generally.
      </p> -->
    </div>
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => goto('/recipes/new')}
        class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a recipe</button
      >
    </div>
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
            <!-- {#each offers as { proposed_intents }, index} -->
            {#each recipes as recipe_process, index}
              <tr class={index % 2 == 0 ? 'bg-gray-100' : ''}>
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-3"
                  >{#each recipe_process.has_recipe_input.map(it => it.resource_conforms_to.name) as input_name}
                    {input_name}<br />
                  {/each}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >{recipe_process.name}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >{#each recipe_process.has_recipe_output.map(it => it.resource_conforms_to.name) as output_name}
                    {output_name} <br />
                  {/each}
                </td>
                <td
                  class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                >
                  <button type="button" class="text-indigo-600 hover:text-indigo-900"
                    >Edit<span class="sr-only">, Lindsay Walton</span></button
                  >
                  &nbsp;
                  <button type="button" class="text-indigo-600 hover:text-indigo-900">
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
