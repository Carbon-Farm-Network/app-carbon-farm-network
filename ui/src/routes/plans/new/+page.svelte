<script lang="ts">
  // import recipes from '$lib/data/recipes-with-exchanges.json'
  import { Decimal } from 'decimal.js'
  import PlanModal from '../PlanModal.svelte'
  import CommitmentModal from '../CommitmentModal.svelte'
  import { Trash, Pencil, PlusCircle } from '$lib/icons'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { Unit, Action, Agent, Proposal, ResourceSpecification, PlanCreateParams } from '@leosprograms/vf-graphql'
  import { allActions, allAgents, allUnits, allResourceSpecifications, allProcessSpecifications, allProposals } from '../../../crud/store'
  import { getAllActions, getAllAgents, getAllHashChanges, getAllProcessSpecifications, getAllProposals, getAllRecipes, getAllRecipeExchanges, getAllResourceSpecifications, getAllUnits, getAllEconomicResources } from '../../../crud/fetch'
  import { dragscroll } from '@svelte-put/dragscroll';
  import { allHashChanges, allRecipes, allRecipeExchanges, allEconomicResources } from '../../../crud/store'
  import Export from '$lib/Export.svelte'
  import { cloneDeep } from 'lodash'
  import { createCommitments, makeAgreement, findExchange, assignProviderReceiver, createAgreements, aggregateCommitments, type Process, type Commitment, type Demand } from '../=helper'
  import { importPlan } from '../../../crud/import'
  import { goto } from '$app/navigation'

  let recipes: any[] = []
  allRecipes.subscribe((res) => {recipes = res})
  let recipeExchanges: any[] = []
  allRecipeExchanges.subscribe((res) => {recipeExchanges = res})
  let economicResources: any[] = []
  allEconomicResources.subscribe((res) => {economicResources = res})

  let hashChanges: any = {}
  let agents: Agent[] = []
  let units: Unit[] = []
  let actions: Action[] = []
  let resourceSpecifications: ResourceSpecification[] = []
  let processSpecifications: any[] = []
  let requests: Proposal[] = [];
  let offers: Proposal[] = [];
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

  allHashChanges.subscribe((res) => {hashChanges = res})
  allActions.subscribe((res) => {actions = res})
  allUnits.subscribe((res) => {units = res})
  allResourceSpecifications.subscribe((res) => {resourceSpecifications = res})
  allProcessSpecifications.subscribe((res) => {processSpecifications = res})

  allProposals.subscribe((res) => {
    console.log('proposals', res)
    if (!res.length || res.length == 0) return
    let dedupedRes = res.map(it => {
       //dedupe .publishes
      let publishes = it.publishes
      let deduped = publishes.reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);
      return {
        ...it,
        publishes: deduped
      }
    })
    requests = dedupedRes.filter(it => it.publishes?.find(it => it.reciprocal)?.publishes?.provider)
    offers = dedupedRes.filter(it => it.publishes?.find(it => !it.reciprocal)?.publishes?.provider)
    proposalsList = dedupedRes
  })

  onMount(async () => {
    if (browser) {

      let functions = [
        { array: actions, func: getAllActions },
        { array: hashChanges, func: getAllHashChanges },
        { array: agents, func: getAllAgents },
        { array: units, func: getAllUnits },
        { array: resourceSpecifications, func: getAllResourceSpecifications },
        { array: processSpecifications, func: getAllProcessSpecifications },
        { array: proposalsList, func: getAllProposals },
        { array: recipeExchanges, func: getAllRecipeExchanges },
        { array: recipes, func: getAllRecipes },
        { array: economicResources, func: getAllEconomicResources }
      ];

      for (let item of functions) {
        if (item.array.length === 0) {
          await item.func();
        }
      }

      console.log(resourceSpecifications, proposalsList)
    }
  })


  // ===========================================
  const previousColumn = (column: any) => {
    return column
      ?.reduce((acc: any, input: any) => {
        if (input.resourceQuantity.hasNumericalValue > 0) {
          // find a recipe that outputs what the demand wants
          console.log("input", input)
          const recipe = recipes
            .find(a_recipe => {
              // if (input.stage) {
                return a_recipe?.recipeOutputs?.some(
                  output =>
                    output.resourceConformsTo?.name == input.resourceConformsTo?.name &&
                    a_recipe.processConformsToId == processSpecifications.find(it => it.name == input.stage?.name)?.id
                  )
              // } else {
              //   return a_recipe.recipeOutputs.some(
              //     output =>
              //       output.resourceConformsTo?.name == input.resourceConformsTo?.name
              //   )
              // }
            })
          // console.log("found recipes", recipe, acc)
          // if there is no recipe we just continue
          if (!recipe) {
            return acc
          }
          // find the output that matches the demand
          let matching_output = recipe?.recipeOutputs?.find(
            output => output.resourceConformsTo.name == input.resourceConformsTo.name
          )

          // delete revisionId from matching output
          if (matching_output) {
            delete matching_output.revisionId;
          }
          // find the multiplier to make the demand required
          // TODO round up not down like it is now
          // console.log(recipe, matching_output?.resourceQuantity?.hasNumericalValue)
          const multiplier = new Decimal(
            input.resourceQuantity.hasNumericalValue || '1'
          ).div(new Decimal(matching_output?.resourceQuantity?.hasNumericalValue))

            let matching_input = recipe?.recipeInputs?.find(
            an_input =>
              an_input.resourceConformsTo.name == input.resourceConformsTo.name
            )
            // delete revisionId from matching input
            if (matching_input) {
              delete matching_input.revisionId;
            }

          matching_input = assignProviderReceiver(matching_input, agents)

          matching_input = Object.assign({}, matching_input, {
            resourceQuantity: {
              ...matching_input?.resourceQuantity,
              hasNumericalValue: multiplier
                .toDecimalPlaces(0, Decimal.ROUND_UP)
                .toString()
            }
          })

          matching_output = assignProviderReceiver(matching_output, agents)
          matching_output = Object.assign({}, matching_output, {
            resourceQuantity: {
              ...matching_output?.resourceQuantity,
              hasNumericalValue: new Decimal(
                input.resourceQuantity.hasNumericalValue
              )
                .toDecimalPlaces(0, Decimal.ROUND_UP)
                .toString()
            }
          })

          let committedOutputs, committedInputs, new_output, new_input
          if (
            matching_output?.action.label == 'dropoff' ||
            matching_output?.action.label == 'modify'
          ) {
            const existing_process = acc?.find(it => it.id == recipe.id)
            if (existing_process) {
              const remaining_processes = acc.filter(it => it.id != existing_process.id)
              const existing_services = existing_process.committedOutputs.filter(
                output => output.action.label != 'dropoff' && output.action.label != 'modify'
              )
              // console.log("EXISTING SERVICES", existing_services, existing_process.committedOutputs)
              const existing_output = existing_process.committedOutputs.find(
                output => output.id == matching_output.id
              )
              if (existing_output) {
                new_output = {
                  ...existing_output,
                  resourceQuantity: {
                    ...existing_output.resourceQuantity,
                    hasNumericalValue: new Decimal(
                      existing_output.resourceQuantity.hasNumericalValue
                    ).add(matching_output.resourceQuantity.hasNumericalValue)
                  }
                }
              } else {
                new_output = matching_output
              }

              const existing_input = existing_process.committedInputs.find(
                input => input.id == matching_input.id
              )
              if (existing_input) {
                new_input = {
                  ...existing_input,
                  resourceQuantity: {
                    ...existing_input.resourceQuantity,
                    hasNumericalValue: new Decimal(
                      existing_input.resourceQuantity.hasNumericalValue
                    ).add(matching_input.resourceQuantity.hasNumericalValue)
                  }
                }
              } else {
                new_input = matching_input
              }
              const non_service_non_matching_outputs = existing_process.committedOutputs.filter(
                previous_output =>
                  previous_output.id != matching_output.id &&
                  (previous_output.action.label == 'dropoff' ||
                    previous_output.action.label == 'modify')
              )
              const non_matching_inputs = existing_process.committedInputs.filter(
                previous_input => previous_input.id != matching_input?.id
              )
              const non_matching_independent_inputs = non_matching_inputs.filter(
                it => it.independent
              )
              const non_matching_dependent_inputs = non_matching_inputs.filter(
                it => !it.independent
              )
              return [
                ...remaining_processes,
                {
                  ...existing_process,
                  committedOutputs: [
                    ...non_service_non_matching_outputs,
                    new_output,
                    ...existing_services
                  ],
                  committedInputs: [
                    ...non_matching_dependent_inputs,
                    new_input,
                    ...non_matching_independent_inputs
                  ]
                }
              ]
            } else {
                const services = recipe?.recipeOutputs
                .filter(output => output.action.label != 'dropoff' && output.action.label != 'modify')
                .map(service => {
                  const { revisionId, ...rest } = service;
                  return assignProviderReceiver(rest, agents);
                })
              const non_matching_inputs = recipe?.recipeInputs
                .filter(
                  previous_input =>
                  previous_input.id != matching_input?.id &&
                  previous_input.action.label != 'pickup' &&
                  previous_input.action.label != 'accept'
                )
                .map(it => {
                  const { revisionId, ...rest } = it;
                  return { ...rest, independent: true };
                })
              // console.log("MATCHING INPUT", matching_input, non_matching_inputs)
              committedInputs = [matching_input, ...non_matching_inputs]
              committedOutputs = [matching_output, ...services]
            }
          } else {
            committedOutputs = [
              matching_output,
              ...recipe?.recipeOutputs
              .filter(it => it.id != matching_output?.id)
              .map(it => {
                const { revisionId, ...rest } = it;
                return { ...rest, editable: true };
              })
              .map(output => assignProviderReceiver(output, agents))
            ]
            committedInputs = recipe?.recipeInputs
              ?.map(input => assignProviderReceiver(input, agents))
              .map(input => {
              console.log("INPUT0", input)
              const { revisionId, ...rest } = input;
              return Object.assign({}, rest, {
                resourceQuantity: {
                ...input.resourceQuantity,
                hasNumericalValue: new Decimal(
                  input.resourceQuantity.hasNumericalValue
                )
                  .mul(multiplier)
                  .toDecimalPlaces(0, Decimal.ROUND_UP)
                  .toString()
                }
              })
              })
          }
          // console.log("RECIPE", recipe)
          return [
            ...acc,
            {
              id: recipe.id,
              name: recipe.name,
              basedOn: processSpecifications.find(it => it.id == recipe.processConformsToId),
              committedOutputs,
              committedInputs
            }
          ]
        }
      }, [])
      .map(process => runInstructions(process))
      .map((process: Process) => {
        // console.log("PROCESS1 ", process)
        return createAgreements(process, recipeExchanges, offers, agents)
      })
  }

  function runInstructions(process: Process): Process {
    return {
      ...process,
      committedOutputs: process.committedOutputs.map(output => {
        if (output.instructions == 'SumOutputs') {
          const other_outputs = process.committedOutputs.filter(it => it.id != output.id)
          const sum = other_outputs.reduce(
            (acc, output) => acc.add(output.resourceQuantity.hasNumericalValue),
            new Decimal(0)
          )
          return {
            ...output,
            resourceQuantity: {
              ...output.resourceQuantity,
              hasNumericalValue: sum.toDecimalPlaces(0, Decimal.ROUND_UP).toString()
            }
          }
        } else if (output.instructions == 'SumInputs') {
          const sum = process.committedInputs.reduce(
            (acc, output) => acc.add(output.resourceQuantity.hasNumericalValue),
            new Decimal(0)
          )
          return {
            ...output,
            resourceQuantity: {
              ...output.resourceQuantity,
              hasNumericalValue: sum.toDecimalPlaces(0, Decimal.ROUND_UP).toString()
            }
          }
        }
        return output
      }),
      // TODO in the future inputs will have instructions too
      committedInputs: process.committedInputs
    }
  }

  let commitments: Commitment[] = []
  let plan_created = false
  let allColumns: any = [];
  $: aggregatedCommitments = aggregateCommitments(commitments)
  $: if (!plan_created) {
    allColumns = generateColumns(aggregatedCommitments, recipes, agents);
  }

  function generateColumns(aggregatedCommitments: any[]): any[] {
    // calculate how much of each resource exists per stage
    let resourceInventory: any = {}
    economicResources?.forEach(it => {
      let resourceComboId = it.conformsTo?.id.concat('____').concat(it.stage?.id)
      if (resourceComboId) {
        let onhandQuantity = it.onhandQuantity?.hasNumericalValue
        let existingQuantity = resourceInventory[resourceComboId]
        resourceInventory[resourceComboId] = existingQuantity
          ? existingQuantity + onhandQuantity
          : onhandQuantity
      }
    })
    console.log("resourceInventory", resourceInventory, economicResources)
    
    // subtract inventory from commitments
    function subtractInventory(processes: any[]): any[] {
      // console.log("subtracting inventory", processes, resourceInventory)
      return processes.map((process: any) => {
      return {
        ...process,
        committedInputs: process.committedInputs.map((input: any) => {
        if (!input.stage?.id) {
          return input
        }
        
        // console.log("STAGE", input)
        const resourceComboId = input.resourceConformsTo?.id.concat('____').concat(input.stage?.id)
        // console.log("resourceComboId B", resourceComboId)
        const inventory = resourceInventory[resourceComboId] || new Decimal(0)
        // console.log("inventory", inventory.toString())
        const newQuantity = Decimal.max(new Decimal(input.resourceQuantity?.hasNumericalValue).sub(inventory), new Decimal(0))
        // console.log("new quantity", input.resourceConformsTo?.name, input.stage?.name, newQuantity.toString(), inventory.toString(), input.resourceQuantity?.hasNumericalValue)
        // remove subtracted quantity from inventory as well
        resourceInventory[resourceComboId] = Decimal.max(new Decimal(inventory).sub(input.resourceQuantity?.hasNumericalValue), new Decimal(0))
        // console.log("subtracting inventory", resourceComboId, input.resourceConformsTo?.name, resourceInventory[resourceComboId]?.toString(), inventory, input.resourceQuantity?.hasNumericalValue, resourceInventory[resourceComboId]?.toString())
        // console.log("updated inventory", resourceInventory[resourceComboId].toNumber(), newQuantity.toString())

        return {
          ...input,
          resourceQuantity: {
          ...input.resourceQuantity,
          hasNumericalValue: newQuantity.toString()
          }
        }
        })
        .filter((input: any) => input.resourceQuantity.hasNumericalValue > 0),
      }
      })
    }

    // create first column
    let previousProcesses = previousColumn(aggregatedCommitments)
    
    // plan backwards
    let count = 0
    let allColumnsLocal: any[] = []
    while (previousProcesses.length != 0 && count < 20) {
      count++
      allColumnsLocal = [previousProcesses, ...allColumnsLocal]
      previousProcesses = subtractInventory(cloneDeep(previousProcesses))
      console.log("subtracted inventory", previousProcesses[0]?.committedInputs)
      previousProcesses = previousColumn(
        previousProcesses
          .flatMap((it: any) => it.committedInputs)
          .reduce((acc: any[], process: any) => {
            return [...acc, process]
          }, [])
      )
    }
    return allColumnsLocal
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
          receiver: event.detail.commitment.receiverId ? agents.find(it => it.id == event.detail.commitment.receiverId) : undefined
        }
        
        let exchange = findExchange(event.detail.commitment, allColumns[commitmentModalColumn][commitmentModalProcess].basedOn.name, recipeExchanges)
        let agreement = makeAgreement(event.detail.commitment, exchange, offers, agents)
        updatedCommitment.agreement = agreement

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
        event.detail.commitment.receiver = agents.find(it => it.id == event.detail.commitment.receiverId)
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
                receiverId: agents.find(agent => agent.id == hashChanges[it.receiverId]),
                // resourceConformsTo: resourceSpecifications.find(spec => spec.id == hashChanges[it.resourceConformsTo.id]),
              }
            })
            allColumns = event.detail.allColumns
            // change the providerId to the new hash in each column
            allColumns = allColumns.map(column => {
              return column.map(process => {
                return {
                  ...process,
                  committedInputs: process.committedInputs.map(it => {
                    return {
                      ...it,
                      providerId: hashChanges[it.providerId]
                    }
                  }),
                  committedOutputs: process.committedOutputs.map(it => {
                    return {
                      ...it,
                      providerId: hashChanges[it.providerId]
                    }
                  })
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
            {#each proposalsList as { publishes }}
              {@const reciprocal = publishes?.find(it => it.reciprocal)}
              {@const primary = publishes?.find(it => !it.reciprocal)}
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
                      {/if}
                      {reciprocal?.publishes?.resourceQuantity?.hasNumericalValue}
                      {reciprocal?.publishes?.resourceConformsTo?.name} per {primary?.publishes?.resourceQuantity?.hasNumericalValue} {primary?.publishes?.resourceQuantity?.hasUnit?.label}
                    </p>
                  {:else}
                    <p>
                      {reciprocal?.publishes?.resourceQuantity?.hasNumericalValue}
                      {reciprocal?.publishes?.resourceConformsTo?.name} per {primary?.publishes?.resourceQuantity?.hasNumericalValue}  {primary?.publishes?.resourceQuantity?.hasUnit?.label}
                    </p>
                  {/if}
                  <p>from {primary?.publishes?.provider?.name}</p>
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
                  on:click={() => (commitments = createCommitments(requests))}
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
                        receiverId: agents.find(agent => agent.id == hashChanges[it.receiverId]),
                        // resourceConformsTo: resourceSpecifications.find(spec => spec.id == hashChanges[it.resourceConformsTo.id]),
                      }
                    })
                    allColumns = event.detail.allColumns
                    // change the providerId to the new hash in each column
                    allColumns = allColumns.map(column => {
                      return column.map(process => {
                        return {
                          ...process,
                          committedInputs: process.committedInputs.map(it => {
                            return {
                              ...it,
                              providerId: hashChanges[it.providerId]
                            }
                          }),
                          committedOutputs: process.committedOutputs.map(it => {
                            return {
                              ...it,
                              providerId: hashChanges[it.providerId]
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
              {@const receiver = c.receiverId ? agents.find(it => it.id == c.receiverId) : c.receiver}
              {@const provider = c.providerId ? agents.find(it => it.id == c.providerId) : c.provider}
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
                    {primary?.publishes?.resourceQuantity?.hasUnit?.label}
                  </p>
                  <p>to {primary?.publishes?.receiver?.name}</p>
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
