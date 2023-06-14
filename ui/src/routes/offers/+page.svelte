<script lang="ts">
  import OfferModal from '$lib/OfferModal.svelte'
  import offers from '$lib/data/offers.json'
  import { onMount } from 'svelte'
  import { gql } from 'graphql-tag'
  import { PROPOSAL_CORE_FIELDS } from '$lib/graphql/proposal.fragments'
  let modalOpen = false
  let name = ''

  onMount(() => {
    // console.log(offers)
  })
</script>

<OfferModal bind:open={modalOpen} bind:name />

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <h1 class="text-base font-semibold leading-6 text-gray-900">Offers</h1>
      <p class="mt-2 text-sm text-gray-700">
        The goods or services you are offering within the network, now or generally.
      </p>
    </div>
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => (modalOpen = true)}
        class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add an offer</button
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
                >Provider</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Offering</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Available quantity</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Price per unit</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Available</th
              >
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <!-- <tbody class="bg-white">
            {#each offers as { proposed_intents }, index}
              {@const mainIntent = proposed_intents.find(({ reciprocal }) => !reciprocal)}
              {@const reciprocalIntent = proposed_intents.find(
                ({ reciprocal }) => reciprocal
              )}
              {@const availableQuantity = mainIntent.intent.available_quantity}
              {@const resourceQuantity = reciprocalIntent.intent.resource_quantity}
              <tr class={index % 2 == 0 ? 'bg-gray-100' : ''}>
                <td
                  class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3"
                  >{mainIntent.intent.provider.name}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >{mainIntent.intent.resource_conforms_to.name}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >{availableQuantity.has_numerical_value}
                  {availableQuantity.has_unit.label}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >{resourceQuantity.has_numerical_value}
                  {reciprocalIntent.intent.resource_conforms_to.name} / {mainIntent.intent
                    .resource_quantity.has_numerical_value}
                  {mainIntent.intent.resource_quantity.has_unit.label}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <input
                    id="candidates"
                    aria-describedby="candidates-description"
                    name="candidates"
                    type="checkbox"
                    checked
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                </td>
                <td
                  class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                >
                  <button
                    type="button"
                    on:click={() => {
                      modalOpen = true
                    }}
                    class="text-indigo-600 hover:text-indigo-900"
                    >Edit<span class="sr-only">, Lindsay Walton</span></button
                  >
                </td>
              </tr>
            {/each}

          </tbody> -->
        </table>
      </div>
    </div>
  </div>
</div>
