<script lang="ts">
  import RecipeExchangeModal from '$lib/RecipeExchangeModal.svelte'
  import RecipeFlowModal from '$lib/RecipeFlowModal.svelte'
  // import recipes from '$lib/data/recipes.json'
  import Header from '$lib/Header.svelte'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores';
  import { allRecipeExchanges, allProcessSpecifications, allActions } from '../../../../crud/store'
  import { getAllRecipeExchanges, getAllProcessSpecifications, getAllActions, getAllResourceSpecifications, getAllUnits } from '../../../../crud/fetch'
  import { deleteRecipeFlow } from '../../../../crud/commit'
  import type { RecipeFlowCreateParams, RecipeFlowUpdateParams } from '@leosprograms/vf-graphql'

  let recipeExchanges: any[] = []
  allRecipeExchanges.subscribe(value => {
    recipeExchanges = value
  })

  let processSpecifications: any[] = []
  allProcessSpecifications.subscribe(value => {
    processSpecifications = value
  })

  let actions: any[] = []
  allActions.subscribe(value => {
    actions = value
  })

  let recipeExchangeId = ''
  $: if ($page.params.recipe_exchange_id) {
    recipeExchangeId = $page.params.recipe_exchange_id;
  }

  // component UI state
  let recipeExchangeModalOpen = false
  let recipeFlowModalOpen = false
  let editing = false
  let name = ''

  const newRecipeExchange = {
    name: '',
    note: '',
    processConformsTo: '',
  };
  let currentRecipeExchange = {...newRecipeExchange};

  const newRecipeFlow: RecipeFlowCreateParams = {
    note: '',
    action: '',
    resourceQuantity: {
      hasNumericalValue: null,
      hasUnit: '',
    },
    resourceConformsTo: '',
    stage: '',
  };
  let currentRecipeFlow: RecipeFlowCreateParams | RecipeFlowUpdateParams = {...newRecipeFlow};

  $: recipeExchange = recipeExchanges?.find(it => it.id === recipeExchangeId)

  onMount(async () => {
    await getAllRecipeExchanges()
    await getAllActions()
    await getAllResourceSpecifications()
    await getAllProcessSpecifications()
    await getAllUnits()
    console.log('recipe exchanges', recipeExchanges)
  })
</script>

<!-- <div style="height: 8vh"> -->
  <Header title="Recipes" description="The instructions for manufacturing a resource." />
<!-- </div> -->

<RecipeExchangeModal bind:open={recipeExchangeModalOpen} recipeExchange={currentRecipeExchange} />
<RecipeFlowModal bind:open={recipeFlowModalOpen} recipeFlow={currentRecipeFlow} {processSpecifications} on:save={(e) => getAllRecipeExchanges()} />
<div class="grid grid-cols-3 gap-3">
  <div class="p-12">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <!-- <h1 class="text-base font-semibold leading-6 text-gray-900">Offers</h1>
      <p class="mt-2 text-sm text-gray-700">
        The goods or services you are offering within the network, now or generally.
      </p> -->
      <button
          type="button"
          class="text-gray-500 hover:text-gray-900"
         on:click={()=>{goto('/recipe_exchanges')}}>↵ All recipe exchanges</button>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button
          type="button"
          on:click={async () => {
            currentRecipeFlow = {...newRecipeFlow, recipeClauseOf: recipeExchangeId}
            recipeFlowModalOpen = true
          }}
          class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
                  >Clauses</th
                >
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                  <span class="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white">
              <!-- {#each offers as { proposed_intents }, index} -->
              {#each recipeExchange?.recipeClauses ? recipeExchange?.recipeClauses.map(it => it.resourceConformsTo.name) : [] as inputName, index}
                {@const thisRecipeFlow = recipeExchange.recipeClauses[index]}
                <tr class={index % 2 == 0 ? 'bg-gray-100' : ''}>
                  <td
                    class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-3"
                  >
                    {inputName}
                  </td>
                  <td
                    class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                  >
                    <button
                      type="button"
                      on:click={async () => {
                        console.log('thisRecipeFlow', thisRecipeFlow)
                        currentRecipeFlow = {
                          revisionId: thisRecipeFlow.revisionId,
                          note: thisRecipeFlow.note,
                          providerRole: thisRecipeFlow.providerRole,
                          receiverRole: thisRecipeFlow.receiverRole,
                          action: thisRecipeFlow.action.id,
                          resourceQuantity: {
                            hasNumericalValue: thisRecipeFlow.resourceQuantity.hasNumericalValue,
                            hasUnit: thisRecipeFlow.resourceQuantity.hasUnit.id,
                          },
                          resourceConformsTo: thisRecipeFlow.resourceConformsTo.id,
                          stage: thisRecipeFlow.stage?.id,
                        }
                        console.log("currentRecipeFlow", currentRecipeFlow)
                        recipeFlowModalOpen = true
                      }}
                      class="text-indigo-600 hover:text-indigo-900"
                      >Edit<span class="sr-only">, Lindsay Walton</span></button
                    >
                    &nbsp;
                    <button type="button" class="text-indigo-600 hover:text-indigo-900"
                      on:click={async () => {
                        let prompt = confirm('Are you sure you want to delete this input?')
                        if (prompt) {
                          await deleteRecipeFlow(thisRecipeFlow?.revisionId)
                          await getAllRecipeExchanges()
                        }
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

  <div class="p-12 text-center">
    <div
      class="max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
    >
      <h6 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {recipeExchange?.name}
      </h6>

      <!-- <h5 class="mb-2 text-md font-bold tracking-tight text-gray-900 dark:text-white">
        {recipeExchange?.note}
      </h5> -->

      <button
        type="button"
        on:click={() => {
          currentRecipeExchange = {
            revisionId: recipeExchange.revisionId,
            name: recipeExchange.name,
            note: recipeExchange.note,
          }
          recipeExchangeModalOpen = true
        }}
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
          on:click={() => {
            currentRecipeFlow = {...newRecipeFlow, recipeReciprocalClauseOf: recipeExchangeId}
            recipeFlowModalOpen = true
          }}
          class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Add a reiprocal clause</button
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
                  >Reciprocal clauses</th
                >
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                  <span class="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white">
              {#each recipeExchange?.recipeReciprocalClauses ? recipeExchange?.recipeReciprocalClauses.map(it => it.resourceConformsTo.name) : [] as outputName, index}
                {@const thisRecipeFlow = recipeExchange.recipeReciprocalClauses[index]}
                <tr class={index % 2 == 0 ? 'bg-gray-100' : ''}>
                  <td
                    class="whitespace-nowrap py-4 pl-3 pr-3 text-sm text-gray-500"
                  >
                    {outputName}
                  </td>
                  <td
                    class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                  >
                    <button
                      type="button"
                      on:click={async () => {
                        console.log('thisRecipeFlow', thisRecipeFlow)
                        currentRecipeFlow = {
                          revisionId: thisRecipeFlow.revisionId,
                          note: thisRecipeFlow.note,
                          action: thisRecipeFlow.action.id,
                          providerRole: thisRecipeFlow.providerRole,
                          receiverRole: thisRecipeFlow.receiverRole,
                          resourceQuantity: {
                            hasNumericalValue: thisRecipeFlow.resourceQuantity.hasNumericalValue,
                            hasUnit: thisRecipeFlow.resourceQuantity.hasUnit.id,
                          },
                          resourceConformsTo: thisRecipeFlow.resourceConformsTo.id,
                          stage: thisRecipeFlow.stage?.id,
                        }
                        recipeFlowModalOpen = true
                      }}
                      class="text-indigo-600 hover:text-indigo-900"
                      >Edit<span class="sr-only">, Lindsay Walton</span></button
                    >
                    &nbsp;
                    <button type="button" class="text-indigo-600 hover:text-indigo-900"
                      on:click={async () => {
                        let prompt = confirm('Are you sure you want to delete this output?')
                        if (prompt) {
                          await deleteRecipeFlow(thisRecipeFlow?.revisionId)
                          await getAllRecipeExchanges()
                        }
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
</div>
