<script lang="ts">
  import AgentModal from "$lib/AgentModal.svelte"
  import allAgents from '$lib/data/agents.json'
  let modalOpen = false;
  let name = "";

  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import type { ComponentType } from 'svelte'
  import { query } from 'svelte-apollo'
  import type { ReadableQuery } from 'svelte-apollo'
  import { gql } from 'graphql-tag'
  import type { AgentConnection, Agent } from '@valueflows/vf-graphql'
  import type { RelayConn } from '$lib/graphql/helpers'
  import { AGENT_CORE_FIELDS } from '$lib/graphql/agent.fragments'
  import { flattenRelayConnection } from '$lib/graphql/helpers'

  const GET_ALL_AGENTS = gql`
    ${AGENT_CORE_FIELDS}
    query {
      agents(last: 100000) {
        edges {
          cursor
          node {
            ...AgentCoreFields
          }
        }
      }
    }
  `

  interface QueryResponse {
    agents: AgentConnection & RelayConn<Agent>
  }

  // map component state

  let panelInfo: any,
      MapComponent: ComponentType,
      agentsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_AGENTS)

  onMount(async () => {
    // defer Leaflet map load until rendering, and only in browser environment
    if (browser) {
      // MapComponent = (await import('$lib/Map.svelte')).default
    }
  })

  // reactive data bindings

  let agents: Agent[]

  $: {
    // assign derived values from Agent list API
    let current = agentsQuery && agentsQuery.getCurrentResult()
    if (current) {
      agents = flattenRelayConnection(current.data?.agents)
      console.log(agents)
    }
  }

</script>

<AgentModal bind:open={modalOpen} bind:name={name} />

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <h1 class="text-base font-semibold leading-6 text-gray-900">Agents</h1>
      <p class="mt-2 text-sm text-gray-700">
        A list of all the people, organizations and ecological agents in the network.
      </p>
    </div>
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => (modalOpen = true)}
        class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add an agent</button>
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
                >Role in network</th
              >
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            <!-- Odd row -->
            <!-- {#each agents as agent, index}
              hi
              {agent.name}
            {/each} -->
            {#each allAgents as agent, index}
            <tr class="{index % 2 == 0 ? 'bg-gray-100': ''}">
              <td
                class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3"
                >{agent.name}</td
              >
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >Farmer</td
              >
              <td
                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
              >
                <button type="button" on:click={() => {name = agent.name; modalOpen = true}}  class="text-indigo-600 hover:text-indigo-900"
                  >Edit<span class="sr-only">, Lindsay Walton</span></button
                >
              </td>
            </tr>
            {/each}

            <!-- More people... -->
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
