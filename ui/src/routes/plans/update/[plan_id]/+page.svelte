<script lang="ts">
  import { Decimal } from 'decimal.js'
  import PlanModal from '../../PlanModal.svelte'
  import CommitmentModal from '../../CommitmentModal.svelte'
  import EconomicEventModal from '../../../economic_events/EconomicEventModal.svelte'
  import { Trash, Pencil, PlusCircle, EconomicEvent } from '$lib/icons'
  import { page } from '$app/stores';
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { Fulfillment, Unit, AgentConnection, Agent, Action, Proposal, CommitmentCreateParams, EconomicResource, EconomicResourceCreateParams, ResourceSpecification, ProcessSpecification, PlanConnection, EconomicEventCreateParams, FulfillmentCreateParams, CommitmentUpdateParams, Agreement } from '@leosprograms/vf-graphql'
  import Export from "$lib/Export.svelte"
  import { dragscroll } from '@svelte-put/dragscroll';
  import { getAllActions, getAllAgents, getAllProcessSpecifications, getAllEconomicEvents, getAllProposals, getAllResourceSpecifications, getAllUnits, getAllEconomicResources, getProcess, getNonProcessCommitments, getAllRecipes } from '../../../../crud/fetch'
  import { createEconomicEvent, createFulfillment, createEconomicEventWithResource, updateCommitment, createCommitment, createAgreement, deleteCommitment, deleteAgreement } from '../../../../crud/commit'
  import { allActions, allAgents, allUnits, allResourceSpecifications, allFulfillments, allProcessSpecifications, allProposals, allEconomicResources, allEconomicEvents } from '../../../../crud/store'
  import Loading from '$lib/Loading.svelte'
  import PlanForwardModal from './PlanForwardModal.svelte'
  import { matchingOffer, makeAgreement } from '../../=helper'
  import { getPlan } from '../../../../crud/fetch'
  import { fullPlans, removeProcessCommitmentFromPlan, addProcessCommitmentToPlan, addNonProcessCommitmentToPlan, removeNonProcessCommitmentFromPlan, allRecipes } from '../../../../crud/store'
  import { cloneDeep } from "lodash";

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
  let recipes: any[] = []
  let planForwardModalOpen = false;
  let forwardSuggestions: any = {}
  let zoomLevel: string = "1";
  $: zoomLevel;

  // let processImages = {
  //   "Pick Up": "/pickup.svg",
  //   "Ship": "/truck.svg",
  //   "Spin Yarn": "/socks.svg",
  //   "Scour Fiber": "/washing-machine.svg"
  // }

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
  allRecipes.subscribe((res) => {recipes = res})
  
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

  function decrementWithRecipe(inputs: any[], recipeInputs: any[]): any[] | boolean {
    // console.log("apply recipe", inputs, recipeInputs)
    let decrementedInputs = cloneDeep(inputs)
    for (let i = 0; i < recipeInputs.length; i++) {
      let recipeInput = cloneDeep(recipeInputs[i])
      
      // don't consider these actions when decrementing
      // if (['consume', 'use', 'work', 'cite', 'combine'].includes(recipeInput.action.label)) {
      if (['use', 'work', 'cite', 'combine'].includes(recipeInput.action.label)) {
          continue
      }

      let input = decrementedInputs.find(it => it.resourceConformsTo.id == recipeInput.resourceConformsTo.id)
      if (input) {
        let newValue = new Decimal(input.resourceQuantity.hasNumericalValue).minus(new Decimal(recipeInput.resourceQuantity.hasNumericalValue))//.toString()
        if (newValue < new Decimal(0)) {
          // console.log("negative value", input, recipeInput.resourceQuantity.hasNumericalValue, newValue.toString())
          return false
        } else {
          // console.log("recipe input numerical value", recipeInput.resourceQuantity.hasNumericalValue)
        }
        // console.log("decremented input", input.resourceQuantity?.hasNumericalValue, recipeInput.resourceQuantity.hasNumericalValue, newValue.toString())
        input.resourceQuantity.hasNumericalValue = newValue.toString()
        // decrementedInputs[index]?.resourceQuantity?.hasNumericalValue ? decrementedInputs[i].resourceQuantity.hasNumericalValue = newValue : null
      } else {
        // console.log("no input found", recipeInput)
      }
      // console.log("decremented input", decrementedInputs[index].resourceQuantity?.hasNumericalValue, recipeInput.resourceQuantity.hasNumericalValue, input.resourceQuantity?.hasNumericalValue)
    }
    return decrementedInputs
  }

  function calculateOutputToInput(columnIndex: number) {
    let column = cloneDeep(allColumns[columnIndex])
    let nextColumn = cloneDeep(allColumns[columnIndex + 1])

    let flattenedOutputs = column.map(it => it.committedOutputs).flat()
    // create list of all output resource specifications with summed quantities
    let outputsCombined = flattenedOutputs.reduce((acc, output) => {
      if (acc[output.resourceConformsTo.id]) {
        acc[output.resourceConformsTo.id] = new Decimal(output.resourceQuantity.hasNumericalValue).plus(new Decimal(acc[output.resourceConformsTo.id]))
      } else {
        acc[output.resourceConformsTo.id] = output.resourceQuantity.hasNumericalValue
      }
      
      return acc
    }, {})

    let flattenedInputs = nextColumn.map(it => it.committedInputs).flat()
    let inputsCombined = flattenedInputs.reduce((acc, input) => {
      if (acc[input.resourceConformsTo.id]) {
        acc[input.resourceConformsTo.id] = new Decimal(input.resourceQuantity.hasNumericalValue).plus(new Decimal(acc[input.resourceConformsTo.id]))
      } else {
        acc[input.resourceConformsTo.id] = input.resourceQuantity.hasNumericalValue
      }
      
      return acc
    }, {})

    // console.log("inputs combined", inputsCombined)
    // console.log("outputs combined", outputsCombined)

    let suggestedInputs = []
    for (let i = 0; i < nextColumn.length; i++) {
      let process = nextColumn[i]
      let inputs = cloneDeep(process.committedInputs)
      let newInputs = inputs.map(it => {
        let proportion = new Decimal(it.resourceQuantity.hasNumericalValue).dividedBy(new Decimal(inputsCombined[it.resourceConformsTo.id]))
        // console.log("pro", proportion)
        let newValue = new Decimal(outputsCombined[it.resourceConformsTo.id]).times(new Decimal(proportion)).floor()
        // console.log("newv", newValue)
        it.resourceQuantity.hasNumericalValue = newValue.toString()
        // console.log("*")
        return it
      })
      suggestedInputs.push(newInputs)
    }

    return suggestedInputs
  }

  function calculateInputToOutput(columnIndex: number) {
    console.log("hello 2")
    let column = cloneDeep(allColumns[columnIndex])
    console.log(column)
    // If input column
    // for each process

    // *** for both inputs and outputs, use events as quantities if present

    let suggestedOutputs: any[] = []
    for (let i = 0; i < column.length; i++) {
      let process = column[i]
      // let inputs = [...process.committedInputs]
      let inputs = cloneDeep(process.committedInputs)
      // let outputs = [...process.committedOutputs]
      let outputs = cloneDeep(process.committedOutputs)
      // console.log("inputs", inputs)
      // console.log("outputs", outputs)
      // console.log("recipes", recipes)
      const processSpecificationId = process.basedOn.id
      // recipe with same process specification id and contains all output resource specifications
      const allOutputResourceSpecificationIds = outputs.map(it => it.resourceConformsTo.id)
      const allInputResourceSpecificationIds = inputs.map(it => it.resourceConformsTo.id)
      const recipesWithMatchingProcessSpecification = recipes.filter(it => it.processConformsToId == processSpecificationId)
      // console.log("recipesWithMatchingProcessSpecification", recipesWithMatchingProcessSpecification)
      // const recWithAllOutputRSpecs = recipesWithMatchingProcessSpecification.filter(it => {
      //   const allRecipeOutputResourceSpecificationIds = it.recipeOutputs.map(it => it.resourceConformsTo.id)
      //   console.log("allRecipeOutputResourceSpecificationIds", allRecipeOutputResourceSpecificationIds, allOutputResourceSpecificationIds)
      //   return allOutputResourceSpecificationIds.every(it => allRecipeOutputResourceSpecificationIds.includes(it))
      // })
      const recWithAllInputRSpecs = recipesWithMatchingProcessSpecification.filter(it => {
        const allRecipeInputResourceSpecificationIds = it.recipeInputs.map(it => it.resourceConformsTo.id)
        // console.log("allRecipeInputResourceSpecificationIds", allRecipeInputResourceSpecificationIds, allInputResourceSpecificationIds)
        return allInputResourceSpecificationIds.every(it => allRecipeInputResourceSpecificationIds.includes(it))
      })
      let recipe = recWithAllInputRSpecs[0]
      // console.log("recipe", recipe)
      // console.log("inputs", inputs)

      // check if suminputs is in the outputs
      // let sumInputs: boolean = recipe.recipeInputs.some(it => it.instructions == 'SumInputs')
      // let sumOutputs: boolean = recipe.recipeOutputs.some(it => it.instructions == 'SumOutputs')
      
      // console.log("SUM INPUTS", sumInputs, sumOutputs)

      // let stage = recipe.processSpecification.name
      // console.log(recipe)
      
      let recipeCycles = 0
      let decrementedInputs = [...inputs]
      while (recipeCycles < 1000) {
        let res = decrementWithRecipe(decrementedInputs, recipe.recipeInputs)
        // console.log("res", res)
        if (res) {
          recipeCycles++
          decrementedInputs = res
        } else {
          break
        }
      }
      // console.log("Recipe cycles", recipeCycles)
      // console.log("decrementedInputs", decrementedInputs)
      
      // add each recipe output multiplied by the number of times the recipe was applied
      let newOutputs = cloneDeep(outputs)
      let recipeOutputs = recipe.recipeOutputs
      for (let i = 0; i < recipeOutputs.length; i++) {
        let recipeOutput = cloneDeep(recipeOutputs[i])
        let output = newOutputs.find(it => it.resourceConformsTo.id == recipeOutput.resourceConformsTo.id)
        if (output) {
          console.log("output", output.resourceConformsTo.name, recipeOutput.instructions)
          let matchingInput = inputs.find(it => it.resourceConformsTo.id == output.resourceConformsTo.id)
          if (recipeOutput.instructions == "SumInputs") {
            console.log("sumInputs", output)
            let newValue = inputs.reduce((acc, it) => {
              return new Decimal(acc).plus(new Decimal(it.resourceQuantity.hasNumericalValue))
            }, 0)
            output.resourceQuantity.hasNumericalValue = newValue.floor().toString()
          } else if (recipeOutput.instructions == "SumOutputs") {
            console.log("sum outputs", output, newOutputs.map(it => it.resourceQuantity.hasNumericalValue))
            let newValue = newOutputs.reduce((acc, it) => {
              if (it.resourceConformsTo.id == output.resourceConformsTo.id) {
                return new Decimal(acc)
              } else {
                return new Decimal(acc).plus(new Decimal(it.resourceQuantity.hasNumericalValue))
              }
            }, 0)
            output.resourceQuantity.hasNumericalValue = newValue.floor().toString()
          } else if (matchingInput) {
            console.log("matching input", output, matchingInput)
            let recipeInput = recipe.recipeInputs.find(it => it.resourceConformsTo.id == output.resourceConformsTo.id)
            if (!recipeInput) { continue; }
            let ratio = recipeOutput.resourceQuantity?.hasNumericalValue / recipeInput.resourceQuantity?.hasNumericalValue
            if (!ratio) { continue; }
            let newValue = new Decimal(matchingInput.resourceQuantity?.hasNumericalValue).times(new Decimal(ratio))
            output.resourceQuantity.hasNumericalValue = newValue.floor().toString()
          } else {
            let newValue = new Decimal(recipeOutput.resourceQuantity.hasNumericalValue).times(new Decimal(recipeCycles))
            output.resourceQuantity.hasNumericalValue = newValue.floor().toString()
          }
        } else {
          console.log("no output found", recipeOutput)
        }
      }
      console.log('newOutputs', newOutputs)
      suggestedOutputs.push(newOutputs)
    }
    return suggestedOutputs
  }

  async function includeCommitment(commitment: Commitment) {
    try {
      // if primary intent, add to requestsPerOffer
      if (commitment.clauseOf) {
        // console.log("&&& commitment", commitment)
        const matching_offer = matchingOffer(commitment, offers)

        const primary_intent = matching_offer?.publishes.find(
          intent => !intent.reciprocal
        )

        if (primary_intent) { 
          if (!requestsPerOffer[primary_intent.id]) {
            requestsPerOffer[primary_intent.id] = {}
          }
          
          // if (commitment.action.label == "pickup") {
            requestsPerOffer[primary_intent.id][commitment.id] = new Decimal(commitment.resourceQuantity.hasNumericalValue)
          // }
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

  async function saveEconomicEvent(event: any, processId: any, side: string) {
    try {
      console.log("event", event)
      const economicEvent: EconomicEventCreateParams = {
        action: event.action.id,
        provider: event.provider?.id ? event.provider.id : event.providerId,
        receiver: event.receiverId,
        resourceQuantity: { hasNumericalValue: event.resourceQuantity.hasNumericalValue, hasUnit: event.resourceQuantity.hasUnitId },
        resourceConformsTo: event.resourceConformsTo.id,
        hasPointInTime: new Date(),
        hasBeginning: new Date(),
        // outputOf: processId,
      }

      if (economicEvent.action != "transfer") { //transfer can't reference process
        if (side == "committedInputs") {
          economicEvent.inputOf = processId
        } else if (side == "committedOutputs"){
          economicEvent.outputOf = processId
        }
      }

      let pickupFromOtherAgent = event.action.label == "pickup" && event.providerId != event.receiverId
      let produce = event.action.label == "produce"
      let consume = event.action.label == "consume"

      if (pickupFromOtherAgent || produce || consume) {
        let matchingResource = economicResources.find(it => it.conformsTo.id == event.resourceConformsTo.id)
        if (matchingResource) {
          economicEvent.resourceInventoriedAs = matchingResource.id
        }
      }

      let res;
      if (!economicEvent?.resourceInventoriedAs && ( pickupFromOtherAgent || produce ) ) {
        console.log("add new economic event and resource", !economicEvent?.resourceInventoriedAs, event)
        let resourceSpecification = resourceSpecifications.find(it => it.id == event.resourceConformsTo.id)
        let newInventoriedResource: EconomicResourceCreateParams = {
          name: resourceSpecification?.name,
          note: event.note,
          image: resourceSpecification?.image,
          conformsTo: resourceSpecification?.id,
          trackingIdentifier: crypto.randomUUID(),
        }

        res = await createEconomicEventWithResource(economicEvent, newInventoriedResource)

      } else {
        console.log("add economic event", economicEvent)
        res = await createEconomicEvent(economicEvent)
        console.log("economic event res", res)
      }

      const fulfillment: FulfillmentCreateParams = {
        fulfilledBy: res.data.createEconomicEvent.economicEvent.id,
        fulfills: event.id,
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
    requestsPerOffer = {}
    allColumns = []

    try {
      console.log("plan", plan)
      if (!plan) { return }
      independentDemands = plan ? [...plan.independentDemands] : []
      nonProcessCommitments = plan ? [...plan.nonProcessCommitments.filter(it => {return !(it.inputOfId || it.outputOfId)})] : []

      // order plan.processes by meta.retrievedRevision.time
      let sortedProcesses = [...plan.processes].sort((a, b) => new Date(a.meta?.retrievedRevision.time).getTime() - new Date(b.meta?.retrievedRevision.time).getTime())
      for (const process of sortedProcesses) {
        const newProcess = {
          ...process,
          basedOn: {
            // image: processImages[process.basedOn.name],
            image: processSpecifications.find(it => it.id == process.basedOn.id)?.image,
            name: process.basedOn.name,
            id: process.basedOn.id,
          },
          // sort committedInputs by last modified
          committedInputs: [...process.committedInputs].sort((a, b) => new Date(a.meta?.retrievedRevision.time).getTime() - new Date(b.meta?.retrievedRevision.time).getTime()),
          // committedInputs: [...process.committedInputs].reverse(),
          committedOutputs: [...process.committedOutputs].sort((a, b) => new Date(a.meta?.retrievedRevision.time).getTime() - new Date(b.meta?.retrievedRevision.time).getTime()),
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
          // console.log("SAME PROCESS", process.basedOn.name, lastSeenProcessSpecification)
        }
        lastLastSeenProcessSpecification = process.basedOn.id
        loadingPlan = false;
        allColumns = [...allColumns]
      }

      // {#each nonProcessCommitments.filter(it => {return it.stageId == prevColumnBasedOnId && resourceSpecificationIds.includes(it.resourceConformsTo.id)}) as { resourceConformsTo, providerId, resourceQuantity, action, receiverId, id, revisionId, agreement, fulfilledBy, finished, clauseOf }}


      for (const commitment of plan.nonProcessCommitments.filter(it => {return it.stageId != "undefined"})) {
        // console.log("non process commitment", commitment)
        await includeCommitment(commitment)
      }

      } catch (e) {
        console.log("Error building plan", e)
        error = e
      }
  }

  async function updateColumns(columnIndex: number, processIndex: number = 0, side: string = "committedInputs") {
    // update every commitment in a column
    let updatedColumn = {...allColumns[columnIndex][processIndex][side]}

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
          hasNumericalValue: Number(updatedColumn[i].resourceQuantity?.hasNumericalValue),
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

    await getProcess(allColumns[columnIndex][processIndex].id)
  }

  onMount(async () => {
    if (browser) {
      // Listen to scrollwheel movements and zoom in and out accordingly
      window.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
          // e.preventDefault();
          let zoom = parseFloat(zoomLevel) || 1;
          if (e.deltaY > 0) {
            zoom = Math.max(0.1, zoom - 0.1);
          } else {
            zoom = Math.min(3, zoom + 0.1);
          }
          zoomLevel = zoom.toString();
        }
      });

      let functions = [
        { array: actions, func: getAllActions },
        { array: units, func: getAllUnits },
        { array: agents, func: getAllAgents },
        { array: economicEvents, func: getAllEconomicEvents},
        { array: recipes, func: getAllRecipes },
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

      if (!plan) {
        await getPlan(planId)
        await buildPlan()
      } else {
        console.log("plan already exists")
        await buildPlan()
        getPlanLater()
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
            try {
              const addedValue = new Decimal(inputsAndOutputs[k].clauseOf.commitments.find(it => it.action.label == "transfer").resourceQuantity.hasNumericalValue)
              totalCost = totalCost.add(addedValue)
            } catch (e) {
              console.log("error", e)
            }
          }
        }
      }
    }

    let filteredNonProcessCommitments = nonProcessCommitments.filter(it => it.stageId != "undefined")
    for (let i = 0; i < filteredNonProcessCommitments.length; i++) {
      const commitment = filteredNonProcessCommitments[i]
      // console.log("!@!@", commitment)
      // add cost to totalCost
      if (commitment.clauseOf) {
        const cost = commitment.clauseOf.commitments.find(it => it.resourceConformsTo?.name == "USD")
        if (cost) {
          totalCost = totalCost.add(cost.resourceQuantity.hasNumericalValue)
        }
      }
    }
  }
</script>

{#if planForwardModalOpen}
<PlanForwardModal
  bind:open={planForwardModalOpen}
  {forwardSuggestions}
  on:accept={async (event) => {
    console.log(event)
    for (let i = 0; i < forwardSuggestions.new.length; i++) {
      allColumns[forwardSuggestions.columnIndex][i][forwardSuggestions.side] = forwardSuggestions.new[i]
      await updateColumns(forwardSuggestions.columnIndex, i, forwardSuggestions.side)
    }
  }}
/>
{/if}

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
    let extractedEvent = event.detail.event
    console.log("economic event: ", extractedEvent)
    await saveEconomicEvent(extractedEvent, selectedProcessId, commitmentModalSide)

    if (extractedEvent.finished) {
      // actually save commitment
      let indexOfCommitment = allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide].findIndex(it => it.id == extractedEvent.id)
      allColumns[event.detail.column][event.detail.process][event.detail.side][indexOfCommitment] = extractedEvent
      await updateColumns(event.detail.column, event.detail.process, event.detail.side)
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

{#if commitmentModalOpen}
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

    // =============================ON SAVE COST CHECKED=============================
    let previousCostAgreement = event.detail.commitment.clauseOf //preexisting cost
    if (event.detail.saveCost) {
      try {
        if (previousCostAgreement) { // delete preexisting cost
          // TODO: delete cost agreement immediately
          // agreementsToDelete.push(previousCostAgreement.revisionId)
          // commitmentsToDelete.push(previousCostAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
          await deleteAgreement(previousCostAgreement.revisionId)
          await deleteCommitment(previousCostAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
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
    // =============================ON SAVE COST CHECKED ENDS=============================

    if (event.detail.useAs == "update") {
      // =============================ON UPDATE=============================
      if (event.detail.process == undefined) {
      // =============================ON UPDATE INDEPENDENT=============================
        independentDemands = independentDemands.map(it => it.id == event.detail.commitment.id ? event.detail.commitment : it)
        independentDemands = [...independentDemands]
        // actually save commitment
        let commitmentData = event.detail.commitment
        let updatedCommitment = {
          revisionId: commitmentData.revisionId,
          note: commitmentData.note,
          finished: commitmentData.finished,
          clauseOf: commitmentData.clauseOfId,
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
        let updatedCommitment = {
          ...event.detail.commitment,
        }

        // console.log("updated commitment for column --", updatedCommitment)

        let commitmentIndex = allColumns[event.detail.column][event.detail.process][event.detail.side].findIndex(it => it.id == event.detail.commitment.id)
        allColumns[event.detail.column][event.detail.process][event.detail.side][commitmentIndex] = updatedCommitment

        // console.log("** ", allColumns[event.detail.column][event.detail.process][event.detail.side][commitmentIndex], event.detail.process)

        await updateColumns(event.detail.column, event.detail.process, event.detail.side)
        // await getProcess(allColumns[event.detail.column][event.detail.process].id)
      }
    } else {
      // =============================ON NEW COMMITMENT=============================
      // console.log(event.detail)

      // =============================ON NEW SAVE COST=============================

      // if (event.detail.saveCost) {
      //   let costAgreement = makeAgreement(event.detail.commitment, undefined, offers, agents)

      //   let primaryIntent = costAgreement.primaryIntent
      //   if (!requestsPerOffer[primaryIntent.id]) {
      //     requestsPerOffer[primaryIntent.id] = {}
      //   }
      //   if (event.detail.commitment.action.label == "pickup") {
      //     requestsPerOffer[primaryIntent.id][event.detail.commitment.id] = new Decimal(event.detail.commitment.resourceQuantity.hasNumericalValue)
      //   }

      //   console.log("cost agreementt", costAgreement)
      //   if (costAgreement) {
      //     event.detail.commitment.clauseOf = {commitments: [costAgreement.commitment]}
      //     // actually save cost agreement
      //     const dollars = resourceSpecifications.find((rs) => rs.name === "USD")
      //     let agreement = {
      //       name: "Cost agreement",
      //       note: "Cost agreement",
      //     }
      //     let savedAgreement = await createAgreement(agreement);
          
      //     let c = event.detail.commitment;

      //     event.detail.commitment.clauseOfId = savedAgreement?.id
      //     // add agreement to commitment

      //     let paymentCommitment = {
      //       clauseOf: savedAgreement?.id,
      //       action: "transfer",
      //       provider: c.receiverId,
      //       receiver: c.providerId,
      //       plannedWithin: planId,
      //       resourceConformsTo: dollars?.id,
      //       resourceQuantity: {
      //         hasNumericalValue: Number(costAgreement.commitment?.resourceQuantity?.hasNumericalValue),
      //         hasUnit: dollars?.defaultUnitOfResource?.id,
      //       },
      //       finished: false,
      //       hasBeginning: new Date(Date.now()),
      //     }
      //     // TODO: add to ui early
      //     await createCommitment(paymentCommitment)
      //   }
      // }
      // =============================ON NEW SAVE COST ENDS=============================

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

        // ============================= ADD VISUALLY =============================
        if (!allColumns[event.detail.column][event.detail.process]?.id) {
          await addNonProcessCommitmentToPlan(planId, event.detail.commitment)
        } else {
          await addProcessCommitmentToPlan(planId, allColumns[event.detail.column][event.detail.process]?.id, event.detail.side, event.detail.commitment)
        }
        await buildPlan()
        // ============================= ADD VISUALLY ENDS =============================

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
          await getNonProcessCommitments(planId)
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
{/if}

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
  <div class="flex space-x-8 mx-4 overflow-x-scroll overflow-y-scroll" style="overflow: auto; height: calc((100vh - 150px) / {zoomLevel}); zoom: {zoomLevel}" use:dragscroll={{ axis: 'both' }}>

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
            <div class="flex justify-center items-center w-full mb-2">
              <div class="flex space-x-2">
                <button
                  title="Add a new commitment to this process"
                  class="flex justify-center items-center"
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

                {#if processIndex == 0}
                  <button
                    title="Auto-fill the output commitments based on the input commitments"
                    class="flex justify-center items-center"
                    on:click={() => {
                    forwardSuggestions = {
                      side: "committedOutputs",
                      columnIndex: columnIndex,
                      current: allColumns[columnIndex].map(it => it.committedOutputs),
                      new: calculateInputToOutput(columnIndex)
                    }
                    planForwardModalOpen = true
                    }}
                  >
                    {"↳"}
                  </button>                  
                {/if}
              </div>
            </div>

                {#each committedInputs as { resourceConformsTo, providerId, resourceQuantity, action, receiverId, id, revisionId, agreement, fulfilledBy, finished, clauseOf, meta }}
                  {@const color = finished ? "#c4fbc4" : (((fulfilledBy && fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                    style="background-color: {color};
                          border-radius: 0px 60px 60px 0px;
                    ">
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
                        {@const dedupedFulfilledBy = fulfilledBy.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)}
                        <br />
                        Economic Events: {dedupedFulfilledBy?.length}
                      {/if}
                    </p>
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
                        updateColumns(columnIndex, processIndex, "committedInputs")
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
                        updateColumns(columnIndex, processIndex, "committedInputs")
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
                        await removeProcessCommitmentFromPlan(planId, allColumns[columnIndex][processIndex].id, id)
                        await buildPlan()
                        
                        // remove cost agreement if present
                        let costAgreement = clauseOf
                        console.log("clauseOf to delete", costAgreement, costAgreement != undefined)
                        if (costAgreement != undefined) {
                          console.log("deleting cost agreement", costAgreement)
                          agreementsToDelete.push(costAgreement.revisionId)
                          commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
                          await deleteAgreement(costAgreement.revisionId)
                          await deleteCommitment(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
                        }
                        // allColumns[columnIndex][processIndex].committedInputs = allColumns[columnIndex][processIndex].committedInputs.filter(it => it.id != id)
                        await deleteCommitment(revisionId)
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
                    <!-- <button
                    style="margin-left: 20px;"
                      on:click={async () => {
                        // make commitment clauseOf null
                        await updateCommitment({
                          revisionId: revisionId,
                          clauseOf: null
                        })
                      }}
                    >
                      ####
                    </button>
                    <button
                    style="margin-left: 20px;"
                      on:click={async () => {
                        // make commitment clauseOf normal
                        await updateCommitment({
                          revisionId: revisionId,
                          clauseOf: clauseOf.id
                        })
                      }}
                    >
                      ****
                    </button> -->

                    </div>
                  </div>

                  {#if clauseOf}
                  {@const clause = clauseOf.commitments.find(it => it.action.label == "transfer")}
                    {#if clause}
                    {@const costColor = clause.finished ? "#c4fbc4" : (((clause.fulfilledBy && clause.fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")}
                    <div
                      class="bg-white rounded-r-full border border-gray-400 py-1 pl-8 pr-2 text-xs"
                      style="background-color: {costColor};
                            border-radius: 60px 0 0 60px;
                      "
                      >
                          <p>
                            <strong>
                              transfer {new Decimal(
                                clause.resourceQuantity.hasNumericalValue
                              )
                              .toFixed(2, Decimal.ROUND_HALF_UP)
                              .toString()}
                              {clause.resourceConformsTo.name}
                            </strong>
                            <br>from {agents.find(it => it.id == clause.providerId)?.name} 
                            <br>to {agents.find(it => it.id == clause.receiverId)?.name}
                            {#if clause.fulfilledBy?.length > 0}
                            {@const dedupedFulfilledBy = clause.fulfilledBy.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)}
                              <br />
                              Economic Events: {dedupedFulfilledBy?.length}
                            {/if}
                          </p>
                          <div style="display:flex;">
                            <button
                              style="margin-left: 12px;"
                              on:click={() => {
                                commitmentModalProcess = processIndex
                                commitmentModalColumn = columnIndex
                                commitmentModalSide = "committedInputs"
                                selectedCommitmentId = clause.id
                                selectedProcessId = processes[0].id
                                currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                                commitmentModalOpen = true
                              }}
                            >
                              <Pencil />
                            </button>
                            <button
                              on:click={async () => {
                                // visually remove commitment
                                // allColumns[columnIndex][processIndex].committedInputs = allColumns[columnIndex][processIndex].committedOutputs.filter(it => it.id != id)
                                await deleteCommitment(clause.revisionId)
                                await deleteAgreement(clauseOf.revisionId)
                                // const updateC = {
                                //   revisionId: revisionId, 
                                //   clauseOf: null,
                                //   plannedWithin: planId,
                                //   inputOf: processes[processIndex].id
                                // }
                                // console.log("updateC", updateC)
                                // let uc = await updateCommitment(updateC)
                                // console.log("UC", uc)
                                await getProcess(allColumns[columnIndex][processIndex].id)
                              }}
                            >
                              <Trash />
                            </button>
                            <button
                              style="margin-left: 20px;"
                              on:click={() => {
                                commitmentModalProcess = processIndex
                                commitmentModalColumn = columnIndex
                                commitmentModalSide = "committedInputs"
                                selectedCommitmentId = clause.id
                                selectedProcessId = processes[0].id
                                currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                                economicEventModalOpen = true
                              }}
                            >
                              <EconomicEvent />
                            </button>
                          </div>

                        </div>
                      <!-- </div> -->
                    {/if}
                  {/if}
                {/each}
              </div>
              <div>
                <div class="flex justify-center items-center w-full mb-2">
                  <div class="flex space-x-2">
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

                    {#if processIndex == 0}
                      <button
                        title="Auto-fill the output commitments based on the input commitments"
                        class="flex justify-center items-center"
                        on:click={() => {
                        forwardSuggestions = {
                          side: "committedInputs",
                          columnIndex: columnIndex + 1,
                          current: allColumns[columnIndex + 1]?.map(it => it.committedInputs),
                          new: calculateOutputToInput(columnIndex)
                        }
                        planForwardModalOpen = true
                        }}
                      >
                        {"↳"}
                      </button>
                    {/if}
                  </div>
                </div>

                {#each committedOutputs as { resourceConformsTo, providerId, resourceQuantity, action, receiverId, id, revisionId, agreement, fulfilledBy, finished, clauseOf }}
                {@const color = finished ? "#c4fbc4" : (((fulfilledBy && fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")}
                <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                    style="background-color: {color};
                          border-radius: 0 60px 60px 0;
                    "
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
                          {@const dedupedFulfilledBy = fulfilledBy.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)}
                          <br />
                          Economic Events: {dedupedFulfilledBy?.length}
                        {/if}
                      </p>
                      {#if false && clauseOf}
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
                          updateColumns(columnIndex, processIndex, "committedOutputs")
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
                          updateColumns(columnIndex, processIndex, "committedOutputs")
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
                      await removeProcessCommitmentFromPlan(planId, allColumns[columnIndex][processIndex].id, id)
                      await buildPlan()

                      // remove cost agreement if present
                      let costAgreement = clauseOf
                      if (costAgreement) {
                        agreementsToDelete.push(costAgreement.revisionId)
                        commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
                        // requestsPerOffer[costAgreement.providerId] = requestsPerOffer[costAgreement.providerId] - costAgreement.commitments.find(it => it.action.label == "transfer").resourceQuantity.hasNumericalValue
                        // resetColumns()
                        deleteAgreement(costAgreement.revisionId)
                        deleteCommitment(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
                      }
                      // allColumns[columnIndex][processIndex].committedOutputs = allColumns[columnIndex][processIndex].committedOutputs.filter(it => it.id != id)
                      
                      await deleteCommitment(revisionId)
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

                  </div>
                  {#if clauseOf}
                  {@const clause = clauseOf.commitments.find(it => it.action.label == "transfer")}
                  {@const costColor = clause.finished ? "#c4fbc4" : (((clause.fulfilledBy && clause.fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-8 pr-2 text-xs"
                    style="background-color: {costColor};
                          border-radius: 60px 0 0 60px;
                    "
                    >
                      {#if clause}
                        <!-- <hr class="my-2" /> -->
                        <!-- <div style="display:flex;">
                          <img class="mx-auto" height="30px" width="30px" src="/caret-left.svg" alt="" /> -->
                          <div>
                            <p>
                              <strong>
                                transfer {new Decimal(
                                  clause.resourceQuantity.hasNumericalValue
                                )
                                .toFixed(2, Decimal.ROUND_HALF_UP)
                                .toString()}
                                {clause.resourceConformsTo.name}
                              </strong>
                              <br>from {agents.find(it => it.id == clause.providerId)?.name} 
                              <br>to {agents.find(it => it.id == clause.receiverId)?.name}
                              {#if clause.fulfilledBy?.length > 0}
                              {@const dedupedFulfilledBy = clause.fulfilledBy.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)}
                                <br />
                                Economic Events: {dedupedFulfilledBy?.length}
                              {/if}
                            </p>
                            <div style="display:flex;">
                              <button
                                style="margin-left: 12px;"
                                on:click={() => {
                                  commitmentModalProcess = processIndex
                                  commitmentModalColumn = columnIndex
                                  commitmentModalSide = "committedOutputs"
                                  selectedCommitmentId = clause.id
                                  selectedProcessId = processes[0].id
                                  currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                                  commitmentModalOpen = true
                                }}
                              >
                                <Pencil />
                              </button>
                              <button
                                on:click={async () => {
                                  // visually remove commitment
                                  // allColumns[columnIndex][processIndex].committedOutputs = allColumns[columnIndex][processIndex].committedOutputs.filter(it => it.id != id)
                                  await deleteCommitment(clause.revisionId)
                                  await deleteAgreement(clauseOf.revisionId)
                                  await getProcess(allColumns[columnIndex][processIndex].id)
                                }}
                              >
                                <Trash />
                              </button>
                              <button
                                style="margin-left: 20px;"
                                on:click={() => {
                                  commitmentModalProcess = processIndex
                                  commitmentModalColumn = columnIndex
                                  commitmentModalSide = "committedOutputs"
                                  selectedCommitmentId = clause.id
                                  selectedProcessId = processes[0].id
                                  currentProcess = [...allColumns[commitmentModalColumn][commitmentModalProcess][commitmentModalSide]]
                                  economicEventModalOpen = true
                                }}
                              >
                                <EconomicEvent />
                              </button>
                            </div>

                          </div>
                        <!-- </div> -->
                      {/if}
                    </div>
                  {/if}
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
                <!-- {#each nonProcessCommitments as { resourceConformsTo, providerId, resourceQuantity, action, receiverId, id, revisionId, agreement, fulfilledBy, finished, clauseOf }} -->
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
                        {@const dedupedFulfilledBy = fulfilledBy.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)}
                          <br />
                          Economic Events: {dedupedFulfilledBy?.length}
                        {/if}
                      </p>
                      <!-- {#if clauseOf}
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
                      {/if} -->
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
                            // await removeNonProcessCommitmentFromPlan(planId, id)
                            // await buildPlan()
                            // independentDemands = nonProcessCommitments.filter(it => it.id != id)

                            // remove cost agreement if present
                            console.log("clauseOf to delete", clauseOf)
                            let costAgreement = clauseOf
                            if (costAgreement) {
                              console.log("costAgreement delete", costAgreement)
                              agreementsToDelete.push(costAgreement.revisionId)
                              commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
                            //   // requestsPerOffer[costAgreement.providerId] = requestsPerOffer[costAgreement.providerId] - costAgreement.commitments.find(it => it.action.label == "transfer").resourceQuantity.hasNumericalValue
                            //   // resetColumns()
                              deleteAgreement(costAgreement.revisionId)
                              deleteCommitment(costAgreement.commitments.find(it => it.action.label == "transfer").revisionId)
                            }
                            // await deleteCommitment(clauseOf.commitments.find(it => it.action.label == "transfer").revisionId)
                            
                            await deleteCommitment(revisionId)
                            await getNonProcessCommitments(planId)
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

                      <!-- <div
                        style="margin-left: 10px;"
                      >
                        <button
                          on:click={async ()=>{
                            const updateC = {
                              revisionId: revisionId, 
                              clauseOf: null,
                            }
                            console.log("updateC", updateC)
                            let uc = await updateCommitment(updateC)
                          }}
                        >
                          <img class="mx-auto" height="14px" width="14px" src="/cancel.svg" alt="" />
                        </button>
                      </div> -->
                    </div>
                  </div>
                  
                  <!-- COST/RECIPROCAL COMMITMENT -->
                  <!-- {JSON.stringify(nonProcessCommitments.filter(it => {return it.stageId == prevColumnBasedOnId && resourceSpecificationIds.includes(it.resourceConformsTo.id)}))} -->
                  <!-- {JSON.stringify(clauseOf)} -->
                  {#if clauseOf}
                  {@const clause = clauseOf.commitments.find(it => it.action.label == "transfer")}
                  {@const costColor = clause.finished ? "#c4fbc4" : (((clause.fulfilledBy && clause.fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-8 pr-2 text-xs"
                    style="background-color: {costColor};
                          border-radius: 60px 0 0 60px;
                    "
                    >
                      {#if clause}
                        <!-- <hr class="my-2" /> -->
                        <!-- <div style="display:flex;">
                          <img class="mx-auto" height="30px" width="30px" src="/caret-left.svg" alt="" /> -->
                          <div>
                            <p>
                              <strong>
                                transfer {new Decimal(
                                  clause.resourceQuantity.hasNumericalValue
                                )
                                .toFixed(2, Decimal.ROUND_HALF_UP)
                                .toString()}
                                {clause.resourceConformsTo.name}
                              </strong>
                              <br>from {agents.find(it => it.id == clause.providerId)?.name} 
                              <br>to {agents.find(it => it.id == clause.receiverId)?.name}
                              {#if clause.fulfilledBy?.length > 0}
                              {@const dedupedFulfilledBy = clause.fulfilledBy.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)}
                                <br />
                                Economic Events: {dedupedFulfilledBy?.length}
                              {/if}
                            </p>
                            <div style="display:flex;">
                              <button
                                style="margin-left: 12px;"
                                on:click={() => {
                                  commitmentModalProcess = undefined
                                  commitmentModalColumn = undefined
                                  selectedCommitmentId = clause.id
                                  commitmentModalSide = ""
                                  commitmentModalOpen = true
                                }}
                              >
                                <Pencil />
                              </button>
                              <button
                                on:click={async () => {
                                  // visually remove commitment
                                  await deleteCommitment(clause.revisionId)
                                  await deleteAgreement(clauseOf.revisionId)
                                  await getNonProcessCommitments(planId)
                                }}
                              >
                                <Trash />
                              </button>
                              <button
                                style="margin-left: 20px;"
                                on:click={() => {
                                  commitmentModalProcess = undefined
                                  commitmentModalColumn = undefined
                                  selectedCommitmentId = clause.id
                                  economicEventModalOpen = true
                                }}
                              >
                                <EconomicEvent />
                              </button>
                            </div>

                          </div>
                        <!-- </div> -->
                      {/if}
                    </div>
                  {/if}

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
      <h2 class="text-center" style="margin-top: 42px; margin-bottom: 11px;">Total cost: ${Math.round(Number(totalCost) * 100)/100}</h2>
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
