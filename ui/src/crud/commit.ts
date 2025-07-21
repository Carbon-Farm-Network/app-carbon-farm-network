import { gql } from 'graphql-tag'
import type { AgentConnection, Agent, Organization, ProcessSpecificationCreateParams, OrganizationCreateParams, EconomicResourceUpdateParams, OrganizationUpdateParams, 
  EconomicEvent, RecipeProcessCreateParams, RecipeFlowCreateParams, RecipeFlowUpdateParams, 
  IntentCreateParams,
  CommitmentCreateParams,
  CommitmentUpdateParams,
  EconomicEventCreateParams} from '@valueflows/vf-graphql'
import { setActions, clientStored, clientHC, setAgents, updateAnAgent, setUnits, setResourceSpecifications, setProcessSpecifications, setProposals, 
  setHashChanges, setEconomicEvents, setEconomicResources, addToHashChanges, addAUnit, 
  updateAUnit} from './store'
import { WeaveClient, isWeaveContext, initializeHotReload, type WAL} from '@theweave/api';
import { appletServices } from '../../we';
import type { EntryHash } from '@holochain/client';
import { getAllHashChanges } from './fetch'
import { AGENT_CORE_FIELDS, PERSON_CORE_FIELDS, ORGANIZATION_CORE_FIELDS } from '$lib/graphql/agent.fragments'
import { FACET_GROUP_CORE_FIELDS, FACET_CORE_FIELDS, FACET_VALUE_CORE_FIELDS } from "$lib/graphql/facet.fragments"
import { PROPOSAL_CORE_FIELDS, INTENT_CORE_FIELDS, PROPOSAL_RETURN_FIELDS } from '$lib/graphql/proposal.fragments'
import { COMMITMENT_RETURN_FIELDS, PLAN_RETURN_FIELDS, PROCESS_RETURN_FIELDS, SIMPLIFIED_PLAN_RETURN_FIELDS } from '$lib/graphql/plan.fragments'
import { ECONOMIC_EVENT_RETURN_FIELDS } from '$lib/graphql/economic_events.fragments'
import { ECONOMIC_RESOURCE_RETURN_FIELDS } from '$lib/graphql/economic_resources.fragments'
import { RESOURCE_SPECIFICATION_CORE_FIELDS, UNIT_CORE_FIELDS } from '$lib/graphql/resource_specification.fragments'
import { PROCESS_SPECIFICATION_CORE_FIELDS } from '$lib/graphql/process_specification.fragments'
import { RECIPE_FLOW_CORE_FIELDS, RECIPE_PROCESS_CORE_FIELDS, RECIPE_EXCHANGE_CORE_FIELDS } from '$lib/graphql/recipe.fragments'
import type { ProcessCreateParams } from '@valueflows/vf-graphql';

let client: any;
clientStored.subscribe(value => {
  client = value;
});

let client0: any;
clientHC.subscribe(value => {
  client0 = value;
});

export async function addHashChange(original: string, newHash: string) {
  if (original == undefined || newHash == undefined) { return; }
  if (isWeaveContext()) {
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
      addToHashChanges({ original, current: newHash })
      // getAllHashChanges()
  } else {
    console.log('addHashChange', original, newHash)
    const res = client0.callZome({
      cap_secret: null,
      role_name: 'migration',
      zome_name: 'migrate',
      fn_name: 'create_hash_change',
      payload: {
          original: String(original),
          current: String(newHash),
      },
    })
    console.log('addHashChange done', res)
    addToHashChanges({ original, current: newHash })
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

const ADD_FACET_GROUP = gql`
${FACET_GROUP_CORE_FIELDS},
mutation($facetGroup: FacetGroupCreateParams!){
  createFacetGroup(facetGroup: $facetGroup) {
    facetGroup {
      ...FacetGroupCoreFields
    }
  }
}
`

const CREATE_FACET = gql`
  mutation($facet: FacetParams!){
    putFacet(facet: $facet) {
      facet {
        name
        note
        id
        revisionId
      }
    }
  }
`
const CREATE_FACET_VALUE = gql`
  mutation($facetValue: FacetValueParams!){
    putFacetValue(facetValue: $facetValue) {
      facetValue {
        value
        note
        id
        revisionId
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
      clauseOf {
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
  mutation($processSpecification: ProcessSpecificationCreateParams!){
    createProcessSpecification(processSpecification: $processSpecification) {
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
  deleteCommitment(revisionId: $revisionId) {
    commitment {
      id
    }
  }
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

const UPDATE_PLAN = gql`
${SIMPLIFIED_PLAN_RETURN_FIELDS},
mutation($plan: PlanUpdateParams!){
  updatePlan(plan: $plan) {
    plan {
      ...SimplifiedPlanReturnFields
    }
  }
}
`

const DELETE_PLAN = gql`
mutation($revisionId: ID!){
  deletePlan(revisionId: $revisionId)
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

const UPDATE_PROCESS = gql`
${PROCESS_RETURN_FIELDS},
mutation($process: ProcessUpdateParams!){
  updateProcess(process: $process) {
    process {
      ...ProcessReturnFields
    }
  }
}
`

const DELETE_PROCESS = gql`
mutation($revisionId: ID!){
  deleteProcess(revisionId: $revisionId)
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

const CREATE_PROPOSAL = gql`
${PROPOSAL_RETURN_FIELDS},
mutation($proposal: ProposalCreateParams!){
  createProposal(proposal: $proposal) {
    proposal {
      ...ProposalReturnFields
    }
  }
}
`

const UPDATE_PROPOSAL = gql`
${PROPOSAL_RETURN_FIELDS},
mutation($proposal: ProposalUpdateParams!){
  updateProposal(proposal: $proposal) {
    proposal {
      ...ProposalReturnFields
    }
  }
}
`

const DELETE_PROPOSAL = gql`
mutation($revisionId: ID!){
  deleteProposal(revisionId: $revisionId)
}
`

const CREATE_INTENT = gql`
${INTENT_CORE_FIELDS},
mutation($intent: IntentCreateParams!){
  createIntent(intent: $intent) {
    intent {
      ...IntentCoreFields
    }
  }
}
`

const UPDATE_INTENT = gql`
${INTENT_CORE_FIELDS},
mutation($intent: IntentUpdateParams!){
  updateIntent(intent: $intent) {

    intent {
      ...IntentCoreFields
    }
  }
}
`

const DELETE_INTENT = gql`
mutation($revisionId: ID!){
  deleteIntent(revisionId: $revisionId)
}
`

function savePrep(obj: any, update = false) {
  const revisionId = obj.revisionId;
  // remove id
  delete obj.id;
  delete obj.__typename
  delete obj.meta
  for (const key in obj) {
    // delete any fields that end in "Id"
    if (key.endsWith('Id')) {
      delete obj[key];
    }
    // delete any undefined or null fields
    if (obj[key] === undefined || obj[key] === null) {
      delete obj[key];
    }
    // convert nested id fields into just id strings
    if (obj[key] && typeof obj[key] === 'object' && obj[key].id) {
      obj[key] = obj[key].id;
    }
    // also check second level for id
    if (obj[key] && typeof obj[key] === 'object') {
      for (const subKey in obj[key]) {
        if (obj[key][subKey] && typeof obj[key][subKey] === 'object' && obj[key][subKey].id) {
          obj[key][subKey] = obj[key][subKey].id;
        }
      }
      delete obj[key].meta; // remove meta if exists
      delete obj[key].__typename; // remove __typename if exists
    }
  }
  if (update) {
    obj.revisionId = revisionId; // keep revisionId for updates
  }
  return obj;
}

export const createUnit = async (unit: any) => {
  const res = await client.mutate({
    mutation: ADD_UNIT,
    variables: {
      unit
    }
  });
  console.log('createUnit', res.data.createUnit.unit)
  addAUnit(res.data.createUnit.unit)
  return res.data.createUnit.unit
}

export const updateUnit = async (unit: any) => {
  const res = await client.mutate({
    mutation: UPDATE_UNIT,
    variables: {
      unit
    }
  });
  updateAUnit(res.data.updateUnit.unit)
  return res.data.updateUnit.unit
}

export const createFacetGroup = async (facetGroup: any) => {
  const res = await client0.callZome({
    cap_secret: null,
    role_name: 'hrea_facets_0',
    zome_name: 'hc_facets',
    fn_name: `create_facet_group`,
    payload: facetGroup,
  })
  return res
}

export const createFacet = async (facet: any) => {
  let res = await client0.callZome({
    cap_secret: null,
    role_name: 'hrea_facets_0',
    zome_name: 'hc_facets',
    fn_name: `create_facet_option`,
    payload: facet,
  })
  return res

  // const res = await client.mutate({
  //   mutation: CREATE_FACET,
  //   variables: {
  //     facet
  //   }
  // });
  // return res
}

export const deleteFacet = async (revisionId: string) => {
  await client0.callZome({
    cap_secret: null,
    role_name: 'hrea_facets_0',
    zome_name: 'hc_facets',
    fn_name: `delete_facet_option`,
    payload: {revision_id: revisionId},
  })
}

export const createFacetValue = async (facetValue: any) => {
  const res = await client0.callZome({
    cap_secret: null,
    role_name: 'hrea_facets_0',
    zome_name: 'hc_facets',
    fn_name: `create_facet_value`,
    payload: facetValue,
  })
  return res

  // const res = await client.mutate({
  //   mutation: CREATE_FACET_VALUE,
  //   variables: {
  //     facetValue
  //   }
  // });
  // return res
}

export const deleteFacetValue = async (revisionId: string) => {
  await client0.callZome({
    cap_secret: null,
    role_name: 'hrea_facets_0',
    zome_name: 'hc_facets',
    fn_name: `delete_facet_value`,
    payload: {revision_id: revisionId},
  })
}

export const createProcessSpecification = async (processSpecification: ProcessSpecificationCreateParams) => {
  // delete processSpecification.image
  // delete processSpecification.note
  console.log('createProcessSpecification', processSpecification)
  const res = await client.mutate({
    mutation: ADD_PROCESS_SPECIFICATION,
    variables: {
      processSpecification: processSpecification
    }
  });
  return res.data.createProcessSpecification.processSpecification
};

export const updateProcessSpecification = async (process: any) => {
  const res = await client.mutate({
    mutation: UPDATE_PROCESS_SPECIFICATION,
    variables: {
      process
    }
  });
  return res.data.updateProcessSpecification.processSpecification
};

export const deleteProcessSpecification = async (revisionId: string) => {
  return await client.mutate({
    mutation: DELETE_PROCESS_SPECIFICATION,
    variables: {
      revisionId
    }
  });
};

export const createResourceSpecification = async (resource: any) => {
  delete resource.id
  delete resource.revisionId
  const res = await client.mutate({
    mutation: ADD_RESOURCE_SPECIFICATION,
    variables: {
      resource
    }
  });
  return res.data.createResourceSpecification.resourceSpecification
};

export const associateResourceSpecificationAndFacetValue = async (identifier: string, facetValueId: string) => {
  console.log('associateResourceSpecificationAndFacetValue', identifier, facetValueId)
  const res = await client0.callZome({
    cap_secret: null,
    role_name: 'hrea_facets_0',
    zome_name: 'hc_facets',
    fn_name: `use_facet_value`,
    payload: {
      identifier: String(identifier),
      facetValueId: facetValueId,
    },
  })
  console.log('associateResourceSpecificationAndFacetValue done', res)
  return res
  // return await client.mutate({
  //   mutation: ASSOCIATE_RESOURCE_SPECIFICATION_AND_FACET_VALUE,
  //   variables: {
  //     identifier,
  //     facetValueId,
  //   }
  // })
}

export const updateResourceSpecification = async (resource: any) => {
  const res = await client.mutate({
    mutation: UPDATE_RESOURCE_SPECIFICATION,
    variables: {
      resource
    }
  });
  return res.data.updateResourceSpecification.resourceSpecification
};

export const deleteResourceSpecification = async (revisionId: string) => {
  return await client.mutate({
    mutation: DELETE_RESOURCE_SPECIFICATION,
    variables: {
      revisionId
    }
  });
};

export const createAgent = async (agent: OrganizationCreateParams) => {
  const res = await client.mutate({
    mutation: ADD_AGENT,
    variables: {
      agent
    }
  });
  return res.data.createOrganization.agent as Agent;
};

export const updateAgent = async (agent: OrganizationUpdateParams) => {
  const res = await client.mutate({
    mutation: UPDATE_AGENT,
    variables: {
      agent
    }
  })
  return res.data.updateOrganization.agent as Agent;
}

export const associateAgentWithValue = async (identifier: string, facetValueId: EntryHash) => {
  console.log('associateAgentWithValue', identifier, facetValueId)
  const res = await client0.callZome({
    cap_secret: null,
    role_name: 'hrea_facets_0',
    zome_name: 'hc_facets',
    fn_name: `use_facet_value`,
    payload: {
      identifier: String(identifier),
      facetValueId: facetValueId,
    },
  })
  // return await client.mutate({
  //   mutation: ASSOCIATE_AGENT_AND_FACET_VALUE,
  //   variables: {
  //     identifier,
  //     facetValueId,
  //   }
  // })
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

export const createEconomicEvent = async (event: EconomicEventCreateParams) => {
  delete event.revisionId
  delete event.clauseOf
  delete event.fulfilledBy
  event = savePrep(event);
  console.log('createEconomicEvent', event)
  const res = await client.mutate({
    mutation: CREATE_ECONOMIC_EVENT,
    variables: {
      event,
    }
  })
  return res.data.createEconomicEvent.economicEvent as EconomicEvent;
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

export const createEconomicEventWithResource = async (event: EconomicEventCreateParams, newInventoriedResource: any) => {
  delete event.revisionId
  delete event.clauseOf
  delete event.fulfilledBy
  event = savePrep(event);
  console.log('createEconomicEventWithResource', event, newInventoriedResource)
  const res = await client.mutate({
    mutation: CREATE_ECONOMIC_EVENT_WITH_RESOURCE,
    variables: {
      event,
      newInventoriedResource
    }
  })
  return res.data.createEconomicEvent.economicResource as EconomicResourceUpdateParams;
}

export const updateEconomicResource = async (resource: EconomicResourceUpdateParams) => {
  console.log('updateEconomicResource', resource)
  const res = await client.mutate({
    mutation: UPDATE_ECONOMIC_RESOURCE,
    variables: {
      resource
    }
  })
  return res.data.updateEconomicResource.economicResource as EconomicResourceUpdateParams;
}

export const createFulfillment = async (fulfillment: any) => {
  return await client.mutate({
    mutation: CREATE_FULFILLMENT,
    variables: {
      fulfillment
    }
  })
}

export const updateCommitment = async (commitment: CommitmentUpdateParams) => {
  console.log("==-=-=Updating commitment=-=-==", commitment?.resourceConformsTo)
  delete commitment.id
  commitment.inputOf = commitment.inputOf?.id || commitment.inputOf
  commitment.outputOf = commitment.outputOf?.id || commitment.outputOf

  const res = await client.mutate({
    mutation: UPDATE_COMMITMENT,
    variables: {
      commitment
    }
  })
  console.log("==-=-=Updated commitment=-=-==", res.data.updateCommitment.commitment?.resourceConformsTo?.name)
  return res.data.updateCommitment.commitment as CommitmentUpdateParams;
}

export const createCommitmentResponsive = async (commitment: any) => {
  
}

// export const createCommitment = async (commitment: CommitmentCreateParams) => {
//   delete commitment.revisionId
//   delete commitment.id
//   delete commitment.__typename
//   delete commitment.availableQuantity
//   delete commitment.instructions
//   delete commitment.providerRole
//   delete commitment.receiverRole
//   delete commitment.independent
//   delete commitment.agreement
//   delete commitment.editable
//   if (commitment.action?.id) {
//     commitment.action = commitment.action.id;
//   }
//   console.log("Attempting to create commitment", commitment)
//   const res = await client.mutate({
//     mutation: CREATE_COMMITMENT,
//     variables: {
//       commitment
//     }
//   })
//   console.log("created commitment", res.data.createCommitment.commitment)
//   return res.data.createCommitment.commitment as CommitmentCreateParams;
// }

export const createCommitment = async (commitment: CommitmentCreateParams) => {
  delete commitment.revisionId
  delete commitment.id
  delete commitment.__typename
  delete commitment.availableQuantity
  delete commitment.instructions
  delete commitment.providerRole
  delete commitment.receiverRole
  delete commitment.independent
  delete commitment.agreement
  delete commitment.editable
  if (commitment.action?.id) {
    commitment.action = commitment.action.id;
  }
  console.log("Attempting to create commitment", commitment)
  const res = await client.mutate({
    mutation: CREATE_COMMITMENT,
    variables: {
      commitment
    },
    update: (cache, { data }) => {
      const newCommitment = data?.createCommitment?.commitment;
      const planId = newCommitment?.plannedWithin?.id;
      if (!newCommitment || !planId) return;

      // Update the plan's nonProcessCommitments list in the cache
      cache.modify({
        id: cache.identify({ __typename: "Plan", id: planId }),
        fields: {
          nonProcessCommitments(existing = []) {
            // Add the new commitment to the list
            return [...existing, { __ref: cache.identify(newCommitment) }];
          }
        }
      });
    }
  })
  console.log("created commitment", res.data.createCommitment.commitment)
  return res.data.createCommitment.commitment as CommitmentCreateParams;
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
  console.log('createPlan', plan)
  const res = await client.mutate({
    mutation: CREATE_PLAN,
    variables: {
      plan
    }
  })
  console.log('createPlan done', res.data.createPlan.plan)
  return res.data.createPlan.plan
}

export const updatePlan = async (plan: any) => {
  return await client.mutate({
    mutation: UPDATE_PLAN,
    variables: {
      plan
    }
  })
}

export const deletePlan = async (revisionId: string) => {
  return await client.mutate({
    mutation: DELETE_PLAN,
    variables: {
      revisionId
    }
  })
}

export const createProcess = async (process: any) => {
  console.log('createProcess', process)
  const res = await client.mutate({
    mutation: CREATE_PROCESS,
    variables: {
      process
    }
  })
  console.log('createProcess done', res.data.createProcess.process)
  return res.data.createProcess.process
}

export const updateProcess = async (process: any) => {
  return await client.mutate({
    mutation: UPDATE_PROCESS,
    variables: {
      process
    }
  })
}

export const deleteProcess = async (revisionId: string) => {
  return await client.mutate({
    mutation: DELETE_PROCESS,
    variables: {
      revisionId
    }
  })
}

export const createRecipeFlow = async (recipeFlow: RecipeFlowCreateParams) => {
  console.log('createRecipeFlow', recipeFlow)
  const res = await client.mutate({
    mutation: CREATE_RECIPE_FLOW,
    variables: {
      recipeFlow
    }
  })
  console.log('createRecipeFlow', res)
  return res
}

export const updateRecipeFlow = async (recipeFlow: RecipeFlowUpdateParams) => {
  recipeFlow = savePrep(recipeFlow, true);
  console.log('updateRecipeFlow', recipeFlow)
  const res = await client.mutate({
    mutation: UPDATE_RECIPE_FLOW,
    variables: {
      recipeFlow
    }
  })
  console.log('updateRecipeFlow', res)
  return res
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
  delete recipeProcess.id
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

export const createProposal = async (proposal: any) => {
  console.log('createProposal', proposal)
  const res = await client.mutate({
    mutation: CREATE_PROPOSAL,
    variables: {
      proposal
    }
  })
  console.log('createProposal done', res.data.createProposal.proposal)
  return res.data.createProposal.proposal
}

export const updateProposal = async (proposal: any) => {
  return await client.mutate({
    mutation: UPDATE_PROPOSAL,
    variables: {
      proposal
    }
  })
}

export const deleteProposal = async (revisionId: string) => {
  return await client.mutate({
    mutation: DELETE_PROPOSAL,
    variables: {
      revisionId
    }
  })
}

export const createIntent = async (intent: IntentCreateParams) => {
  return await client.mutate({
    mutation: CREATE_INTENT,
    variables: {
      intent
    }
  })
}

export const updateIntent = async (intent: any) => {
  return await client.mutate({
    mutation: UPDATE_INTENT,
    variables: {
      intent
    }
  })
}

export const deleteIntent = async (revisionId: string) => {
  return await client.mutate({
    mutation: DELETE_INTENT,
    variables: {
      revisionId
    }
  })
}