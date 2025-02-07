import { addToFullPlans, setActions, clientStored, clientHC, setAgents, updateAnAgent, setUnits, setResourceSpecifications, setProcessSpecifications, setProposals, setRecipes, setRecipeExchanges, 
  setHashChanges, setEconomicEvents, setEconomicResources, updateProcessInPlan, setFulfillments, setCommitments, setAgreements, addNonProcessCommitmentsToPlan, setPlansList, setFacetGroups,
  allFacets} from './store'
import * as s from './store'
import { WeaveClient, isWeContext, initializeHotReload, type WAL} from '@lightningrodlabs/we-applet';
import { appletServices } from '../../we';
import { decode, encode } from '@msgpack/msgpack';
import { decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client'
import { formatResItem, snakeToCamel, camelToSnake, encodeHashFields, pull, realizeLinks, fetchSet } from './shared'
import { cloneDeep } from "lodash";
import { get, type Readable } from 'svelte/store';

let client: any;
clientStored.subscribe(value => {
  client = value;
});

let client0: any;
clientHC.subscribe(value => {
  client0 = value;
});


// define type
type HashChange = {
  original: string,
  current: string
}

const plurals = {
  'agent': 'agents',
  'unit': 'units',
  'resource_specification': 'resource_specifications',
  'process_specification': 'process_specifications',
  'proposal': 'proposals',
  'action': 'actions',
  'commitment': 'commitments',
  'agreement': 'agreements',
  'fulfillment': 'fulfillments',
  'economic_event': 'economic_events',
  'economic_resource': 'economic_resources',
  'plan': 'plans',
  'recipe_process': 'recipe_processes',
  'recipe_exchange': 'recipe_exchanges'
}

export async function getAllHashChanges() {
  if (isWeContext()) {
      let weClient = await WeaveClient.connect(appletServices);
      let res = await weClient.renderInfo.appletClient.callZome({
          cap_secret: null,
          role_name: 'migration',
          zome_name: 'migrate',
          fn_name: 'get_all_hash_changes',
          payload: null,
      })
      let hashMap = {}
      for (let i = 0; i < res.length; i++) {
      // criterion = decode((record.entry as any).Present.entry) as Criterion;
        let decoded = decode((res[i].entry as any).Present.entry) as HashChange
          hashMap[decoded.original] = decoded.current
      }
      setHashChanges(hashMap)
  } else {
    client0.callZome({
      cap_secret: null,
      role_name: 'migration',
      zome_name: 'migrate',
      fn_name: 'get_all_hash_changes',
      payload: null,
    }).then(res => {
      let hashMap = {}
      for (let i = 0; i < res.length; i++) {
        let decoded = decode((res[i].entry as any).Present.entry) as HashChange
        hashMap[decoded.original] = decoded.current
      }
      setHashChanges(hashMap)
    })
  }
}

export const getAllAgents = async () => {
  let agents = await fetchSet('rea_agent', 'agents')
  // const facetRes = await getAllFacetGroups()
  console.log("agents res", agents)
  for (let i = 0; i < agents.length; i++) {
    console.log("fetch facets", agents[i].id)
    let fs = await client0.callZome({
      cap_secret: null,
      role_name: 'hrea_facets_0',
      zome_name: 'hc_facets',
      fn_name: 'retrieve_facet_values',
      payload: { 'identifier': agents[i].id },
    })
    console.log("facet values", fs)
    agents[i].facets = []
    for (let j = 0; j < fs.length; j++) {
      const formatted = {
        facetId: encodeHashToBase64(fs[j].facetId),
        id: encodeHashToBase64(fs[j].id),
        note: fs[j].note,
        revisionId: encodeHashToBase64(fs[j].revisionId),
        value: fs[j].value
      }
      agents[i].facets.push(formatted)
      console.log("agent with facets", agents[i].facets)
    }
  }
  setAgents(agents)
  return agents

  // const res = await client.query({
  //   query: GET_ALL_AGENTS,
  //   fetchPolicy: 'no-cache'
  // })
  // setAgents(res.data.agents.edges.map((edge: any) => edge.node))
  // return res
}

// export const getAgent = async (id: string) => {
//   let t = {
//     query: GET_ORGANIZATION,
//     variables: {
//       id
//     },
//     fetchPolicy: 'no-cache'
//   }
//   const res = await client.query(t)
//   updateAnAgent(res.data.organization)
//   return res
// }

// const GET_FACET_GROUPS = gql`
// ${FACET_GROUP_CORE_FIELDS}
// query GetFacets {
//   facetGroups {
//     ...FacetGroupCoreFields
//   }
// }
// `

export const getAllFacetGroups = async () => {
  let groups = await pull('get_facet_groups', null, "hrea_facets_0", "hc_facets")
  for (let i = 0; i < groups.length; i++) {
    groups[i] = encodeHashFields(groups[i])
    console.log("fetching facet options", groups[i].id)
    let facetOptions = await pull('get_facet_options_for_facet_group', {facet_group_hash: groups[i].id}, "hrea_facets_0", "hc_facets")
    console.log("facet options", facetOptions)
    for (let j = 0; j < facetOptions.length; j++) {
      facetOptions[j] = encodeHashFields(facetOptions[j])
      let facetValues = await pull('get_facet_values_for_facet_option', {facet_option_hash: facetOptions[j].id}, "hrea_facets_0", "hc_facets")
      facetValues = facetValues.map((fv: any) => {
        return encodeHashFields(fv)
      })
      facetOptions[j].facetValues = facetValues
    }
    groups[i].facetOptions = facetOptions
  }
  console.log(groups)
  setFacetGroups(groups)
  return groups

  // const res = await client.query({
  //   query: GET_FACET_GROUPS,
  //   fetchPolicy: 'no-cache'
  // })
  // console.log("facet groups", res)
  // allFacets.update(v => res.data.facetGroups)
  // return res
}

export const getAllUnits = async () => {
  const res = await fetchSet('rea_unit', 'units')
  setUnits(res)
}

export const getAllResourceSpecifications = async () => {
  await ensure(['unit'])
  let res = await fetchSet('rea_resource_specification', 'resource_specifications')
  // add facets
  for (let i = 0; i < res.length; i++) {
    console.log("fetch facets", res[i].id)
    let fs = await client0.callZome({
      cap_secret: null,
      role_name: 'hrea_facets_0',
      zome_name: 'hc_facets',
      fn_name: 'retrieve_facet_values',
      payload: { 'identifier': res[i].id },
    })
    console.log("facet values", fs)
    res[i].facets = []
    for (let j = 0; j < fs.length; j++) {
      const formatted = {
        facetId: encodeHashToBase64(fs[j].facetId),
        id: encodeHashToBase64(fs[j].id),
        note: fs[j].note,
        revisionId: encodeHashToBase64(fs[j].revisionId),
        value: fs[j].value
      }
      res[i].facets.push(formatted)
      console.log("resource with facets", res[i].facets)
    }
  }
  setResourceSpecifications(res)
  return res
}

export const getAllProcessSpecifications = async () => {
  const res = await pull('get_all_process_specifications', null)
  console.log("process specs", res)
  const res2 = await realizeLinks('get_latest_rea_process_specification', res)
  console.log("process specs", res2)
  setProcessSpecifications(res2)
  return res2
}

export const getAllProposals = async () => {
  await ensure(['unit', 'action', 'resourceSpecification', 'agent'])
  const res = await fetchSet('rea_proposal', 'proposals')
  // console.log("proposals", res)
  for (let i = 0; i < res.length; i++) {
    const proposedIntents = await pull('get_rea_proposed_intents_for_rea_proposal', decodeHashFromBase64(res[i].id))
    // console.log("proposed intents", proposedIntents)
    res[i].publishes = await realizeLinks('get_latest_rea_proposed_intent', proposedIntents)
    // for each publishes
    for (let j = 0; j < res[i].publishes.length; j++) {
      const resIntentId = res[i].publishes[j].publishes
      const resIntent = await pull('get_latest_rea_intent', resIntentId)
      // console.log("publishes 1", resIntent)
      res[i].publishes[j].publishes = formatResItem(resIntent, resIntentId)
      // console.log("publishes 2", res[i].publishes[j].publishes)
    }
  }
  setProposals(res)
  return res
}

export const getAllActions = async () => {
  const res = await pull('get_all_actions', null)
  console.log("actions", res)
  setActions(res)
  return res
}

export const getAllCommitments = async () => {
  const res = await fetchSet('rea_commitment', 'commitments')
  setCommitments(res)
  return res
}

export const getAllAgreements = async () => {
  let res = await fetchSet('rea_agreement', 'agreements')
  console.log("all agreements", res)

  for (let i = 0; i < res.length; i++) {
    const commitmentLinks = await pull('get_rea_commitments_for_rea_agreement', decodeHashFromBase64(res[i].id))
    res[i].commitments = await realizeLinks('get_latest_rea_commitment', commitmentLinks)
  }
  setAgreements(res)
}

export const getFulfillments = async () => {
  const res = await fetchSet('rea_fulfillment', 'fulfillments')
  console.log("fulfillments", res)
  setFulfillments(res)
  return res
}

export const getAllEconomicEvents = async () => {
  await getFulfillments()
  const res = await fetchSet('rea_economic_event', 'economic_events')
  console.log("economic events", res)
  setEconomicEvents(res)
  return res
}

export const getAllEconomicResources = async () => {
  const res = await fetchSet('rea_economic_resource', 'economic_resources')
  setEconomicResources(res)
  return res
}

export const getPlan = async (id: string) => {
  await getAllAgreements()

  console.log('getting plan', id)
  let plan = await pull('get_latest_rea_plan', id)
  console.log("got plan", plan)
  plan = formatResItem(plan, decodeHashFromBase64(id))
  console.log("plan", plan)
  const processLinks = await pull('get_rea_processes_for_rea_plan', id)
  console.log("processes", processLinks)
  plan.processes = await realizeLinks('get_latest_rea_process', processLinks)
  console.log("plan", plan)
  // get independent demands
  const independentDemandLinks = await pull('get_independent_demands_for_rea_plan', id)
  plan.independentDemands = await realizeLinks('get_latest_rea_commitment', independentDemandLinks)
  // get non-process commitments
  const nonProcessCommitmentLinks = await pull('get_rea_commitments_for_rea_plan', id)
  plan.nonProcessCommitments = await realizeLinks('get_latest_rea_commitment', nonProcessCommitmentLinks)

  // add fulfillments to commitments
  for (let i = 0; i < plan.nonProcessCommitments.length; i++) {
    const fulfillmentLinks = await pull('get_rea_fulfillments_for_rea_commitment', decodeHashFromBase64(plan.nonProcessCommitments[i].id))
    let fulfillments = await realizeLinks('get_latest_rea_fulfillment', fulfillmentLinks)

    for (let j = 0; j < fulfillments.length; j++) {
      if (fulfillments[j].fulfilledBy) {
        const event = formatResItem( await pull('get_latest_rea_economic_event', fulfillments[j].fulfilledBy), fulfillments[j].fulfilledBy )
        fulfillments[j].fulfilledBy = event
      }
    }

    // add clauseof commitments
    if (plan.nonProcessCommitments[i].clauseOfId) {
      const agreementCommitmentLinks = await pull('get_rea_commitments_for_rea_agreement', decodeHashFromBase64(plan.nonProcessCommitments[i].clauseOfId))
      const agreementCommitments = await realizeLinks('get_latest_rea_commitment', agreementCommitmentLinks)

      // add fulfillments to clauseof commitments
      for (let j = 0; j < agreementCommitments.length; j++) {
        const fulfillmentLinks = await pull('get_rea_fulfillments_for_rea_commitment', decodeHashFromBase64(agreementCommitments[j].id))
        let fulfillments = await realizeLinks('get_latest_rea_fulfillment', fulfillmentLinks)
        for (let k = 0; k < fulfillments.length; k++) {
          if (fulfillments[k].fulfilledBy) {
            const event = formatResItem( await pull('get_latest_rea_economic_event', fulfillments[k].fulfilledBy), fulfillments[k].fulfilledBy )
            fulfillments[k].fulfilledBy = event
          }
        }
        agreementCommitments[j].fulfilledBy = fulfillments
      }

      plan.nonProcessCommitments[i].clauseOf.commitments = agreementCommitments
    }

    plan.nonProcessCommitments[i].fulfilledBy = fulfillments
  }
  // for each process, assign committedInputs and committedOutputs
  for (let i = 0; i < plan.processes.length; i++) {
    const committedInputLinks = await pull('get_inputs_for_rea_process', decodeHashFromBase64(plan.processes[i].id))
    // find matching ids from nonProcessCommitments
    let committedInputs = []
    for (let j = 0; j < committedInputLinks.length; j++) {
      for (let k = 0; k < plan.nonProcessCommitments.length; k++) {
        if (encodeHashToBase64(committedInputLinks[j].target) === plan.nonProcessCommitments[k].id) {
          let com = cloneDeep(plan.nonProcessCommitments[k])
          committedInputs.push(com)
        }
      }
    }
    plan.processes[i].committedInputs = committedInputs

    const committedOutputLinks = await pull('get_outputs_for_rea_process', decodeHashFromBase64(plan.processes[i].id))
    let committedOutputs = []
    for (let j = 0; j < committedOutputLinks.length; j++) {
      for (let k = 0; k < plan.nonProcessCommitments.length; k++) {
        if (encodeHashToBase64(committedOutputLinks[j].target) === plan.nonProcessCommitments[k].id) {
          let com = cloneDeep(plan.nonProcessCommitments[k])
          committedOutputs.push(com)
        }
      }
    }
    plan.processes[i].committedOutputs = committedOutputs
  }
  console.log("plan", plan)
  addToFullPlans(plan)
  return plan
}

export const getAllPlans = async () => {
  const res = await fetchSet('rea_plan', 'plans')
  setPlansList(res)
  return res
}

export const getAllFullPlans = async () => {
  const res = await fetchSet('rea_plan', 'plans')
  console.log("full plans", res)
  for (let i = 0; i < res.length; i++) {
    const processLinks = await pull('get_rea_processes_for_rea_plan', decodeHashFromBase64(res[i].id))
    res[i].processes = await realizeLinks('get_latest_rea_process', processLinks)
    // get independent demands
    const independentDemandLinks = await pull('get_independent_demands_for_rea_plan', decodeHashFromBase64(res[i].id))
    res[i].independentDemands = await realizeLinks('get_latest_rea_commitment', independentDemandLinks)
    // get non-process commitments
    const nonProcessCommitmentLinks = await pull('get_rea_commitments_for_rea_plan', decodeHashFromBase64(res[i].id))
    res[i].nonProcessCommitments = await realizeLinks('get_latest_rea_commitment', nonProcessCommitmentLinks)

    // add fulfillments to commitments
    for (let j = 0; j < res[i].nonProcessCommitments.length; j++) {
      const fulfillmentLinks = await pull('get_rea_fulfillments_for_rea_commitment', decodeHashFromBase64(res[i].nonProcessCommitments[j].id))
      let fulfillments = await realizeLinks('get_latest_rea_fulfillment', fulfillmentLinks)

      for (let k = 0; k < fulfillments.length; k++) {
        if (fulfillments[k].fulfilledBy) {
          const event = formatResItem( await pull('get_latest_rea_economic_event', fulfillments[k].fulfilledBy), fulfillments[k].fulfilledBy )
          fulfillments[k].fulfilledBy = event
        }
      }

      // add clauseof commitments
      if (res[i].nonProcessCommitments[j].clauseOfId) {
        const agreementCommitmentLinks = await pull('get_rea_commitments_for_rea_agreement', decodeHashFromBase64(res[i].nonProcessCommitments[j].clauseOfId))
        const agreementCommitments = await realizeLinks('get_latest_rea_commitment', agreementCommitmentLinks)

        // add fulfillments to clauseof commitments
        for (let k = 0; k < agreementCommitments.length; k++) {
          const fulfillmentLinks = await pull('get_rea_fulfillments_for_rea_commitment', decodeHashFromBase64(agreementCommitments[k
          ].id))
          let fulfillments = await realizeLinks('get_latest_rea_fulfillment', fulfillmentLinks)
          for (let l = 0; l < fulfillments.length; l++) {
            if (fulfillments[l].fulfilledBy) {
              const event = formatResItem( await pull('get_latest_rea_economic_event', fulfillments[l].fulfilledBy), fulfillments[l].fulfilledBy )
              fulfillments[l].fulfilledBy = event
            }
          }
          agreementCommitments[k].fulfilledBy = fulfillments
        }

        res[i].nonProcessCommitments[j].clauseOf.commitments = agreementCommitments
      }

      res[i].nonProcessCommitments[j].fulfilledBy = fulfillments
    }

    // for each process, assign committedInputs and committedOutputs
    for (let j = 0; j < res[i].processes.length; j++) {
      const committedInputLinks = await pull('get_inputs_for_rea_process', decodeHashFromBase64(res[i].processes[j].id))
      // find matching ids from nonProcessCommitments
      let committedInputs = []
      for (let k = 0; k < committedInputLinks.length; k++) {
        for (let l = 0; l < res[i].nonProcessCommitments.length; l++) {
          if (encodeHashToBase64(committedInputLinks[k].target) === res[i].nonProcessCommitments[l].id) {
            let com = cloneDeep(res[i].nonProcessCommitments[l])
            committedInputs.push(com)
          }
        }
      }
      res[i].processes[j].committedInputs = committedInputs

      const committedOutputLinks = await pull('get_outputs_for_rea_process', decodeHashFromBase64(res[i].processes[j].id))
      let committedOutputs = []
      for (let k = 0; k < committedOutputLinks.length; k++) {
        for (let l = 0; l < res[i].nonProcessCommitments.length; l++) {
          if (encodeHashToBase64(committedOutputLinks[k].target) === res[i].nonProcessCommitments[l].id) {
            let com = cloneDeep(res[i].nonProcessCommitments[l])
            committedOutputs.push(com)
          }
        }
      }
      res[i].processes[j].committedOutputs = committedOutputs
    }
  }
  setPlansList(res)
  return res
}

// export const getNonProcessCommitments = async (id: string) => {
  // const res = await client.query({
  //   query: GET_NON_PROCESS_COMMITMENTS,
  //   variables: {
  //     id
  //   },
  //   fetchPolicy: 'no-cache'
  // })
  // addNonProcessCommitmentsToPlan(id, res.data.plan.nonProcessCommitments)
  // return res.data.plan.nonProcessCommitments
// }

// export const getSimplifiedPlan = async (id: string) => {
//   return await client.query({
//     query: GET_SIMPLIFIED_PLAN,
//     variables: {
//       id
//     },
//     fetchPolicy: 'no-cache'
//   })
// }

export const getProcess = async (id: string) => {
  let process = formatResItem(await pull('get_latest_rea_recipe_process', id), decodeHashFromBase64(id))
  const committedInputLinks = await pull('get_inputs_for_rea_process', decodeHashFromBase64(id))
  process.committedInputs = await realizeLinks('get_latest_rea_commitment', committedInputLinks)
  const committedOutputLinks = await pull('get_outputs_for_rea_process', decodeHashFromBase64(id))
  process.committedOutputs = await realizeLinks('get_latest_rea_commitment', committedOutputLinks)

  const enrichCommitments = async (commitments: any[]) => {
    for (let i = 0; i < commitments.length; i++) {
      const fulfillmentLinks = await pull('get_rea_fulfillments_for_rea_commitment', decodeHashFromBase64(commitments[i].id))
      let fulfillments = await realizeLinks('get_latest_rea_fulfillment', fulfillmentLinks)
      for (let i = 0; i < fulfillments.length; i++) {
        if (fulfillments[i].fulfilledBy) {
          const event = formatResItem( await pull('get_latest_rea_economic_event', fulfillments[i].fulfilledBy), fulfillments[i].fulfilledBy )
          fulfillments[i].fulfilledBy = event
        }
      }
      // add clauseof commitments
      if (commitments[i].clauseOfId) {
        const agreementCommitmentLinks = await pull('get_rea_commitments_for_rea_agreement', decodeHashFromBase64(commitments[i].clauseOfId))
        const agreementCommitments = await realizeLinks('get_latest_rea_commitment', agreementCommitmentLinks)

        // add fulfillments to clauseof commitments
        for (let j = 0; j < agreementCommitments.length; j++) {
          const fulfillmentLinks = await pull('get_rea_fulfillments_for_rea_commitment', decodeHashFromBase64(agreementCommitments[j].id))
          let fulfillments = await realizeLinks('get_latest_rea_fulfillment', fulfillmentLinks)
          for (let k = 0; k < fulfillments.length; k++) {
            if (fulfillments[k].fulfilledBy) {
              const event = formatResItem( await pull('get_latest_rea_economic_event', fulfillments[k].fulfilledBy), fulfillments[k].fulfilledBy )
              fulfillments[k].fulfilledBy = event
            }
          }
          agreementCommitments[j].fulfilledBy = fulfillments
        }

        commitments[i].clauseOf.commitments = agreementCommitments
      }

      commitments[i].fulfilledBy = fulfillments
    }
  }

  await enrichCommitments(process.committedInputs)
  await enrichCommitments(process.committedOutputs)

  console.log("0000====0000==== process", process)

  updateProcessInPlan(process)
}

export const getAllRecipes = async () => {
  const res = await fetchSet('rea_recipe_process', 'recipe_processes')
  console.log("recipes", res)
  for (let i = 0; i < res.length; i++) {
    // res[i] = encodeHashFields(res[i], ['processConformsTo'])
    const recipeOutputLinks = await pull('get_rea_recipe_flow_outputs_for_rea_recipe_process', decodeHashFromBase64(res[i].id))
    res[i].recipeOutputs = await realizeLinks('get_latest_rea_recipe_flow', recipeOutputLinks)
    const recipeInputLinks = await pull('get_rea_recipe_flow_inputs_for_rea_recipe_process', decodeHashFromBase64(res[i].id))
    res[i].recipeInputs = await realizeLinks('get_latest_rea_recipe_flow', recipeInputLinks)
  }
  console.log("recipes 2", res)
  setRecipes(res)
  return res

  // const res = await client.query({
  //   query: GET_ALL_RECIPES,
  //   fetchPolicy: 'no-cache'
  // })
  // let dedupedRecipes = res.data.recipeProcesses.edges.map((edge: any) => edge.node).map((recipe: any) => {
  //   return {
  //     ...recipe,
  //     recipeInputs: recipe.recipeInputs.filter((input: any, index: number, self: any) => self.findIndex((t: any) => t.id === input.id) === index),
  //     recipeOutputs: recipe.recipeOutputs.filter((output: any, index: number, self: any) => self.findIndex((t: any) => t.id === output.id) === index)
  //   }
  // })
  // console.log("recipes", dedupedRecipes)
  // setRecipes(dedupedRecipes)
  // return res
}

export const getAllRecipeExchanges = async () => {
  const res = await fetchSet('rea_recipe_exchange', 'recipe_exchanges')
  console.log("recipe exchanges", res)
  for (let i = 0; i < res.length; i++) {
    const recipeClauseLinks = await pull('get_rea_recipe_clauses_for_rea_recipe_exchange', decodeHashFromBase64(res[i].id))
    res[i].recipeClauses = await realizeLinks('get_latest_rea_recipe_flow', recipeClauseLinks)
    const recipeReciprocalClauseLinks = await pull('get_rea_recipe_reciprocal_clauses_for_rea_recipe_exchange', decodeHashFromBase64(res[i].id))
    res[i].recipeReciprocalClauses = await realizeLinks('get_latest_rea_recipe_flow', recipeReciprocalClauseLinks)
  }
  console.log("recipe exchanges 2", res)
  setRecipeExchanges(res)
  return res

  // const res = await client.query({
  //   query: GET_ALL_RECIPE_EXCHANGES,
  //   fetchPolicy: 'no-cache'
  // })
  // let dedupedRecipeExchanges = res.data.recipeExchanges.edges.map((edge: any) => edge.node).map((recipeExchange: any) => {
  //   return {
  //     ...recipeExchange,
  //     recipeClauses: recipeExchange.recipeClauses.filter((clause: any, index: number, self: any) => self.findIndex((t: any) => t.id === clause.id) === index),
  //     recipeReciprocalClauses: recipeExchange.recipeReciprocalClauses.filter((reciprocalClause: any, index: number, self: any) => self.findIndex((t: any) => t.id === reciprocalClause.id) === index)
  //   }
  // })
  // setRecipeExchanges(dedupedRecipeExchanges)
}

const fetchFuncs = {
  'agent': getAllAgents,
  'unit': getAllUnits,
  'resourceSpecification': getAllResourceSpecifications,
  'processSpecification': getAllProcessSpecifications,
  'proposal': getAllProposals,
  'action': getAllActions,
  'commitment': getAllCommitments,
  'agreement': getAllAgreements,
  'fulfillment': getFulfillments,
  'economicEvent': getAllEconomicEvents,
  'economicResource': getAllEconomicResources,
  'plan': getAllPlans,
  'recipeProcess': getAllRecipes,
  'recipeExchange': getAllRecipeExchanges
}

const stores = {
  'agent': s.allAgents,
  'unit': s.allUnits,
  'resourceSpecification': s.allResourceSpecifications,
  'processSpecification': s.allProcessSpecifications,
  'proposal': s.allProposals,
  'action': s.allActions,
  'commitment': s.allCommitments,
  'agreement': s.allAgreements,
  'fulfillment': s.allFulfillments,
  'economicEvent': s.allEconomicEvents,
  'economicResource': s.allEconomicResources,
  'plan': s.plansList,
  'recipeProcess': s.allRecipes,
  'recipeExchange': s.allRecipeExchanges
}

export async function ensure(entryTypes: (keyof typeof stores)[]) {
  // for each entry type, check if it exists in the store, and if not, fetch it
  for (let i = 0; i < entryTypes.length; i++) {
    let store: any[] = get(stores[entryTypes[i]]);
    if (!store || store.length === 0) {
      await fetchFuncs[entryTypes[i] as keyof typeof fetchFuncs]();
    }
  }
}
    