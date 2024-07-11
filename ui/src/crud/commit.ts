import { gql } from 'graphql-tag'
import type { AgentConnection, Agent, Organization, OrganizationCreateParams, OrganizationUpdateParams } from '@valueflows/vf-graphql'
import { setActions, clientStored, setAgents, updateAnAgent, setUnits, setResourceSpecifications, setProcessSpecifications, setProposals, setHashChanges, setEconomicEvents, setEconomicResources } from './store'
import { WeClient, isWeContext, initializeHotReload, type WAL} from '@lightningrodlabs/we-applet';
import { appletServices } from '../../we';
import { getAllHashChanges } from './fetch'
import { AGENT_CORE_FIELDS, PERSON_CORE_FIELDS, ORGANIZATION_CORE_FIELDS } from '$lib/graphql/agent.fragments'
import { FACET_GROUP_CORE_FIELDS, FACET_VALUE_CORE_FIELDS } from "$lib/graphql/facet.fragments"
import { PROPOSAL_CORE_FIELDS, INTENT_CORE_FIELDS, PROPOSED_INTENT_CORE_FIELDS, PROPOSAL_RETURN_FIELDS } from '$lib/graphql/proposal.fragments'
import { COMMITMENT_RETURN_FIELDS, PLAN_RETURN_FIELDS, PROCESS_RETURN_FIELDS, SIMPLIFIED_PLAN_RETURN_FIELDS } from '$lib/graphql/plan.fragments'
import { ECONOMIC_EVENT_RETURN_FIELDS } from '$lib/graphql/economic_events.fragments'
import { ECONOMIC_RESOURCE_RETURN_FIELDS } from '$lib/graphql/economic_resources.fragments'
import { RESOURCE_SPECIFICATION_CORE_FIELDS, UNIT_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
import { PROCESS_SPECIFICATION_CORE_FIELDS } from '$lib/graphql/process_specification.fragments'

let client: any;
clientStored.subscribe(value => {
  client = value;
});

export async function addHashChange(original: string, newHash: string) {
  if (isWeContext()) {
      let weClient = await WeClient.connect(appletServices);
      await weClient.renderInfo.appletClient.callZome({
          cap_secret: null,
          role_name: 'migration',
          zome_name: 'migrate',
          fn_name: 'create_hash_change',
          payload: {
              original: String(original),
              current: String(newHash),
          },
      })
      getAllHashChanges()
  }
}

const ADD_AGENT = gql`
${AGENT_CORE_FIELDS},
mutation($agent: OrganizationCreateParams!){
  createOrganization(organization: $agent) {
    agent {
      ...AgentCoreFields
    }
  }
}
`
const UPDATE_AGENT = gql`
${AGENT_CORE_FIELDS},
mutation($agent: OrganizationUpdateParams!){
  updateOrganization(organization: $agent) {
    agent {
      ...AgentCoreFields
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

const UPDATE_COMMITMENT = gql`
mutation($commitment: CommitmentUpdateParams!) {
  updateCommitment(commitment: $commitment) {
    commitment {
      id
      revisionId
      clauseOf {
        id
      }
      plannedWithin {
        id
      }
    }
  }
}
`

const CREATE_COMMITMENT = gql`
mutation($commitment: CommitmentCreateParams!) {
  createCommitment(commitment: $commitment) {
    commitment {
      id
      revisionId
      plannedWithin {
        id
      }
    }
  }
}
`

const ASSOCIATE_AGENT_AND_FACET_VALUE = gql`
mutation($identifier: String, $facetValueId: ID!){
  associateFacetValue(identifier: $identifier, facetValueId: $facetValueId)
}
`

const ADD_PROCESS_SPECIFICATION = gql`
  ${PROCESS_SPECIFICATION_CORE_FIELDS},
  mutation($process: ProcessSpecificationCreateParams!){
    createProcessSpecification(processSpecification: $process) {
      processSpecification {
        ...ProcessSpecificationCoreFields
      }
    }
  }
`

const UPDATE_PROCESS_SPECIFICATION = gql`
  ${PROCESS_SPECIFICATION_CORE_FIELDS},
  mutation($process: ProcessSpecificationUpdateParams!){
    updateProcessSpecification(processSpecification: $process) {
      processSpecification {
        ...ProcessSpecificationCoreFields
      }
    }
  }
`

const DELETE_PROCESS_SPECIFICATION = gql`mutation($revisionId: ID!){
  deleteProcessSpecification(revisionId: $revisionId)
}`

const ADD_RESOURCE_SPECIFICATION = gql`
${RESOURCE_SPECIFICATION_CORE_FIELDS},
mutation($resource: ResourceSpecificationCreateParams!){
  createResourceSpecification(resourceSpecification: $resource) {
    resourceSpecification {
      ...ResourceSpecificationCoreFields
    }
  }
}
`

const ASSOCIATE_RESOURCE_SPECIFICATION_AND_FACET_VALUE = gql`
mutation($identifier: String, $facetValueId: ID!){
  associateFacetValue(identifier: $identifier, facetValueId: $facetValueId)
}
`

const UPDATE_RESOURCE_SPECIFICATION = gql`
${RESOURCE_SPECIFICATION_CORE_FIELDS},
mutation($resource: ResourceSpecificationUpdateParams!){
  updateResourceSpecification(resourceSpecification: $resource) {
    resourceSpecification {
      ...ResourceSpecificationCoreFields
    }
  }
}
`

const DELETE_RESOURCE_SPECIFICATION = gql`mutation($revisionId: ID!){
  deleteResourceSpecification(revisionId: $revisionId)
}`


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

const CREATE_AGREEMENT = gql`
  mutation($ag: AgreementCreateParams!) {
    createAgreement(agreement: $ag) {
      agreement {
        id
        revisionId
      }
    }
  }
`

const DELETE_COMMITMENT = gql`
mutation($revisionId: ID!){
  deleteCommitment(revisionId: $revisionId)
}
`

export const addProcessSpecification = async (process: any) => {
  const res = await client.mutate({
    mutation: ADD_PROCESS_SPECIFICATION,
    variables: {
      process
    }
  });
  return res
};

export const updateProcessSpecification = async (process: any) => {
  const res = await client.mutate({
    mutation: UPDATE_PROCESS_SPECIFICATION,
    variables: {
      process
    }
  });
  return res
};

export const deleteProcessSpecification = async (revisionId: string) => {
  return await client.mutate({
    mutation: DELETE_PROCESS_SPECIFICATION,
    variables: {
      revisionId
    }
  });
};

export const addResourceSpecification = async (resource: any) => {
  const res = await client.mutate({
    mutation: ADD_RESOURCE_SPECIFICATION,
    variables: {
      resource
    }
  });
  return res
};

export const associateResourceSpecificationAndFacetValue = async (identifier: string, facetValueId: string) => {
  return await client.mutate({
    mutation: ASSOCIATE_RESOURCE_SPECIFICATION_AND_FACET_VALUE,
    variables: {
      identifier,
      facetValueId,
    }
  })
}

export const updateResourceSpecification = async (resource: any) => {
  const res = await client.mutate({
    mutation: UPDATE_RESOURCE_SPECIFICATION,
    variables: {
      resource
    }
  });
  return res
};

export const deleteResourceSpecification = async (revisionId: string) => {
  return await client.mutate({
    mutation: DELETE_RESOURCE_SPECIFICATION,
    variables: {
      revisionId
    }
  });
};

export const addAgent = async (agent: OrganizationCreateParams) => {
  const res = await client.mutate({
    mutation: ADD_AGENT,
    variables: {
      agent
    }
  });
  return res
};

export const updateAgent = async (agent: OrganizationUpdateParams) => {
  const res = await client.mutate({
    mutation: UPDATE_AGENT,
    variables: {
      agent
    }
  })
  return res
}

export const associateAgentWithValue = async (identifier: string, facetValueId: string) => {
  return await client.mutate({
    mutation: ASSOCIATE_AGENT_AND_FACET_VALUE,
    variables: {
      identifier,
      facetValueId,
    }
  })
}

export const deleteAgent = async (revisionId: string) => {
  return await client.mutate({
    mutation: gql`
      mutation {
        deleteOrganization(revisionId: "${revisionId}")
      }
    `
  })
}

export const createEconomicEvent = async (event: any) => {
  return await client.mutate({
    mutation: CREATE_ECONOMIC_EVENT,
    variables: {
      event,
    }
  })
}

export const createEconomicEventWithResource = async (event: any, newInventoriedResource: any) => {
  return await client.mutate({
    mutation: CREATE_ECONOMIC_EVENT_WITH_RESOURCE,
    variables: {
      event,
      newInventoriedResource
    }
  })
}

export const createFulfillment = async (fulfillment: any) => {
  return await client.mutate({
    mutation: CREATE_FULFILLMENT,
    variables: {
      fulfillment
    }
  })
}

export const updateCommitment = async (commitment: any) => {
  return await client.mutate({
    mutation: UPDATE_COMMITMENT,
    variables: {
      commitment
    }
  })
}

export const createCommitment = async (commitment: any) => {
  return await client.mutate({
    mutation: CREATE_COMMITMENT,
    variables: {
      commitment
    }
  })
}

export const createAgreement = async (ag: any) => {
  let res = await client.mutate({
    mutation: CREATE_AGREEMENT,
    variables: {
      ag
    }
  })
  return res.data.createAgreement.agreement
}

export const deleteCommitment = async (revisionId: string) => {
  return await client.mutate({
    mutation: DELETE_COMMITMENT,
    variables: {
      revisionId
    }
  })
}

export const deleteAgreement = async (revisionId: string) => {
  return await client.mutate({
    mutation: gql`
      mutation {
        deleteAgreement(revisionId: "${revisionId}")
      }
    `
  })
}