<script lang="ts">
  import { gql } from 'graphql-tag'
  import { createEventDispatcher } from 'svelte';
  import { mutation, query } from 'svelte-apollo'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation';
  import type { ReadableQuery } from 'svelte-apollo'
  import type { Unit, UnitConnection } from '@leosprograms/vf-graphql'
  import recipes from '$lib/data/recipes-with-exchanges.json'
  import { createRecipeProcess, createRecipeExchange, createRecipeFlow, createFacetGroup } from '../crud/commit';
  import { getAllFacetGroups, getAllProcessSpecifications, getAllResourceSpecifications, getAllActions, getAllUnits } from '../crud/fetch';
  import { allProcessSpecifications, allResourceSpecifications, allActions, allUnits, allFacets, allFacetGroups } from '../crud/store'
  import { get } from 'svelte/store'

  let processSpecifications: any[] = []
  allProcessSpecifications.subscribe(value => {
    processSpecifications = value
  })
  let resourceSpecifications: any[] = []
  allResourceSpecifications.subscribe(value => {
    resourceSpecifications = value
  })
  let actions: any[] = []
  allActions.subscribe(value => {
    actions = value
  })
  let units: any[] = []
  allUnits.subscribe(value => {
    units = value
  })
 
  let dependenciesOk: boolean | null = null
  let error: Error | null = null
  let saving = false

  async function addRecipes() {
    await getAllProcessSpecifications()
    await getAllResourceSpecifications()
    await getAllActions()
    await getAllUnits()

    // add all recipes and recipe exchanges
    let initialProcessSpecificationId = processSpecifications.find(p => p.name === "Initial")?.id
    for (let r of recipes) {
      if (r.type == "recipe_process") {
        // console.log(r)
        // console.log(processSpecifications)
        let rProcRes = await createRecipeProcess({
          name: r.name,
          processConformsTo: processSpecifications.find(p => p.name === r.process_conforms_to.name)?.id,
        })
        for (let i of r.has_recipe_input) {
          console.log(i)
          let rFlowInput = {
            note: "asdf",
            recipeInputOf: rProcRes.data?.createRecipeProcess.recipeProcess.id,
            resourceConformsTo: resourceSpecifications.find(rs => rs.name === i.resourceConformsTo.name)?.id,
            action: actions.find(a => a.label === i.action.label.replaceAll("_", "-")).id,
            providerRole: i.provider_role,
            receiverRole: i.receiver_role,
            instructions: i.instructions,
            resourceQuantity: {
              hasNumericalValue: Number(i.resourceQuantity.hasNumericalValue),
              hasUnit: units.find(u => u.label === i.resourceQuantity.hasUnit.label)?.id,
            },
          }
          let stageId = processSpecifications.find(p => p.name === i.stage?.name)?.id
          if (stageId) {
            rFlowInput.stage = stageId
          }
          console.log(rFlowInput)
          let rFlowRes = await createRecipeFlow(rFlowInput)
        }
        for (let o of r.has_recipe_output) {
          console.log(o)
          let rFlowOutput = {
            note: "asdf",
            recipeOutputOf: rProcRes.data?.createRecipeProcess.recipeProcess.id,
            resourceConformsTo: resourceSpecifications.find(rs => rs.name === o.resourceConformsTo.name)?.id,
            action: actions.find(a => a.label === o.action.label.replaceAll("_", "-")).id,
            providerRole: o.provider_role,
            receiverRole: o.receiver_role,
            instructions: o.instructions,
            resourceQuantity: {
              hasNumericalValue: Number(o.resourceQuantity.hasNumericalValue),
              hasUnit: units.find(u => u.label === o.resourceQuantity.hasUnit.label)?.id,
            },
          }
          let stageId = processSpecifications.find(p => p.name === o.stage?.name)?.id
          if (stageId) {
            rFlowOutput.stage = stageId
          }
          console.log(rFlowOutput)
          let rFlowRes = await createRecipeFlow(rFlowOutput)
        }
      } else if (r.type == "recipe_exchange") {
        console.log(r)
        let rRespEx = await createRecipeExchange({
          name: r.name
        })
        for (let i of r.has_recipe_clause) {
          let rFlowInput = {
            note: "",
            recipeClauseOf: rRespEx.data?.createRecipeExchange.recipeExchange.id,
            resourceConformsTo: resourceSpecifications.find(rs => rs.name === i.resourceConformsTo.name)?.id,
            action: actions.find(a => a.label === i.action.label.replaceAll("_", "-")).id,
            providerRole: i.provider_role,
            receiverRole: i.receiver_role,
            resourceQuantity: {
              hasNumericalValue: Number(i.resourceQuantity.hasNumericalValue),
              hasUnit: units.find(u => u.label === i.resourceQuantity.hasUnit.label)?.id,
            },
          }
          let stageId = processSpecifications.find(p => p.name === i.stage?.name)?.id
          if (stageId) {
            rFlowInput.stage = stageId
          }
          console.log(rFlowInput)
          let rFlowRes = await createRecipeFlow(rFlowInput)
        }
        for (let o of r.has_recipe_reciprocal_clause) {
          let rFlowOutput = {
            note: "",
            recipeReciprocalClauseOf: rRespEx.data?.createRecipeExchange.recipeExchange.id,
            resourceConformsTo: resourceSpecifications.find(rs => rs.name === o.resourceConformsTo.name)?.id,
            action: actions.find(a => a.label === o.action.label.replaceAll("_", "-")).id,
            providerRole: o.provider_role,
            receiverRole: o.receiver_role,
            resourceQuantity: {
              hasNumericalValue: Number(o.resourceQuantity.hasNumericalValue),
              hasUnit: units.find(u => u.label === o.resourceQuantity.hasUnit.label)?.id,
            },
          }
          let stageId = processSpecifications.find(p => p.name === o.stage?.name)?.id
          if (stageId) {
            rFlowOutput.stage = stageId
          }
          console.log(rFlowOutput)
          let rFlowRes = await createRecipeFlow(rFlowOutput)
        }
      }
    }
  }

  // :NOTE: assumes that FacetGroups & ResourceSpecification are not yet created if Units aren't
  async function runInitialization() {
    if (saving) return
    saving = true
    let units: Unit[] = []
    try {
      await createFacetGroup({
        name: "Agent",
        note: "All facet classifications relevant to Agent records.",
      })
      await createFacetGroup({
        name: "Resource Specification",
        note: "All facet classifications relevant to types of resources.",
      })
      
        // await initData({ variables: {
        //   g1: {
        //     name: "Agent",
        //     note: "All facet classifications relevant to Agent records.",
        //   },
        //   g2: {
        //     name: "Resource Specification",
        //     note: "All facet classifications relevant to types of resources.",
        //   }
        // }})
        // console.log("GO TO EXPORT")
        goto("export")

        // await getAllProcessSpecifications()
        // await getAllResourceSpecifications()
        // await getAllActions()
        // await getAllUnits()
        // await addRecipes()
      // }
      
    } catch(e) {
      error = e as Error
      console.log(e)
    }
    dependenciesOk = get(allFacetGroups).length > 0//units.length > 0
    checkDependencies()
    saving = false
    return units
  }

  async function checkDependencies() {
    // const res = await getUnits.refetch()
    // let units = flattenRelayConnection(res.data?.units)
    // dependenciesOk = units.length > 0
    await getAllFacetGroups()
    console.log("all facets", get(allFacets))
    dependenciesOk = get(allFacetGroups).length > 0
  }

  onMount(checkDependencies)
  // dependenciesOk = false
</script>

<!-- <button on:click={addRecipes}>RECIPES</button> -->
{#if dependenciesOk === true}
  <slot></slot>
{:else}
<div class="p-12">
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
  
  {#if error}
    <h1 class="text-base font-semibold leading-6 text-gray-900">Error initializing shared data.</h1>
    <p class="mt-2 text-sm text-gray-700">The operation may have timed out. Try freeing up some system resources and restart the app.</p>
  {:else if dependenciesOk === false}
    <h1 class="text-base font-semibold leading-6 text-gray-900">New network detected!</h1>
    <p class="mt-2 text-sm text-gray-700">It looks like you need to initialize some shared data.</p>
    <br />
    <p class="mt-2 text-sm text-gray-700">
      <strong>If somebody else invited you to this network:</strong><br />
      ensure the person who invited you is online and wait for their node to sync with yours. You can check the sync status in the Holochain app store.<br />
      When ready, <button class="px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2" on:click={checkDependencies}>click here</button> to check again.
    </p>
    <br />
    <p class="mt-2 text-sm text-gray-700">
      <strong>If you are the person setting up this network:</strong><br />
      please <button class="px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2" on:click={runInitialization}>click here</button> to create these records.
    </p>
  {:else}
    <h1 class="text-base font-semibold leading-6 text-gray-900">Checking shared data&hellip;</h1>
    <p class="mt-2 text-sm text-gray-700">(This may take a while the first time the app is opened.)</p>
  {/if}

    </div>
  </div>
</div>

{/if}
