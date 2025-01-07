import { gql } from 'graphql-tag'
import type { AgentConnection, Agent, Organization, OrganizationCreateParams, OrganizationUpdateParams } from '@leosprograms/vf-graphql'
import { FULFILLMENT_CORE_FIELDS } from '$lib/graphql/fulfillment_fragments'
import { AGREEMENT_CORE_FIELDS } from '$lib/graphql/agreement.fragments'
import { AGENT_CORE_FIELDS, PERSON_CORE_FIELDS, ORGANIZATION_CORE_FIELDS } from '$lib/graphql/agent.fragments'
import { FACET_GROUP_CORE_FIELDS, FACET_VALUE_CORE_FIELDS } from "$lib/graphql/facet.fragments"
import { PROPOSAL_CORE_FIELDS, INTENT_CORE_FIELDS, PROPOSED_INTENT_CORE_FIELDS, PROPOSAL_RETURN_FIELDS } from '$lib/graphql/proposal.fragments'
import { COMMITMENT_RETURN_FIELDS, NON_PROCESS_COMMITMENT_RETURN_FIELDS, PLAN_RETURN_FIELDS, PROCESS_RETURN_FIELDS, SIMPLIFIED_PLAN_RETURN_FIELDS } from '$lib/graphql/plan.fragments'
import { ECONOMIC_EVENT_RETURN_FIELDS } from '$lib/graphql/economic_events.fragments'
import { ECONOMIC_RESOURCE_RETURN_FIELDS } from '$lib/graphql/economic_resources.fragments'
import { RESOURCE_SPECIFICATION_CORE_FIELDS, UNIT_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
import { PROCESS_SPECIFICATION_CORE_FIELDS } from '$lib/graphql/process_specification.fragments'
import { RECIPE_RETURN_FIELDS, RECIPE_EXCHANGE_RETURN_FIELDS } from '$lib/graphql/recipe.fragments'
import { addToFullPlans, setActions, clientStored, setAgents, updateAnAgent, setUnits, setResourceSpecifications, setProcessSpecifications, setProposals, setRecipes, setRecipeExchanges, 
  setHashChanges, setEconomicEvents, setEconomicResources, updateProcessInPlan, setFulfillments, setCommitments, setAgreements, addNonProcessCommitmentsToPlan, setPlansList, 
  allFacets} from './store'
import { WeaveClient, isWeContext, initializeHotReload, type WAL} from '@lightningrodlabs/we-applet';
import { appletServices } from '../../we';
import { decode } from '@msgpack/msgpack';
import { decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client'

let client: any;
clientStored.subscribe(value => {
  client = value;
});

// define type
type HashChange = {
  original: string,
  current: string
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
  }
}

const GET_ALL_AGENTS = gql`
${AGENT_CORE_FIELDS}
${PERSON_CORE_FIELDS}
${ORGANIZATION_CORE_FIELDS}
${FACET_VALUE_CORE_FIELDS}
query {
  agents(last: 100000) {
    edges {
      cursor
      node {
        ...AgentCoreFields
        ...PersonCoreFields
        ...OrganizationCoreFields
        facets {
          ...FacetValueCoreFields
        }
      }
    }
  }
}
`

const GET_ORGANIZATION = gql`
${AGENT_CORE_FIELDS},
query GetOrganization($id: ID!) {
  organization(id: $id) {
    ...OrganizationCoreFields
  }
}
`

const GET_FACET_GROUPS = gql`
${FACET_GROUP_CORE_FIELDS}
query GetFacets {
  facetGroups {
    ...FacetGroupCoreFields
  }
}
`

// const GET_FACET_VALUES = gql`
// ${FACET_VALUE_CORE_FIELDS}
// query GetFacetValues {
//   facetValues {
//     ...FacetValueCoreFields
//   }
// }
// `

const GET_UNITS = gql`
query GetUnits {
  units {
    edges {
      cursor
      node {
        id
        revisionId
        label
        symbol
        omUnitIdentifier
      }
    }
  }
}
`

const GET_ALL_RESOURCE_SPECIFICATIONS = gql`
${RESOURCE_SPECIFICATION_CORE_FIELDS}
${UNIT_CORE_FIELDS}
query {
  resourceSpecifications(last: 100000) {
    edges {
      cursor
      node {
        ...ResourceSpecificationCoreFields
        defaultUnitOfResource {
          ...UnitCoreFields
        }
      }
    }
  }
}
`

const GET_ALL_PROCESS_SPECIFICATIONS = gql`
${PROCESS_SPECIFICATION_CORE_FIELDS}
query {
  processSpecifications(last: 100000) {
    edges {
      cursor
      node {
        ...ProcessSpecificationCoreFields
      }
    }
  }
}
`

const GET_All_PROPOSALS = gql`
${PROPOSAL_RETURN_FIELDS}
query {
  proposals(last: 100000) {
    edges {
      cursor
      node {
        ...ProposalReturnFields
      }
    }
  }
}
`

const GET_All_ACTIONS = gql`
query {
  actions(last: 100000) {
    id
    label
    inputOutput
  }
}
`

const GET_AGREEMENTS = gql`
${AGREEMENT_CORE_FIELDS}
query {
  agreements(last: 100000) {
    edges {
      cursor
      node {
        ...AgreementCoreFields
      }
    }
  }
}
`

const GET_COMMITMENTS = gql`
${COMMITMENT_RETURN_FIELDS}
query {
  commitments(last: 100000) {
    pageInfo {
      startCursor
      endCursor
    }
    edges {
      cursor
      node {
        ...CommitmentReturnFields
      }
    }
  }
}
`

const GET_PLAN = gql`
${PLAN_RETURN_FIELDS}
query GetPlan($id: ID!) {
  plan(id: $id) {
    ...PlanReturnFields
  }
}
`

const GET_ALL_FULL_PLANS = gql`
${PLAN_RETURN_FIELDS}
query {
  plans(last: 100000) {
    edges {
      cursor
      node {
        ...PlanReturnFields
      }
    }
  }
}
`

const GET_PLANS = gql`
${SIMPLIFIED_PLAN_RETURN_FIELDS}
query {
  plans(last: 100000) {
    edges {
      cursor
      node {
        ...SimplifiedPlanReturnFields
      }
    }
  }
}
`

const GET_NON_PROCESS_COMMITMENTS = gql`
${NON_PROCESS_COMMITMENT_RETURN_FIELDS}
query GetPlan($id: ID!) {
  plan(id: $id) {
    ...nonProcessCommitments
  }
}
`


const GET_SIMPLIFIED_PLAN = gql`
${SIMPLIFIED_PLAN_RETURN_FIELDS}
query GetPlan($id: ID!) {
  plan(id: $id) {
    ...SimplifiedPlanReturnFields
  }
}
`

const GET_PROCESS = gql`
${PROCESS_RETURN_FIELDS}
query GetProcess($id: ID!) {
  process(id: $id) {
    ...ProcessReturnFields
  }
}
`

const GET_ECONOMIC_EVENTS = gql`
${ECONOMIC_EVENT_RETURN_FIELDS}
query {
  economicEvents(last: 100000) {
    pageInfo {
      startCursor
      endCursor
    }
    edges {
      cursor
      node {
        ...EconomicEventReturnFields
      }
    }
  }
}
`

const GET_ECONOMIC_RESOURCES = gql`
${ECONOMIC_RESOURCE_RETURN_FIELDS}
query {
  economicResources(last: 100000) {
    pageInfo {
      startCursor
      endCursor
    }
    edges {
      cursor
      node {
        ...EconomicResourceReturnFields
      }
    }
  }
}
`

const GET_FULFILLMENTS = gql`
${FULFILLMENT_CORE_FIELDS}
query {
  fulfillments(last: 100000) {
    pageInfo {
      startCursor
      endCursor
    }
    edges {
      cursor
      node {
        ...FulfillmentCoreFields
      }
    }
  }
}
`

const GET_ALL_RECIPES = gql`
${RECIPE_RETURN_FIELDS}
query {
  recipeProcesses(last: 100000) {
    edges {
      cursor
      node {
        ...RecipeFields
      }
    }
  }
}
`

const GET_ALL_RECIPE_EXCHANGES = gql`
${RECIPE_EXCHANGE_RETURN_FIELDS}
query {
  recipeExchanges(last: 100000) {
    edges {
      cursor
      node {
        ...RecipeExchangeFields
      }
    }
  }
}
`

export const getAllAgents = async () => {
  const res = await client.query({
    query: GET_ALL_AGENTS,
    fetchPolicy: 'no-cache'
  })
  setAgents(res.data.agents.edges.map((edge: any) => edge.node))
  return res
}

export const getAgent = async (id: string) => {
  let t = {
    query: GET_ORGANIZATION,
    variables: {
      id
    },
    fetchPolicy: 'no-cache'
  }
  const res = await client.query(t)
  updateAnAgent(res.data.organization)
  return res
}

export const getAllFacetGroups = async () => {
  const res = await client.query({
    query: GET_FACET_GROUPS,
    fetchPolicy: 'no-cache'
  })
  console.log("facet groups", res)
  allFacets.update(v => res.data.facetGroups)
  return res
}

// export const getAllFacetValues = async () => {
//   const res = await client.query({
//     query: GET_FACET_VALUES,
//     fetchPolicy: 'no-cache'
//   })
//   allFacets.update(v => res.data.facetValues)
//   return res
// }

export const getAllUnits = async () => {
  const res = await client.query({
    query: GET_UNITS,
    fetchPolicy: 'no-cache'
  })
  setUnits(res.data.units.edges.map((edge: any) => edge.node))
  return res
}

export const getAllResourceSpecifications = async () => {
  const res = await client.query({
    query: GET_ALL_RESOURCE_SPECIFICATIONS,
    fetchPolicy: 'no-cache'
  })
  setResourceSpecifications(res.data.resourceSpecifications.edges.map((edge: any) => edge.node))
  return res
}

export const getAllProcessSpecifications = async () => {
  const res = await client.query({
    query: GET_ALL_PROCESS_SPECIFICATIONS,
    fetchPolicy: 'no-cache'
  })
  console.log("process specs", res)
  setProcessSpecifications(res.data.processSpecifications.edges.map((edge: any) => edge.node))
  return res
}

export const getAllProposals = async () => {
  const res = await client.query({
    query: GET_All_PROPOSALS,
    fetchPolicy: 'no-cache'
  })
  console.log("proposals", res)
  setProposals(res.data.proposals.edges.map((edge: any) => edge.node))
  return res
}

export const getAllActions = async () => {
  let res = await client.query({
    query: GET_All_ACTIONS,
    fetchPolicy: 'no-cache'
  })
  setActions(res.data.actions)
  return res.data.actions
}

export const getAllCommitments = async () => {
  const res = await client.query({
    query: GET_COMMITMENTS,
    fetchPolicy: 'no-cache'
  })
  setCommitments(res.data.commitments.edges.map((edge: any) => edge.node))
  return res
}

export const getAllAgreements = async () => {
  const res = await client.query({
    query: GET_AGREEMENTS,
    fetchPolicy: 'no-cache'
  })
  setAgreements(res.data.agreements.edges.map((edge: any) => edge.node))
  return res
}

const getFulfillments = async () => {
  // const res = await client.query({
  //   query: GET_FULFILLMENTS,
  //   fetchPolicy: 'no-cache'
  // })
  // const formattedResults = res.data.fulfillments.edges.map((edge: any) => edge.node)
  // setFulfillments(formattedResults)
  // return formattedResults

  function translateId(id: string) {
    return id.replace(/-/g, "+").replace(/_/g, "/");
  }

  if (isWeContext()) {
    let weClient = await WeaveClient.connect(appletServices);
    let res = await weClient.renderInfo.appletClient.callZome({
        cap_secret: null,
        role_name: 'hrea_combined_0',
        zome_name: 'indexing',
        fn_name: 'read_all_fulfillments',
        payload: {},
    })
    let formattedResults = res.edges.map((edge: any) => {return {
      id: translateId(`${encodeHashToBase64(edge.node.id[1])}:${encodeHashToBase64(edge.node.id[0])}`),
      fulfilledBy: translateId(`${encodeHashToBase64(edge.node.fulfilledBy[1])}:${encodeHashToBase64(edge.node.fulfilledBy[0])}`),
      fulfills: translateId(`${encodeHashToBase64(edge.node.fulfills[1])}:${encodeHashToBase64(edge.node.fulfills[0])}`),
    }})
    setFulfillments(formattedResults)
    return formattedResults
  }
}

export const getAllEconomicEvents = async () => {
  const res = await client.query({
    query: GET_ECONOMIC_EVENTS,
    fetchPolicy: 'no-cache'
  })
  await getFulfillments()
  setEconomicEvents(res.data.economicEvents.edges.map((edge: any) => edge.node))
  return res
}

export const getAllEconomicResources = async () => {

  // function translateId(id: string) {
  //   return id.replace(/-/g, "+").replace(/_/g, "/");
  // }

  // if (isWeContext()) {
  //   let weClient = await WeaveClient.connect(appletServices);
  //   let res = await weClient.renderInfo.appletClient.callZome({
  //       cap_secret: null,
  //       role_name: 'hrea_combined_0',
  //       zome_name: 'indexing',
  //       fn_name: 'read_all_economic_resources',
  //       payload: {},
  //   })
  //   console.log("get all resources", res)
  //   // let formattedResults = res.edges.map((edge: any) => {return {
  //   //   id: translateId(`${encodeHashToBase64(edge.node.id[1])}:${encodeHashToBase64(edge.node.id[0])}`),
  //   //   fulfilledBy: translateId(`${encodeHashToBase64(edge.node.fulfilledBy[1])}:${encodeHashToBase64(edge.node.fulfilledBy[0])}`),
  //   //   fulfills: translateId(`${encodeHashToBase64(edge.node.fulfills[1])}:${encodeHashToBase64(edge.node.fulfills[0])}`),
  //   // }})
  //   // console.log("formatted", formattedResults)
  //   // setFulfillments(formattedResults)
  //   // return formattedResults
  // }

  const res = await client.query({
    query: GET_ECONOMIC_RESOURCES,
    fetchPolicy: 'no-cache'
  })
  setEconomicResources(res.data.economicResources.edges.map((edge: any) => edge.node))
  return res
}

export const getPlan = async (id: string) => {
  let res = await client.query({
    query: GET_PLAN,
    variables: {
      id
    },
    fetchPolicy: 'no-cache'
  })
  addToFullPlans(res.data.plan)
  return res.data.plan
}

export const getAllPlans = async () => {
  const res = await client.query({
    query: GET_PLANS,
    fetchPolicy: 'no-cache'
  })
  setPlansList(res.data.plans.edges.map((edge: any) => edge.node))
  return res
}

export const getAllFullPlans = async () => {
  const res = await client.query({
    query: GET_ALL_FULL_PLANS,
    fetchPolicy: 'no-cache'
  })
  res.data.plans.edges.forEach((edge: any) => addToFullPlans(edge.node))
  return res
}

export const getNonProcessCommitments = async (id: string) => {
  const res = await client.query({
    query: GET_NON_PROCESS_COMMITMENTS,
    variables: {
      id
    },
    fetchPolicy: 'no-cache'
  })
  addNonProcessCommitmentsToPlan(id, res.data.plan.nonProcessCommitments)
  return res.data.plan.nonProcessCommitments
}

export const getSimplifiedPlan = async (id: string) => {
  return await client.query({
    query: GET_SIMPLIFIED_PLAN,
    variables: {
      id
    },
    fetchPolicy: 'no-cache'
  })
}

export const getProcess = async (id: string) => {
  const process = await client.query({
    query: GET_PROCESS,
    variables: {
      id
    },
    fetchPolicy: 'no-cache'
  })
  updateProcessInPlan(process.data.process)
}

export const getAllRecipes = async () => {
  const res = await client.query({
    query: GET_ALL_RECIPES,
    fetchPolicy: 'no-cache'
  })
  let dedupedRecipes = res.data.recipeProcesses.edges.map((edge: any) => edge.node).map((recipe: any) => {
    return {
      ...recipe,
      recipeInputs: recipe.recipeInputs.filter((input: any, index: number, self: any) => self.findIndex((t: any) => t.id === input.id) === index),
      recipeOutputs: recipe.recipeOutputs.filter((output: any, index: number, self: any) => self.findIndex((t: any) => t.id === output.id) === index)
    }
  })
  console.log("recipes", dedupedRecipes)
  setRecipes(dedupedRecipes)
  return res
}

export const getAllRecipeExchanges = async () => {
  const res = await client.query({
    query: GET_ALL_RECIPE_EXCHANGES,
    fetchPolicy: 'no-cache'
  })
  let dedupedRecipeExchanges = res.data.recipeExchanges.edges.map((edge: any) => edge.node).map((recipeExchange: any) => {
    return {
      ...recipeExchange,
      recipeClauses: recipeExchange.recipeClauses.filter((clause: any, index: number, self: any) => self.findIndex((t: any) => t.id === clause.id) === index),
      recipeReciprocalClauses: recipeExchange.recipeReciprocalClauses.filter((reciprocalClause: any, index: number, self: any) => self.findIndex((t: any) => t.id === reciprocalClause.id) === index)
    }
  })
  setRecipeExchanges(dedupedRecipeExchanges)
}