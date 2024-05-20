<script lang="ts">
  import { clickOutside } from '../utils'
  import { onMount } from 'svelte'
  import { mutation, query } from 'svelte-apollo'
  import gql from 'graphql-tag'
  import type { Unit, AgentConnection, UnitConnection, PlanUpdateParams, PlanCreateParams, CommitmentCreateParams, CommitmentUpdateParams, ProcessCreateParams, ProcessUpdateParams, Commitment } from '@valueflows/vf-graphql'
  import { createEventDispatcher } from 'svelte';
  import type { RelayConn } from '$lib/graphql/helpers'
  import { flattenRelayConnection } from '$lib/graphql/helpers'
  import { RESOURCE_SPECIFICATION_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
  import { PROCESS_SPECIFICATION_CORE_FIELDS } from '$lib/graphql/process_specification.fragments'
  import { AGENT_CORE_FIELDS, PERSON_CORE_FIELDS, ORGANIZATION_CORE_FIELDS } from '$lib/graphql/agent.fragments'
  import type { ReadableQuery } from 'svelte-apollo'
  import type { Create } from '@holochain/client'
  import { goto } from '$app/navigation'
  
  export let open = false
  export let planObject: PlanUpdateParams | PlanCreateParams;
  export let editing: boolean = false;
  export let commitments: any;
  export let allColumns: any[];
  export let commitmentsToDelete: any[] = [];
  export let units: Unit[];
  export let agents: any[];
  export let resourceSpecifications: any[];
  export let processSpecifications: any[];
  let savingPlan: boolean = false;
  const delay = ms => new Promise(res => setTimeout(res, ms));
  let commitmentsToSaveCount: number = 0;
  let commitmentsSavedCount: number = 0;
  let error: any;

  $: if (commitmentsSavedCount > 0) {
    commitmentsSavedCount = commitmentsSavedCount
  };

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

  const UPDATE_PLAN = gql`
    mutation($rs: PlanUpdateParams!) {
      res: updatePlan(plan: $rs) {
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

  const UPDATE_PROCESS = gql`
    mutation($pc: ProcessUpdateParams!) {
      updateProcess(process: $pc) {
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
          plannedWithin {
            id
          }
        }
      }
    }
  `

  const UPDATE_COMMITMENT = gql`
    mutation($cm: CommitmentUpdateParams!) {
      updateCommitment(commitment: $cm) {
        commitment {
          id
          revisionId
          plannedWithin {
            id
          }
        }
      }
    }
  `

  const DELETE_COMMITMENT = gql`mutation($revisionId: ID!){
    deleteCommitment(revisionId: $revisionId)
  }`

  const CREATE_AGREEMENT = gql`
    mutation($ag: AgreementCreateParams!) {
      createAgreement(agreement: $ag) {
        agreement {
          id
          revisionId
        }
      }
    }
  `

  const UPDATE_AGREEMENT = gql`
    mutation($ag: AgreementUpdateParams!) {
      updateAgreement(agreement: $ag) {
        agreement {
          id
          revisionId
        }
      }
    }
  `

  let addPlan: any = mutation(CREATE_PLAN)
  let updatePlan: any = mutation(UPDATE_PLAN)
  let addProcess: any = mutation(CREATE_PROCESS)
  let updateProcess: any = mutation(UPDATE_PROCESS)
  let addCommitment: any = mutation(CREATE_COMMITMENT)
  let updateCommitment: any = mutation(UPDATE_COMMITMENT)
  let addAgreement: any = mutation(CREATE_AGREEMENT)
  let updateAgreement: any = mutation(UPDATE_AGREEMENT)
  let deleteCommitment: any = mutation(DELETE_COMMITMENT)

  async function saveProcess(process: any) {
    console.log(process)
    console.log(processSpecifications)
    let processCreateParams: ProcessCreateParams = {
      name: process.name,
      note: process.note,
      plannedWithin: process.plannedWithin,
      basedOn: processSpecifications.find((rs) => rs.name === process.based_on.name).id,
    }
    let p = await addProcess({
      variables: {
        pc: processCreateParams
      }
    })
    console.log(p)
    return p
  }

  async function saveProcessUpdates(process: any) {
    let processUpdateParams: ProcessUpdateParams = {
      revisionId: process.revisionId,
      name: process.name,
      note: process.note,
      plannedWithin: process.plannedWithin,
      basedOn: process.basedOn.id,
    }
    console.log(processUpdateParams)
    let p = await updateProcess({
      variables: {
        pc: processUpdateParams
      }
    })
    console.log(p)
    return p
  }

  async function addOrUpdatePlan(update: boolean) {
    if (update) {
      return await updatePlan({
        variables: {
          rs: {
            revisionId: planObject.revisionId,
            name: planObject.name,
            note: planObject.note,
          }
        }
      })
    } else {
      return await addPlan({
        variables: {
          rs: {
            name: planObject.name,
            created: new Date(Date.now()),
            due: new Date(Date.now()),
            note: planObject.note,
          }
        }
      })
    }   
  }

  async function saveOrUpdateProcess(process: any) {
    if (process.revisionId !== undefined) {
      console.log("update process")
      const x = await saveProcessUpdates(process)
      console.log(x)
      return x.data.updateProcess.process.id
    } else {
      console.log("create process")
      const x = await saveProcess(process)
      return x.data.createProcess.process.id
    }
  }

  async function saveOrUpdateCommitment(commitment: CommitmentUpdateParams) {
    console.log("save or updated commitment", commitment.resourceConformsTo?.name, resourceSpecifications)
    let unitId = commitment.resourceQuantity?.hasUnitId ? commitment.resourceQuantity?.hasUnitId : commitment.resourceQuantity?.hasUnit?.id
    if (unitId === undefined) {
      unitId = units.find((u) => u.label === commitment.resourceQuantity?.hasUnit?.label)?.id
    }
    let o: CommitmentCreateParams = {
      plannedWithin: commitment.plannedWithin,
      finished: commitment.finished,
      note: commitment.note,
      hasBeginning: new Date(Date.now()),
      resourceConformsTo: resourceSpecifications.find((rs) => rs.name === commitment.resourceConformsTo?.name).id,
      resourceQuantity: {
        hasNumericalValue: Number(commitment?.resourceQuantity?.hasNumericalValue),
        hasUnit: unitId
      },
    }
    console.log("commitment check unit id", commitment)

    const defaultAgent = agents.find((a) => a.classifiedAs[2] === "Network")

    try {
      if (commitment.providerId) {
        o.provider = commitment.providerId
      } else {
        o.provider = agents.find((a) => a.name === commitment.provider.name).id
      }
    } catch (e) {
      console.log("can't find receiver", e)
      o.provider = defaultAgent.id
      console.log("saved by setting default agent", defaultAgent)
    }
    try {
      if (commitment.receiverId) {
        o.receiver = commitment.receiverId
      } else {
        o.receiver = agents.find((a) => a.name === commitment.receiver.name).id
      }
    } catch (e) {
      console.log("can't find provider", e)
      o.receiver = defaultAgent.id
      console.log("saved by setting default agent", defaultAgent)
    }

    if (commitment.clauseOf !== undefined) {
      o.clauseOf = commitment.clauseOf
    }
    if (commitment.outputOf !== undefined) {
      o.outputOf = commitment.outputOf
    }
    if (commitment.inputOf !== undefined) {
      o.inputOf = commitment.inputOf
    }
    if (commitment.independentDemandOf !== undefined) {
      o.independentDemandOf = commitment.independentDemandOf
    }
    console.log("about to add or update commitment", commitment)
    if (commitment.revisionId == undefined) {
      o.action = commitment.action.label
      console.log("adding commitment", o)
      try {
        const res = await addCommitment({
          variables: {
            cm: o
          }
        })
        console.log("added commitment", res)
        // commitmentsSavedCount++
        // await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        console.log(e)
        error = e
      }
    } else {
      let com: CommitmentUpdateParams = {
        ...o,
        revisionId: commitment.revisionId,
      }
      if (com.clauseOf?.id) {
        com.clauseOf = com.clauseOf.id
      }
      console.log("updating commitment", com)
      try {
        const res = await updateCommitment({
          variables: {
            cm: com
          }
        })
        console.log("updated commitment", res)
      } catch (e) {
        console.log(e)
        error = e
      }
    }
  }

  async function handleSubmit() {
    savingPlan = true;
    commitmentsToSaveCount = commitments.length
    for (const column of allColumns) {
      for (const process of column) {
        commitmentsToSaveCount += process.committedInputs.length
        commitmentsToSaveCount += process.committedOutputs.length
      }
    }
    commitmentsSavedCount = 0
    let p = await addOrUpdatePlan(editing)
    // SAVE INDEPENDENT DEMANDS (commitments with no input or output)
    for (const c of commitments) {
      console.log(c)
      console.log("agents", agents)
      let o = {
        ...c,
        // provider is carbon farm network
        provider: agents.find((a) => a.classifiedAs[2] === "Network").id,
        // reciever is agent for request
        plannedWithin: p.data.res.plan.id,
        // references plan with independentDemandOf
        independentDemandOf: p.data.res.plan.id,
        // action is transfer
        action: {
          label: "transfer"
        }
      }
      console.log("trying to add independent", o)
      await saveOrUpdateCommitment(o)
      commitmentsSavedCount = commitmentsSavedCount + 1
      // await new Promise(r => setTimeout(r, 1000));

      console.log('added independent', o)
    }

    for (const column of allColumns) {
      for (const process of column) {
        process.plannedWithin = p.data.res.plan.id
        // save process
        const processId = await saveOrUpdateProcess(process)
        console.log("compare ids", p, processId)
        // save everything else
        async function handleCommitment(c: any) {          
          let agreementId: string;
          // save cost if applicable
          if (c.clauseOf) {
            console.log("There is a clause of", c.clauseOf)
            c.agreement = {
              id: c.clauseOf.id,
              commitment: c.clauseOf.commitments.find((cm) => cm.action.label === "transfer")
            }
          }
          if (c.agreement !== undefined) {
            console.log("agreement exists!!", c.agreement)
            console.log("commitment for agreement: ", c)
            // save agreement
            let ag = c.agreement
            let agCreateParams = {
              name: ag.name,
              note: ag.note,
            }
            const a = await addAgreement({
              variables: {
                ag: agCreateParams
              }
            })
            console.log("new agreement added", a)
            agreementId = a.data.createAgreement.agreement.id
            c.clauseOf = a.data.createAgreement.agreement.id

            // save cost commitment
            const dollars = resourceSpecifications.find((rs) => rs.name === "USD")
            console.log("dollars", dollars)
            let payment: CommitmentCreateParams = {
              clauseOf: a.data.createAgreement.agreement.id,
              action: {
                label: "transfer"
              },
              provider: c.receiver,
              receiver: c.provider,
              plannedWithin: p.data.res.plan.id,
              resourceConformsTo: dollars,
              resourceQuantity: {
                hasNumericalValue: Number(c.agreement.commitment.resourceQuantity.hasNumericalValue),
                hasUnitId: dollars.defaultUnitOfResource.id,
                hasUnit: {
                  id: dollars.defaultUnitOfResource.id,
                  label: dollars.defaultUnitOfResource.label
                }
              },
              finished: false,
              note: c.agreement.commitment.note,
              hasBeginning: new Date(Date.now()),
            }

            console.log("payment commitment 1", payment)

            // try {
            //   payment.provider = agents.find((a) => a.node.name === c.receiver.name).node.id
            // } catch (e) {
            //   console.log("can't find receiver", e)
            //   payment.provider = agents.find((a) => a.node.name === "Carbon Farm Network").node.id
            // }
            // try {
            //   payment.receiver = agents.find((a) => a.node.name === c.provider.name).node.id
            // } catch (e) {
            //   console.log("can't find provider", e)
            //   payment.receiver = agents.find((a) => a.node.name === "Carbon Farm Network").node.id
            // }

            console.log("payment commitment 2", payment)

            // try  {
            //   c.agreement.commitment.
            // } catch (e) {
            //   console.log("could not find unit", e)
            // }
            try {
              // let paymentCommitment = await addCommitment({
              //   variables: {
              //     cm: payment
              //   }
              // })
              console.log("trying to save payment commitment", payment)
              let paymentCommitment = await saveOrUpdateCommitment(payment)
              commitmentsSavedCount = commitmentsSavedCount + 1
              // await new Promise(r => setTimeout(r, 1000));
              console.log("payment commitment 3", paymentCommitment)
            } catch (e) {
              console.log("could not add payment commitment", e)
            }
          }

          // save primary commitment
          // c.process = x.data.createProcess.process
          c.plannedWithin = p.data.res.plan.id
          // console.log(c.process)
          if (c.provider === undefined) {
            c.provider = c.receiver
          }
          if (c.receiver === undefined) {
            c.receiver = c.provider
          }
          if (agreementId) {
            c.clauseOf = agreementId
          }
          // await delay(30)
          console.log("about to save commitment", c)

          // TEMPORARY find unit id
          if (c.revisionId == undefined) {
            console.log("finding unit id", c.resourceQuantity)
            let unitId = c.resourceQuantity?.hasUnitId ? c.resourceQuantity?.hasUnitId : c.resourceQuantity?.hasUnit?.id
            if (unitId === undefined) {
              unitId = units.find((u) => u.label === c.resourceQuantity?.hasUnit?.label)?.id
            }
            c = {
              ...c,
              resourceQuantity: {
                // ...c.resourceQuantity,
                ...((({ hasUnitId, ...o }) => o)(c.resourceQuantity)),
                hasUnit: {
                  // id: c.resourceQuantity.hasUnit.id
                  id: unitId
                }
              }
            }
            console.log("HERE IS THE C", c)
            // c.resourceQuantity.hasUnit.id = units.find((u) => u.label === c.resourceQuantity.hasUnit.label).id
          }
          // UNIT ID FIND ENDS
          console.log("commitment before sending to function", c)
          await saveOrUpdateCommitment(c)
          // console.log("saving commitment",c)
          // await delay(30);
        }

        for (const input of process.committedInputs) {
          console.log("input is", input)
          // await delay(30);
          await handleCommitment({
            ...input,
            inputOf: processId,
          })
        }
        for (const output of process.committedOutputs) {
          console.log("output is", output)
          // await delay(30);
          await handleCommitment({
            ...output,
            outputOf: processId,
          })

          // let c = input
          // c.process = x.data.createProcess.process
          // if (c.provider === undefined) {
          //   c.provider = c.receiver
          // }
          // if (c.receiver === undefined) {
          //   c.receiver = c.provider
          // }
          // console.log(x.data.createProcess.process.id)
          // c.outputOf = x.data.createProcess.process.id
          // c.plannedWithin = p.data.res.plan.id
          // // c.outputProcess = "none"
          // // console.log("saving commitment",c)
          // await saveCommitment(c)
          // await delay(20);
        }
        // await delay(30);
      }
    }

    // delete commitments
    console.log(commitmentsToDelete)
    for (const c of commitmentsToDelete) {
      try {
        console.log("deleting commitment", c)
        await deleteCommitment({
          variables: {
            revisionId: c
          }
        })
      } catch (e) {
        console.log("could not delete commitment", e)
      }
    }

    savingPlan = false;
    // goto(`/plans/update/${p.data.res.plan.id}`)
    console.log("Go To Plan Update Page", encodeURIComponent(p.data.res.plan.id))
    dispatch('saved', p.data.res.plan.id)
    goto(`/plans/update/${encodeURIComponent(p.data.res.plan.id)}`)
    open = false
    // dispatch('create', plan)
  }

  async function handleUpdate() {
    console.log("update in progress ...")

  }

  // async function fetchUnits() {
  //   getUnits.getCurrentResult()
  //   getUnits.refetch().then((r) => {
  //     if (r.data?.units.edges.length > 0) {
  //       units = flattenRelayConnection(r.data?.units)
  //     }
  //   })
  // }

  onMount(async () => {
    // await fetchUnits();
    // console.log(planObject)
    // const x = await resourceSpecificationsQuery.refetch()
    // resourceSpecifications = x.data.resourceSpecifications.edges
    // console.log("loaded resource specifications", resourceSpecifications)
    // const z = await processSpecificationsQuery.refetch()
    // processSpecifications = z.data.processSpecifications.edges
    // console.log("loaded process specifications", processSpecifications)
    // const y = await agentsQuery.refetch()
    // console.log(y)
    // agents = y.data.agents.edges
    // console.log("loaded agents", agents)
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
            class="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
            on:click={() => {
              // if (editing) {
              //   handleUpdate()
              // } else {
                handleSubmit()
              // }
            }}>{
              editing ? "Update" : "Save"
            }</button
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
                <circle cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="black" stroke-dasharray="31.415, 31.415" />
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
                  <!-- {#if commitmentsSavedCount > -1}
                    (saving {commitmentsSavedCount} of {commitmentsToSaveCount}) commitments
                  {/if} -->
                </div>
                {#if error}
                  <div class="mt-2">
                    Error:
                    {JSON.stringify(error)}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
