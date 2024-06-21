import { gql } from 'graphql-tag'
import type { AgentConnection, Agent, Organization, OrganizationCreateParams, OrganizationUpdateParams } from '@valueflows/vf-graphql'
import { AGENT_CORE_FIELDS, PERSON_CORE_FIELDS, ORGANIZATION_CORE_FIELDS } from '$lib/graphql/agent.fragments'
import { FACET_GROUP_CORE_FIELDS, FACET_VALUE_CORE_FIELDS } from "$lib/graphql/facet.fragments"
import { PROPOSAL_CORE_FIELDS, INTENT_CORE_FIELDS, PROPOSED_INTENT_CORE_FIELDS, PROPOSAL_RETURN_FIELDS } from '$lib/graphql/proposal.fragments'
import { COMMITMENT_RETURN_FIELDS, PLAN_RETURN_FIELDS, PROCESS_RETURN_FIELDS, SIMPLIFIED_PLAN_RETURN_FIELDS } from '$lib/graphql/plan.fragments'
import { ECONOMIC_EVENT_RETURN_FIELDS } from '$lib/graphql/economic_events.fragments'
import { ECONOMIC_RESOURCE_RETURN_FIELDS } from '$lib/graphql/economic_resources.fragments'
import { RESOURCE_SPECIFICATION_CORE_FIELDS, UNIT_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
import { PROCESS_SPECIFICATION_CORE_FIELDS } from '$lib/graphql/process_specification.fragments'
import { addToFullPlans, setActions, clientStored, setAgents, updateAnAgent, setUnits, setResourceSpecifications, setProcessSpecifications, setProposals, setHashChanges, setEconomicEvents, setEconomicResources } from './store'
import { WeClient, isWeContext, initializeHotReload, type WAL} from '@lightningrodlabs/we-applet';
import { appletServices } from '../../we';
import { decode } from '@msgpack/msgpack';

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
      let weClient = await WeClient.connect(appletServices);
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

const GET_UNITS = gql`
query GetUnits {
  units {
    edges {
      cursor
      node {
        id
        label
        symbol
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

const GET_PLAN = gql`
${PLAN_RETURN_FIELDS}
query GetPlan($id: ID!) {
  plan(id: $id) {
    ...PlanReturnFields
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
  return await client.query({
    query: GET_FACET_GROUPS,
    fetchPolicy: 'no-cache'
  })
}

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
  setProcessSpecifications(res.data.processSpecifications.edges.map((edge: any) => edge.node))
  return res
}

export const getAllProposals = async () => {
  const res = await client.query({
    query: GET_All_PROPOSALS,
    fetchPolicy: 'no-cache'
  })
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

export const getAllEconomicEvents = async () => {
  const res = await client.query({
    query: GET_ECONOMIC_EVENTS,
    fetchPolicy: 'no-cache'
  })
  setEconomicEvents(res.data.economicEvents.edges.map((edge: any) => edge.node))
  return res
}

export const getAllEconomicResources = async () => {
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
  return await client.query({
    query: GET_PROCESS,
    variables: {
      id
    },
    fetchPolicy: 'no-cache'
  })
}