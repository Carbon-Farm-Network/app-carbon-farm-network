<script lang="ts">
  // import recipes from '$lib/data/recipes-with-exchanges.json'
  import { Decimal } from 'decimal.js'
  import PlanModal from '../PlanModal.svelte'
  import CommitmentModal from '../CommitmentModal.svelte'
  import { Trash, Pencil, PlusCircle } from '$lib/icons'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { Unit, Action, Agent, Proposal, ResourceSpecification, PlanCreateParams, Intent, RecipeProcess, RecipeFlow } from '@valueflows/vf-graphql'
  import { dragscroll } from '@svelte-put/dragscroll';
  import { allHashChanges, allRecipes, allRecipeExchanges, allEconomicResources } from '../../../crud/store'
  import Export from '$lib/Export.svelte'
  import { cloneDeep } from 'lodash'
  import { createCommitments, makeAgreement, findExchange, assignProviderReceiver, createAgreements, aggregateCommitments, type Process, type Commitment, type Demand } from '../=helper'
  import { importPlan } from '../../../crud/import'
  import { goto } from '$app/navigation'
  import { GET_ALL_RECIPES, GET_ALL_RECIPE_EXCHANGES, GET_ALL_ECONOMIC_RESOURCES, GET_All_PROPOSALS, GET_ALL_AGENTS } from '../../../crud/fetch'
  import { query } from 'svelte-apollo'

  const recipesQuery = query(GET_ALL_RECIPES)
  const agentsQuery = query(GET_ALL_AGENTS)

  const columnLimit = 20
  let recipes: any[] = []
  recipesQuery.subscribe((res) => {
    recipes = res.data?.recipeProcesses.edges?.map(e => e.node) || []})
  const recipeExchangeQuery = query(GET_ALL_RECIPE_EXCHANGES)
  let recipeExchanges: any[] = []
  recipeExchangeQuery.subscribe((res) => {recipeExchanges = res.data?.recipeExchanges.edges?.map(e => e.node) || []})
  const allEconomicResourcesQuery = query(GET_ALL_ECONOMIC_RESOURCES)
  let economicResources: any[] = []
  allEconomicResourcesQuery.subscribe((res) => {economicResources = res.data?.economicResources.edges?.map(e => e.node) || []})

  const allProposalsQuery = query(GET_All_PROPOSALS)
  let allProposals: Proposal[] = []
  let offers: Proposal[] = []
  let requests: Proposal[] = []
  allProposalsQuery.subscribe((res) => {
    allProposals = res.data?.proposals?.edges?.map(e => e.node) || []
    offers = allProposals.filter(it => it.publishes[0].provider != undefined)
    requests = allProposals.filter(it => it.reciprocal[0].provider != undefined)
  })

  let hashChanges: any = {}
  let agents: Agent[] = []
  let units: Unit[] = []
  let actions: Action[] = []
  let resourceSpecifications: ResourceSpecification[] = []
  let processSpecifications: any[] = []
  // let requests: Proposal[] = [];
  // let offers: Proposal[] = [];
  let proposalsList: Proposal[] = []
  let currentProcess: any[] | undefined = undefined;
  let exportOpen: boolean = false;
  let importing: boolean = false;
  let commitmentModalProcess: number | undefined = undefined;
  let commitmentModalColumn: number | undefined = undefined;
  let commitmentModalSide: string | undefined = "";
  let selectedCommitment: string | undefined = undefined;
  let selectedCommitmentId: string | undefined = undefined;
  let createPlan: PlanCreateParams = {
    name: '',
    note: '',
  }

  $: currentProcess, actions;

  agentsQuery.subscribe((res) => {
    const edges = res.data?.agents?.edges ?? [];
    agents = edges.map((e: any) => ({
      ...e.node,
      name: e.node.name,
      imageUrl: e.node.image,
      iconUrl: e.node.image,
      lat: e.node.classifiedAs?.[0],
      long: e.node.classifiedAs?.[1],
      role: e.node.classifiedAs?.[2],
      address: e.node.note,
      facets: e.node.facets
    })) || [];
  })

  onMount(async () => {
    if (browser) {
      allEconomicResourcesQuery.refetch()
      recipesQuery.refetch()
      recipeExchangeQuery.refetch()
      agentsQuery.refetch()

      console.log("loaded", allEconomicResources, recipes, recipeExchanges)
    }
  })

  // ============================ NEW CODE ============================

  /**
 * Generates backward-chained process plans from initial commitments.
 * It recursively finds recipes to fulfill each input, subtracts existing inventory,
 * and builds process columns until no unmet demand remains or a column limit is reached.
 */

// ===================== Core Planning Logic =====================

/**
 * Backward chains processes from unmet input demand.
 */
function previousColumn(column: any[]): Process[] {
  return column
    ?.reduce((acc: any[], input: Intent) => {
      if (input.resourceQuantity?.hasNumericalValue <= 0) return acc;

      const recipe = findMatchingRecipe(input);
      if (!recipe) return acc;

      const matchingOutput = findRecipeOutput(recipe, input);
      const matchingInput = findRecipeInput(recipe, input);
      if (!matchingOutput || !matchingInput) return acc;

      const multiplier = calculateMultiplier(input, matchingOutput);

      const scaledInput = scaleInput(matchingInput, multiplier);
      const scaledOutput = scaleOutput(input, matchingOutput);

      const process = buildProcess(recipe, scaledInput, scaledOutput, acc);
      return [...acc.filter(p => p.id !== process.id), process];
    }, [])
    .map(runInstructions)
    .map(p => createAgreements(p, recipeExchanges, offers, agents));
}

/**
 * Calculates input and output quantities based on a recipe and aggregates them into a process.
 */
function buildProcess(recipe: RecipeProcess, input: Commitment, output: Commitment, existingProcesses: Process[]): Process {
  const existing = existingProcesses.find(p => p.id === recipe.id);
  const services = getServiceOutputs(recipe);
  const additionalInputs = getNonMatchingInputs(recipe, input);

  if (isSimpleDropoffOrModify(output)) {
    if (existing) {
      const merged = mergeIntoExistingProcess(existing, input, output, services, additionalInputs);
      return merged;
    }
    return createNewProcess(recipe, [input, ...additionalInputs], [output, ...services]);
  }

  const scaledInputs = scaleInputs(recipe, calculateMultiplier(input, output));
  const additionalOutputs = getEditableOutputs(recipe, output);
  return createNewProcess(recipe, scaledInputs, [output, ...additionalOutputs]);
}

/**
 * Applies instructions like SumInputs or SumOutputs to the process outputs.
 */
function runInstructions(process: Process): Process {
  return {
    ...process,
    committedOutputs: process.committedOutputs.map(output => {
      const sum = output.instructions === 'SumOutputs'
        ? sumOutputs(process, output)
        : output.instructions === 'SumInputs'
        ? sumInputs(process)
        : null;

      return sum
        ? {
            ...output,
            resourceQuantity: {
              ...output.resourceQuantity,
              hasNumericalValue: sum.toDecimalPlaces(0, Decimal.ROUND_UP).toString()
            }
          }
        : output;
    }),
  };
}

// ===================== Planning Loop =====================

/**
 * Rebuilds the full plan columns, subtracting inventory at each stage and chaining processes.
 */
function generateColumns(aggregatedCommitments: any[]): any[] {
  const resourceInventory = computeInitialInventory(economicResources);
  let previousProcesses = previousColumn(aggregatedCommitments);
  console.log("initial previousProcesses", previousProcesses);
  let columns: any[] = [];
  let count = 0;

  while (previousProcesses.length && count++ < columnLimit) {
    columns = [previousProcesses, ...columns];
    previousProcesses = subtractInventory(cloneDeep(previousProcesses), resourceInventory);
    previousProcesses = previousColumn(flattenInputs(previousProcesses));
  }

  return columns;
}

/**
 * Subtracts existing inventory from process input quantities.
 */
function subtractInventory(processes: Process[], inventory: Record<string, Decimal>): any[] {
  return processes.map(process => ({
    ...process,
    committedInputs: process.committedInputs
      .map(input => {
        if (!input.stage?.id) return input;

        const key = `${input.resourceConformsTo?.id}____${input.stage?.id}`;
        const available = inventory[key] || new Decimal(0);
        const needed = new Decimal(input.resourceQuantity.hasNumericalValue);
        const used = Decimal.min(available, needed);

        inventory[key] = Decimal.max(available.sub(used), 0);
        return {
          ...input,
          resourceQuantity: {
            ...input.resourceQuantity,
            hasNumericalValue: needed.sub(used).toString()
          }
        };
      })
      .filter(i => new Decimal(i.resourceQuantity.hasNumericalValue).gt(0))
  }));
}

// ===================== Utility Functions =====================

function findMatchingRecipe(input: Intent) {
  return recipes.find(recipe =>
    recipe.recipeOutputs?.some((output: RecipeFlow) =>
      output.resourceConformsTo?.id === input.resourceConformsTo?.id
      && (recipe.processConformsTo?.name === input.stage?.name
        || recipe.processConformsTo?.id === input.stage?.id)
    )
  );
}

function findAllMatchingRecipes(input: Intent) {
  return recipes.filter(recipe =>
    recipe.recipeOutputs?.some((output: RecipeFlow) =>
      output.resourceConformsTo?.id === input.resourceConformsTo?.id
    )
  );
}

function findRecipeOutput(recipe: any, input: any) {
  const match = recipe.recipeOutputs?.find(o => o.resourceConformsTo.name === input.resourceConformsTo.name);
  if (match) delete match.revisionId;
  return assignProviderReceiver(match, agents);
}

function findRecipeInput(recipe: any, input: any) {
  const match = recipe.recipeInputs?.find(i => i.resourceConformsTo.name === input.resourceConformsTo.name);
  if (match) delete match.revisionId;
  return assignProviderReceiver(match, agents);
}

function calculateMultiplier(input: any, output: any) {
  return new Decimal(input.resourceQuantity.hasNumericalValue || '1')
    .div(new Decimal(output.resourceQuantity?.hasNumericalValue || '1'));
}

function scaleInput(input: any, multiplier: Decimal) {
  return {
    ...input,
    resourceQuantity: {
      ...input.resourceQuantity,
      hasNumericalValue: multiplier.toDecimalPlaces(0, Decimal.ROUND_UP).toString()
    }
  };
}

function scaleOutput(input: any, output: any) {
  return {
    ...output,
    resourceQuantity: {
      ...output.resourceQuantity,
      hasNumericalValue: new Decimal(input.resourceQuantity.hasNumericalValue)
        .toDecimalPlaces(0, Decimal.ROUND_UP)
        .toString()
    }
  };
}

function isSimpleDropoffOrModify(output: any) {
  return ['dropoff', 'modify'].includes(output?.action?.label);
}

function getServiceOutputs(recipe: any) {
  return recipe.recipeOutputs
    .filter(o => !['dropoff', 'modify'].includes(o.action.label))
    .map(o => assignProviderReceiver({ ...o, revisionId: undefined }, agents));
}

function getEditableOutputs(recipe: any, exclude: any) {
  return recipe.recipeOutputs
    .filter(o => o.id !== exclude.id)
    .map(o => assignProviderReceiver({ ...o, revisionId: undefined, editable: true }, agents));
}

function getNonMatchingInputs(recipe: any, exclude: any) {
  return recipe.recipeInputs
    .filter(i =>
      i.id !== exclude?.id &&
      !['pickup', 'accept'].includes(i.action.label)
    )
    .map(i => ({ ...i, revisionId: undefined, independent: true }));
}

function scaleInputs(recipe: any, multiplier: Decimal) {
  return recipe.recipeInputs.map(input => {
    const { revisionId, ...rest } = assignProviderReceiver(input, agents);
    return {
      ...rest,
      resourceQuantity: {
        ...rest.resourceQuantity,
        hasNumericalValue: new Decimal(rest.resourceQuantity.hasNumericalValue)
          .mul(multiplier)
          .toDecimalPlaces(0, Decimal.ROUND_UP)
          .toString()
      }
    };
  });
}

function flattenInputs(processes: any[]): any[] {
  return processes.flatMap(p => p.committedInputs);
}

function computeInitialInventory(resources: any[]) {
  const inventory: Record<string, Decimal> = {};
  resources?.forEach(r => {
    const key = `${r.conformsTo?.id}____${r.stage?.id}`;
    const qty = new Decimal(r.onhandQuantity?.hasNumericalValue || 0);
    inventory[key] = (inventory[key] || new Decimal(0)).add(qty);
  });
  return inventory;
}

function sumOutputs(process: Process, target: any) {
  return process.committedOutputs
    .filter(o => o.id !== target.id)
    .reduce((acc, o) => acc.add(o.resourceQuantity.hasNumericalValue), new Decimal(0));
}

function sumInputs(process: Process) {
  return process.committedInputs
    .reduce((acc, i) => acc.add(i.resourceQuantity.hasNumericalValue), new Decimal(0));
}

function createNewProcess(recipe: any, inputs: any[], outputs: any[]): Process {
  return {
    id: recipe.id,
    name: recipe.name,
    basedOn: recipe.processConformsTo,
    committedInputs: inputs,
    committedOutputs: outputs
  };
}

function mergeIntoExistingProcess(existing: Process, input: any, output: any, services: any[], extras: any[]): Process {
  const newInput = mergeOrAppend(existing.committedInputs, input, 'independent');
  const newOutput = mergeOrAppend(existing.committedOutputs, output);
  // console.log("new output", newOutput, existing?.committedOutputs)
  console.log("multiple services? ", services.length, newOutput)

  return {
    ...existing,
    // committedInputs: [...newInput, ...extras],
    // committedOutputs: [...newOutput, ...services]
    committedInputs: newInput,
    committedOutputs: newOutput
  };
}

function mergeOrAppend(existingItems: any[], newItem: any, independentKey?: string) {
  const existing = existingItems.find(i => i.resourceConformsTo?.id === newItem.resourceConformsTo?.id);
  console.log("--found existing item--", newItem?.resourceConformsTo?.name, existing, existingItems, newItem);
  if (existing && independentKey !== 'independent') {
    const merged = {
      ...existing,
      resourceQuantity: {
        ...existing.resourceQuantity,
        hasNumericalValue: new Decimal(existing.resourceQuantity.hasNumericalValue)
          .add(new Decimal(newItem.resourceQuantity.hasNumericalValue))
          .toString()
      }
    };
    return [merged];
  }
  if (independentKey === 'independent') {
    console.log("independent item", newItem?.resourceConformsTo?.name);
  }
  return [
    ...existingItems,
    newItem
  ];
}


  // ============================ ENDS NEW CODE ============================

  let commitments: Commitment[] = []
  let plan_created = false
  let allColumns: any = [];
  $: aggregatedCommitments = aggregateCommitments(commitments)
  $: if (!plan_created) {
    allColumns = generateColumns(aggregatedCommitments);
  }

  let planModalOpen = false
  let commitmentModalOpen = false

  let totalCost: Decimal = new Decimal(0);
  $: if (allColumns) {
    totalCost = new Decimal(0)
    for (let i = 0; i < allColumns.length; i++) {
      for (let j = 0; j < allColumns[i].length; j++) {
        let inputsAndOutputs = allColumns[i][j].committedInputs.concat(allColumns[i][j].committedOutputs)
        for (let k = 0; k < inputsAndOutputs.length; k++) {
          if (inputsAndOutputs[k].agreement) {
            totalCost = totalCost.add(inputsAndOutputs[k].agreement.commitment.resourceQuantity.hasNumericalValue)
          }
        }
      }
    }
  }
</script>
<!-- <button
on:click={()=>{
  console.log(aggregatedCommitments)
  allColumns = generateColumns(aggregatedCommitments)
}}
>
generate columns
</button> -->
<PlanModal bind:open={planModalOpen} planObject = 
  {createPlan} 
  {allColumns} 
  {commitments} 
  {agents}
  {resourceSpecifications}
  {units}
  {processSpecifications}
  editing={false}
/>

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
  process = {currentProcess}

  
  on:submit={(event) => {
    if (event.detail.useAs == "update") {
      if (event.detail.column == undefined) {
        commitments = commitments.map(it => it.id == event.detail.commitment.id ? event.detail.commitment : it)
        commitments = [...commitments]
      } else {
        // check if provider changed, and if so, update the cost
        let updatedCommitment = {
          ...event.detail.commitment,
          receiver: event.detail.commitment.receiver.id ? agents.find(it => it.id == event.detail.commitment.receiver.id) : undefined
        }
        
        let exchange = findExchange(event.detail.commitment, allColumns[commitmentModalColumn][commitmentModalProcess].basedOn.name, recipeExchanges)
        let agreement = makeAgreement(event.detail.commitment, exchange, offers, agents)
        updatedCommitment.agreement = agreement
        if (agreement) {
          updatedCommitment.provider = agents.find(it => it.id == agreement.commitment.receiver.id)
          console.log("commitment provider", updatedCommitment.provider)
        }

        console.log("done...", updatedCommitment)
        let commitmentIndex = allColumns[event.detail.column][event.detail.process][event.detail.side].findIndex(it => it.id == event.detail.commitment.id)
        allColumns[event.detail.column][event.detail.process][event.detail.side][commitmentIndex] = updatedCommitment
      }
    } else {
      console.log(event.detail)
      if (event.detail.column == undefined) {
        commitments.push(event.detail.commitment)
        commitments = [...commitments]
      } else {
        plan_created = true
        let exchange = findExchange(event.detail.commitment, allColumns[commitmentModalColumn][commitmentModalProcess].basedOn.name, recipeExchanges)
        let agreement = makeAgreement(event.detail.commitment, exchange, offers, agents)
        event.detail.commitment.agreement = agreement
        event.detail.commitment.receiver = agents.find(it => it.id == event.detail.commitment.receiver.id)
        if (agreement) {
          event.detail.commitment.provider = agents.find(it => it.id == agreement.commitment.receiver.id)
          console.log("commitment provider", event.detail.commitment.provider)
        }
        allColumns[event.detail.column][event.detail.process][event.detail.side].push(event.detail.commitment)
      }
    }

    // reset form
    selectedCommitmentId = undefined
    commitmentModalProcess = undefined
    commitmentModalColumn = undefined
    commitmentModalSide = undefined
  }}
/>
{/if}

<!-- custom header introduced to enable planning to be more inline with the beginning of the page -->
<div class="custom-background" style="height: 15vh; margin-bottom: 6px">
  <div class="mx-auto px-2 sm:px-6 lg:px-8">
    <h2 class="pt-1 text-white text-3xl">Planning</h2>
    <p class="text-white text-xs">
      Creating and modifying a plan, and recording actual activity
    </p>
  </div>
</div>

<div class="flex justify-center items-center">
  <div class="flex space-x-8 mx-4 overflow-x-scroll overflow-y-scroll" style="height: calc(100vh - 172px)" use:dragscroll={{ axis: 'both' }}>
    <div class="min-w-[200px]">
      <div class="flex justify-center" style="margin-top: 22px; margin-bottom: 22px">
        <button
          type="button"
          on:click={() => {0
            planModalOpen = true
          }}
          class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >Save plan</button
        >
        <Export dataName="plan" fileName="cfn-plan" data={null} hideExport={true} bind:open={exportOpen} bind:importing
          on:import={async event => {
            console.log(event.detail)
            const planId = await importPlan(event.detail)
            goto(`/plans/update/${encodeURIComponent(planId)}`)
          }}
          on:scaffold={event => {
            commitments = event.detail.commitments
            .map(it => {
              return {
                ...it,
              }
            })
            allColumns = event.detail.allColumns
            allColumns = allColumns.map(column => {
              return column.map(process => {
                return {
                  ...process,
                  committedInputs: cloneDeep(process.committedInputs),
                  committedOutputs: cloneDeep(process.committedOutputs)
                }
              })
            })
            importing = false
            exportOpen = false
          }}
        />
      </div>
      <h2 class="text-center text-xl font-semibold">Offers</h2>
      <div class="bg-blue-300 border border-gray-400 p-2" style="background-color: #8C8C8C;">
        <!-- Sub-columns -->
        <div class="">
          <div>
            {#each offers as proposal}
              {@const reciprocal = proposal.reciprocal?.[0]}
              {@const primary = proposal.publishes?.[0]}
              {#if primary?.provider}
              <div
              class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
              >
                  <p>{primary?.resourceConformsTo?.name}</p>
                  {#if primary?.availableQuantity}
                    <p>
                      {#if primary?.availableQuantity?.hasNumericalValue && primary?.availableQuantity?.hasNumericalValue > 0}
                        {primary?.availableQuantity?.hasNumericalValue}
                        {primary?.availableQuantity?.hasUnit?.label} available<br>
                      {/if}
                      {reciprocal?.resourceQuantity?.hasNumericalValue}
                      {reciprocal?.resourceConformsTo?.name} per {primary?.resourceQuantity?.hasNumericalValue} {primary?.resourceQuantity?.hasUnit?.label}
                    </p>
                  {:else}
                    <p>
                      {reciprocal?.resourceQuantity?.hasNumericalValue}
                      {reciprocal?.resourceConformsTo?.name} per {primary?.resourceQuantity?.hasNumericalValue}  {primary?.resourceQuantity?.hasUnit?.label}
                    </p>
                  {/if}
                  <p>from {primary?.provider?.name}</p>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    </div>

    {#each allColumns as processes, columnIndex}
      {@const { image, name } = processes[0].basedOn}
      <div class="min-w-[420px]">
        <img class="mx-auto" height="80px" width="80px" src={image} alt="" />
        <h2 class="text-center text-xl font-semibold">{name}</h2>
        {#each processes as { committedInputs, committedOutputs }, processIndex}
          <div class="border-gray-400 p-2" style="background-color: #BFBFBF;">
            <div class="grid grid-cols-2 gap-2">
              <div>

                {#each committedInputs as { resourceConformsTo, receiver, provider, resourceQuantity, action, editable, id, agreement }}
                {@const networkReceiver = agents.find((a) => a.classifiedAs[2] === "Network")}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                  >
                    <p>{resourceConformsTo?.name}</p>
                    <div class="flex justify-between">
                      <!--
                      <p>
                        {supply_driven_quantity?.hasNumericalValue}
                        {supply_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                      <p>
                        {action?.label}
                        {new Decimal(resourceQuantity?.hasNumericalValue).toString()}
                        {resourceQuantity?.hasUnit?.label}
                      </p>
                      <!--
                      <p>
                        {demand_driven_quantity?.hasNumericalValue}
                        {demand_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                    </div>
                    <p>
                      from {provider?.name || ''}<br />
                      {#if receiver}
                        to {receiver?.name || ''}
                      {:else}
                        to {networkReceiver?.name || ''}
                      {/if}
                    </p>
                    {#if agreement}
                      {@const commitment = agreement.commitment}
                      <p>
                        cost {new Decimal(
                          commitment.resourceQuantity.hasNumericalValue
                        )
                          .toFixed(0, Decimal.ROUND_HALF_UP)
                          .toString()}
                        {commitment.resourceConformsTo.name}
                      </p>
                    {/if}
                  </div>
                {/each}
              </div>
              <div>

                {#each committedOutputs as { resourceConformsTo, receiver, provider, resourceQuantity, action, editable, id, agreement }}
                  <div
                    class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
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
                          {resourceQuantity?.hasNumericalValue}
                          {resourceQuantity?.hasUnit?.label}
                        </p>
                        <!--
                      <p>
                        {demand_driven_quantity?.hasNumericalValue}
                        {demand_driven_quantity?.hasUnit?.label}
                      </p>
                      -->
                      </div>
                      <p>
                        from {provider?.name || ''}<br />
                        to {receiver?.name || ''}
                      </p>
                      {#if agreement}
                        {@const commitment = agreement.commitment}
                        <p>
                          cost {new Decimal(
                            commitment.resourceQuantity.hasNumericalValue
                          )
                            .toFixed(0, Decimal.ROUND_HALF_UP)
                            .toString()}
                          {commitment.resourceConformsTo.name}
                        </p>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/each}

    <div class="min-w-[250px]">
      <h2 class="text-center" style="margin-top: 45px; margin-bottom: 11px;">Total cost: ${
        new Decimal(totalCost)
          .toFixed(0, Decimal.ROUND_HALF_UP)
          .toString()
        
      }</h2>
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
            {#if commitments.length == 0 && recipes.length > 0}
              <div class="flex justify-center my-4">
                <button
                  type="button"
                  on:click={() => {
                    commitments = createCommitments(requests)
                  }}
                  class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >Create from requests</button
                >
              </div>
              <!-- <div class="flex justify-center my-4">
                <Export dataName="plan" fileName="cfn-plan" data={null} hideExport={true}
                  on:import={event => {
                    commitments = event.detail.commitments
                    .map(it => {
                      return {
                        ...it,
                        receiver.id: agents.find(agent => agent.id == hashChanges[it.receiver.id]),
                        // resourceConformsTo: resourceSpecifications.find(spec => spec.id == hashChanges[it.resourceConformsTo.id]),
                      }
                    })
                    allColumns = event.detail.allColumns
                    // change the provider.id to the new hash in each column
                    allColumns = allColumns.map(column => {
                      return column.map(process => {
                        return {
                          ...process,
                          committedInputs: process.committedInputs.map(it => {
                            return {
                              ...it,
                              provider.id: hashChanges[it.provider.id]
                            }
                          }),
                          committedOutputs: process.committedOutputs.map(it => {
                            return {
                              ...it,
                              provider.id: hashChanges[it.provider.id]
                            }
                          })
                        }
                      })
                    })
                  }}
                />
              </div> -->
            {:else if recipes.length == 0}
              <!-- loading button -->
              <div class="flex justify-center my-4">
                <button
                  type="button"
                  class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  disabled
                >
                  Loading recipes...
                </button>
              </div>
            {/if}
            {#each commitments as c}
              {@const resourceConformsTo = c.resourceConformsTo}
              {@const resourceQuantity = c.resourceQuantity}
              {@const receiver = c.receiver}
              <!-- {@const provider = c.provider} -->
              {@const id = c.id}
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
                      {#if unit.id == resourceConformsTo?.defaultUnitOfResource?.id || unit.id == resourceConformsTo?.defaultUnitOfResourceId}
                        {unit.label}
                      {/if}
                    {/each}
                  </p>
                  <p>to {receiver?.name}</p>
                </div>
                <div class="w-full flex justify-center">
                  <button
                    on:click={() => {
                      commitmentModalProcess = undefined
                      commitmentModalColumn = undefined
                      commitmentModalSide = ""
                      selectedCommitmentId = id
                      commitmentModalOpen = true
                      selectedCommitment = cloneDeep(c)
                    }}
                  >
                    <Pencil />
                  </button>
                  <button
                    on:click={() => (commitments = commitments.filter(it => it.id != id))}
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
            {#each requests as req}
              {@const primary = req.publishes[0]}
              {#if primary?.receiver}
                <div
                  class="bg-white rounded-r-full border border-gray-400 py-1 pl-2 pr-4 text-xs"
                >
                  <p>{primary?.resourceConformsTo?.name}</p>
                  <p>
                    {primary?.action?.label}
                    {primary?.resourceQuantity?.hasNumericalValue}
                    {primary?.resourceQuantity?.hasUnit?.label}
                  </p>
                  <p>to {primary?.receiver?.name}</p>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<style>
  /* Custom CSS */
  .custom-background {
    background-image: url('/dsf.jpg');
    background-size: cover;
    background-position: center;
  }
</style>
