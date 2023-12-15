<script lang="ts">
  import { clickOutside } from './utils'
  import { onMount } from 'svelte'
  import { mutation, query } from 'svelte-apollo'
  import type { AgentConnection, ProcessCreateParams } from '@valueflows/vf-graphql'
  import gql from 'graphql-tag'
  import type { PlanUpdateParams, PlanCreateParams, CommitmentCreateParams, CommitmentUpdateParams } from '@valueflows/vf-graphql'
  import { createEventDispatcher } from 'svelte';
  import type { RelayConn } from '$lib/graphql/helpers'
  import { RESOURCE_SPECIFICATION_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
  import { AGENT_CORE_FIELDS, PERSON_CORE_FIELDS, ORGANIZATION_CORE_FIELDS } from '$lib/graphql/agent.fragments'
  import type { ReadableQuery } from 'svelte-apollo'
  import type { Create } from '@holochain/client'
  
  export let open = false
  export let planObject: PlanUpdateParams | PlanCreateParams;
  export let editing: boolean = false;
  export let commitments;
  export let allColumns: any[];
  let agents: any[];
  let savingPlan: boolean = false;
  const delay = ms => new Promise(res => setTimeout(res, ms));
  let resourceSpecifications: any[];

  // let name = ''
  // let note = ''

  const dispatch = createEventDispatcher();

  function checkKey(e: any) {
    if (e.key === 'Escape' && !e.shiftKey) {
      e.preventDefault()
      open = false
    }
  }

  const CREATE_PLAN = gql`
    mutation($rs: PlanCreateParams!) {
      res: createPlan(plan: $rs) {
        plan {
          id
          revisionId
        }
      }
    }
  `

  const CREATE_PROCESS = gql`
    mutation($pc: ProcessCreateParams!) {
      createProcess(process: $pc) {
        process {
          id
          revisionId
        }
      }
    }
  `
    
  const CREATE_COMMITMENT = gql`
    mutation($cm: CommitmentCreateParams!) {
      createCommitment(commitment: $cm) {
        commitment {
          id
          revisionId
        }
      }
    }
  `

const GET_ALL_RESOURCE_SPECIFICATIONS = gql`
    ${RESOURCE_SPECIFICATION_CORE_FIELDS}
    query {
      resourceSpecifications(last: 100000) {
        edges {
          cursor
          node {
            ...ResourceSpecificationCoreFields
          }
        }
      }
    }
  `

const GET_ALL_AGENTS = gql`
    ${AGENT_CORE_FIELDS}
    query {
      agents(last: 100000) {
        edges {
          cursor
          node {
            id
            name
          }
        }
      }
    }
  `

  interface QueryResponse {
    resourceSpecifications: AgentConnection & RelayConn<any>
  }

  let resourceSpecificationsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_RESOURCE_SPECIFICATIONS)

  interface QueryResponse {
    agents: AgentConnection & RelayConn<any>
  }

  let agentsQuery: ReadableQuery<QueryResponse> = query(GET_ALL_AGENTS)

  let addPlan: any = mutation(CREATE_PLAN)
  let addProcess: any = mutation(CREATE_PROCESS)
  let addCommitment: any = mutation(CREATE_COMMITMENT)

  async function saveProcess(process: any) {
    console.log(process)
    let processCreateParams: ProcessCreateParams = {
      name: process.name,
      note: process.note,
      plannedWithin: process.plannedWithin,
    }
    let p = await addProcess({
      variables: {
        pc: processCreateParams
      }
    })
    console.log(p)
    return p
  }


  async function saveCommitment(commitment: any) {
    console.log(commitment)
    let o: CommitmentCreateParams = {
      // ...commitment,
      action: commitment.action,
      provider: agents.find((a) => a.node.name === "Carbon Farm Network").node.id,
      plannedWithin: commitment.process.id,
      receiver: agents.find((a) => a.node.name === "Carbon Farm Network").node.id,
      resourceConformsTo: resourceSpecifications.find((rs) => rs.node.name === commitment.resourceConformsTo.name).node.id,
      resourceQuantity: {hasNumericalValue: Number(commitment.resourceQuantity.hasNumericalValue)},
      finished: false,
      note: commitment.note,
      hasBeginning: new Date(Date.now()),
    }
    if (commitment.inputOf !== undefined) {
      o.inputOf = commitment.inputOf
    } else if (commitment.outputOf !== undefined) {
      o.outputOf = commitment.outputOf
    }
    // if (o.action == "dropoff") {
    //   o.action = ""
    // }
    console.log(o)
    let c = await addCommitment({
      variables: {
        cm: o
      }
    })
    console.log(c)
  }

  async function handleSubmit() {
    // if (planObject.name === '') {
    //   alert('Name is required.')
    //   return
    // }

    savingPlan = true;

    let p = await addPlan({
      variables: {
        rs: {
          name: planObject.name,
          created: new Date(Date.now()),
          due: new Date(Date.now()),
          note: planObject.note,
        }
      }
    })

    // console.log(p)

    // console.log(allColumns)

    for (const column of allColumns) {
      for (const process of column) {
        process.plannedWithin = p.data.res.plan.id
        // console.log(process)
        let x = await saveProcess(process)
        for (const input of process.has_input) {
          let c = input
          c.process = x.data.createProcess.process
          if (c.provider === undefined) {
            c.provider = c.receiver
          }
          if (c.receiver === undefined) {
            c.receiver = c.provider
          }
          // console.log(x.data.createProcess.process.id)
          c.inputOf = x.data.createProcess.process.id
          // console.log("saving commitment",c)
          await saveCommitment(c)
          await delay(20);
        }
        for (const input of process.has_output) {
          let c = input
          c.process = x.data.createProcess.process
          if (c.provider === undefined) {
            c.provider = c.receiver
          }
          if (c.receiver === undefined) {
            c.receiver = c.provider
          }
          console.log(x.data.createProcess.process.id)
          c.outputOf = x.data.createProcess.process.id
          // c.outputProcess = "none"
          // console.log("saving commitment",c)
          await saveCommitment(c)
          await delay(20);
        }
        await delay(20);
      }
    }

    savingPlan = false;



    open = false
    // dispatch('create', plan)
  }

  async function handleUpdate() {
    console.log("update in progress ...")
  }

  onMount(async () => {
    console.log(planObject)
    const x = await resourceSpecificationsQuery.refetch()
    resourceSpecifications = x.data.resourceSpecifications.edges
    console.log(resourceSpecifications)
    const y = await agentsQuery.refetch()
    agents = y.data.agents.edges
    console.log(agents)
    window.addEventListener('keydown', checkKey)
  })

  $: allColumns
</script>


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
  <div
    class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
    class:hidden={!open}
  />

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
      <!-- <div
        class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
        class:hidden={!open}
        use:clickOutside
        on:outclick={() => (open = false)}
      > -->

      {#if !savingPlan}
        <div
          class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
          class:hidden={!open}
          use:clickOutside
        >
        <div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
              Save the plan
            </h3>

            <div class="mt-4">
              <div class="text-left">
                <label
                  for="name"
                  class="block text-sm font-medium leading-6 text-gray-900">Name</label
                >
                <div class="relative mt-2 rounded-md shadow-sm">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder=""
                    bind:value={planObject.name}
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

            <div class="mt-4 text-left">
              <div class="col-span-full">
                <label
                  for="note"
                  class="block text-sm font-medium leading-6 text-gray-900"
                  >Description
                </label>
                <div class="mt-2">
                  <textarea
                    id="note"
                    bind:value={planObject.note}
                    name="note"
                    rows="3"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
            on:click={() => {
              if (editing) {
                handleUpdate()
              } else {
                handleSubmit()
              }
            }}>Create</button
          >
          <button
            type="button"
            on:click={() => (open = false)}
            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
            >Cancel</button
          >
        </div>
      </div>
      <!-- loading popup -->
      {:else}
        <div
          class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          class:hidden={!savingPlan}
        >
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <!-- <div
                class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10"
              > -->
              <svg width="50" height="50" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="rgb(99,102,241)" stroke-dasharray="31.415, 31.415" />
              </svg>
              <!-- </div> -->
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3
                  class="text-lg leading-6 font-medium text-gray-900"
                  id="modal-headline"
                >
                  Saving plan ...
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Please wait while the plan saves.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
