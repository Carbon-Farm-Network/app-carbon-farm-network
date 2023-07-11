<script lang="ts">
  export let open = false;
  export let currentAgent: any = {};
  export let name = "";
  export let logo = "";
  export let type = "Organization";
  export let role = "Farmer";
  export let certification = "";
  export let editing = false;
  import facets from '$lib/data/facets.json'
  import facetValues from '$lib/data/facet_values.json'
  import { createEventDispatcher } from 'svelte';
  
  import { onMount } from 'svelte'
  import { gql } from 'graphql-tag'
  import { AGENT_CORE_FIELDS } from '$lib/graphql/agent.fragments'
  import type { RelayConn } from '$lib/graphql/helpers'
  import type { AgentConnection, Agent, Organization, OrganizationCreateParams, OrganizationUpdateParams } from '@valueflows/vf-graphql'
  import { mutation, query } from 'svelte-apollo'
  import type { ReadableQuery } from 'svelte-apollo'
  import type { Facet, FacetGroup, FacetParams } from "$lib/graphql/extension-schemas"
  // import { AppAgentWebsocket, type AppAgentClient } from '@holochain/client';

  const dispatch = createEventDispatcher();

  const GET_FACET_GROUPS = gql`
    query GetFacets {
      facetGroups {
        id
        revisionId
        name
        note
        facets {
          id
          revisionId
          name
          note
          #group {
          #   id
          #}
          values {
            id
            revisionId
            value
            note
            # facet {
            #   id
            # }
          }
        }
      }
    }
  `

  const ADD_AGENT = gql`
    ${AGENT_CORE_FIELDS},
    mutation($agent: OrganizationCreateParams!){
      createOrganization(organization: $agent) {
        agent {
          ...AgentCoreFields
        }
      }
    }
  `

  const ASSOCIATE_AGENT_AND_FACET_VALUE = gql`
    ${AGENT_CORE_FIELDS},
    mutation($agent: OrganizationCreateParams!){
      associateFacetValue(organization: $agent) {
        agent {
          ...AgentCoreFields
        }
      }
    }
  `

  const UPDATE_AGENT = gql`
    ${AGENT_CORE_FIELDS},
    mutation($agent: OrganizationUpdateParams!){
      updateOrganization(organization: $agent) {
        agent {
          ...AgentCoreFields
        }
      }
    }
  `

  // const GET_AGENT = gql`
  //   ${AGENT_CORE_FIELDS},
  //   query($o: ID!){
  //     organization(id: id
  //     ) {
  //       ...AgentCoreFields
  //     }
  //   }
  // `

  const GET_ORGANIZATION = gql`
    ${AGENT_CORE_FIELDS},
    query GetOrganization {
      organization(id: $id) {
        ...OrganizationCoreFields
      }
  }
  `

  interface FacetGroupResponse {
    facetGroups: FacetGroup[]
  }
  let queryFacetGroups: ReadableQuery<FacetGroupResponse> = query(GET_FACET_GROUPS)


  interface QueryResponse {
    agent: AgentConnection & RelayConn<Agent>
  }

  let roles = ["Farmer", "Mill", "Designer"]

  // let addAgent: Mutate<QueryResponse> = mutation(ADD_AGENT)
  let addAgent: any= mutation(ADD_AGENT)
  let associateAgentWithValue: any = mutation(ASSOCIATE_AGENT_AND_FACET_VALUE)

  let getAgent: ReadableQuery<QueryResponse> = query(GET_ORGANIZATION)

  // let updateAgent: Mutate<QueryResponse> = mutation(UPDATE_AGENT)
  let updateAgent: any = mutation(UPDATE_AGENT)

  async function handleSubmit() {
    let agent: OrganizationCreateParams = {
        name: currentAgent.name,
        image: currentAgent.imageUrl,
        note: currentAgent.note,
        classifiedAs: [currentAgent.lat, currentAgent.long, currentAgent.role],

        // $: name, latitude, longitude, note, logo, type, role, certification;
    }
    try {
      const res = await addAgent({ variables: { agent } })
      const groups = (await queryFacetGroups.result())
      console.log(groups)
      const value_id = ((groups?.data?.facetGroups[0].facets || [{values: []}])[0].values || [{}])[0].id
      console.log(value_id)
      const res2 = await associateAgentWithValue({ identifier: res.data.createOrganization.agent.id, facet_value_id: value_id })
      dispatch("submit");
      open = false;
      console.log(res)
    } catch (error) {
      console.error(error)
    }
  }

  async function findAgent(id: String) {
    try {
      getAgent.setVariables({ id })
      getAgent.result().then((r) => {console.log(r)})
    } catch (error) {
      console.error(error)
    }
  }

  async function handleUpdate() {
    // getAgent();
    console.log(currentAgent)

    let agent: OrganizationUpdateParams = {
        name: currentAgent.name,
        image: currentAgent.imageUrl,
        note: currentAgent.note,
        classifiedAs: [currentAgent.lat, currentAgent.long, currentAgent.role],
        revisionId: currentAgent.revisionId

        // $: name, latitude, longitude, note, logo, type, role, certification;
    }
    try {
      const res = await updateAgent({ variables: { agent } })
      dispatch("submit");
      open = false;
      console.log(res)
    } catch (error) {
      console.error(error)
    }
  }

  // async function testFacetsCall() {
  //   const facetGroupEntry = { 
  //     group_id: "groupId",
  //     note: "note",
  //   };
  
  //   try {
  //     const record = await client.callZome({
  //       cap_secret: null,
  //       role_name: 'hc_facets',
  //       zome_name: 'hc_facets',
  //       fn_name: 'create_facet_group',
  //       payload: facetGroupEntry,
  //     });
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }

  // let client: AppAgentClient;

  $: name, type, role, certification, editing, currentAgent; //, client;

  $: isAgentValid = true && currentAgent.lat && currentAgent.long && currentAgent.name && currentAgent.imageUrl && currentAgent.role;

  onMount(async () => {
    // console.log("mounted")
    // findAgent();
  //   // We pass '' as url because it will dynamically be replaced in launcher environments
  //   client = await AppAgentWebsocket.connect('', 'acfn');
  });
</script>
<!-- <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" on:click={() => testFacetsCall()}>
  test`
</button> -->
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
  <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" class:hidden={!open}/>

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
      >

        <div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
              Add an agent
            </h3>

            <div class="mt-4">
              <div class="text-left">
                <label
                  for="name"
                  class="block text-sm font-medium leading-6 text-gray-900">Name</label
                >
                <div class="relative mt-2 rounded-md shadow-sm">
                  <!-- "block w-full rounded-md border-0 py-1.5 pr-10 text-red-900 ring-1 ring-inset ring-red-300 placeholder:text-red-300 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6" -->
                  <input
                    type="text"
                    name="name"
                    id="name"
                    class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder=""
                    bind:value={currentAgent.name}
                    on:input={e => {
                      const input = e.target;
                      if (input instanceof HTMLInputElement) {
                        name = input.value;
                        // console.log(name)
                      }
                    }}
                    required
                    aria-invalid="true"
                    aria-describedby="name-error"
                  />
                  <!-- <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <svg
                      class="h-5 w-5 text-red-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div> -->
                </div>
                <!-- <p class="mt-2 text-sm text-red-600" id="email-error">
                  Name is required.
                </p> -->
              </div>
            </div>

            {#if false}
            <div class="mt-4 text-left">
              <div>
                <label
                  for="type"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Type</label
                >
                <select
                  id="type"
                  name="type"
                  on:change={e => {
                    const input = e.target;
                    if (input instanceof HTMLSelectElement) {
                      type = input.value;
                    }
                  }}
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                  <option>Person</option>
                  <option selected>Organization</option>
                  <option>Ecological agent</option>
                </select>
              </div>
            </div>
            {/if}

            <div class="mt-4 text-left">
              <div>
                <label
                  for="classifiedAs"
                  class="block text-sm font-medium leading-6 text-gray-900"
                >Role in the network</label>
                <select
                  id="classifiedAs"
                  name="classifiedAs"
                  bind:value={currentAgent.role}
                  on:change={e => {
                    const input = e.target;
                    if (input instanceof HTMLSelectElement) {
                      let role = input.value;
                      if (role == "Farmer") {
                        currentAgent.imageUrl = "farm.svg"
                      } else if (role == "Mill") {
                        currentAgent.imageUrl = "mill.svg"
                      } else if (role == "Designer") {
                        currentAgent.imageUrl = "knitting.svg"
                      }
                    }
                  }}
                  class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                  {#each roles as role (role)}
                    <option {role} selected={role === currentAgent.role}>{role}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="mt-4 text-left flex justify-between">
              <div>
                <label
                  for="latitude"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Latitude</label
                >
                <div class="mt-2">
                  <input
                    type="text"
                    name="latitude"
                    id="latitude"
                    autocomplete="latitude"
                    bind:value={currentAgent.lat}
                    on:input={e => {
                      const input = e.target;
                      if (input instanceof HTMLInputElement) {
                        currentAgent.lat = input.value;
                      }
                    }}
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <label
                  for="longitude"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Longitude</label
                >
                <div class="mt-2">
                  <input
                    type="text"
                    name="longitude"
                    id="longitude"
                    autocomplete="longitude"
                    bind:value={currentAgent.long}
                    on:input={e => {
                      const input = e.target;
                      if (input instanceof HTMLInputElement) {
                        currentAgent.long = input.value;
                      }
                    }}
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>

            <div class="mt-4 text-left">
              <div class="col-span-full">
                <label
                  for="note"
                  class="block text-sm font-medium leading-6 text-gray-900">Display information</label
                >
                <div class="mt-2">
                  <textarea
                    id="note"
                    name="note"
                    rows="3"
                    bind:value={currentAgent.note}
                    on:input={e => {
                      const input = e.target;
                      if (input instanceof HTMLInputElement) {
                        currentAgent.note = input.value;
                      }
                    }}
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <p class="mt-3 text-sm leading-6 text-gray-600">
                  This will display on the map from the popup.
                </p>
              </div>
            </div>

            <div class="mt-4 text-left">
              <div class="col-span-full">
                <label
                  for="image"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Logo url</label
                >
                <div class="mt-2">
                  <input
                    type="text"
                    name="longitude"
                    id="longitude"
                    autocomplete="longitude"
                    placeholder="https://www.example.com/logo.png"
                    bind:value={currentAgent.imageUrl}
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <!-- <div
                  class="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"
                >
                  <div class="text-center">
                    <svg
                      class="mx-auto h-12 w-12 text-gray-300"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div class="mt-4 flex text-sm leading-6 text-gray-600">
                      <label
                        for="file-upload"
                        class="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          class="sr-only"
                        />
                      </label>
                      <p class="pl-1">or drag and drop</p>
                    </div>
                    <p class="text-xs leading-5 text-gray-600">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div> -->
              </div>
            </div>
          </div>
        </div>

        <!-- {#each facets as {name}}

          <div class="mt-4 text-left">
            <div>
              <label
                for="type"
                class="block text-sm font-medium leading-6 text-gray-900"
                >{name}</label
              >
              <select
                id="type"
                name="type"
                class="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                {#each facetValues as {value}}
                  <option>{value}</option>
                {/each}
              </select>
            </div>
          </div>
        {/each} -->

        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            disabled={!isAgentValid}
            on:click={() => {
              if (editing) {
                handleUpdate()
              } else {
                handleSubmit()
              }
            }}
            class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
            >
            {#if editing}
            Update
            {:else}
            Create
            {/if}
            </button
          >
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

<style>
  button:disabled { background-color: lightgray; }
</style>