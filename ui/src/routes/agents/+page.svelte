<script lang="ts">
  import AgentModal from "./AgentModal.svelte"
  import { onMount } from 'svelte'
  import type { Facet, FacetGroup, FacetParams, FacetValueParams } from "$lib/graphql/extension-schemas"
  import { deleteAgent, addHashChange } from '../../crud/commit'
  import { getAllFacetGroups, getAllAgents } from '../../crud/fetch'
  import { allHashChanges } from "../../crud/store"
  import { allAgents } from '../../crud/store'
  import Header from "$lib/Header.svelte"
  import Export from "$lib/Export.svelte"
  import Error from "$lib/Error.svelte"
  import Loading from "$lib/Loading.svelte"

  let error: any;
  let modalOpen = false;
  let editing = false;
  let name = "";
  let id = "";
  let currentAgent: any;
  let agents: any[]
  let facets: Facet[] | undefined;
  let selectedFacets: any = {};
  let createAgent: any;
  let associateAgentWithValue: any;
  let loading = false;
  let importing = false;
  let exportOpen = false;
  let hashChanges: any = {}
  allHashChanges.subscribe((res) => {
    hashChanges = res
  })

  allAgents.subscribe((res) => {
    console.log("agents change", res)
    agents = res.map((a) => {
      return {
        ...a,
        "name": a.name,
        "imageUrl": a.image,
        "iconUrl": a.image,
        "lat": a.classifiedAs[0],
        "long": a.classifiedAs[1],
        "role": a.classifiedAs[2],
        "address": a.note,
        "facets": a.facets
      }
    })
  })

  async function fetchFacets() {
    let res = await getAllFacetGroups()
    let facetGroups = res.data.facetGroups
    facets = facetGroups.find((g) => {return g.name == "Agent"})?.facets
  }

  async function deleteAnAgent(revisionId: string) {
    let areYouSure = await confirm("Are you sure you want to delete this agent?")
    if (areYouSure == true) {
      // const res = await deleteAgent({ variables: { revisionId } })
      const res = await deleteAgent(revisionId)
      console.log(res)
      getAllAgents()
    }
  }

  async function importData(data: any) {
    try {

      console.log("importing data", data)
      for (let i = 0; i < data.length; i++) {
        let agent: AgentCreateParams = {
          name: data[i].name,
          note: data[i].note,
          image: data[i].image,
          classifiedAs: data[i].classifiedAs,
        }
        let facets = data[i].facets.map((f) => hashChanges[f.id])
        console.log(agent)
        let res = await createAgent(agent, facets)
        console.log(res)
        console.log("adding hash change", data[i].id, res.data.createOrganization.agent.id)
        addHashChange(data[i].id, res.data.createOrganization.agent.id)
      }
      await getAllAgents()
      importing = false;
      exportOpen = false;
    } catch (e) {
      error = e
      console.log(e)
      importing = false;
      exportOpen = false;
    }
  }

  onMount(async () => {
    loading = agents.length == 0
    await getAllAgents();
    await fetchFacets();
    loading = false;
  })

  // reactive data bindings
  $: agents, modalOpen, editing, id, currentAgent, selectedFacets;
</script>

<!-- <div style="height: 8vh"> -->
  <Header title="Agents" description="A list of all the people, organizations and ecological agents related to the network." />
<!-- </div> -->
<AgentModal bind:createAgent bind:associateAgentWithValue bind:open={modalOpen} {name} {facets} {currentAgent} {editing} {selectedFacets} on:submit={getAllAgents} />

<Error {error} />

{#if loading}
<Loading />
{/if}

<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <!-- <h1 class="text-base font-semibold leading-6 text-gray-900">Agents</h1>
      <p class="mt-2 text-sm text-gray-700">
        A list of all the people, organizations and ecological agents related to the network.
      </p> -->
    </div>
    <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <button
        type="button"
        on:click={() => {editing = false; modalOpen = true; currentAgent = {}}}
        class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Add an agent</button>
    </div>
    <Export dataName="list of agents" fileName="cfn-agents" data={agents} 
    bind:open={exportOpen}
    bind:importing
    on:import={async (event) => {
      await importData(event.detail)
      exportOpen = false;
      // console.log("importing data", event.detail)
      // console.log("hi")
      // importData({ variables: { proposals: event.detail } })
    }}
    />
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
              <!-- for each facet, create th -->
              {#if facets}
                {#each facets as facet}
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >{facet.name}</th
                  >
                {/each}
              {/if}
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-3">
                <span class="sr-only" on:click={() => {editing = true; modalOpen = true;}}>Edit</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white">
            <!-- Odd row -->
            <!-- {#each agents as agent, index}
              hi
              {agent.name}
            {/each} -->
            {#if agents}
            {#each agents as agent, index}
            <tr class="{index % 2 == 0 ? 'bg-gray-100': ''}">
              <td
                class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3"
                >{agent.name}</td
              >
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                >{agent.role}</td
              >
              {#if facets}
              {#each facets as facet}
              {@const facetValue = agent.facets.findLast((f) => {return f.facet.id == facet.id})?.value}
                <th
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-medium text-gray-900"
                  >
                  {#if facetValue && facetValue != 'undefined'}
                    {facetValue}
                  {/if}
              </th>
              {/each}
              {/if}
              <td
                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
              >
                <button type="button" on:click={() => {
                  name = agent.name; id = agent.id; currentAgent = agent; editing = true; modalOpen = true;
                  selectedFacets = {};
                  agent.facets.map((f) => {
                    selectedFacets[f.facet.id] = f.id
                  })
                  }}  class="text-indigo-600 hover:text-indigo-900"
                  >Edit<span class="sr-only">, Lindsay Walton</span></button
                > &nbsp; 
                <button type="button" on:click={() => {
                  deleteAnAgent(agent.revisionId)
                  }}  class="text-indigo-600 hover:text-indigo-900"
                  >Delete<span class="sr-only">, Lindsay Walton</span></button>
              </td>
            </tr>
            {/each}
            {/if}

            <!-- More people... -->
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
