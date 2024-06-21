<script lang="ts">
  import { Decimal } from 'decimal.js'
  import PlanModal from '$lib/PlanModal.svelte'
  import CommitmentModal from '$lib/CommitmentModal.svelte'
  import EconomicEventModal from '$lib/EconomicEventModal.svelte'
  import { Trash, Pencil, PlusCircle, EconomicEvent } from '$lib/icons'
  import { page } from '$app/stores';
  import { gql } from 'graphql-tag'
  import { mutation, query } from 'svelte-apollo'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { Unit, AgentConnection, Agent, Action, Proposal, EconomicResource, EconomicResourceCreateParams, ResourceSpecification, ProcessSpecification, PlanConnection, EconomicEventCreateParams, FulfillmentCreateParams } from '@valueflows/vf-graphql'
  import Export from "$lib/Export.svelte"
  import { dragscroll } from '@svelte-put/dragscroll';
  import { getAllActions, getAllAgents, getAllProcessSpecifications, getAllProposals, getAllResourceSpecifications, getAllUnits, getAllEconomicResources } from '../../../../crud/fetch'
  import { allActions, allAgents, allUnits, allResourceSpecifications, allProcessSpecifications, allProposals, allEconomicResources } from '../../../../crud/store'
  import Loading from '$lib/Loading.svelte'
  import { matchingOffer, makeAgreement } from '../../=helper'
  import { getPlan } from '../../../../crud/fetch'
  import { fullPlans } from '../../../../crud/store'
  import { get } from 'svelte/store'

  const delay = ms => new Promise(res => setTimeout(res, ms));
  let commitmentModalProcess: number | undefined;
  let commitmentModalColumn: number | undefined;
  let commitmentModalSide: string | undefined;
  let currentProcess: any[] | undefined;
  let commitmentsToDelete: string[] = []
  let agreementsToDelete: string[] = []
  let processesToLoadCount = 0;
  let processesLoadedCount = 0;
  let selectedProcessId: string | undefined = undefined;
  let error: any;
  let yellow: any[] = []
  let yellowAmounts: any = {}
  let units: Unit[] = []
  let actions: Action[] = []
  let agents: Agent[] = []
  let resourceSpecifications: ResourceSpecification[] = []
  let processSpecifications: ProcessSpecification[] = []
  let requestsPerOffer: { [key: string]: any } = {}
  let requests: Proposal[] = [];
  let offers: Proposal[] = [];
  let proposalsList: Proposal[] = []
  let plan: any;
  let loadingPlan: boolean = true;
  let allColumns: any = []
  let economicResources: EconomicResource[] = [];

  let processImages = {
    "Pick Up": "/pickup.svg",
    "Ship": "/truck.svg",
    "Spin Yarn": "/socks.svg",
    "Scour Fiber": "/washing-machine.svg"
  }

  let planId = ''
  $: if ($page.params.plan_id) {
    planId = $page.params.plan_id;
  }

  allEconomicResources.subscribe(value => {economicResources = value;})
  allProcessSpecifications.subscribe((res) => {processSpecifications = res})
  allResourceSpecifications.subscribe((res) => {resourceSpecifications = res})
  allUnits.subscribe((res) => {units = res})
  allActions.subscribe((res) => {actions = res})
  fullPlans.subscribe((res) => {plan = res[$page.params.plan_id]})

  allAgents.subscribe((res) => {
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

  allProposals.subscribe((res) => {
    if (!res.length || res.length == 0) return
    requests = res.filter(it => it.publishes?.find(it => it.reciprocal)?.publishes?.receiver)
    offers = res.filter(it => it.publishes?.find(it => !it.reciprocal)?.publishes?.provider)
    proposalsList = res
  })

  $: allColumns, commitmentModalColumn, commitmentModalProcess, commitmentModalSide, currentProcess, commitmentModalOpen, economicEventModalOpen, loadingPlan, currentProcess

  const CREATE_ECONOMIC_EVENT_WITH_RESOURCE = gql`
    mutation($event: EconomicEventCreateParams!, $newInventoriedResource: EconomicResourceCreateParams!) {
      createEconomicEvent(event: $event, newInventoriedResource: $newInventoriedResource) {
        economicEvent {
          id
        }
        economicResource {
          id
        }
      }
    }
  `

  const CREATE_ECONOMIC_EVENT = gql`
    mutation($event: EconomicEventCreateParams!) {
      createEconomicEvent(event: $event) {
        economicEvent {
          id
        }
      }
    }
  `

  const CREATE_FULFILLMENT = gql`
    mutation($fulfillment: FulfillmentCreateParams!) {
      createFulfillment(fulfillment: $fulfillment) {
        fulfillment {
          id
          revisionId
        }
      }
    }
  `

  let addEconomicEventWithResource: any = mutation(CREATE_ECONOMIC_EVENT_WITH_RESOURCE)
  let addEconomicEvent: any = mutation(CREATE_ECONOMIC_EVENT)
  let addFulfillment: any = mutation(CREATE_FULFILLMENT)

  async function includeCommitment(commitment: Commitment) {
    try {
      // if primary intent, add to requestsPerOffer
      if (commitment.clauseOf) {
        const matching_offer = matchingOffer(commitment, offers)

        const primary_intent = matching_offer?.publishes.find(
          intent => !intent.reciprocal
        )
                
        if (!requestsPerOffer[primary_intent.id]) {
          requestsPerOffer[primary_intent.id] = {}
        }
        
        if (commitment.action.label == "pickup") {
          requestsPerOffer[primary_intent.id][commitment.id] = new Decimal(commitment.resourceQuantity.hasNumericalValue)
        }
      }
    } catch (e) {
      console.log("include commitment error", e)
    }
  }

  async function saveEconomicEvent(commitment: any, process: any, side: string) {
    try {
      const economicEvent: EconomicEventCreateParams = {
        action: commitment.action.id,
        provider: commitment.providerId,
        receiver: commitment.receiverId,
        resourceQuantity: { hasNumericalValue: commitment.resourceQuantity.hasNumericalValue, hasUnit: commitment.resourceQuantity.hasUnitId },
        resourceConformsTo: commitment.resourceConformsTo.id,
        hasPointInTime: new Date(),
        hasBeginning: new Date(),
      }

      if (side == "committedInputs") {
        economicEvent.inputOf = process
      } else if (side == "committedOutputs"){
        economicEvent.outputOf = process
      }

      let pickupFromOtherAgent = commitment.action.label == "pickup" && commitment.providerId != commitment.receiverId
      let produce = commitment.action.label == "produce"
      let consume = commitment.action.label == "consume"

      if (pickupFromOtherAgent || produce || consume) {
        let matchingResource = economicResources.find(it => it.conformsTo.id == commitment.resourceConformsTo.id)
        if (matchingResource) {
          economicEvent.resourceInventoriedAs = matchingResource.id
        }
      }

      let res;
      if (!economicEvent?.resourceInventoriedAs && ( (commitment.action.label == "pickup" && commitment.providerId != commitment.receiverId) || commitment.action.label == "produce") ) {
        console.log("add new economic event and resource", !economicEvent?.resourceInventoriedAs, commitment)
        let resourceSpecification = resourceSpecifications.find(it => it.id == commitment.resourceConformsTo.id)
        let newInventoriedResource: EconomicResourceCreateParams = {
          name: resourceSpecification?.name,
          note: commitment.note,
          image: resourceSpecification?.image,
          conformsTo: resourceSpecification?.id
        }
        
        res = await addEconomicEventWithResource({
          variables: {
            event: economicEvent,
            newInventoriedResource: newInventoriedResource
          }
        })
      } else {
        console.log("add economic event")
        res = await addEconomicEvent({
          variables: {
            event: economicEvent
          }
        })
      }

      const fulfillment: FulfillmentCreateParams = {
        fulfilledBy: res.data.createEconomicEvent.economicEvent.id,
        fulfills: commitment.id,
      }

      await addFulfillment({
        variables: {
          fulfillment: fulfillment,
        }
      })

      getAllEconomicResources();

      // await saveCommitment(commitment)
    } catch (e) {
      console.log(e)
    }
  }

  async function resetColumns() {
    requestsPerOffer = {}
    for (let i = 0; i < allColumns.length; i++) {
      for (let j = 0; j < allColumns[i].length; j++) {
        let inputsAndOutputs = allColumns[i][j].committedInputs.concat(allColumns[i][j].committedOutputs)
        for (let k = 0; k < inputsAndOutputs.length; k++) {
          inputsAndOutputs[k].clauseOf = null
          await includeCommitment(inputsAndOutputs[k])
          try {
            const addedValue = new Decimal(inputsAndOutputs[k].clauseOf.commitments.find(it => it.action.label == "transfer").resourceQuantity.hasNumericalValue)
            totalCost = totalCost.add(addedValue)
          } catch {}
        }
      }
    }
  }

  export async function getPlanLater() {
    await getPlan(planId)
    await buildPlan()
  }

  export async function buildPlan() {
    let lastSeenProcessSpecification: any = undefined;
    let lastLastSeenProcessSpecification: any = undefined;
    let lastColumn: any = []
    allColumns = []

    try {
      // getPlan.setVariables({
      //   id: planId
      // });
      // const res = await getPlan.refetch()
      // plan = {...res.data.plan}
      console.log(plan)
      commitments = [...plan.independentDemands]
      console.log("plan is here", plan)
      console.log("commitments", commitments)

      // order plan.processes by meta.retrievedRevision.time
      let sortedProcesses = [...plan.processes].sort((a, b) => new Date(a.meta.retrievedRevision.time).getTime() - new Date(b.meta.retrievedRevision.time).getTime())
      for (const process of sortedProcesses) {
        const newProcess = {
          ...process,
          basedOn: {
            image: processImages[process.basedOn.name],
            name: process.basedOn.name,
            id: process.basedOn.id,
          },
          // sort committedInputs by last modified
          committedInputs: [...process.committedInputs].sort((a, b) => new Date(a.meta.retrievedRevision.time).getTime() - new Date(b.meta.retrievedRevision.time).getTime()),
          // committedInputs: [...process.committedInputs].reverse(),
          committedOutputs: [...process.committedOutputs].sort((a, b) => new Date(a.meta.retrievedRevision.time).getTime() - new Date(b.meta.retrievedRevision.time).getTime()),
        }

        for (const commitment of process.committedOutputs) {
          await includeCommitment(commitment)
        }

        for (const commitment of process.committedInputs) {
          await includeCommitment(commitment)
        }
        
        // if this is a new process
        if (process.basedOn.id !== lastSeenProcessSpecification) {
          // add last column to allColumns and reset
          if (lastColumn.length > 0) {
            lastColumn = [newProcess]
          } else {
            lastColumn.push(newProcess)
          }
          lastSeenProcessSpecification = process.basedOn.id
        } else {
          lastColumn.push(newProcess)
        }

        if (process.basedOn.id !== lastLastSeenProcessSpecification) {
          allColumns.push(lastColumn)
        } else {
          console.log("SAME PROCESS", process.basedOn.name, lastSeenProcessSpecification)
        }
        lastLastSeenProcessSpecification = process.basedOn.id
        loadingPlan = false;
        allColumns = [...allColumns]
      }

        // await getAllActions()
        // await getAllUnits()
        // await getAllAgents()
        // // await getAllProposals()
        // await getAllResourceSpecifications()
        // await getAllProcessSpecifications()
        // await getAllEconomicResources()
        console.log("these are all the columns", allColumns)
      } catch (e) {
        console.log("error", e)
        error = e
      }
  }

  onMount(async () => {
    if (browser) {
      if (!plan) {
        console.log(JSON.stringify(plan))
        await getPlan(planId)
        await buildPlan()
      } else {
        console.log("plan already exists")
        await buildPlan()
        getPlanLater()
      }
      let functions = [
        { array: actions, func: getAllActions },
        { array: units, func: getAllUnits },
        { array: agents, func: getAllAgents },
        // { array: proposals, func: getAllProposals },
        { array: resourceSpecifications, func: getAllResourceSpecifications },
        { array: processSpecifications, func: getAllProcessSpecifications },
        { array: economicResources, func: getAllEconomicResources },
      ];

      for (let item of functions) {
        if (item.array.length === 0) {
          await item.func();
        }
      }
    }
  })


  // ===========================================

  type Commitment = {
    resourceConformsTo: { name: string }
    resourceQuantity: { hasNumericalValue: string; hasUnit: { label: string } }
    receiver: { name: string }
    action: string
    id: string
  }
  let commitments: any[] = []

  let planModalOpen = false
  let commitmentModalOpen = false
  let economicEventModalOpen = false
  let selectedCommitmentId: string | undefined = undefined

  let totalCost: Decimal = new Decimal(0);
  $: if (allColumns) {
    totalCost = new Decimal(0)
    for (let i = 0; i < allColumns.length; i++) {
      for (let j = 0; j < allColumns[i].length; j++) {
        let inputsAndOutputs = allColumns[i][j].committedInputs.concat(allColumns[i][j].committedOutputs)
        for (let k = 0; k < inputsAndOutputs.length; k++) {
          if (inputsAndOutputs[k].clauseOf) {
            const addedValue = new Decimal(inputsAndOutputs[k].clauseOf.commitments.find(it => it.action.label == "transfer").resourceQuantity.hasNumericalValue)
            totalCost = totalCost.add(addedValue)
          }
        }
      }
    }
  }
</script>

{#if plan}
<PlanModal
  bind:open={planModalOpen} 
  planObject = {plan} 
  {allColumns} 
  {commitments} 
  {commitmentsToDelete}
  {units}
  {agents}
  {resourceSpecifications}
  {processSpecifications}
  editing={true}
  on:saved={async (event) => {
    loadingPlan = true
    await getPlan(planId)
    await buildPlan()
    loadingPlan = false
  }}
/>
{/if}

{#if economicEventModalOpen}
<EconomicEventModal
bind:open={economicEventModalOpen}
  {selectedCommitmentId}
  {commitmentModalProcess}
  {commitmentModalColumn}
  {commitmentModalSide}
  {units}
  {agents}
  {resourceSpecifications}
  {processSpecifications}
  process = {currentProcess}
  bind:commitments
  on:submit={(event) => {
    console.log("economic event: ", event.detail.commitment)
    saveEconomicEvent(event.detail.commitment, selectedProcessId, commitmentModalSide)
    let indexOfCommitment = allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide].findIndex(it => it.id == event.detail.commitment.id)
    console.log(event.detail)
    if (event.detail.commitment.finished) {
      yellow = yellow.filter(it => it != event.detail.commitment.id)
    } else {
      yellow.push(event.detail.commitment.id)
      // add all economic event amounts to yellowAmounts
    }
    if (yellowAmounts[event.detail.commitment.id]) {
      yellowAmounts[event.detail.commitment.id] = yellowAmounts[event.detail.commitment.id] + event.detail.commitment.resourceQuantity.hasNumericalValue
    } else {
      yellowAmounts[event.detail.commitment.id] = event.detail.commitment.resourceQuantity.hasNumericalValue
    }
    console.log("finished", event.detail.commitment.finished)
    allColumns[event.detail.column][event.detail.process][event.detail.side][indexOfCommitment] = event.detail.commitment
  }}
/>
{/if}

<CommitmentModal
  bind:open={commitmentModalOpen}
  {selectedCommitmentId}
  {commitmentModalProcess}
  {commitmentModalColumn}
  {commitmentModalSide}
  {units}
  {actions}
  {agents}
  {resourceSpecifications}
  process = {currentProcess}
  bind:commitments
  on:submit={(event) => {
    console.log("START COMMIT", event.detail)
    if (event.detail.useAs == "update") {
      if (event.detail.column == undefined) {
        commitments = commitments.map(it => it.id == event.detail.commitment.id ? event.detail.commitment : it)
        commitments = [...commitments]
      } else {

        // get cost
        let costAgreement = event.detail.commitment.clauseOf //.commitments.map(it => it.id == event.detail.commitment.id ? event.detail.commitment : {...it, provider: event.detail.commitment.receiver, receiver: event.detail.commitment.provider} )
        console.log("cost agreement 1", costAgreement)
        // check if provider changed, and if so, update the cost
        // let providerChanged = false;
        // try {
        //   providerChanged = event.detail.commitment.provider?.id != allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide].find(it => it.id == event.detail.commitment.id)?.provider?.id
        // } catch (e) {
        //   console.log(e)
        // }
        // console.log("provider changed? ", providerChanged, event.detail.commitment.provider)
        if (event.detail.saveCost) {
          if (costAgreement) {
            agreementsToDelete.push(costAgreement.revisionId)
            commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
            // resetColumns()
          }
          costAgreement = makeAgreement(event.detail.commitment, costAgreement, offers, agents)
          console.log("cost agreement", costAgreement)

          let primaryIntent = costAgreement.primaryIntent

          console.log("primary intent", primaryIntent)
          console.log("cost agreement", costAgreement)

          if (!requestsPerOffer[primaryIntent.id]) {
            requestsPerOffer[primaryIntent.id] = {}
          }
          if (event.detail.commitment.action.label == "pickup") {
            requestsPerOffer[primaryIntent.id][event.detail.commitment.id] = new Decimal(event.detail.commitment.resourceQuantity.hasNumericalValue)
          }

          console.log("cost agreement", costAgreement)
          if (costAgreement) {
            event.detail.commitment.clauseOf = {commitments: [costAgreement.commitment]}
          }          
        }
        // possible cost update ends

        let updatedCommitment = {
          ...event.detail.commitment,
        }

        console.log("cost agreement 2", costAgreement)
        if (costAgreement) {
          updatedCommitment.clauseOf = {commitments: [costAgreement.commitment]}
        }

        console.log("updated commitment", updatedCommitment)
        let commitmentIndex = allColumns[event.detail.column][event.detail.process][event.detail.side].findIndex(it => it.id == event.detail.commitment.id)
        allColumns[event.detail.column][event.detail.process][event.detail.side][commitmentIndex] = updatedCommitment
        // resetColumns()
      }
    } else {
      console.log(event.detail)
      if (event.detail.column == undefined) {
        commitments.push(event.detail.commitment)
        commitments = [...commitments]
      } else {
        console.log("adding commitment", event.detail.commitment)
        if (event.detail.saveCost) {
          let costAgreement = makeAgreement(event.detail.commitment, undefined, offers, agents)

          let primaryIntent = costAgreement.primaryIntent
          if (!requestsPerOffer[primaryIntent.id]) {
            requestsPerOffer[primaryIntent.id] = {}
          }
          if (event.detail.commitment.action.label == "pickup") {
            requestsPerOffer[primaryIntent.id][event.detail.commitment.id] = new Decimal(event.detail.commitment.resourceQuantity.hasNumericalValue)
          }

          console.log("cost agreement", costAgreement)
          if (costAgreement) {
            event.detail.commitment.clauseOf = {commitments: [costAgreement.commitment]}
          }
        }
        allColumns[event.detail.column][event.detail.process][event.detail.side].push(event.detail.commitment)
      }
    }

    allColumns = [...allColumns]
    // console.log(allColumns[event.detail.column][event.detail.process][event.detail.side])

    // reset form
    selectedCommitmentId = undefined
    commitmentModalProcess = undefined
    commitmentModalColumn = undefined
    commitmentModalSide = undefined
  }}
/>
<!-- custom header introduced to enable planning to be more inline with the beginning of the page -->
<div class="custom-background" style="height: 15vh">
  <div class="mx-auto px-2 sm:px-6 lg:px-8">
    <h2 class="pt-1 text-white text-3xl">Planning</h2>
    <p class="text-white text-xs">
      Creating and modifying a plan, and recording actual activity
    </p>
  </div>
</div>


{#if loadingPlan}
<!-- Loading processes ({processesLoadedCount}/{processesToLoadCount + 1}) -->
<!-- Loading plan... -->
<Loading />
<!-- processesLoadedCount number of dots -->
<!-- {#each Array.from({ length: processesLoadedCount }, (_, i) => i) as dot}
.
{/each} -->
{#if error}
  <br>
  {error}
{/if}
{:else}
<!-- plan name -->
<!-- plan name -->
<h1 class="text-center text-xl font-semibold">{plan.name}</h1>
{@const exportData = {
  plan: plan,
  allColumns: allColumns,
  commitments: commitments,
}}
<div class="flex justify-center items-center">
  <!-- <div class="outer-div justify-center items-center">
  <div class="scroll-div justify-center items-center">
  <div class="content-div flex space-x-8 mx-4"> -->
  <!-- <div class="flex space-x-8 mx-4 overflow-x-scroll"> -->
  <div class="flex space-x-8 mx-4 overflow-x-scroll overflow-y-scroll" style="height: calc(100vh - 172px)" use:dragscroll={{ axis: 'both' }}>

    <div class="min-w-[250px]">
      <div class="flex justify-center" style="margin-top: 22px; margin-bottom: 22px">
        <button
          type="button"
          on:click={() => {
            planModalOpen = true
            // plan_created = true
          }}
          class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Save changes</button
        >
        <Export dataName="plan" fileName="cfn-plan-{plan.name}" data={exportData} hideImport={true} />
      </div>
      <h2 class="text-center text-xl font-semibold">Offers</h2>
      <div class="bg-blue-300 border border-gray-400 p-2" style="background-color: #8C8C8C;">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#each proposalsList as { publishes }}
              {@const reciprocal = publishes?.find(it => it.reciprocal)}
              {@const primary = publishes?.find(it => !it.reciprocal)}
              {@const requestsTotalAll = requestsPerOffer[primary?.id]}
              {@const requestsTotal = requestsTotalAll ? Object.values(requestsTotalAll).map(it => new Decimal(it)).reduce((acc, it) => acc.add(it), new Decimal(0)) : new Decimal(0)}
              <!-- {@const requestsTotal = requestsPerOffer[primary?.id]} -->
              <!-- {JSON.stringify(requestsTotalAll)} -->
              {#if primary?.publishes?.provider}
                <div
                  class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                >
                  <p>{primary?.publishes?.resourceConformsTo?.name}</p>
                  {#if primary?.publishes?.availableQuantity}
                  <p>
                    {#if primary?.publishes?.availableQuantity?.hasNumericalValue && primary?.publishes?.availableQuantity?.hasNumericalValue > 0}
                      {primary?.publishes?.availableQuantity?.hasNumericalValue}
                      {primary?.publishes?.availableQuantity?.hasUnit?.label} available<br>
                      <!-- {#each units as unit}
                        {#if unit.id == primary?.publishes?.availableQuantity?.hasUnitId}
                          {unit.label}
                        {/if}
                      {/each} 
                       available<br>-->
                      <span style="color: {(requestsTotal  > primary?.publishes?.availableQuantity?.hasNumericalValue) ? 'red' : ''
                        }">
                        {requestsTotal} requested<br>
                        <!-- {requestsTotal} of {primary?.publishes?.availableQuantity?.hasNumericalValue} requested<br> -->
                      </span>
                    {/if}
                    {reciprocal?.publishes?.resourceQuantity?.hasNumericalValue}
                    {reciprocal?.publishes?.resourceConformsTo?.name} per {primary?.publishes?.resourceQuantity?.hasNumericalValue} 
                    {primary?.publishes?.resourceQuantity?.hasUnit?.label}
                    <!-- {#each units as unit}
                      {#if unit.id == primary?.publishes?.resourceQuantity?.hasUnitId}
                        {unit.label}
                      {/if}
                    {/each} -->
                  </p>
                  {:else}
                    <p>
                      {reciprocal?.publishes?.resourceQuantity?.hasNumericalValue}
                      USD per lb
                    </p>
                  {/if}
                  <p>from 
                    <!-- {primary?.publishes?.provider?.name} -->
                    {#each agents as agent}
                      {#if agent.id == primary?.publishes?.provider.id}
                        {agent.name}
                      {/if}
                    {/each}
                  </p>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>  
    </div>

    <!-- Main Columns -->
    <!-- {JSON.stringify(allColumns[0])} -->
    <!-- {#each allColumns as processes}
      {@const { image, name } = processes[0].basedOn}
      {JSON.stringify(name)}
    {/each} -->
    {#each allColumns as processes, columnIndex}
    {@const { image, name } = processes[0].basedOn}
    <div class="min-w-[420px]">
      <img class="mx-auto" height="80px" width="80px" src={image} alt="" />
      <h2 class="text-center text-xl font-semibold">{name}</h2>
      {#each processes as { committedInputs, committedOutputs }, processIndex}

      <!-- <div class="bg-gray-400 border border-gray-400 p-2"> -->
      <div class="border-gray-400 p-2" style="background-color: #BFBFBF;">
        <!-- Sub-columns -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <button
            class="flex justify-center items-center w-full mb-2"
            on:click={() => {
              commitmentModalProcess = processIndex
              commitmentModalColumn = columnIndex
              commitmentModalSide = "committedInputs"
              commitmentModalOpen = true
              selectedCommitmentId = undefined
            }}
                >
                <PlusCircle />
              </button>
                {#each committedInputs as { resourceConformsTo, providerId, resourceQuantity, action, receiverId, id, revisionId, agreement, fulfilledBy, finished, clauseOf, meta }}
                  {@const color = finished ? "#c4fbc4" : (((fulfilledBy && fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                    style="background-color: {color};"
                    >
                    <!-- {JSON.stringify(clauseOf?.commitments[0].providerId)} -->
                    <p>{resourceConformsTo?.name}</p>
                    <!-- {JSON.stringify(clauseOf)} -->
                    <!-- <p>{id}</p> -->
                    <div class="flex justify-between">
                      <!--
                      <p>
                        {supply_driven_quantity?.hasNumericalValue}
                        {supply_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                      <p>
                        {action.label}
                        <!-- sum of all fulfilledby numericalvalues -->
                        {#if false && fulfilledBy && fulfilledBy.length > 0 && fulfilledBy[0].id}
                          {@const yellowAmount = yellowAmounts[id] || 0}
                          {@const amount = fulfilledBy.map(it => it.fulfilledBy.resourceQuantity.hasNumericalValue).reduce((acc, it) => new Decimal(acc).add(it), new Decimal(0)).toString()}
                          {new Decimal(amount).add(yellowAmount).toString()}
                          {fulfilledBy[0].fulfilledBy?.resourceQuantity?.hasUnit?.label}
                        {:else if yellowAmounts[id]}
                          {yellowAmounts[id]}
                          <!-- {resourceQuantity?.hasUnit?.label} -->
                          {#each units as unit}
                            {#if unit.id?.split(":")[0] == resourceQuantity.hasUnit?.id?.split(":")[0]}
                              {unit.label}
                            {/if}
                          {/each}
                        {:else}
                          {new Decimal(resourceQuantity?.hasNumericalValue).toString()}
                          <!-- {resourceQuantity?.hasUnit?.label} -->
                          {#each units as unit}
                            {#if unit.id?.split(":")[0] == resourceQuantity.hasUnit?.id?.split(":")[0]}
                              {unit.label}
                            {/if}
                          {/each}
                        {/if}
                      </p>

                      <!--
                      <p>
                        {demand_driven_quantity?.hasNumericalValue}
                        {demand_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                    </div>
                    <p>
                      from 
                      {#each agents as agent}
                        {#if agent.id == providerId}
                          {agent.name}
                        {/if}
                      {/each}
                      <br />
                      to 
                      {#each agents as agent}
                        {#if agent.id == receiverId}
                          {agent.name}
                        {/if}
                      {/each}
                      {#if fulfilledBy?.length > 0}
                        <br />
                        Economic Events: {fulfilledBy?.length}
                      {/if}
                    </p>
                    {#if clauseOf}
                      {@const clause = clauseOf.commitments.find(it => it.action.label == "transfer")}
                      {#if clause}
                        <p>
                          cost {
                            new Decimal(
                              clause.resourceQuantity.hasNumericalValue
                            )
                            .toFixed(2, Decimal.ROUND_HALF_UP)
                            .toString()}
                          {clause.resourceConformsTo.name}
                        </p>
                      {/if}
                    {/if}
                    {#if false && fulfilledBy && fulfilledBy.length > 0}
                      <p>
                        fulfilled by: {fulfilledBy[0]}
                        finished: {finished}
                      </p>
                    {/if}
                    <div class="w-full flex justify-center">
                    <div style="margin-right: 20px; margin-top: 4px;">
                    <!-- <div style="margin-right: 30px; margin-top: 4px;"> -->
                      <!-- button to move commitment up in arra -->
                      <button on:click={() => {
                        let index = allColumns[columnIndex][processIndex].committedInputs.findIndex(it => it.id == id)
                        if (index > 0) {
                          let temp = allColumns[columnIndex][processIndex].committedInputs[index]
                          allColumns[columnIndex][processIndex].committedInputs[index] = allColumns[columnIndex][processIndex].committedInputs[index - 1]
                          allColumns[columnIndex][processIndex].committedInputs[index - 1] = temp
                        }
                      }}>
                        <img class="mx-auto" height="14px" width="14px" src="/arrow-up.svg" alt="" />
                      </button>
                      <!-- button to move down -->
                      <button on:click={() => {
                        let index = allColumns[columnIndex][processIndex].committedInputs.findIndex(it => it.id == id)
                        if (index < allColumns[columnIndex][processIndex].committedInputs.length - 1) {
                          let temp = allColumns[columnIndex][processIndex].committedInputs[index]
                          allColumns[columnIndex][processIndex].committedInputs[index] = allColumns[columnIndex][processIndex].committedInputs[index + 1]
                          allColumns[columnIndex][processIndex].committedInputs[index + 1] = temp
                        }
                      }}>
                        <img class="mx-auto" height="14px" width="14px" src="/arrow-down.svg" alt="" />
                      </button>

                    </div>

                    <div style="margin-right: 20px; margin-top: 1px">
                    <button
                      on:click={() => {
                        commitmentModalProcess = processIndex
                        commitmentModalColumn = columnIndex
                        commitmentModalSide = "committedInputs"
                        selectedCommitmentId = id
                        currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                        commitmentModalOpen = true
                      }}
                    >
                      <Pencil/>
                    </button>
                    <button
                      on:click={() => {
                        // allColumns[columnIndex][processIndex].committedInputs = allColumns[columnIndex][processIndex].committedInputs.filter(it => it.id != id)
                        // if (revisionId) {
                        //   commitmentsToDelete.push(revisionId)
                        // }
                        // console.log(commitmentsToDelete, revisionId)
                        if (revisionId != undefined) {
                          commitmentsToDelete.push(revisionId)
                        }
                        
                        // remove cost agreement if present
                        let costAgreement = clauseOf
                        if (costAgreement) {
                          // resetColumns()
                          agreementsToDelete.push(costAgreement.revisionId)
                          commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
                        }
                        allColumns[columnIndex][processIndex].committedInputs = allColumns[columnIndex][processIndex].committedInputs.filter(it => it.id != id)
                      }}
                    >
                      <Trash />
                    </button>
                    </div>

                    {#if true && revisionId}
                      <button
                        style="margin-top: -3px;"
                        on:click={() => {
                          commitmentModalProcess = processIndex
                          commitmentModalColumn = columnIndex
                          commitmentModalSide = "committedInputs"
                          selectedCommitmentId = id
                          selectedProcessId = processes[0].id
                          currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                          economicEventModalOpen = true
                        }}
                      >
                        <EconomicEvent/>
                      </button>
                    {/if}

                    </div>
                  </div>
                {/each}
              </div>
              <div>
                <button
                  class="flex justify-center items-center w-full mb-2"

                  on:click={() => {
                    commitmentModalProcess = processIndex
                    commitmentModalColumn = columnIndex
                    commitmentModalSide = "committedOutputs"
                    // console.log(allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide][0].id)
                    commitmentModalOpen = true
                    // console.log(allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide][0].id)
                    selectedCommitmentId = undefined
                  }}
                >
                  <PlusCircle />
                </button>

                {#each committedOutputs as { resourceConformsTo, providerId, resourceQuantity, action, receiverId, id, revisionId, agreement, fulfilledBy, finished, clauseOf }}
                {@const color = finished ? "#c4fbc4" : (((fulfilledBy && fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")}
                <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                    style="background-color: {color};"
                    >
                    <div>
                      <p>{resourceConformsTo?.name}</p>
                      <div class="flex justify-between">
                        <!--
                      <p>
                        {supply_driven_quantity?.hasNumericalValue}
                        {supply_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                        <p>
                          {action.label}

                          {#if false && fulfilledBy && fulfilledBy.length > 0 && fulfilledBy[0].id}
                            {@const yellowAmount = yellowAmounts[id] || 0}
                            {@const amount = fulfilledBy.map(it => it.fulfilledBy.resourceQuantity.hasNumericalValue).reduce((acc, it) => new Decimal(acc).add(it), new Decimal(0)).toString()}
                            {new Decimal(amount).add(yellowAmount).toString()}
                            {fulfilledBy[0]?.fulfilledBy?.resourceQuantity?.hasUnit?.label}
                          {:else if yellowAmounts[id]}
                            {yellowAmounts[id]}
                            <!-- {resourceQuantity?.hasUnit?.label} -->
                            {#each units as unit}
                              {#if unit.id?.split(":")[0] == resourceQuantity.hasUnit.id?.split(":")[0]}
                                {unit.label}
                              {/if}
                            {/each}
                          {:else}
                            {new Decimal(resourceQuantity?.hasNumericalValue).toString()}
                            <!-- {resourceQuantity?.hasUnit?.label} -->
                            {#each units as unit}
                              {#if unit.id?.split(":")[0] == resourceQuantity.hasUnit.id?.split(":")[0]}
                                {unit.label}
                              {/if}
                            {/each}
                          {/if}
                        </p>
                        <!--
                      <p>
                        {demand_driven_quantity?.hasNumericalValue}
                        {demand_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                      </div>
                      <p>
                        from 
                        {#each agents as agent}
                          {#if agent.id == providerId}
                            {agent.name}
                          {/if}
                        {/each}
                        <br />
                        to 
                        {#each agents as agent}
                          {#if agent.id == receiverId}
                            {agent.name}
                          {/if}
                        {/each}
                        {#if fulfilledBy?.length > 0}
                          <br />
                          Economic Events: {fulfilledBy?.length}
                        {/if}
                      </p>
                      {#if clauseOf}
                        {@const clause = clauseOf.commitments.find(it => it.action.label == "transfer")}
                        {#if clause}
                          <p>
                            cost {new Decimal(
                              clause.resourceQuantity.hasNumericalValue
                            )
                              .toFixed(2, Decimal.ROUND_HALF_UP)
                              .toString()}
                            {clause.resourceConformsTo.name}
                          </p>
                        {/if}
                      {/if}
                    </div>
                    <!-- {#if editable} -->
                    <div class="w-full flex justify-center">
                      <div style="margin-right: 20px; margin-top: 4px;">
                      <!-- <div style="margin-right: 30px; margin-top: 4px;"> -->
                        <button on:click={() => {
                          let index = allColumns[columnIndex][processIndex].committedOutputs.findIndex(it => it.id == id)
                          if (index > 0) {
                            let temp = allColumns[columnIndex][processIndex].committedOutputs[index]
                            allColumns[columnIndex][processIndex].committedOutputs[index] = allColumns[columnIndex][processIndex].committedOutputs[index - 1]
                            allColumns[columnIndex][processIndex].committedOutputs[index - 1] = temp
                          }
                        }}>
                          <img class="mx-auto" height="14px" width="14px" src="/arrow-up.svg" alt="" />
                        </button>
                        <button on:click={() => {
                          let index = allColumns[columnIndex][processIndex].committedOutputs.findIndex(it => it.id == id)
                          if (index < allColumns[columnIndex][processIndex].committedOutputs.length - 1) {
                            let temp = allColumns[columnIndex][processIndex].committedOutputs[index]
                            allColumns[columnIndex][processIndex].committedOutputs[index] = allColumns[columnIndex][processIndex].committedOutputs[index + 1]
                            allColumns[columnIndex][processIndex].committedOutputs[index + 1] = temp
                          }
                        }}>
                          <img class="mx-auto" height="14px" width="14px" src="/arrow-down.svg" alt="" />
                        </button>
                      </div>

                      <div style="margin-right: 20px; margin-top: 1px">
                      <button
                        on:click={() => {
                          commitmentModalProcess = processIndex
                          commitmentModalColumn = columnIndex
                          commitmentModalSide = "committedOutputs"
                          selectedCommitmentId = id
                          currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                          commitmentModalOpen = true
                        }}
                      >
                      <Pencil/>
                    </button>
                    <button
                    on:click={() => {
                      if (revisionId != undefined) {
                        commitmentsToDelete.push(revisionId)
                      }

                      // remove cost agreement if present
                      let costAgreement = clauseOf
                      if (costAgreement) {
                        agreementsToDelete.push(costAgreement.revisionId)
                        commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
                        // requestsPerOffer[costAgreement.providerId] = requestsPerOffer[costAgreement.providerId] - costAgreement.commitments.find(it => it.action.label == "transfer").resourceQuantity.hasNumericalValue
                        resetColumns()
                      }
                      allColumns[columnIndex][processIndex].committedOutputs = allColumns[columnIndex][processIndex].committedOutputs.filter(it => it.id != id)
                    }}
                      >
                      <Trash />
                    </button>
                    </div>

                    {#if revisionId}
                      <button
                        style="margin-top: -3px;"
                        on:click={() => {
                          commitmentModalProcess = processIndex
                          commitmentModalColumn = columnIndex
                          commitmentModalSide = "committedOutputs"
                          selectedCommitmentId = id
                          selectedProcessId = processes[0].id
                          currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                          economicEventModalOpen = true
                        }}
                      >
                        <EconomicEvent/>
                      </button>
                    {/if}

                    </div>
                    <!-- {/if} -->
                  </div>
                {/each}
              </div>
            </div>
          </div>
          {/each}
      </div>
    {/each}

    <div class="min-w-[250px]">
      <!-- <strong>Total cost: $189</strong> -->
      <h2 class="text-center" style="margin-top: 42px; margin-bottom: 11px;">Total cost: ${totalCost}</h2>
      <!-- <h2 class="text-center text-xl font-semibold">{name}</h2> -->
      <h2 class="text-center text-xl font-semibold">Satisfy Requests</h2>
      <div class="bg-blue-300 border border-gray-400 p-2" style="background-color: #EEEEEE;">
        <!-- Sub-columns -->
        <div class="">
          <div>
            <button
              class="flex justify-center items-center w-full mb-2"
              on:click={() => {
                commitmentModalProcess = undefined
                commitmentModalColumn = undefined
                selectedCommitmentId = undefined
                commitmentModalSide = ""
                commitmentModalOpen = true
              }}
            >
              <PlusCircle />
            </button>
            {#each commitments as c}
              <!-- {JSON.stringify(c)} -->
              {@const resourceConformsTo = c.resourceConformsTo}
              {@const resourceQuantity = c.resourceQuantity}
              <!-- {@const receiver = c.receiver} -->
              {@const id = c.id}
              {@const revisionId = c.revisionId}
              {@const action = c.action}
              <div
                class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
              >
                <div>
                  <p>{resourceConformsTo?.name}</p>
                  <p>
                    {action.label}
                    {resourceQuantity?.hasNumericalValue}
                    {#each units as unit}
                      {#if unit.id?.split(":")[0] == resourceConformsTo?.defaultUnitOfResourceId?.split(":")[0]}
                        {unit.label}
                      {/if}
                    {/each}
                  </p>
                  <p>to 
                    {#each agents as agent}
                      {#if agent.id == c.receiverId}
                        {agent.name}
                      {/if}
                    {/each}
                  </p>
                </div>
                <div class="w-full flex justify-center">
                  <button
                    on:click={() => {
                      commitmentModalProcess = undefined
                      commitmentModalColumn = undefined
                      selectedCommitmentId = undefined
                      commitmentModalSide = ""
                      commitmentModalOpen = true
                      currentProcess = undefined
                      selectedCommitmentId = id
                      commitmentModalOpen = true
                    }}
                  >
                    <Pencil />
                  </button>
                  <button
                    on:click={() => {
                      (commitments = commitments.filter(it => it.id != id));
                      commitmentsToDelete.push(revisionId);
                    }}
                  >
                    <Trash />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <div class="min-w-[200px] mt-20">
      <h2 class="text-center text-xl font-semibold">Requests</h2>
      <div class="bg-blue-300 border border-gray-400 p-2" style="background-color: #8C8C8C;">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#each proposalsList as { publishes }}
              {@const reciprocal = publishes.find(it => it.reciprocal)}
              {@const primary = publishes.find(it => !it.reciprocal)}
              {#if primary?.publishes?.receiver}
                <div
                  class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                >
                  <p>{primary?.publishes?.resourceConformsTo?.name}</p>
                  <p>
                    {primary?.publishes?.action?.label}
                    {primary?.publishes?.resourceQuantity?.hasNumericalValue}
                    {primary?.publishes?.availableQuantity?.hasUnit?.label}<br>
                    <!-- {#each units as unit}
                      {#if unit.id == primary?.publishes?.resourceQuantity?.hasUnitId}
                        {unit.label}
                      {/if}
                    {/each} -->
                  </p>
                  <p>to 
                    {#each agents as agent}
                      {#if agent.id == primary?.publishes?.receiver.id}
                        {agent.name}
                      {/if}
                    {/each}
                  </p>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    </div>

  </div>
  <!-- </div>
  </div> -->
</div>
{/if}

<style>
  /* Custom CSS */
  .custom-background {
    /* background-image: url('/heading3.png'); */
    background-image: url('/dsf.jpg');
    background-size: cover;
    background-position: center;
  }
</style>
