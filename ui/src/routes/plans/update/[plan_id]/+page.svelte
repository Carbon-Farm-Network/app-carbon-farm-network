<script lang="ts">
  import { Decimal } from 'decimal.js'
  import PlanModal from '$lib/PlanModal.svelte'
  import CommitmentModal from '$lib/CommitmentModal.svelte'
  import EconomicEventModal from '$lib/EconomicEventModal.svelte'
  import { Trash, Pencil, PlusCircle, EconomicEvent } from '$lib/icons'
  import { page } from '$app/stores';
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { Fulfillment, Unit, AgentConnection, Agent, Action, Proposal, CommitmentCreateParams, EconomicResource, EconomicResourceCreateParams, ResourceSpecification, ProcessSpecification, PlanConnection, EconomicEventCreateParams, FulfillmentCreateParams, CommitmentUpdateParams, Agreement } from '@valueflows/vf-graphql'
  import Export from "$lib/Export.svelte"
  import { dragscroll } from '@svelte-put/dragscroll';
  import { getAllActions, getAllAgents, getAllProcessSpecifications, getAllEconomicEvents, getAllProposals, getAllResourceSpecifications, getAllUnits, getAllEconomicResources, getProcess } from '../../../../crud/fetch'
  import { createEconomicEvent, createFulfillment, createEconomicEventWithResource, updateCommitment, createCommitment, createAgreement, deleteCommitment, deleteAgreement } from '../../../../crud/commit'
  import { allActions, allAgents, allUnits, allResourceSpecifications, allFulfillments, allProcessSpecifications, allProposals, allEconomicResources, allEconomicEvents } from '../../../../crud/store'
  import Loading from '$lib/Loading.svelte'
  import { matchingOffer, makeAgreement } from '../../=helper'
  import { getPlan } from '../../../../crud/fetch'
  import { fullPlans } from '../../../../crud/store'
  import { decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client'
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
  let economicEvents: EconomicEvent[] = [];
  let fulfillments: Fulfillment[] = []
  let selectedStage: string | undefined = undefined;

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
  allEconomicEvents.subscribe(value => {economicEvents = value;})
  allProcessSpecifications.subscribe((res) => {processSpecifications = res})
  allResourceSpecifications.subscribe((res) => {resourceSpecifications = res})
  allUnits.subscribe((res) => {units = res})
  allActions.subscribe((res) => {actions = res})
  allFulfillments.subscribe((res) => {fulfillments = res})
  
  const debouncedPlanSubscribe = debounce(async (res) => {
    plan = res[$page.params.plan_id]
    buildPlan()
  }, 100)

  fullPlans.subscribe(async(res) => {
    await debouncedPlanSubscribe(res)
  })

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

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async function includeCommitment(commitment: Commitment) {
    try {
      // if primary intent, add to requestsPerOffer
      if (commitment.clauseOf) {
        const matching_offer = matchingOffer(commitment, offers)

        const primary_intent = matching_offer?.publishes.find(
          intent => !intent.reciprocal
        )

        if (primary_intent) { 
          if (!requestsPerOffer[primary_intent.id]) {
            requestsPerOffer[primary_intent.id] = {}
          }
          
          if (commitment.action.label == "pickup") {
            requestsPerOffer[primary_intent.id][commitment.id] = new Decimal(commitment.resourceQuantity.hasNumericalValue)
          }
        }
      }
    } catch (e) {
      console.log("include commitment error", e)
    }
  }

  function sumEconomicEvents(fulfillmentIds: string[]) {
    let sum = new Decimal(0)
    for (let id of fulfillmentIds) {
      let fulfillment = fulfillments.find(it => it.id == id)
      if (fulfillment) {
        let event = economicEvents.find(it => it.id == fulfillment?.fulfilledBy)
        if (event) {
          sum = sum.add(event.resourceQuantity.hasNumericalValue)
        }
      }
    }
    return Number(sum)
  }

  async function saveEconomicEvent(commitment: any, processId: any, side: string) {
    try {
      const economicEvent: EconomicEventCreateParams = {
        action: commitment.action.id,
        provider: commitment.provider?.id ? commitment.provider.id : commitment.providerId,
        receiver: commitment.receiverId,
        resourceQuantity: { hasNumericalValue: commitment.resourceQuantity.hasNumericalValue, hasUnit: commitment.resourceQuantity.hasUnitId },
        resourceConformsTo: commitment.resourceConformsTo.id,
        hasPointInTime: new Date(),
        hasBeginning: new Date(),
      }

      if (side == "committedInputs") {
        economicEvent.inputOf = processId
      } else if (side == "committedOutputs"){
        economicEvent.outputOf = processId
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
          stage: processId,
          image: resourceSpecification?.image,
          conformsTo: resourceSpecification?.id
        }

        res = await createEconomicEventWithResource(economicEvent, newInventoriedResource)

      } else {
        console.log("add economic event", economicEvent)
        res = await createEconomicEvent(economicEvent)
        console.log("economic event res", res)
      }

      const fulfillment: FulfillmentCreateParams = {
        fulfilledBy: res.data.createEconomicEvent.economicEvent.id,
        fulfills: commitment.id,
      }

      console.log("fulfillment", fulfillment)
      await createFulfillment(fulfillment)
      console.log("fulfillment created")
      await getAllEconomicEvents()
      console.log("all economic events fetched")
      if (processId) {
        await getProcess(processId)
        console.log("process fetched")
      } else {
        await getPlan(planId)
        console.log("plan fetched")
      }
    } catch (e) {
      console.log(e)
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
      console.log(plan)
      independentDemands = plan ? [...plan.independentDemands] : []
      nonProcessCommitments = plan ? [...plan.nonProcessCommitments.filter(it => {return !(it.inputOf || it.outputOf)})] : []
      console.log("plan: ", plan)

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

        console.log("these are all the columns", allColumns)
      } catch (e) {
        console.log("error", e)
        error = e
      }
  }

  async function updateColumns(columnIndex: number, side: string = "committedInputs") {
    // update every commitment in a column
    let updatedColumn = {...allColumns[columnIndex][0][side]}

    for (let i in updatedColumn) {
      console.log("original commitment", updatedColumn[i])

      let commitment: CommitmentUpdateParams = {
        revisionId: updatedColumn[i].revisionId,
        agreedIn: updatedColumn[i].agreedIn,
        // clauseOf: updatedColumn[i].clauseOf?.id,
        due: updatedColumn[i].due,
        effortQuantity: updatedColumn[i].effortQuantity,
        finished: updatedColumn[i].finished,
        hasBeginning: updatedColumn[i].hasBeginning,
        hasEnd: updatedColumn[i].hasEnd,
        hasPointInTime: updatedColumn[i].hasPointInTime,
        inScopeOf: updatedColumn[i].inScopeOf,
        independentDemandOf: updatedColumn[i].independentDemandOf,
        inputOf: updatedColumn[i].inputOf,
        note: updatedColumn[i].note,
        outputOf: updatedColumn[i].outputOf,
        plannedWithin: updatedColumn[i].plannedWithin,
        provider: updatedColumn[i].provider?.id,
        receiver: updatedColumn[i].receiver?.id,
        resourceClassifiedAs: updatedColumn[i].resourceClassifiedAs,
        resourceConformsTo: updatedColumn[i].resourceConformsTo?.id,
        resourceInventoriedAs: updatedColumn[i].resourceInventoriedAs,
        resourceQuantity: {
          hasNumericalValue: updatedColumn[i].resourceQuantity?.hasNumericalValue,
          hasUnit: updatedColumn[i].resourceQuantity?.hasUnitId
        },
      }
      
      if (updatedColumn[i].clauseOfId) {
        commitment["clauseOf"] = updatedColumn[i].clauseOfId
      }

      console.log("updating commitment from column", commitment)
      let updatedCommitment = await updateCommitment(commitment)
      console.log("updated commitment", updatedCommitment)
      updatedColumn[i] = updatedCommitment
    }

    await getProcess(allColumns[columnIndex][0].id)
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
        { array: economicEvents, func: getAllEconomicEvents},
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
  let independentDemands: Commitment[] = []
  let nonProcessCommitments: Commitment[] = []

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
          if (inputsAndOutputs[k].fulfilledBy?.length > 0 && inputsAndOutputs[k].clauseOf) {
            let costOfResource = inputsAndOutputs[k].clauseOf?.commitments.find(it => it.action.label == "transfer")?.resourceQuantity?.hasNumericalValue / inputsAndOutputs[k].resourceQuantity?.hasNumericalValue
            let sum = sumEconomicEvents(inputsAndOutputs[k].fulfilledBy.map(it => it.id)) * costOfResource
            totalCost = totalCost.add(sum)
          } else if (inputsAndOutputs[k].clauseOf) {
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
  commitments={independentDemands} 
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
  bind:independentDemands={independentDemands}
  bind:nonProcessCommitments
  on:submit={async (event) => {
    console.log("economic event: ", event.detail.commitment)
    await saveEconomicEvent(event.detail.commitment, selectedProcessId, commitmentModalSide)

    if (event.detail.commitment.finished) {
      // actually save commitment
      let indexOfCommitment = allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide].findIndex(it => it.id == event.detail.commitment.id)
      allColumns[event.detail.column][event.detail.process][event.detail.side][indexOfCommitment] = event.detail.commitment
      await updateColumns(event.detail.column, event.detail.side)
    }

    // let indexOfCommitment = allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide].findIndex(it => it.id == event.detail.commitment.id)
    // console.log(event.detail)
    // if (event.detail.commitment.finished) {
      // yellow = yellow.filter(it => it != event.detail.commitment.id)
    // } else {
    //   yellow.push(event.detail.commitment.id)
    //   // add all economic event amounts to yellowAmounts
    // }
    // if (yellowAmounts[event.detail.commitment.id]) {
    //   yellowAmounts[event.detail.commitment.id] = yellowAmounts[event.detail.commitment.id] + event.detail.commitment.resourceQuantity.hasNumericalValue
    // } else {
    //   yellowAmounts[event.detail.commitment.id] = event.detail.commitment.resourceQuantity.hasNumericalValue
    // }
    // console.log("finished", event.detail.commitment.finished)
    // allColumns[event.detail.column][event.detail.process][event.detail.side][indexOfCommitment] = event.detail.commitment
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
  {selectedStage}
  process = {currentProcess}
  bind:independentDemands
  bind:nonProcessCommitments
  on:submit={async (event) => {
    console.log("START COMMIT", event.detail)
    if (event.detail.useAs == "update") {
      // =============================ON UPDATE=============================
      if (event.detail.column == undefined) {
      // =============================ON UPDATE INDEPENDENT=============================
        independentDemands = independentDemands.map(it => it.id == event.detail.commitment.id ? event.detail.commitment : it)
        independentDemands = [...independentDemands]
        // actually save commitment
        let commitmentData = event.detail.commitment
        let updatedCommitment = {
          revisionId: commitmentData.revisionId,
          note: commitmentData.note,
          finished: commitmentData.finished,
          provider: commitmentData.providerId,
          receiver: commitmentData.receiverId,
          resourceClassifiedAs: commitmentData.resourceClassifiedAs,
          resourceConformsTo: commitmentData.resourceConformsTo?.id,
          resourceQuantity: {
            hasNumericalValue: commitmentData.resourceQuantity?.hasNumericalValue,
            hasUnit: commitmentData.resourceQuantity?.hasUnitId
          }
        }
        const c = await updateCommitment(updatedCommitment)
        await getPlan(planId)
      } else {
      // =============================ON UPDATE REGULAR=============================
        let previousCostAgreement = event.detail.commitment.clauseOf //preexisting cost
        if (event.detail.saveCost) {
          try {
            if (previousCostAgreement) { // delete preexisting cost
              // TODO: delete cost agreement immediately
              agreementsToDelete.push(previousCostAgreement.revisionId)
              commitmentsToDelete.push(previousCostAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
            }
            
            let newCostAgreement = makeAgreement(event.detail.commitment, previousCostAgreement, offers, agents)

            let primaryIntent = newCostAgreement.primaryIntent

            // fill out requestsPerOffer to calculate overall cost
            if (!requestsPerOffer[primaryIntent.id]) { requestsPerOffer[primaryIntent.id] = {} }
            if (event.detail.commitment.action.label == "pickup") {
              requestsPerOffer[primaryIntent.id][event.detail.commitment.id] = new Decimal(event.detail.commitment.resourceQuantity.hasNumericalValue)
            }

            // add cost to commitment visually
            if (newCostAgreement) {
              event.detail.commitment.clauseOf = {commitments: [newCostAgreement.commitment]}
              // actually save cost agreement
              const dollars = resourceSpecifications.find((rs) => rs.name === "USD")
              let agreement = {
                name: "Cost agreement",
                note: "Cost agreement",
              }
              let savedAgreement = await createAgreement(agreement);
              event.detail.commitment.clauseOfId = savedAgreement?.id
              console.log("saved agreement", savedAgreement)
              console.log("cost commitment", newCostAgreement)
              // add agreement to commitment
              let updateCommitmentInput = {
                revisionId: event.detail.commitment.revisionId,
                clauseOf: savedAgreement?.id
              }
              console.log("update commitment input", updateCommitmentInput)
              // let x = await updateCommitment(updateCommitmentInput)
              // console.log(x)
              let c = event.detail.commitment;
              console.log("commitment", c)
              let paymentCommitment = {
                clauseOf: savedAgreement?.id,
                action: "transfer",
                provider: c.receiverId,
                receiver: c.providerId,
                plannedWithin: planId,
                resourceConformsTo: dollars?.id,
                resourceQuantity: {
                  hasNumericalValue: Number(newCostAgreement.commitment?.resourceQuantity?.hasNumericalValue),
                  hasUnit: newCostAgreement.primaryIntent?.publishes?.resourceQuantity?.hasUnit?.id
                },
                finished: false,
                note: "payment",
                hasBeginning: new Date(Date.now()),
              }
              console.log("payment commitment", paymentCommitment)
              let savedPaymentCommitment = await createCommitment(paymentCommitment)
            }
          } catch (e) {
            console.log("Couldn't find cost", e)
          }
        }

        let updatedCommitment = {
          ...event.detail.commitment,
        }

        let commitmentIndex = allColumns[event.detail.column][event.detail.process][event.detail.side].findIndex(it => it.id == event.detail.commitment.id)
        allColumns[event.detail.column][event.detail.process][event.detail.side][commitmentIndex] = updatedCommitment

        await updateColumns(event.detail.column, event.detail.side)
        // await getProcess(allColumns[event.detail.column][event.detail.process].id)
      }
    } else {
      // =============================ON NEW COMMITMENT=============================
      console.log(event.detail)
      if (event.detail.column == undefined) {
      // =============================ON NEW INDEPENDENT=============================
        independentDemands.push(event.detail.commitment)
        independentDemands = [...independentDemands]
        // actually save commitment
        let commitmentData = event.detail.commitment
        let newCommitment = {
          action: commitmentData.action.id,
          agreedIn: commitmentData.agreedIn,
          clauseOf: commitmentData.clauseOfId,
          due: commitmentData.due,
          effortQuantity: commitmentData.effortQuantity,
          finished: commitmentData.finished,
          hasBeginning: new Date(),
          hasEnd: commitmentData.hasEnd,
          hasPointInTime: commitmentData.hasPointInTime,
          inScopeOf: commitmentData.inScopeOf,
          independentDemandOf: planId,
          note: commitmentData.note,
          plannedWithin: planId,
          provider: commitmentData.providerId,
          receiver: commitmentData.receiverId,
          resourceClassifiedAs: commitmentData.resourceClassifiedAs,
          resourceConformsTo: commitmentData.resourceConformsTo?.id,
          resourceInventoriedAs: commitmentData.resourceInventoriedAs,
          resourceQuantity: {
            hasNumericalValue: commitmentData.resourceQuantity?.hasNumericalValue,
            hasUnit: commitmentData.resourceQuantity?.hasUnitId
          }
        }
        await createCommitment(newCommitment)
        await getPlan(planId)
      } else {
      // =============================ON NEW REGULAR=============================
        console.log("adding commitment", event.detail.commitment)

        // add to ui
        // if (event.detail.side && event.detail.process) {
        //   allColumns[event.detail.column][event.detail.process][event.detail.side].push(event.detail.commitment)
        // }

        if (event.detail.saveCost) {
          let costAgreement = makeAgreement(event.detail.commitment, undefined, offers, agents)

          let primaryIntent = costAgreement.primaryIntent
          if (!requestsPerOffer[primaryIntent.id]) {
            requestsPerOffer[primaryIntent.id] = {}
          }
          if (event.detail.commitment.action.label == "pickup") {
            requestsPerOffer[primaryIntent.id][event.detail.commitment.id] = new Decimal(event.detail.commitment.resourceQuantity.hasNumericalValue)
          }

          console.log("cost agreementt", costAgreement)
          if (costAgreement) {
            event.detail.commitment.clauseOf = {commitments: [costAgreement.commitment]}
            // actually save cost agreement
            const dollars = resourceSpecifications.find((rs) => rs.name === "USD")
            let agreement = {
              name: "Cost agreement",
              note: "Cost agreement",
            }
            let savedAgreement = await createAgreement(agreement);
            
            let c = event.detail.commitment;

            event.detail.commitment.clauseOfId = savedAgreement?.id
            // add agreement to commitment

            let paymentCommitment = {
              clauseOf: savedAgreement?.id,
              action: "transfer",
              provider: c.receiverId,
              receiver: c.providerId,
              plannedWithin: planId,
              resourceConformsTo: dollars?.id,
              resourceQuantity: {
                hasNumericalValue: Number(costAgreement.commitment?.resourceQuantity?.hasNumericalValue),
                hasUnit: dollars?.defaultUnitOfResource?.id,
              },
              finished: false,
              hasBeginning: new Date(Date.now()),
            }
            // TODO: add to ui early
            await createCommitment(paymentCommitment)
          }
        }

        // temprarily add visually
        if (event.detail.side && event.detail.process) {
          allColumns[event.detail.column][event.detail.process][event.detail.side].push(event.detail.commitment)
        }

        // actually save commitment
        let commitmentData = event.detail.commitment
        console.log("commitmentData", commitmentData)
        let newCommitment = {
          action: commitmentData.action.id,
          agreedIn: commitmentData.agreedIn,
          clauseOf: commitmentData.clauseOfId,
          due: commitmentData.due,
          effortQuantity: commitmentData.effortQuantity,
          finished: commitmentData.finished,
          hasBeginning: new Date(),
          hasEnd: commitmentData.hasEnd,
          hasPointInTime: commitmentData.hasPointInTime,
          inScopeOf: commitmentData.inScopeOf,
          independentDemandOf: commitmentData.independentDemandOf,
          note: commitmentData.note,
          plannedWithin: planId,
          provider: commitmentData.providerId,
          receiver: commitmentData.receiverId,
          resourceClassifiedAs: commitmentData.resourceClassifiedAs,
          resourceConformsTo: commitmentData.resourceConformsTo?.id,
          resourceInventoriedAs: commitmentData.resourceInventoriedAs,
          resourceQuantity: {
            hasNumericalValue: commitmentData.resourceQuantity?.hasNumericalValue,
            hasUnit: commitmentData.resourceQuantity?.hasUnitId
          }
        }

        if (commitmentData.stage) {
          newCommitment["stage"] = commitmentData.stage
        }

        // maybe save cost agreement

        let thisProcess = allColumns[event.detail.column][event.detail.process]
        if (thisProcess) {
          if (event.detail.side == "committedInputs") {
            newCommitment.inputOf = thisProcess.id
          } else if (event.detail.side == "committedOutputs") {
            newCommitment.outputOf = thisProcess.id
          }

          await createCommitment(newCommitment)
          await getProcess(thisProcess.id)
        } else {
          console.log("no process")
          console.log("new commitment", newCommitment)
          await createCommitment(newCommitment)
          await getPlan(planId)
        }
      }
    }

    // allColumns = [...allColumns]
    // console.log(allColumns[event.detail.column][event.detail.process][event.detail.side])

    // reset form
    selectedCommitmentId = undefined
    commitmentModalProcess = undefined
    commitmentModalColumn = undefined
    commitmentModalSide = undefined
    selectedStage = undefined
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
<!-- <h1 class="text-center text-xl font-semibold">{plan.name}</h1> -->
{@const exportData = {
  plan: plan,
  allColumns: allColumns,
  commitments: independentDemands,
  nonProcessCommitments: nonProcessCommitments,
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
          >{plan.name}</button
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
                  <strong>{primary?.publishes?.resourceConformsTo?.name}</strong>
                  {#if primary?.publishes?.availableQuantity}
                  <p>
                    {#if primary?.publishes?.availableQuantity?.hasNumericalValue && primary?.publishes?.availableQuantity?.hasNumericalValue > 0}
                      <strong>
                        {primary?.publishes?.availableQuantity?.hasNumericalValue}
                        {primary?.publishes?.availableQuantity?.hasUnit?.label} 
                      </strong>
                      available<br>
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
                    <strong>{resourceConformsTo?.name}</strong>
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
                        <strong>
                          {#if true && fulfilledBy && fulfilledBy.length > 0 && fulfilledBy[0].id}
                            {sumEconomicEvents(fulfilledBy.map(it => it.id))}
                            {#each units as unit}
                              {#if unit.id?.split(":")[0] == resourceQuantity.hasUnitId?.split(":")[0]}
                                {unit.label}
                              {/if}
                            {/each}
                          <!-- {:else if yellowAmounts[id]}
                            {yellowAmounts[id]}
                            {#each units as unit}
                              {#if unit.id?.split(":")[0] == resourceQuantity.hasUnitId?.split(":")[0]}
                                {unit.label}
                              {/if}
                            {/each} -->
                          {:else}
                            {new Decimal(resourceQuantity?.hasNumericalValue).toString()}
                            <!-- {resourceQuantity?.hasUnit?.label} -->
                            {#each units as unit}
                              {#if unit.id?.split(":")[0] == resourceQuantity.hasUnitId?.split(":")[0]}
                                {unit.label}
                              {/if}
                            {/each}
                          {/if}
                        </strong>
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
                        {#if fulfilledBy && fulfilledBy.length > 0}
                          <p>
                            cost {
                              new Decimal(
                                sumEconomicEvents(fulfilledBy.map(it => it.id)) * (clause.resourceQuantity.hasNumericalValue / resourceQuantity.hasNumericalValue)
                              )
                              .toFixed(2, Decimal.ROUND_HALF_UP)
                              .toString()}
                            {clause.resourceConformsTo.name}
                          </p>
                        {:else}
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
                        updateColumns(columnIndex, "committedInputs")
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
                        updateColumns(columnIndex, "committedInputs")
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
                      on:click={async () => {
                        // visually remove commitment
                        allColumns[columnIndex][processIndex].committedInputs = allColumns[columnIndex][processIndex].committedInputs.filter(it => it.id != id)
                        await deleteCommitment(revisionId)
                        
                        // remove cost agreement if present
                        let costAgreement = clauseOf
                        if (costAgreement) {
                          agreementsToDelete.push(costAgreement.revisionId)
                          commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
                          await deleteAgreement(costAgreement.revisionId)
                          await deleteCommitment(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
                        }
                        allColumns[columnIndex][processIndex].committedInputs = allColumns[columnIndex][processIndex].committedInputs.filter(it => it.id != id)
                        await getProcess(allColumns[columnIndex][processIndex].id)
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
                      <strong>{resourceConformsTo?.name}</strong>
                      <div class="flex justify-between">
                        <!--
                      <p>
                        {supply_driven_quantity?.hasNumericalValue}
                        {supply_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                        <p>
                          {action.label}

                          <strong>
                            {#if true && fulfilledBy && fulfilledBy.length > 0 && fulfilledBy[0].id}
                              {sumEconomicEvents(fulfilledBy.map(it => it.id))}
                              {#each units as unit}
                                {#if unit.id?.split(":")[0] == resourceQuantity.hasUnitId?.split(":")[0]}
                                  {unit.label}
                                {/if}
                              {/each}
                            {:else if yellowAmounts[id]}
                              {yellowAmounts[id]}
                              <!-- {resourceQuantity?.hasUnit?.label} -->
                              {#each units as unit}
                                {#if unit.id?.split(":")[0] == resourceQuantity.hasUnitId?.split(":")[0]}
                                  {unit.label}
                                {/if}
                              {/each}
                            {:else}
                              {new Decimal(resourceQuantity?.hasNumericalValue).toString()}
                              <!-- {resourceQuantity?.hasUnit?.label} -->
                              {#each units as unit}
                                {#if unit.id?.split(":")[0] == resourceQuantity.hasUnitId?.split(":")[0]}
                                  {unit.label}
                                {/if}
                              {/each}
                            {/if}
                          </strong>
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
                          updateColumns(columnIndex, "committedOutputs")
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
                          updateColumns(columnIndex, "committedOutputs")
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
                    on:click={async () => {
                      // visually remove commitment
                      allColumns[columnIndex][processIndex].committedOutputs = allColumns[columnIndex][processIndex].committedOutputs.filter(it => it.id != id)
                      await deleteCommitment(revisionId)

                      // remove cost agreement if present
                      let costAgreement = clauseOf
                      if (costAgreement) {
                        agreementsToDelete.push(costAgreement.revisionId)
                        commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
                        // requestsPerOffer[costAgreement.providerId] = requestsPerOffer[costAgreement.providerId] - costAgreement.commitments.find(it => it.action.label == "transfer").resourceQuantity.hasNumericalValue
                        // resetColumns()
                      }
                      allColumns[columnIndex][processIndex].committedOutputs = allColumns[columnIndex][processIndex].committedOutputs.filter(it => it.id != id)

                      await getProcess(allColumns[columnIndex][processIndex].id)
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


          {#if columnIndex > 0}
          {@const prevColumnBasedOnId = allColumns[columnIndex - 1][0].basedOn.id}
          <!-- array of resourceSpecificationIds mentioned in the inputCommitments for the current column -->
          {@const resourceSpecificationIds = allColumns[columnIndex].flatMap(it => it.committedInputs).map(it => it.resourceConformsTo.id)}
          
          <div
          class="flex justify-start items-center w-full mt-2 mb-2"
          >
            <div class="border-gray-400 p-2"
            style="width: 100%;"
            >
              <button
              class="flex justify-center items-center w-full mb-2"
              on:click={() => {
                selectedStage = prevColumnBasedOnId
                console.log(selectedStage)
                commitmentModalProcess = undefined
                commitmentModalSide = undefined
                selectedCommitmentId = undefined
                commitmentModalColumn = columnIndex
                commitmentModalOpen = true
                // stage is id of previous processSpecification
              }}
            >
              <PlusCircle />
            </button>
              <!-- Sub-columns -->
              <!-- <div class="grid grid-cols-2 gap-2"> -->
                {#each nonProcessCommitments.filter(it => {return it.stageId == prevColumnBasedOnId && resourceSpecificationIds.includes(it.resourceConformsTo.id)}) as { resourceConformsTo, providerId, resourceQuantity, action, receiverId, id, revisionId, agreement, fulfilledBy, finished, clauseOf }}
                {@const color = finished ? "#c4fbc4" : (((fulfilledBy && fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")}
               
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                    style="background-color: {color};"
                    >
                    <div>
                      <strong>{resourceConformsTo?.name}</strong>
                      <div class="flex justify-between">
                        <p>
                          {action.label}
                          <strong>
                            {#if true && fulfilledBy && fulfilledBy.length > 0 && fulfilledBy[0].id}
                              {sumEconomicEvents(fulfilledBy.map(it => it.id))}
                              {#each units as unit}
                                {#if unit.id?.split(":")[0] == resourceQuantity.hasUnitId?.split(":")[0]}
                                  {unit.label}
                                {/if}
                              {/each}
                            {:else if yellowAmounts[id]}
                              {yellowAmounts[id]}
                              {#each units as unit}
                                {#if unit.id?.split(":")[0] == resourceQuantity.hasUnitId?.split(":")[0]}
                                  {unit.label}
                                {/if}
                              {/each}
                            {:else}
                              {new Decimal(resourceQuantity?.hasNumericalValue).toString()}
                              {#each units as unit}
                                {#if unit.id?.split(":")[0] == resourceQuantity.hasUnitId?.split(":")[0]}
                                  {unit.label}
                                {/if}
                              {/each}
                            {/if}
                          </strong>
                        </p>
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
                    <div class="w-full flex justify-center">
                      <div style="margin-right: 20px; margin-top: 1px">
                        <button
                          on:click={() => {
                            commitmentModalProcess = undefined
                            commitmentModalColumn = undefined
                            selectedCommitmentId = id
                            commitmentModalSide = ""
                            commitmentModalOpen = true
                          }}
                        >
                          <Pencil />
                        </button>
                        <button
                          on:click={async () => {
                            // visually remove commitment
                            independentDemands = nonProcessCommitments.filter(it => it.id != id)
                            await deleteCommitment(revisionId)

                            // remove cost agreement if present
                            let costAgreement = clauseOf
                            if (costAgreement) {
                              agreementsToDelete.push(costAgreement.revisionId)
                              commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
                              // requestsPerOffer[costAgreement.providerId] = requestsPerOffer[costAgreement.providerId] - costAgreement.commitments.find(it => it.action.label == "transfer").resourceQuantity.hasNumericalValue
                              // resetColumns()
                            }
                            await getPlan(planId)
                          }}
                        >
                          <Trash />
                        </button>
                      </div>
                      <!-- economic event -->
                      {#if revisionId}
                        <button
                          style="margin-top: -3px;"
                          on:click={() => {
                            commitmentModalProcess = undefined
                            commitmentModalColumn = undefined
                            commitmentModalSide = ""
                            selectedCommitmentId = id
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
              <!-- </div> -->
              <div
            class="flex justify-center items-center w-full mb-2"
            ></div>
          </div>
        {/if}
      </div>
    {/each}

    <div class="min-w-[250px]">
      <!-- <strong>Total cost: $189</strong> -->
      <h2 class="text-center" style="margin-top: 42px; margin-bottom: 11px;">Total cost: ${Math.round(totalCost * 100)/100}</h2>
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
            {#each independentDemands as c}
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
                  <strong>{resourceConformsTo?.name}</strong>
                  <p>
                    {action.label}
                    <strong>
                      {resourceQuantity?.hasNumericalValue}
                      {#each units as unit}
                        {#if unit.id?.split(":")[0] == resourceConformsTo?.defaultUnitOfResourceId?.split(":")[0]}
                          {unit.label}
                        {/if}
                      {/each}
                    </strong>
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
                    on:click={async() => {
                      (independentDemands = independentDemands.filter(it => it.id != id));
                      commitmentsToDelete.push(revisionId);
                      await deleteCommitment(revisionId);
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
                  <strong>{primary?.publishes?.resourceConformsTo?.name}</strong>
                  <p>
                    {primary?.publishes?.action?.label}
                    <strong>
                      {primary?.publishes?.resourceQuantity?.hasNumericalValue}
                      {primary?.publishes?.availableQuantity?.hasUnit?.label}<br>
                    </strong>
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
