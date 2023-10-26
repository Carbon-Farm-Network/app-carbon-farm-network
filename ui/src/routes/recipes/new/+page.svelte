<script lang="ts">
  import RecipeProcessModal from '$lib/RecipeProcessModal.svelte'
  import RecipeInputModal from '$lib/RecipeInputModal.svelte'
  import RecipeOutputModal from '$lib/RecipeOutputModal.svelte'
  import recipes from '$lib/data/recipes.json'
  import Header from '$lib/Header.svelte'
  import { goto } from '$app/navigation'

  // component UI state
  let recipeProcessModalOpen = false
  let recipeInputModalOpen = false
  let recipeOutputModalOpen = false
  let editing = false
  let name = ''
  const recipe_process = recipes[0]
</script>

<div style="height: 8vh">
  <Header title="Recipes" description="The instructions for manufacturing a resource." />
</div>

<RecipeProcessModal bind:open={recipeProcessModalOpen} />
<RecipeInputModal bind:open={recipeInputModalOpen} />
<RecipeOutputModal bind:open={recipeOutputModalOpen} />

<div class="grid grid-cols-3 gap-3">
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
          on:click={() => (recipeInputModalOpen = true)}
          class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Add an input</button
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
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                  <span class="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white">
              <!-- {#each offers as { proposed_intents }, index} -->
              {#each recipe_process.has_recipe_input.map(it => it.resource_conforms_to.name) as input_name, index}
                <tr class={index % 2 == 0 ? 'bg-gray-100' : ''}>
                  <td
                    class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-3"
                  >
                    {input_name}
                  </td>
                  <td
                    class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                  >
                    <button
                      type="button"
                      on:click={() => (recipeInputModalOpen = true)}
                      class="text-indigo-600 hover:text-indigo-900"
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

  <div class="p-12 text-center">
    <div
      class="max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
    >
      <h5 class="mb-2 text-md font-bold tracking-tight text-gray-900 dark:text-white">
        {recipe_process.process_conforms_to.name}
      </h5>

      <h6 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {recipe_process.name}
      </h6>

      <button
        type="button"
        on:click={() => (recipeProcessModalOpen = true)}
        class="text-indigo-600 hover:text-indigo-900"
        >Edit<span class="sr-only">, Lindsay Walton</span></button
      >
    </div>
  </div>

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
          on:click={() => (recipeOutputModalOpen = true)}
          class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Add an output</button
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
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >Outputs</th
                >
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                  <span class="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white">
              {#each recipe_process.has_recipe_output.map(it => it.resource_conforms_to.name) as output_name, index}
                <!-- {#each offers as { proposed_intents }, index} -->
                <tr class={index % 2 == 0 ? 'bg-gray-100' : ''}>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {output_name}
                  </td>
                  <td
                    class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                  >
                    <button
                      type="button"
                      on:click={() => (recipeOutputModalOpen = true)}
                      class="text-indigo-600 hover:text-indigo-900"
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
</div>
