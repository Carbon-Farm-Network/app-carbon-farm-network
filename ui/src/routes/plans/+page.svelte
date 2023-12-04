<script lang="ts">
  // import plan from '$lib/data/plan.json'
  import Header from '$lib/Header.svelte'
  import { goto } from '$app/navigation'
  import { gql } from 'graphql-tag'
  import { onMount } from 'svelte'
  import { mutation, query } from 'svelte-apollo'
  import { page } from "$app/stores"
  import type { ReadableQuery } from 'svelte-apollo'
  import type { RelayConn } from '$lib/graphql/helpers'
  import type { PlanConnection } from '@valueflows/vf-graphql'


  export let plans: any[];

  const GET_PLANS = gql`
    query fetchPlans {
      plans {
        edges {
          node {
            id
            name
            note
          }
        }
      }
    }
  `

  interface PlansQueryResponse {
    plans: PlanConnection & RelayConn<any>
  }

  let plansQuery: ReadableQuery<PlansQueryResponse> = query(GET_PLANS)

  // let plansQuery = query(GET_PLANS)

  async function fetchPlans() {
    const res = await plansQuery.refetch()
    plans = res.data.plans.edges
    // plans = res2.data.plans
  }

  onMount(async () => {
    await fetchPlans()
  })


</script>

<div style="height: 8vh">
  <Header title="Plans" description="Current operational planning" />
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
        on:click={() => goto('/plans/new')}
        class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add a plan</button
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
                >Name</th
              >
              <th
                scope="col"
                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >Description</th
              >
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            <!-- {#each offers as { proposed_intents }, index} -->
            {#if plans && plans.length > 0}
            
            {#each plans as plan, index}
              <tr class={index % 2 == 0 ? 'bg-gray-100' : ''}>
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-3"
                  >{plan.node.name}</td
                >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{plan.node.note}</td>
                <td
                  class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                >
                  <button type="button" class="text-indigo-600 hover:text-indigo-900"
                    >Edit<span class="sr-only">, {name}</span></button
                  >
                  &nbsp;
                  <button type="button" class="text-indigo-600 hover:text-indigo-900">
                    Delete</button
                  >
                </td>
              </tr>
            {/each}
            {/if}

          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
