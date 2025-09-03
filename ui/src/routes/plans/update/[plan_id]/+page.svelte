<script lang="ts">
  import { Decimal } from 'decimal.js'
  import PlanModal from '../../PlanModal.svelte'
  import CommitmentModal from '../../CommitmentModal.svelte'
  import EconomicEventModal from '../../../economic_events/EconomicEventModal.svelte'
  import { Trash, Pencil, PlusCircle, EconomicEvent } from '$lib/icons'
  import { page } from '$app/stores';
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { Unit, AgentConnection, Agent, Action, Proposal, CommitmentCreateParams, EconomicResource, EconomicResourceCreateParams, ResourceSpecification, ProcessSpecification, PlanConnection, EconomicEventCreateParams, CommitmentUpdateParams, Agreement } from '@valueflows/vf-graphql'
  import Export from "$lib/Export.svelte"
  import { dragscroll } from '@svelte-put/dragscroll';
  // import { getAllActions, getAllAgents, getAllProcessSpecifications, getAllEconomicEvents, getAllProposals, getAllResourceSpecifications, getAllUnits, getAllEconomicResources, getProcess, getAllRecipes } from '../../../../crud/fetch'
  import { createEconomicEvent, createEconomicEventWithResource, updateCommitment, createCommitment, createAgreement, deleteCommitment, deleteAgreement } from '../../../../crud/commit'
  // import { allActions, allAgents, allUnits, allResourceSpecifications, allFulfillments, allProcessSpecifications, allProposals, allEconomicResources, allEconomicEvents } from '../../../../crud/store'
  import Loading from '$lib/Loading.svelte'
  import PlanForwardModal from './PlanForwardModal.svelte'
  import PlanBackwardModal from './PlanBackwardModal.svelte'
  import { matchingOffer, makeAgreement } from '../../=helper'
  import { GET_All_PROPOSALS, GET_PLAN, GET_ALL_RESOURCE_SPECIFICATIONS, GET_ALL_RECIPES, GET_PROCESS } from '../../../../crud/fetch'
  import { query } from 'svelte-apollo'
  // import { fullPlans, removeProcessCommitmentFromPlan, addProcessCommitmentToPlan, addNonProcessCommitmentToPlan, removeNonProcessCommitmentFromPlan, allRecipes } from '../../../../crud/store'
  import { cloneDeep } from "lodash";
  import SvgIcon from '$lib/SvgIcon.svelte'
  import Commitment from './Commitment.svelte'
  import { get } from 'svelte/store'

  const planQuery = query(GET_PLAN, {
    variables: {
      id: $page.params.plan_id
    },
    // fetchPolicy: 'network-only'
  });

  let processQueryVariables = { id: "" };
  let processQuery: any = null;
  
  // Create process query reactively when we have a valid ID
  $: if (processQueryVariables.id != "") {
    processQuery = query(GET_PROCESS, {
      variables: processQueryVariables
      // fetchPolicy: 'network-only'
    });

    // Subscribe to processQuery to handle loading state
    processQuery.subscribe((res) => {
      console.log("processQuery subscription", res);
      if (!res.loading) {
        planQuery.getCurrentResult();
        return;
      }
    });
  }

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
  // let requests: Proposal[] = [];
  // let offers: Proposal[] = [];
  let combinationOptions: { name: string; id: string }[] = [];
  let proposalsList: Proposal[] = []
  let plan: any;
  let loadingPlan: boolean = true;
  let fetching: boolean = false;
  let allColumns: any = []
  let economicResources: EconomicResource[] = [];
  let economicEvents: EconomicEvent[] = [];
  let fulfillments: Fulfillment[] = []
  let selectedStage: string | undefined = undefined;
  let recipes: any[] = []
  let planForwardModalOpen = false;
  let planBackwardModalOpen = false;
  let carryOver: any = {}
  let forwardSuggestions: any = {}
  let backwardSuggestions: any = {}
  let resourceInventory: any = {}
  let zoomLevel: string = "1";
  $: zoomLevel;


  const allProposalsQuery = query(GET_All_PROPOSALS)
  let allProposals: Proposal[] = []
  let offers: Proposal[] = []
  let requests: Proposal[] = []
  allProposalsQuery.subscribe((res) => {
    allProposals = res.data?.proposals?.edges?.map(e => e.node) || []
    offers = allProposals.filter(it => it.publishes[0].provider != undefined)
    requests = allProposals.filter(it => it.reciprocal[0].provider != undefined)
  })


  const resourceSpecificationsQuery = query(GET_ALL_RESOURCE_SPECIFICATIONS, {
    // fetchPolicy: 'network-only'
  });
  resourceSpecificationsQuery.subscribe((res) => {
    if (res.loading) return;
    resourceSpecifications = res.data?.resourceSpecifications?.edges?.map(e => e.node) || [];
  });

  const recipesQuery = query(GET_ALL_RECIPES, {
    // fetchPolicy: 'network-only'
  });
  recipesQuery.subscribe((res) => {
    if (res.loading) return;
    recipes = res.data?.recipeProcesses?.edges?.map(e => e.node) || [];
    console.log("recipes", recipes)
  });

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

  planQuery.subscribe(async (res) => {
    console.log("planQuery updated", res)
    if (res.loading) {
      loadingPlan = true;
      return;
    }
    loadingPlan = false;
    plan = res.data?.plan;
    console.log("plan", plan, res);
    await delay(200); // wait for the plan to be fully loaded
    await buildPlan();
  });
  
  async function getPlan() {
    console.log("get plan", $page.params.plan_id)
    fetching = true
    await planQuery.refetch()     
  }

  $: allColumns, commitmentModalColumn, commitmentModalProcess, commitmentModalSide, currentProcess, commitmentModalOpen, economicEventModalOpen, loadingPlan, currentProcess

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

  function calculateInputToOutputBackward(columnIndex: number) {
    let column = cloneDeep(allColumns[columnIndex]);
    let previousColumn = cloneDeep(allColumns[columnIndex - 1]);

    let flattenedInputs = column.map(it => it.committedInputs).flat();
    let inputsCombined = flattenedInputs.reduce((acc, input) => {
        acc[input.resourceConformsTo.id] = new Decimal(carryOver[previousColumn[0].basedOn?.id]?.[input.resourceConformsTo?.id]?.received);
        return acc;
    }, {});

    // remove non-process commitments from total received
    let basedOnId = previousColumn[0].basedOn.id
    let resourceSpecificationIds = allColumns[columnIndex - 1]?.map(it => it.committedOutputs.map(it => it.resourceConformsTo.id)).flat()
    let thisStageNonProcessCommitments = nonProcessCommitments.filter(it => {return it.stage?.id == basedOnId && resourceSpecificationIds.includes(it.resourceConformsTo.id)})
    for (let commitment of thisStageNonProcessCommitments) {
      inputsCombined[commitment.resourceConformsTo.id] = new Decimal(inputsCombined[commitment.resourceConformsTo.id]).minus(new Decimal(commitment.resourceQuantity.hasNumericalValue))
    }

    let flattenedOutputs = previousColumn.map(it => it.committedOutputs).flat();

    let outputsCombined = flattenedOutputs.reduce((acc, output) => {
        if (acc[output.resourceConformsTo.id]) {
            acc[output.resourceConformsTo.id] = new Decimal(output.resourceQuantity.hasNumericalValue).plus(new Decimal(acc[output.resourceConformsTo.id]));
        } else {
            acc[output.resourceConformsTo.id] = output.resourceQuantity.hasNumericalValue;
        }

        // find relevant inventory
        let fromInventory = carryOver[previousColumn[0].basedOn?.id]?.[output.resourceConformsTo?.id]?.fromInventory;
        // TODO: figure out why subtracting 1 is sometimes necessary
        // if (fromInventory > 0) {
        //   fromInventory -= 1
        // }
        acc[output.resourceConformsTo.id] = acc[output.resourceConformsTo.id] + fromInventory //new Decimal(acc[output.resourceConformsTo.id]).plus(new Decimal(fromInventory)).toNumber();
        return acc;
    }, {});

    let suggestedOutputs = [];
    for (let i = 0; i < previousColumn.length; i++) {
        let process = previousColumn[i];
        let outputs = cloneDeep(process.committedOutputs);
        let newOutputs = outputs.map((it: any) => {
            let proportion = new Decimal(it.resourceQuantity.hasNumericalValue).dividedBy(new Decimal(outputsCombined[it.resourceConformsTo.id] || 1));
            let newValue;
            if (inputsCombined[it.resourceConformsTo.id]) {
              newValue = new Decimal(inputsCombined[it.resourceConformsTo.id] || 0).times(new Decimal(proportion)).floor();
            } else {
              newValue = it?.resourceQuantity?.hasNumericalValue
            }
            it.resourceQuantity.hasNumericalValue = newValue.toString();
            return it;
        });
        suggestedOutputs.push(newOutputs);
    }

    return suggestedOutputs;
  }

  function calculateOutputToInput(columnIndex: number) {
    let column = cloneDeep(allColumns[columnIndex])
    let nextColumn = cloneDeep(allColumns[columnIndex + 1])

    let flattenedOutputs = column.map(it => it.committedOutputs).flat()

    // create list of all output resource specifications with summed quantities
    let outputsCombined = flattenedOutputs.reduce((acc, output) => {
      acc[output.resourceConformsTo.id] = new Decimal(carryOver[column[0].basedOn.id]?.[output.resourceConformsTo.id]?.provided)

      // TODO: decide if this is a better way of aggregating outputs, as opposed to using the pre-calculated carryOver.provided
      // if (acc[output.resourceConformsTo.id]) {
      //   acc[output.resourceConformsTo.id] = new Decimal(output.resourceQuantity.hasNumericalValue).plus(new Decimal(acc[output.resourceConformsTo.id]))
      // } else {
      //   acc[output.resourceConformsTo.id] = output.resourceQuantity.hasNumericalValue
      // }
      
      return acc
    }, {})
    // const totalForResource = new Decimal(carryOver[column[0].basedOn.id]?.[flattenedOutputs[0]?.resourceConformsTo.id]?.provided)

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

  function calculateOutputToInputBackward(columnIndex: number) {
    // return []
    let column = cloneDeep(allColumns[columnIndex]);
    
    let suggestedInputs: any[] = [];
    for (let i = 0; i < column.length; i++) {
        let process = column[i];
        let outputs = cloneDeep(process.committedOutputs);
        let inputs = cloneDeep(process.committedInputs);
        
        console.log("outputs", outputs);
        console.log("inputs", inputs);
        console.log("recipes", recipes);
        
        const processSpecificationId = process?.basedOn.id;
        const allOutputResourceSpecificationIds = outputs.map(it => it.resourceConformsTo.id);
        
        const recipesWithMatchingProcessSpecification = recipes.filter(it => it.processConformsTo.id == processSpecificationId);
        console.log("recipesWithMatchingProcessSpecification", recipesWithMatchingProcessSpecification);
        
        const recWithAllOutputRSpecs = recipesWithMatchingProcessSpecification.filter(it => {
            const allRecipeOutputResourceSpecificationIds = it.recipeOutputs.map(it => it.resourceConformsTo.id);
            return allOutputResourceSpecificationIds.every(id => allRecipeOutputResourceSpecificationIds.includes(id));
        });
        
        console.log("recWithAllOutputRSpecs", recWithAllOutputRSpecs);
        let recipe = recWithAllOutputRSpecs[0];
        console.log("recipe", recipe);
        console.log("outputs", outputs);

        let recipeCycles = 0;
        let decrementedOutputs = [...outputs];
        while (recipeCycles < 1000) {
            let res = decrementWithRecipe(decrementedOutputs, recipe.recipeOutputs);
            if (res) {
                recipeCycles++;
                decrementedOutputs = res;
            } else {
                break;
            }
        }
        
        let newInputs = cloneDeep(inputs);
        let recipeInputs = recipe.recipeInputs;
        for (let i = 0; i < recipeInputs.length; i++) {
            let recipeInput = cloneDeep(recipeInputs[i]);
            let input = newInputs.find(it => it.resourceConformsTo.id == recipeInput.resourceConformsTo.id);
            if (input) {
                console.log("input", input.resourceConformsTo.name, recipeInput.instructions);
                if (recipeInput.instructions == "SumInputs") {
                    let newValue = outputs.reduce((acc, it) => {
                        return new Decimal(acc).plus(new Decimal(it.resourceQuantity.hasNumericalValue));
                    }, 0);
                    input.resourceQuantity.hasNumericalValue = newValue.floor().toString();
                } else {
                    let ratio = recipeInput.resourceQuantity?.hasNumericalValue / recipe.recipeOutputs.find(it => it.resourceConformsTo.id == input.resourceConformsTo.id)?.resourceQuantity?.hasNumericalValue;
                    if (!ratio) { continue; }
                    let newValue = new Decimal(outputs.find(it => it.resourceConformsTo.id == input.resourceConformsTo.id)?.resourceQuantity?.hasNumericalValue || 0).div(new Decimal(ratio));
                    input.resourceQuantity.hasNumericalValue = newValue.floor().toString();
                }
            } else {
                let newValue = new Decimal(recipeInput.resourceQuantity.hasNumericalValue).times(new Decimal(recipeCycles));
                newInputs.push({
                    resourceConformsTo: recipeInput.resourceConformsTo,
                    resourceQuantity: { hasNumericalValue: newValue.floor().toString() }
                });
            }
        }
        
        console.log('newInputs', newInputs);
        suggestedInputs.push(newInputs);
    }
    return suggestedInputs;
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
      console.log("inputs", inputs)
      console.log("outputs", outputs)
      console.log("recipes", recipes)
      const processSpecificationId = process?.basedOn.id
      // recipe with same process specification id and contains all output resource specifications
      const allOutputResourceSpecificationIds = outputs.map(it => it.resourceConformsTo.id)
      const allInputResourceSpecificationIds = inputs.map(it => it.resourceConformsTo.id)
      console.log("process conforms to", recipes, processSpecificationId)
      const recipesWithMatchingProcessSpecification = recipes.filter(it => it.processConformsTo.id == processSpecificationId)
      console.log("recipesWithMatchingProcessSpecification", recipesWithMatchingProcessSpecification)
      // const recWithAllOutputRSpecs = recipesWithMatchingProcessSpecification.filter(it => {
      //   const allRecipeOutputResourceSpecificationIds = it.recipeOutputs.map(it => it.resourceConformsTo.id)
      //   console.log("allRecipeOutputResourceSpecificationIds", allRecipeOutputResourceSpecificationIds, allOutputResourceSpecificationIds)
      //   return allOutputResourceSpecificationIds.every(it => allRecipeOutputResourceSpecificationIds.includes(it))
      // })
      const recWithAllInputRSpecs = recipesWithMatchingProcessSpecification.filter(it => {
        const allRecipeInputResourceSpecificationIds = it.recipeInputs.map(it => it.resourceConformsTo.id)
        console.log("allRecipeInputResourceSpecificationIds", allRecipeInputResourceSpecificationIds, allInputResourceSpecificationIds, inputs.map(it => it.resourceConformsTo), it.recipeInputs.map(it => it.resourceConformsTo))
        return allInputResourceSpecificationIds.every(it => allRecipeInputResourceSpecificationIds.includes(it))
      })
      console.log("recWithAllInputRSpecs", recWithAllInputRSpecs)
      let recipe = recWithAllInputRSpecs[0]
      console.log("recipe", recipe)
      console.log("inputs", inputs)

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
      commitment = cloneDeep(commitment)
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

          // if already included, skip
          if (requestsPerOffer[primary_intent.id][commitment.id]) {
            return
          }

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

  function sumEconomicEventsFromFulfillments(fulfillments: EconomicEvent[]) {
    let sum = new Decimal(0)
    // for (let fulfillment of fulfillments) {
    //   if (fulfillment.fulfilledBy) {
    //     let event = fulfillment.fulfilledBy
    //     if (event && event.resourceQuantity?.hasNumericalValue !== undefined) {
    //       sum = sum.add(event.resourceQuantity.hasNumericalValue)
    //     }
    //   }
    // }
    for (let fulfillment of fulfillments) {
      if (fulfillment.resourceQuantity?.hasNumericalValue !== undefined) {
        sum = sum.add(fulfillment.resourceQuantity.hasNumericalValue)
      }
    }
    return Number(sum)
  }

  async function saveEconomicEvent(event: any, processId: any, side: string, commitmentIds: string[]) {
    try {
      const economicEvent: EconomicEventCreateParams = {
        action: event.action.id,
        provider: event.provider?.id,
        receiver: event.receiver?.id,
        note: event.note,
        resourceQuantity: { hasNumericalValue: event.resourceQuantity.hasNumericalValue, hasUnit: event.resourceQuantity.hasUnit?.id },
        resourceConformsTo: event.resourceConformsTo.id,
        hasPointInTime: new Date(),
        hasBeginning: new Date(),
        fulfills: commitmentIds
      }

      if (economicEvent.action != "transfer") { //transfer can't reference process
        if (side == "committedInputs") {
          economicEvent.inputOf = processId
        } else if (side == "committedOutputs"){
          economicEvent.outputOf = processId
        }
      }

      let pickupFromOtherAgent = event.action.label == "pickup" && event.provider.id != event.receiver.id
      let produce = event.action.label == "produce"
      let consume = event.action.label == "consume"

      if (pickupFromOtherAgent || produce || consume) {
        let matchingResource = economicResources.find(it => it.conformsTo?.id == event.resourceConformsTo.id)
        console.log("matching resource", matchingResource, economicResources)
        if (matchingResource) {
          economicEvent.resourceInventoriedAs = matchingResource.id
          console.log("Resource inventoried as", economicEvent.resourceInventoriedAs)
        }
      }

      let res;
      if (!economicEvent?.resourceInventoriedAs && ( pickupFromOtherAgent || produce ) ) {
        console.log("add new economic event and resource", !economicEvent?.resourceInventoriedAs, event)
        let resourceSpecification = resourceSpecifications.find(it => it.id == event.resourceConformsTo.id)
        let newInventoriedResource = {
          name: resourceSpecification?.name,
          note: event.note,
          image: resourceSpecification?.image,
          conformsTo: resourceSpecification?.id,
          trackingIdentifier: null,//crypto.randomUUID(),
        }

        res = await createEconomicEventWithResource(economicEvent, newInventoriedResource)
        // await getAllEconomicResources()

      } else {
        console.log("add economic event", economicEvent)
        res = await createEconomicEvent(economicEvent)
        // await getAllEconomicResources()
        console.log("economic event res", res)
      }

      // fetching = true
       
      console.log("all economic events fetched")
      if (processId) {
        console.log("processId", processId)
        // await getProcess(processId)
        // get process query
        fetching = true
        // const processQuery = query(GET_PROCESS, {
        //   variables: { id: processId }
        // });
        processQueryVariables = { id: processId };
        console.log("processQuery", processQuery)
        if (processQuery) {
          const processData = await processQuery.refetch();
          console.log("processData", processData);
        }
         
        console.log("process fetched")
      } else {
        console.log("no processId, not fetching process")
        fetching = true
        await getPlan()
         
        console.log("plan fetched")
      }
    } catch (e) {
      console.log(e)
    }
  }

  export async function getPlanLater() {
    fetching = true
    await getPlan()
     
  }

  export async function buildPlan() {
    console.log("buildPlan", plan)
    let lastColumnProcSpec: any = undefined;
    let lastSeenProcessSpecification: any = undefined;
    let finalLastSeenProcessSpecification: any = undefined;
    let lastColumn: any = []

    resourceInventory = {}
    economicResources.forEach(it => {
      let resourceComboId = it.conformsTo?.id.concat("____").concat(it.stage?.id)
      if (resourceComboId) {
        let onhandQuantity = it.onhandQuantity?.hasNumericalValue
        let existingQuantity = resourceInventory[resourceComboId]
        resourceInventory[resourceComboId] = existingQuantity
          ? existingQuantity + onhandQuantity
          : onhandQuantity
      }
    })

    carryOver = {}
    requestsPerOffer = {}
    allColumns = []

    try {
      // console.log("plan", plan)
      if (!plan) { return }
      independentDemands = plan ? [...plan.independentDemands] : []
      nonProcessCommitments = plan ? [...plan.nonProcessCommitments.filter(it => {return !(it.inputOf?.id || it.outputOf?.id)})] : []
      // console.log("nonProcessCommitments", nonProcessCommitments)

      // order plan.processes by meta.retrievedRevision.time
      let sortedProcesses = [...plan.processes]//.reverse() //.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
      for (const process of sortedProcesses) {
        processesToLoadCount++;
        const newProcess = {
          ...process,
          // basedOn: {
          //   // image: processImages[process?.basedOn.name],
          //   image: processSpecifications.find(it => it.id == process?.basedOn.id)?.image,
          //   name: process?.basedOn.name,
          //   id: process?.basedOn.id,
          // },
          // sort committedInputs by last modified
          committedInputs: [...process.committedInputs].sort((a, b) => a.meta.retrievedRevision.time - b.meta.retrievedRevision.time),
          // committedInputs: [...process.committedInputs].reverse(),
          committedOutputs: [...process.committedOutputs].sort((a, b) => a.meta.retrievedRevision.time - b.meta.retrievedRevision.time),
        }

        // make sure carryOver has a key for this process
        if (!carryOver[process?.basedOn.id]) { carryOver[process?.basedOn.id] = {}; }
        if (!carryOver[lastColumnProcSpec]) { carryOver[lastColumnProcSpec] = {}; }

        for (const commitment of process.committedOutputs) {
          await includeCommitment(commitment)
          // add provided quantity to carryOver
          if (process?.basedOn.id) {
            if (!carryOver[process?.basedOn.id][commitment?.resourceConformsTo?.id]) {
              const inventoryId = commitment?.resourceConformsTo?.id.concat("____").concat(process?.basedOn.id)
              const inventoryProvided = resourceInventory[inventoryId] || 0
              resourceInventory[inventoryId] -= inventoryProvided
              carryOver[process?.basedOn.id][commitment?.resourceConformsTo?.id] = {provided: inventoryProvided, fromInventory: inventoryProvided, received: 0, proSpec: processSpecifications.find(it => it.id == process?.basedOn.id)?.name, rSpec: commitment?.resourceConformsTo?.name};
            }
            carryOver[process?.basedOn.id][commitment?.resourceConformsTo?.id].provided += Number(commitment?.resourceQuantity?.hasNumericalValue)
          }
        }

        for (const commitment of process.committedInputs) {
          await includeCommitment(commitment)
          // add received quantity to carryOver
          // const lastColumnProcSpec = lastColumn[0]?.basedOn?.id

          if (process?.basedOn.id !== lastSeenProcessSpecification) {
            lastColumnProcSpec = lastSeenProcessSpecification
          }

          if (lastColumnProcSpec) {
            if (!carryOver[lastColumnProcSpec][commitment?.resourceConformsTo?.id]) {
              const inventoryId = commitment?.resourceConformsTo?.id.concat("____").concat(lastColumnProcSpec)
              const inventoryProvided = resourceInventory[inventoryId] || 0
              resourceInventory[inventoryId] -= inventoryProvided
              carryOver[lastColumnProcSpec][commitment?.resourceConformsTo?.id] = {provided: inventoryProvided, fromInventory: inventoryProvided, received: 0, proSpec: processSpecifications.find(it => it.id == lastColumnProcSpec)?.name , rSpec: commitment?.resourceConformsTo?.name};
            }

            carryOver[lastColumnProcSpec][commitment?.resourceConformsTo?.id].received += Number(commitment?.resourceQuantity?.hasNumericalValue)
          }
        }

        // if this is a new process
        if (process?.basedOn.id !== lastSeenProcessSpecification) {
          // add last column to allColumns and reset
          // if (lastColumn.length > 0) {
          //   lastColumn = [newProcess]
          // } else {
          //   lastColumn.push(newProcess)
          // }
          lastColumn = [newProcess]
          lastSeenProcessSpecification = process?.basedOn.id
        } else {
          lastColumn.push(newProcess)
        }

        if (process?.basedOn.id !== finalLastSeenProcessSpecification) {
          allColumns.push(lastColumn)
        } else {
          // console.log("SAME PROCESS", process?.basedOn.name, lastSeenProcessSpecification)
        }
        finalLastSeenProcessSpecification = process?.basedOn.id
        loadingPlan = false;
        allColumns = [...allColumns]
      }

      // {#each nonProcessCommitments.filter(it => {return it.stageId == prevColumnBasedOnId && resourceSpecificationIds.includes(it.resourceConformsTo.id)}) as { resourceConformsTo, provider.id, resourceQuantity, action, receiver.id, id, revisionId, agreement, fulfilledBy, finished, clauseOf }}


      for (const commitment of plan.nonProcessCommitments.filter(it => {return it.stage?.id != "undefined" && !it.inputOf?.id && !it.outputOf?.id})) {
        // console.log("non process commitment", commitment)
        await includeCommitment(commitment)

        // Add non-process commitments to carryOver
        let basedOnId = commitment.stage?.id
        if (carryOver[basedOnId]?.[commitment.resourceConformsTo?.id]?.provided) {
          carryOver[basedOnId][commitment.resourceConformsTo?.id].provided += Number(commitment.resourceQuantity?.hasNumericalValue)
        }

      }

      } catch (e) {
        console.log("Error building plan", e)
        error = e
      }

    fetching = false
  }

  async function updateColumns(columnIndex: number, processIndex: number = 0, side: string = "committedInputs") {
    console.log("updating columns", columnIndex, processIndex, side)
    try {
      fetching = true
      // update every commitment in a column
      let updatedColumn = [...cloneDeep(allColumns[columnIndex][processIndex][side])]

      // for (let i in updatedColumn) {
      console.log("updated column - ", updatedColumn)
      for (let i = 0; i < updatedColumn.length; i++) {
        console.log("===========saving commitment===========", updatedColumn[i].resourceConformsTo?.name)
        if (!updatedColumn[i]?.id) {
          continue
        }

        console.log("original commitment", updatedColumn[i], cloneDeep(updatedColumn[i].resourceQuantity?.hasUnit?.id))

        let commitment: CommitmentUpdateParams = {
          revisionId: updatedColumn[i].revisionId,
          agreedIn: updatedColumn[i].agreedIn,
          // clauseOf: updatedColumn[i].clauseOf?.id,
          // action: updatedColumn[i].action?.id,
          due: updatedColumn[i].due,
          effortQuantity: updatedColumn[i].effortQuantity,
          finished: updatedColumn[i].finished,
          hasBeginning: updatedColumn[i].hasBeginning ? new Date(updatedColumn[i].hasBeginning).getTime() : undefined,
          hasEnd: updatedColumn[i].hasEnd ? new Date(updatedColumn[i].hasEnd).getTime() : undefined,
          hasPointInTime: updatedColumn[i].hasPointInTime ? new Date(updatedColumn[i].hasPointInTime).getTime() : undefined,
          inScopeOf: updatedColumn[i].inScopeOf,
          independentDemandOf: updatedColumn[i].independentDemandOf,
          inputOf: updatedColumn[i].inputOf,
          note: updatedColumn[i].note,
          outputOf: updatedColumn[i].outputOf,
          plannedWithin: updatedColumn[i].plannedWithin,
          provider: updatedColumn[i].provider.id,
          receiver: updatedColumn[i].receiver.id,
          resourceClassifiedAs: updatedColumn[i].resourceClassifiedAs,
          resourceConformsTo: updatedColumn[i].resourceConformsTo?.id,
          resourceInventoriedAs: updatedColumn[i].resourceInventoriedAs,
          resourceQuantity: {
            hasNumericalValue: Number(updatedColumn[i].resourceQuantity?.hasNumericalValue),
            hasUnit: updatedColumn[i].resourceQuantity?.hasUnit?.id
          },
        }

        console.log("commitment before update", cloneDeep(commitment))
        
        if (updatedColumn[i].clauseOfId) {
          commitment["clauseOf"] = updatedColumn[i].clauseOfId
        }

        console.log("updating commitment from column", cloneDeep(commitment))
        let updatedCommitment = await updateCommitment(commitment)
        console.log("updated commitment", updatedCommitment)
        updatedColumn[i] = updatedCommitment
      }

      // const processQuery = query(GET_PROCESS, {
      //   variables: { id: allColumns[columnIndex][processIndex].id }
      // });
      // console.log("processQuery", processQuery)
      processQueryVariables = { id: allColumns[columnIndex][processIndex].id };
      if (processQuery) {
        const processData = await processQuery.refetch();
      }
      // await getProcess(allColumns[columnIndex][processIndex].id)
       
    } catch (e) {
      fetching = false
      console.log("error updating columns", e)
    }
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
      fetching = true
      await getPlan()
      await allProposalsQuery.refetch()
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
  let selectedCommitment: Commitment | undefined = undefined

  let totalCost: Decimal = new Decimal(0);
  $: if (allColumns) {
    totalCost = new Decimal(0)
    for (let i = 0; i < allColumns.length; i++) {
      for (let j = 0; j < allColumns[i].length; j++) {
        let inputsAndOutputs = allColumns[i][j]?.committedInputs.concat(allColumns[i][j].committedOutputs)
        for (let k = 0; k < inputsAndOutputs.length; k++) {
          if (inputsAndOutputs[k]?.fulfilledBy?.length > 0 && inputsAndOutputs[k]?.clauseOf) {
            let costOfResource = inputsAndOutputs[k]?.clauseOf?.commitments?.find(it => it?.action?.label == "transfer")?.resourceQuantity?.hasNumericalValue / inputsAndOutputs[k]?.resourceQuantity?.hasNumericalValue
            // let sum = sumEconomicEvents(inputsAndOutputs[k].fulfilledBy.map(it => it.id)) * costOfResource
            let sum = sumEconomicEventsFromFulfillments(inputsAndOutputs[k]?.fulfilledBy) * costOfResource
            totalCost = totalCost.add(sum)
          } else if (inputsAndOutputs[k]?.clauseOf) {
            try {
              const addedValue = new Decimal(inputsAndOutputs[k]?.clauseOf?.commitments?.find(it => it?.action?.label == "transfer")?.resourceQuantity?.hasNumericalValue)
              totalCost = addedValue ? totalCost.add(addedValue) : totalCost
            } catch (e) {
              console.log("error", e)
            }
          }
        }
      }
    }

    let filteredNonProcessCommitments = nonProcessCommitments.filter(it => it.stage?.id != "undefined")
    console.log("filtered non process commitments", filteredNonProcessCommitments)
    for (let i = 0; i < filteredNonProcessCommitments.length; i++) {
      const commitment = filteredNonProcessCommitments[i]
      // console.log("!@!@", commitment)
      // add cost to totalCost
      if (commitment.clauseOf) {
        const cost = commitment.clauseOf?.commitments?.find(it => it.resourceConformsTo?.name == "USD")
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

{#if planBackwardModalOpen}
<PlanBackwardModal
  bind:open={planBackwardModalOpen}
  {backwardSuggestions}
  on:accept={async (event) => {
    console.log(event)
    for (let i = 0; i < backwardSuggestions.new.length; i++) {
      allColumns[backwardSuggestions.columnIndex][i][backwardSuggestions.side] = backwardSuggestions.new[i]
      console.log("start", i)
      await updateColumns(backwardSuggestions.columnIndex, i, backwardSuggestions.side)
      console.log("end", i)
    }
     ;
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
    await getPlan()
    loadingPlan = false
  }}
/>
{/if}

{#if economicEventModalOpen}
<EconomicEventModal
bind:open={economicEventModalOpen}
  {selectedCommitmentId}
  {selectedCommitment}
  {commitmentModalProcess}
  {commitmentModalColumn}
  {commitmentModalSide}
  {units}
  {agents}
  {resourceSpecifications}
  {processSpecifications}
  {combinationOptions}
  process = {currentProcess}
  bind:independentDemands={independentDemands}
  bind:nonProcessCommitments
  on:submit={async (event) => {
    let extractedEvent = event.detail.event
    console.log("economic event: ", extractedEvent)
    await saveEconomicEvent(extractedEvent, selectedProcessId, commitmentModalSide, event.detail.fulfills)

    if (extractedEvent?.finished) {
      if (!commitmentModalColumn && selectedCommitmentId) {
        console.log("finished, and no commitmentModalColumn, but selectedCommitmentId", selectedCommitmentId, event.detail.fulfills, commitmentModalProcess, commitmentModalSide, )
        // for each commitment in fulfills array, mark as finished
        for (let i = 0; i < event.detail.fulfills.length; i++) {
          let commitmentId = event.detail.fulfills[i]
          console.log("commitmentId", commitmentId)
            // Find the commitment by id, or any commitment inside clauseOf of any commitment in the column/side/process that matches the id
            let commitment = 
            plan?.nonProcessCommitments?.find(
              it => it.id == commitmentId
              || (it.clauseOf?.commitments?.some(p => p.id == commitmentId))
            )?.clauseOf?.commitments?.find(c => c.id == commitmentId)
            // If not found, search inside all clauseOf.commitments of all commitments in the column/side/process
            || plan?.nonProcessCommitments
              ?.flatMap(it => it.clauseOf?.commitments || [])
              ?.find(c => c.id == commitmentId);
          if (commitment) {
            console.log("updating commitment as finished", commitment)
            await updateCommitment({
              revisionId: commitment.revisionId,
              finished: true,
            })
          } else {
            console.log("no commitment found for id", commitmentId)
          }
        }
          // console.log("suspected reciprocal commitment", extractedEvent.id, extractedEvent)
          // const foundCommitment = plan.nonProcessCommitments.find(it => it.id == selectedCommitmentId)
          // if (foundCommitment) {
          //   console.log("found commitment", foundCommitment)
          //   await updateCommitment({
          //     revisionId: foundCommitment.revisionId,
          //     finished: true,
          //   })
          // }
          // await getPlan()
      } else {
        // for each commitment in fulfills array, mark as finished
        console.log("finished, and commitmentModalColumn", commitmentModalColumn, commitmentModalProcess, commitmentModalSide)
        for (let i = 0; i < event.detail.fulfills.length; i++) {
          let commitmentId = event.detail.fulfills[i]
          console.log("commitmentId", commitmentId)
          let commitment = allColumns[commitmentModalColumn]?.[commitmentModalProcess]?.[commitmentModalSide]?.find(it => it.id == commitmentId)
          if (commitment) {
            console.log("updating commitment as finished", commitment)
            await updateCommitment({
              revisionId: commitment.revisionId,
              finished: true,
            })
          } else {
            console.log("no commitment found for id", commitmentId)
          }
        }

        // // actually save commitment
        // console.log("updating commitment", commitmentModalColumn)
        // let indexOfCommitment = allColumns[commitmentModalColumn]?.[commitmentModalProcess]?.[commitmentModalSide]?.findIndex(it => it.id == extractedEvent.id)
        // // allColumns[event.detail.column][event.detail.process][event.detail.side][indexOfCommitment] = extractedEvent
        // allColumns[event.detail.column][event.detail.process][event.detail.side][indexOfCommitment].finished = true
        // console.log("updating commitment as finished", allColumns[event.detail.column]?.[event.detail.process]?.[event.detail.side]?.[indexOfCommitment])
        // await updateColumns(event.detail.column, event.detail.process, event.detail.side)
      }
    }

  }}
/>
{/if}

{#if commitmentModalOpen}
<CommitmentModal
  bind:open={commitmentModalOpen}
  {selectedCommitmentId}
  {selectedCommitment}
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
    console.log("saved cost?", event.detail.saveCost)
    if (event.detail.saveCost) {
      try {
        if (previousCostAgreement) {
          console.log("deleting 1", previousCostAgreement.id)
          if (previousCostAgreement.id) { await deleteAgreement(previousCostAgreement.id) }
          const paymentId = previousCostAgreement.commitments?.find(it => it.id != event.detail.commitment.id)?.id
          console.log("deleting 2", paymentId)
          if (paymentId) { await deleteCommitment(paymentId) }
          
          previousCostAgreement.recipeReciprocalClauses = previousCostAgreement.commitments
        }
        
        console.log("making new cost agreement", event.detail.commitment, previousCostAgreement)
        let mockedCommitment = {
          ...event.detail.commitment,
          resourceQuantity: {
            ...event.detail.commitment.resourceQuantity,
            hasNumericalValue: event.detail.commitment.fulfilledBy?.length > 0 ? sumEconomicEventsFromFulfillments(event.detail.commitment.fulfilledBy) : event.detail.commitment.resourceQuantity.hasNumericalValue,
          },
        }
        let newCostAgreement = makeAgreement(mockedCommitment, previousCostAgreement, offers, agents)
        console.log("new cost agreement"  , newCostAgreement)

        let primaryIntent = newCostAgreement?.commitment//primaryIntent

        if (primaryIntent) {
          // fill out requestsPerOffer to calculate overall cost
          if (!requestsPerOffer[primaryIntent.id]) { requestsPerOffer[primaryIntent.id] = {} }
          if (event.detail.commitment.action.label == "pickup") {
            requestsPerOffer[primaryIntent.id][event.detail.commitment.id] = new Decimal(event.detail.commitment.resourceQuantity.hasNumericalValue)
          }
        }

        // add cost to commitment
        console.log("new cost agreement", newCostAgreement)
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
          // let updateCommitmentInput = {
          //   revisionId: event.detail.commitment.revisionId,
          //   clauseOf: savedAgreement?.id,
          //   provider: event.detail.commitment.provider.id,
          //   receiver: event.detail.commitment.receiver.id,
          //   resourceConformsTo: dollars?.id,
          //   resourceQuantity: {
          //     hasNumericalValue: Number(event.detail.commitment.resourceQuantity.hasNumericalValue),
          //     hasUnit: cloneDeep(event.detail.commitment.resourceQuantity.hasUnit)
          //   },
          //   finished: event.detail.commitment.finished,
          //   note: event.detail.commitment.note,
          //   stage: event.detail.commitment.stage,
          //   action: event.detail.commitment.action.id,
          //   plannedWithin: {id: planId},
          //   inputOf: event.detail.commitment.inputOf,
          //   outputOf: event.detail.commitment.outputOf,
          //   hasBeginning: event.detail.commitment.hasBeginning,
          // }
          // console.log("update commitment input", updateCommitmentInput)
          // let x = await updateCommitment(updateCommitmentInput)
          // console.log(x)
          let c = event.detail.commitment;
          console.log("commitment", c)
          let paymentCommitment = {
            clauseOf: savedAgreement?.id,
            action: "transfer",
            provider: c.receiver.id,
            receiver: c.provider.id,
            plannedWithin: planId,
            resourceConformsTo: dollars?.id,
            resourceQuantity: {
              hasNumericalValue: Number(newCostAgreement.commitment?.resourceQuantity?.hasNumericalValue),
              hasUnit: newCostAgreement.commitment?.resourceQuantity?.hasUnit?.id || newCostAgreement.commitment?.resourceConformsTo?.defaultUnitOfResource?.id
            },
            finished: false,
            note: "payment",
            hasBeginning: new Date(Date.now()).getTime(),
          }
          console.log("payment commitment", paymentCommitment)
          let savedPaymentCommitment = await createCommitment(paymentCommitment)
        }

      } catch (e) {
        console.log("Couldn't save cost", e)
      }
    }
    // =============================ON SAVE COST CHECKED ENDS=============================

    if (event.detail.useAs == "update") {
      // =============================ON UPDATE=============================
      if (event.detail.process == undefined) {
      // =============================ON UPDATE INDEPENDENT=============================
        // independentDemands = independentDemands.map(it => it.id == event.detail.commitment.id ? event.detail.commitment : it)
        // independentDemands = [...independentDemands]
        // actually save commitment
        let commitmentData = event.detail.commitment
        let updatedCommitment = {
          // id: commitmentData.id,
          revisionId: commitmentData.revisionId,
          // action: commitmentData.action.id,
          plannedWithin: planId,
          stage: commitmentData.stage?.id || commitmentData.stage,
          note: commitmentData.note,
          finished: commitmentData.finished,
          // clauseOf: commitmentData.clauseOf?.id || commitmentData.clauseOfId,
          provider: commitmentData.provider.id,
          receiver: commitmentData.receiver.id,
          resourceClassifiedAs: commitmentData.resourceClassifiedAs,
          resourceConformsTo: commitmentData.resourceConformsTo?.id,
          resourceQuantity: {
            hasNumericalValue: commitmentData.resourceQuantity?.hasNumericalValue,
            hasUnit: commitmentData.resourceQuantity?.hasUnit?.id
          }
        }
        // updatedCommitment.plannedWithin = planId
        // console.log(updatedCommitment.plannedWithin)
        console.log("updated commitment --", updatedCommitment, updateCommitment.stage)
        fetching = true
        const c = await updateCommitment(updatedCommitment)
        await getPlan()
         
      } else {
      // =============================ON UPDATE REGULAR=============================
        let updatedCommitment = {
          ...event.detail.commitment,
        }

        // console.log("updated commitment for column --", updatedCommitment)

        let commitmentIndex = allColumns[event.detail.column][event.detail.process][event.detail.side].findIndex(it => it.id == event.detail.commitment.id)
        allColumns[event.detail.column][event.detail.process][event.detail.side][commitmentIndex] = updatedCommitment

        console.log("** ", allColumns[event.detail.column][event.detail.process][event.detail.side][commitmentIndex], event.detail.process)

        await updateColumns(event.detail.column, event.detail.process, event.detail.side)
        // await getProcess(allColumns[event.detail.column][event.detail.process].id)
      }
    } // =============================ON NEW SAVE COST ENDS=============================
    else { 
      console.log("commitmentModalColumn", commitmentModalColumn, "commitmentModalProcess", commitmentModalProcess, "commitmentModalSide", commitmentModalSide, event.detail)
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
          hasBeginning: new Date().getTime(),
          hasEnd: commitmentData.hasEnd,
          hasPointInTime: commitmentData.hasPointInTime,
          inScopeOf: commitmentData.inScopeOf,
          independentDemandOf: planId,
          note: commitmentData.note,
          plannedWithin: planId,
          provider: commitmentData.provider.id,
          receiver: commitmentData.receiver.id,
          resourceClassifiedAs: commitmentData.resourceClassifiedAs,
          resourceConformsTo: commitmentData.resourceConformsTo?.id,
          resourceInventoriedAs: commitmentData.resourceInventoriedAs,
          resourceQuantity: {
            hasNumericalValue: commitmentData.resourceQuantity?.hasNumericalValue,
            hasUnit: commitmentData.resourceQuantity?.hasUnit?.id
          }
        }
        await createCommitment(newCommitment)
        fetching = true
        await getPlan()
         
      } else {
      // =============================ON NEW REGULAR=============================
        console.log("adding commitment", event.detail.commitment)

        // ============================= ADD VISUALLY =============================
        // if (!allColumns[event.detail.column][event.detail.process]?.id) {
        //   await addNonProcessCommitmentToPlan(planId, event.detail.commitment)
        // } else {
        //   await addProcessCommitmentToPlan(planId, allColumns[event.detail.column][event.detail.process]?.id, event.detail.side, event.detail.commitment)
        // }
        // await getPlan()
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
          hasBeginning: new Date().getTime(),
          hasEnd: commitmentData.hasEnd,
          hasPointInTime: commitmentData.hasPointInTime,
          inScopeOf: commitmentData.inScopeOf,
          independentDemandOf: commitmentData.independentDemandOf,
          note: commitmentData.note,
          plannedWithin: planId,
          provider: commitmentData.provider.id,
          receiver: commitmentData.receiver.id,
          resourceClassifiedAs: commitmentData.resourceClassifiedAs,
          resourceConformsTo: commitmentData.resourceConformsTo?.id,
          resourceInventoriedAs: commitmentData.resourceInventoriedAs,
          resourceQuantity: {
            hasNumericalValue: commitmentData.resourceQuantity?.hasNumericalValue,
            hasUnit: commitmentData.resourceQuantity?.hasUnit.id
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

          fetching = true
          console.log("getting process", { id: allColumns[event.detail.column][event.detail.process].id })
          // const processQuery = query(GET_PROCESS, {
          //   variables: { id: allColumns[event.detail.column][event.detail.process].id }
          // });
          processQueryVariables = { id: allColumns[event.detail.column][event.detail.process].id };
          if (processQuery) {
            const processData = await processQuery.refetch();
          }
           
          // await getProcess(thisProcess.id)
        } else {
          console.log("no process")
          console.log("new commitment", newCommitment)
          await createCommitment(newCommitment)
          // await getNonProcessCommitments(planId)
          fetching = true
          await getPlan()
           
        }
      }
    }

    // allColumns = [...allColumns]
    // console.log(allColumns[event.detail.column][event.detail.process][event.detail.side])

    // getPlan()
    
    // reset form
    selectedCommitmentId = undefined
    selectedCommitment = undefined
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
<div>
  <!-- <div class="outer-div justify-center items-center">
  <div class="scroll-div justify-center items-center">
  <div class="content-div flex space-x-8 mx-4"> -->
  <!-- <div class="flex space-x-8 mx-4 overflow-x-scroll"> -->
  {#if plan?.name && plan?.revisionId && $planQuery.loading == false}
  
  <!-- Fetching overlay -->
  {#if fetching}
    <div class="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" style="margin-top: 105px;">
      <div class="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="text-gray-700 font-medium text-lg">Please wait while plan updates...</span>
      </div>
    </div>
  {/if}
  
  <div class="relative">
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
          style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
          title={plan.name}
          >{plan.name}</button
        >
        <div class="mx-1.5"></div>
        <button
          type="button"
          disabled={fetching}
          on:click={getPlan}
          class="flex items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <span class="flex items-center" class:animate-spin={fetching}>
            <SvgIcon icon="faRefresh" color="#fff" />
          </span>
        </button>

        <Export dataName="plan" fileName="cfn-plan-{plan.name}" data={exportData} hideImport={true} />
      </div>
      <h2 class="text-center text-xl font-semibold">Offers</h2>
      <div class="bg-blue-300 border border-gray-400 p-2" style="background-color: #8C8C8C;">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#if $allProposalsQuery.loading}
              loading offers...
            {:else}
              {#each offers as offer (offer.id)}
                {@const reciprocal = offer.reciprocal[0]}
                {@const primary = offer.publishes[0]}
                {@const requestsTotalAll = requestsPerOffer[primary?.id]}
                {@const requestsTotal = requestsTotalAll ? Object.values(requestsTotalAll).map(it => new Decimal(it)).reduce((acc, it) => acc.add(it), new Decimal(0)) : new Decimal(0)}
                <!-- {@const requestsTotal = requestsPerOffer[primary?.id]} -->
                <!-- {JSON.stringify(primary?.receiver)} -->
                {#if primary?.provider}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                  >
                    <strong>{primary?.resourceConformsTo?.name}</strong>
                    {#if primary?.availableQuantity}
                    <p>
                      {#if primary?.availableQuantity?.hasNumericalValue && primary?.availableQuantity?.hasNumericalValue > 0}
                        <strong>
                          {primary?.availableQuantity?.hasNumericalValue}
                          {primary?.availableQuantity?.hasUnit?.label} 
                        </strong>
                        available<br>
                        <div>
                          <p class:red-label={requestsTotal  > primary?.availableQuantity?.hasNumericalValue}>
                            {requestsTotal} requested<br>
                            <!-- {requestsTotal} of {primary?.publishes?.availableQuantity?.hasNumericalValue} requested<br> -->
                          </p>
                        </div>
                      {/if}
                      {reciprocal?.resourceQuantity?.hasNumericalValue}
                      {reciprocal?.resourceConformsTo?.name} per {primary?.resourceQuantity?.hasNumericalValue} 
                      {primary?.resourceQuantity?.hasUnit?.label}
                      <!-- {#each units as unit}
                        {#if unit.id == primary?.publishes?.resourceQuantity?.hasUnitId}
                          {unit.label}
                        {/if}
                      {/each} -->
                    </p>
                    {:else}
                      <p>
                        {reciprocal?.resourceQuantity?.hasNumericalValue}
                        USD per lb
                      </p>
                    {/if}
                    <p>from 
                      <!-- {primary?.publishes?.provider?.name} -->
                      {primary?.provider?.name}
                    </p>
                  </div>
                {/if}
              {/each}
            {/if}
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
      
      {#each processes as { id, committedInputs, committedOutputs, id: processId, basedOn: proSpec }, processIndex (id)}        
        <!-- <div class="bg-gray-400 border border-gray-400 p-2"> -->
        <div class="border-gray-400 p-2" style="background-color: #BFBFBF;">
          <!-- Sub-columns -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <div class="flex justify-center items-center w-full mb-2">
                <div class="flex space-x-2">
                  <!-- plan backward -->
                  {#if processIndex == 0 && columnIndex > 0}
                    <button
                      title="Auto-fill the previous output commitments based on the input commitments"
                      class="flex justify-center items-center"
                      on:click={() => {
                      backwardSuggestions = {
                        side: "committedOutputs",
                        columnIndex: columnIndex - 1,
                        current: allColumns[columnIndex - 1]?.map(it => it.committedOutputs),
                        new: calculateInputToOutputBackward(columnIndex)
                      }
                      planBackwardModalOpen = true
                      }}
                    >
                      <SvgIcon icon=faBackward size=12/>
                    </button>
                  {/if}

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
                      <SvgIcon icon=faForward size=12/>
                    </button>                  
                  {/if}
                </div>
              </div>

              {#each committedInputs as commitment (commitment.id)}
                <Commitment 
                  side="committedInputs"
                  {getPlan}
                  {commitment}
                  {carryOver}
                  {columnIndex}
                  {processIndex}
                  {allColumns}
                  {processes}
                  {agents}
                  {economicResources}
                  {units}
                  {yellow}
                  {agreementsToDelete}
                  {commitmentsToDelete}
                  {deleteCommitment}
                  {deleteAgreement}
                  {sumEconomicEventsFromFulfillments}
                  {updateColumns}
                  bind:combinationOptions
                  bind:fetching
                  bind:commitmentModalOpen
                  bind:commitmentModalProcess
                  bind:commitmentModalColumn
                  bind:commitmentModalSide
                  bind:selectedCommitmentId
                  bind:selectedProcessId
                  bind:currentProcess
                  bind:economicEventModalOpen
                  bind:selectedCommitment
                />
              {/each}

              </div>
              <div>
                <div class="flex justify-center items-center w-full mb-2">
                  <div class="flex space-x-2">
                    <!-- plan backward -->
                    {#if processIndex == 0 && columnIndex < allColumns.length}
                      <button
                        title="Auto-fill the input commitments based on the output commitments"
                        class="flex justify-center items-center"
                        on:click={() => {
                        backwardSuggestions = {
                          side: "committedInputs",
                          columnIndex: columnIndex,
                          current: allColumns[columnIndex].map(it => it.committedInputs),
                          new: calculateOutputToInputBackward(columnIndex)
                        }
                        planBackwardModalOpen = true
                        }}
                      >
                        <SvgIcon icon=faBackward size=12/>
                      </button>
                    {/if}

                    <button
                      title="Add a new commitment to this process"
                      class="flex justify-center items-center"
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

                    {#if processIndex == 0 && columnIndex < allColumns.length - 1}
                      <button
                        title="Auto-fill the next input commitments based on the output commitments"
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
                        <SvgIcon icon=faForward size=12/>
                      </button>
                    {/if}
                  </div>
                </div>

                {#each committedOutputs as commitment (commitment.id)}
                <Commitment 
                  side="committedOutputs"
                  {getPlan}
                  {commitment}
                  {carryOver}
                  {columnIndex}
                  {processIndex}
                  {allColumns}
                  {processes}
                  {units}
                  {yellow}
                  {agreementsToDelete}
                  {commitmentsToDelete}
                  {deleteCommitment}
                  {deleteAgreement}
                  {sumEconomicEventsFromFulfillments}
                  {updateColumns}
                  bind:combinationOptions
                  bind:fetching
                  bind:commitmentModalOpen
                  bind:commitmentModalProcess
                  bind:commitmentModalColumn
                  bind:commitmentModalSide
                  bind:selectedCommitmentId
                  bind:selectedProcessId
                  bind:currentProcess
                  bind:economicEventModalOpen
                  bind:selectedCommitment
                />
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
                selectedCommitment = undefined
                commitmentModalColumn = columnIndex
                commitmentModalOpen = true
                // stage is id of previous processSpecification
              }}
            >
              <PlusCircle />
            </button>
              <!-- Sub-columns -->
              <!-- <div class="grid grid-cols-2 gap-2"> -->
                <!-- {#each nonProcessCommitments as { resourceConformsTo, provider.id, resourceQuantity, action, receiver.id, id, revisionId, agreement, fulfilledBy, finished, clauseOf }} -->
                {#each nonProcessCommitments.filter(it => {return it.stage?.id == prevColumnBasedOnId && resourceSpecificationIds.includes(it.resourceConformsTo.id)}) as commitment}
                  <Commitment
                    side=""
                    {getPlan}
                    {commitment}
                    {carryOver}
                    {columnIndex}
                    processIndex={undefined}
                    {allColumns}
                    {processes}
                    {units}
                    {yellow}
                    {agreementsToDelete}
                    {commitmentsToDelete}
                    {deleteCommitment}
                    {deleteAgreement}
                    {sumEconomicEventsFromFulfillments}
                    {updateColumns}
                    bind:combinationOptions
                    bind:fetching
                    bind:commitmentModalOpen
                    bind:commitmentModalProcess
                    bind:commitmentModalColumn
                    bind:commitmentModalSide
                    bind:selectedCommitmentId
                    bind:selectedProcessId
                    bind:currentProcess
                    bind:economicEventModalOpen
                    bind:selectedCommitment
                  />
                {/each}

                <!-- {#each nonProcessCommitments.filter(it => {return it.stageId == prevColumnBasedOnId && resourceSpecificationIds.includes(it.resourceConformsTo.id)}) as { resourceConformsTo, provider.id, resourceQuantity, action, receiver.id, id, revisionId, agreement, fulfilledBy, finished, clauseOf }} -->
                {#each [] as { resourceConformsTo, provider, resourceQuantity, action, receiver, id, revisionId, agreement, fulfilledBy, finished, clauseOf }}
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
                              <!-- {sumEconomicEvents(fulfilledBy.map(it => it.id))} -->
                              {sumEconomicEventsFromFulfillments(fulfilledBy)}
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
                        {provider?.name}
                        <br />
                        to 
                        {receiver?.name}
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
                              clause?.resourceQuantity.hasNumericalValue
                            )
                              .toFixed(2, Decimal.ROUND_HALF_UP)
                              .toString()}
                            {clause?.resourceConformsTo.name}
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
                            selectedCommitment = nonProcessCommitments.find(it => it.id == id)
                            commitmentModalSide = ""
                            commitmentModalOpen = true
                          }}
                        >
                          <Pencil />
                        </button>
                        <button
                          on:click={async () => {
                            // remove cost agreement if present
                            console.log("clauseOf to delete", clauseOf)
                            let costAgreement = clauseOf
                            if (costAgreement) {
                              console.log("costAgreement delete", costAgreement)
                              agreementsToDelete.push(costAgreement.revisionId)
                              commitmentsToDelete.push(costAgreement.commitments.find(it => it.action.label == "transfer" && it.receiver.id == provider.id).revisionId)
                            //   // requestsPerOffer[costAgreement.provider.id] = requestsPerOffer[costAgreement.provider.id] - costAgreement.commitments.find(it => it.action.label == "transfer").resourceQuantity.hasNumericalValue
                            //   // resetColumns()
                            if (costAgreement?.revisionId) {
                              await deleteAgreement(costAgreement.revisionId)
                              await deleteCommitment(costAgreement.commitments.find(it => it.action.label == "transfer" && it.receiver.id == provider.id).revisionId)
                            }
                            }
                            // await deleteCommitment(clauseOf.commitments.find(it => it.action.label == "transfer").revisionId)
                            
                            await deleteCommitment(revisionId)
                            fetching = true
                            await getPlan()
                             
                            // await getNonProcessCommitments(planId)
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
                            selectedProcessId = undefined
                            commitmentModalSide = ""
                            selectedCommitmentId = id
                            selectedCommitment = nonProcessCommitments.find(it => it.id == id)
                            console.log("selectedCommitmentId", selectedCommitmentId)
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
                  {JSON.stringify(clauseOf)}
                  {@const clause = clauseOf?.commitments?.find(it => it.action.label == "transfer" && it.receiver.id == provider.id)}
                  {@const costColor = clause?.finished ? "#c4fbc4" : (((clause?.fulfilledBy && clause?.fulfilledBy.length > 0) || yellow.includes(id)) ? "#fbfbb0" : "white")}
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
                                transfer 
                                {#if true && clause?.fulfilledBy && clause?.fulfilledBy.length > 0 && clause?.fulfilledBy[0].id}
                                  {new Decimal(
                                    sumEconomicEventsFromFulfillments(clause?.fulfilledBy)
                                  )
                                  .toFixed(2, Decimal.ROUND_HALF_UP)
                                  .toString()}
                                {:else}
                                {new Decimal(
                                  clause?.resourceQuantity.hasNumericalValue
                                )
                                .toFixed(0, Decimal.ROUND_HALF_UP)
                                .toString()}
                                {/if}
                                {clause?.resourceConformsTo.name}
                              </strong>
                              <br>from {clause?.provider.name} 
                              <br>to {clause?.receiver.name}
                              {#if clause?.fulfilledBy?.length > 0}
                              {@const dedupedFulfilledBy = clause?.fulfilledBy.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)}
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
                                  selectedCommitmentId = clause?.id
                                  selectedCommitment = cloneDeep(clause)
                                  commitmentModalSide = ""
                                  commitmentModalOpen = true
                                }}
                              >
                                <Pencil />
                              </button>
                              <button
                                on:click={async () => {
                                  await deleteCommitment(clause?.revisionId)
                                  await deleteAgreement(clauseOf.revisionId)
                                  fetching = true
                                  await getPlan()
                                   
                                  // await getNonProcessCommitments(planId)
                                }}
                              >
                                <Trash />
                              </button>
                              <button
                                style="margin-left: 20px;"
                                on:click={() => {
                                  commitmentModalProcess = undefined
                                  commitmentModalColumn = undefined
                                  commitmentModalSide = ""
                                  currentProcess = undefined
                                  selectedCommitmentId = clause?.id
                                  selectedCommitment = cloneDeep(clause)
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
      <h2 class="text-center" style="margin-top: 42px; margin-bottom: 11px;">Total cost: ${Math.round(Number(totalCost))}</h2>
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
                selectedCommitment = undefined
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
                    {action?.label}
                    <strong>
                      {resourceQuantity?.hasNumericalValue}
                      {resourceQuantity?.hasUnit?.label}
                    </strong>
                  </p>
                  <p>to 
                    {c.receiver?.name}
                  </p>
                </div>
                <div class="w-full flex justify-center">
                  <button
                    on:click={() => {
                      commitmentModalProcess = undefined
                      commitmentModalColumn = undefined
                      commitmentModalSide = ""
                      currentProcess = undefined
                      selectedCommitmentId = id
                      commitmentModalOpen = true
                      selectedCommitment = cloneDeep(c)
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
            {#each requests as request}
              {@const reciprocal = request.reciprocal[0]}
              {@const primary = request.publishes[0]}
              {#if primary?.receiver}
                <div
                  class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                >
                  <strong>{primary?.resourceConformsTo?.name}</strong>
                  <p>
                    {primary?.action?.label}
                    <strong>
                      {primary?.resourceQuantity?.hasNumericalValue}
                      {primary?.resourceQuantity?.hasUnit?.label}<br>
                    </strong>
                    <!-- {#each units as unit}
                      {#if unit.id == primary?.publishes?.resourceQuantity?.hasUnitId}
                        {unit.label}
                      {/if}
                    {/each} -->
                  </p>
                  <p>to 
                    {primary?.receiver?.name}
                  </p>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    </div>

  </div>
  </div>
  {:else}
    No plan found
  {/if}
  <!-- </div>
  </div> -->
</div>
{/if}

<style>
  /* Custom CSS */
  .red-label {
    white-space: pre-wrap; word-wrap: break-word; color: red; font-weight: bold; background-color: #ffe0e0; padding: 2px 4px; border-radius: 4px; display: inline-block;
  }

  .custom-background {
    /* background-image: url('/heading3.png'); */
    background-image: url('/dsf.jpg');
    background-size: cover;
    background-position: center;
  }
</style>
