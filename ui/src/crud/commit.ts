import { gql } from 'graphql-tag'
import type { AgentConnection, Agent, Organization, OrganizationCreateParams, EconomicResourceUpdateParams, OrganizationUpdateParams, 
  EconomicEvent, RecipeProcessCreateParams, RecipeFlowCreateParams, RecipeFlowUpdateParams } from '@leosprograms/vf-graphql'
import { setActions, clientStored, setAgents, updateAnAgent, setUnits, setResourceSpecifications, setProcessSpecifications, setProposals, setHashChanges, setEconomicEvents, setEconomicResources } from './store'
import { WeaveClient, isWeContext, initializeHotReload, type WAL} from '@lightningrodlabs/we-applet';
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
import { RECIPE_FLOW_CORE_FIELDS, RECIPE_PROCESS_CORE_FIELDS, RECIPE_EXCHANGE_CORE_FIELDS } from '$lib/graphql/recipe.fragments'
import type { ProcessCreateParams } from '@leosprograms/vf-graphql';

let client: any;
clientStored.subscribe(value => {
  client = value;
});

export async function addHashChange(original: string, newHash: string) {
  if (isWeContext()) {
      let weClient = await WeaveClient.connect(appletServices);
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

const ADD_UNIT = gql`
${UNIT_CORE_FIELDS},
mutation($unit: UnitCreateParams!){
  createUnit(unit: $unit) {
    unit {
      ...UnitCoreFields
    }
  }
}
`

const UPDATE_UNIT = gql`
${UNIT_CORE_FIELDS},
mutation($unit: UnitUpdateParams!){
  updateUnit(unit: $unit) {
    unit {
      ...UnitCoreFields
    }
  }
}
`

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
        stageId
      }
    }
  }
`

const UPDATE_ECONOMIC_RESOURCE = gql`
  mutation($resource: EconomicResourceUpdateParams!) {
    updateEconomicResource(resource: $resource) {
      economicResource {
        id
        stageId
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

const UPDATE_AGREEMENT = gql`
  mutation($ag: AgreementUpdateParams!) {
    updateAgreement(agreement: $ag) {
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

const CREATE_PLAN = gql`
${SIMPLIFIED_PLAN_RETURN_FIELDS},
mutation($plan: PlanCreateParams!){
  createPlan(plan: $plan) {
    plan {
      ...SimplifiedPlanReturnFields
    }
  }
}
`

const CREATE_PROCESS = gql`
${PROCESS_RETURN_FIELDS},
mutation($process: ProcessCreateParams!){
  createProcess(process: $process) {
    process {
      ...ProcessReturnFields
    }
  }
}
`

const CREATE_RECIPE_FLOW = gql`
${RECIPE_FLOW_CORE_FIELDS},
mutation($recipeFlow: RecipeFlowCreateParams!){
  createRecipeFlow(recipeFlow: $recipeFlow) {
    recipeFlow {
      ...RecipeFlowCoreFields
    }
  }
}
`

const UPDATE_RECIPE_FLOW = gql`
${RECIPE_FLOW_CORE_FIELDS},
mutation($recipeFlow: RecipeFlowUpdateParams!){
  updateRecipeFlow(recipeFlow: $recipeFlow) {
    recipeFlow {
      ...RecipeFlowCoreFields
    }
  }
}
`

const DELETE_RECIPE_FLOW = gql`
mutation($revisionId: ID!){
  deleteRecipeFlow(revisionId: $revisionId)
}
`

const CREATE_RECIPE_PROCESS = gql`
${RECIPE_PROCESS_CORE_FIELDS},
mutation($recipeProcess: RecipeProcessCreateParams!){
  createRecipeProcess(recipeProcess: $recipeProcess) {
    recipeProcess {
      ...RecipeProcessCoreFields
    }
  }
}
`

const UPDATE_RECIPE_PROCESS = gql`
${RECIPE_PROCESS_CORE_FIELDS},
mutation($recipeProcess: RecipeProcessUpdateParams!){
  updateRecipeProcess(recipeProcess: $recipeProcess) {
    recipeProcess {
      ...RecipeProcessCoreFields
    }
  }
}
`

const DELETE_RECIPE_PROCESS = gql`
mutation($revisionId: ID!){
  deleteRecipeProcess(revisionId: $revisionId)
}
`

const CREATE_RECIPE_EXCHANGE = gql`
${RECIPE_EXCHANGE_CORE_FIELDS},
mutation($recipeExchange: RecipeExchangeCreateParams!){
  createRecipeExchange(recipeExchange: $recipeExchange) {
    recipeExchange {
      ...RecipeExchangeCoreFields
    }
  }
}
`

const UPDATE_RECIPE_EXCHANGE = gql`
${RECIPE_EXCHANGE_CORE_FIELDS},
mutation($recipeExchange: RecipeExchangeUpdateParams!){
  updateRecipeExchange(recipeExchange: $recipeExchange) {
    recipeExchange {
      ...RecipeExchangeCoreFields
    }
  }
}
`

const DELETE_RECIPE_EXCHANGE = gql`
mutation($revisionId: ID!){
  deleteRecipeExchange(revisionId: $revisionId)
}
`

export const addUnit = async (unit: any) => {
  const res = await client.mutate({
    mutation: ADD_UNIT,
    variables: {
      unit
    }
  });
  return res
}

export const updateUnit = async (unit: any) => {
  const res = await client.mutate({
    mutation: UPDATE_UNIT,
    variables: {
      unit
    }
  });
  return res
}

export const addProcessSpecification = async (process: ProcessCreateParams) => {
  console.log('addProcessSpecification', process)
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

export const deleteEconomicEvent = async (revisionId: string) => {
  return await client.mutate({
    mutation: gql`
      mutation {
        deleteEconomicEvent(revisionId: "${revisionId}")
      }
    `
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

export const updateEconomicResource = async (resource: EconomicResourceUpdateParams) => {
  console.log('updateEconomicResource', resource)
  return await client.mutate({
    mutation: UPDATE_ECONOMIC_RESOURCE,
    variables: {
      resource
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
  console.log("Update commitment", JSON.stringify(commitment))
  return await client.mutate({
    mutation: UPDATE_COMMITMENT,
    variables: {
      commitment
    }
  })
}

export const createCommitmentResponsive = async (commitment: any) => {
  
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
  console.log("create agreement", res)
  return res.data.createAgreement.agreement
}

export const deleteCommitment = async (revisionId: string) => {
  console.log("DELETING COMMITMENT", revisionId)
  return await client.mutate({
    mutation: DELETE_COMMITMENT,
    variables: {
      revisionId
    }
  })
}

export const deleteAgreement = async (revisionId: string) => {
  console.log("delete agreement", revisionId)
  return await client.mutate({
    mutation: gql`
      mutation {
        deleteAgreement(revisionId: "${revisionId}")
      }
    `
  })
}

export const updateAgreement = async (ag: any) => {
  let res = await client.mutate({
    mutation: UPDATE_AGREEMENT,
    variables: {
      ag
    }
  })
  return res.data.updateAgreement.agreement
}

export const createPlan = async (plan: any) => {
  return await client.mutate({
    mutation: CREATE_PLAN,
    variables: {
      plan
    }
  })
}

export const createProcess = async (process: any) => {
  return await client.mutate({
    mutation: CREATE_PROCESS,
    variables: {
      process
    }
  })
}

export const createRecipeFlow = async (recipeFlow: RecipeFlowCreateParams) => {
  return await client.mutate({
    mutation: CREATE_RECIPE_FLOW,
    variables: {
      recipeFlow
    }
  })
}

export const updateRecipeFlow = async (recipeFlow: RecipeFlowUpdateParams) => {
  return await client.mutate({
    mutation: UPDATE_RECIPE_FLOW,
    variables: {
      recipeFlow
    }
  })
}

export const deleteRecipeFlow = async (revisionId: string) => {
  return await client.mutate({
    mutation: DELETE_RECIPE_FLOW,
    variables: {
      revisionId
    }
  })
}

export const createRecipeProcess = async (recipeProcess: RecipeProcessCreateParams) => {
  console.log('createRecipeProcess', recipeProcess)
  return await client.mutate({
    mutation: CREATE_RECIPE_PROCESS,
    variables: {
      recipeProcess
    }
  })
}

export const updateRecipeProcess = async (recipeProcess: any) => {
  return await client.mutate({
    mutation: UPDATE_RECIPE_PROCESS,
    variables: {
      recipeProcess
    }
  })
}

export const deleteRecipeProcess = async (revisionId: string) => {
  return await client.mutate({
    mutation: DELETE_RECIPE_PROCESS,
    variables: {
      revisionId
    }
  })
}

export const createRecipeExchange = async (recipeExchange: any) => {
  return await client.mutate({
    mutation: CREATE_RECIPE_EXCHANGE,
    variables: {
      recipeExchange
    }
  })
}

export const updateRecipeExchange = async (recipeExchange: any) => {
  return await client.mutate({
    mutation: UPDATE_RECIPE_EXCHANGE,
    variables: {
      recipeExchange
    }
  })
}

export const deleteRecipeExchange = async (revisionId: string) => {
  return await client.mutate({
    mutation: DELETE_RECIPE_EXCHANGE,
    variables: {
      revisionId
    }
  })
}