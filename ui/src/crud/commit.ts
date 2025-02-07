import { gql } from 'graphql-tag'
import type { AgentConnection, Agent, Organization, OrganizationCreateParams, EconomicResourceUpdateParams, OrganizationUpdateParams, 
  EconomicEvent, RecipeProcessCreateParams, RecipeFlowCreateParams, RecipeFlowUpdateParams } from '@leosprograms/vf-graphql'
import { setActions, clientStored, clientHC, setAgents, updateAnAgent, setUnits, setResourceSpecifications, setProcessSpecifications, setProposals, 
  setHashChanges, setEconomicEvents, setEconomicResources, addToHashChanges, addAUnit, 
  updateAUnit, removeAnAgreement, addAnAgreement,
  addAnAgent,
  removeAnAgent} from './store'
import { WeaveClient, isWeContext, initializeHotReload, type WAL} from '@lightningrodlabs/we-applet';
import { appletServices } from '../../we';
import { getAllHashChanges } from './fetch'
import type { ProcessCreateParams } from '@leosprograms/vf-graphql';
import { decode } from '@msgpack/msgpack';
import { formatResItem, snakeToCamel, camelToSnake, pull, realizeLinks, fetchSet, findAndDecodeQuantityValueFields } from './shared'
import { decodeHashFromBase64, encodeHashToBase64, type ActionHash } from '@holochain/client'

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
      addToHashChanges({ original, current: newHash })
      // getAllHashChanges()
  } else {
    client0.callZome({
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
  }
}

// function decodeHashFields(obj: any, hashFields: string[]) {
//   hashFields.forEach(field => {
//     console.log(field, obj[field])
//     if (obj[field] != null) obj[field] = decodeHashFromBase64(obj[field])
//   })
//   return obj
// }

// detect Date values and convert them recursively to numbers
const timestampFields = ['hasBeginning', 'hasEnd', 'due', 'createdAt', 'created', 'hasPointInTime']
function changeAllTimestampsToNumbers(obj: any) {
  for (let key in obj) {
    if (obj[key] !== null) {
      if (timestampFields.includes(key)) {
        const date = new Date(obj[key])
        console.log('date', date)
        obj[key] = isNaN(date.getTime()) ? null : date.getTime()
      } else if (typeof obj[key] === 'object') {
        changeAllTimestampsToNumbers(obj[key])
      }
    }
  }
  return obj;
}

async function create(entry_type: string, params: any) {
  console.log('create', entry_type, params)
  
  let changedQuantities = findAndDecodeQuantityValueFields(params)
  console.log('changed quantities', changedQuantities)
  let convertedTimestamps = changeAllTimestampsToNumbers(changedQuantities)
  // console.log('convertedTimestamps', convertedTimestamps)
  let snakecaseParams = camelToSnake(convertedTimestamps)
  // console.log('snakecaseParams', snakecaseParams)
  // let weClient = WeaveClient.connect(appletServices);
  delete snakecaseParams.id
  delete snakecaseParams.revision_id
  console.log('final params', snakecaseParams)
  const res = await client0.callZome({
    cap_secret: null,
    role_name: 'hrea',
    zome_name: 'hrea',
    fn_name: `create_${entry_type}`,
    payload: snakecaseParams,
  })
  return formatResItem( res, res.signed_action.hashed.hash )
}

async function removeNullAndUndefinedFields(obj: any) {
  for (let key in obj) {
    if (obj[key] == null) {
      delete obj[key]
    } else if (typeof obj[key] === 'object') {
      removeNullAndUndefinedFields(obj[key])
    }
  }
  return obj;
}

async function update(entry_type: string, params: any) {
  console.log('update', entry_type, params)
  let sanitized = await removeNullAndUndefinedFields(params)
  let changedQuantities = findAndDecodeQuantityValueFields(sanitized)
  console.log("changed quantities", changedQuantities)
  let convertedTimestamps = changeAllTimestampsToNumbers(changedQuantities)
  let snakecaseParams = camelToSnake(convertedTimestamps)
  const originalId = snakecaseParams.id
  delete snakecaseParams.id
  delete snakecaseParams.revision_id
  console.log('snakecaseParams', snakecaseParams)
  params[`original_${entry_type}_id`] = params.id
  console.log(params)
  const updateObj = {
    [`original_${entry_type}_hash`]: decodeHashFromBase64(params.id),
    [`previous_${entry_type}_hash`]: decodeHashFromBase64(params.revisionId),
    [`updated_${entry_type}`]: snakecaseParams
  }
  console.log('final params', updateObj)
  const res = await client0.callZome({
    cap_secret: null,
    role_name: 'hrea',
    zome_name: 'hrea',
    fn_name: `update_${entry_type}`,
    payload: updateObj,
  })
  return formatResItem( res, decodeHashFromBase64(originalId) )
}

async function destroy(entry_type: string, revisionId: string) {
  console.log('delete', entry_type, revisionId)
  const res = await client0.callZome({
    cap_secret: null,
    role_name: 'hrea',
    zome_name: 'hrea',
    fn_name: `delete_${entry_type}`,
    payload: decodeHashFromBase64(revisionId),
  })
  return res
}

export const createUnit = async (unit: any) => {
  const newUnit = await create('rea_unit', unit)
  addAUnit( newUnit )
  return newUnit

  // const res = await client.mutate({
  //   mutation: ADD_UNIT,
  //   variables: {
  //     unit
  //   }
  // });
  // addAUnit(res.data.createUnit.unit)
  // return res
}

export const updateUnit = async (unit: any) => {
  const revisionId = unit.revisionId
  let updatedUnit = await update('rea_unit', unit)
  updatedUnit.revisionId = revisionId
  console.log('updatedUnit', updatedUnit)
  updateAUnit(updatedUnit)
  return updatedUnit

  // const res = await client.mutate({
  //   mutation: UPDATE_UNIT,
  //   variables: {
  //     unit
  //   }
  // });
  // updateAUnit(res.data.updateUnit.unit)
  // return res
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

  // const res = await client.mutate({
  //   mutation: ADD_FACET_GROUP,
  //   variables: {
  //     facetGroup
  //   }
  // });
  // return res
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

export const createProcessSpecification = async (process: ProcessCreateParams) => {
  const res = await create('rea_process_specification', process)
  return res

  // const res = await client.mutate({
  //   mutation: ADD_PROCESS_SPECIFICATION,
  //   variables: {
  //     process
  //   }
  // });
  // return res
};

export const updateProcessSpecification = async (process: any) => {
  const updatedPSpec = await update('rea_process_specification', process)
  return updatedPSpec

  // const res = await client.mutate({
  //   mutation: UPDATE_PROCESS_SPECIFICATION,
  //   variables: {
  //     process
  //   }
  // });
  // return res
};

export const deleteProcessSpecification = async (revisionId: string) => {
  await destroy('rea_process_specification', revisionId)

  // return await client.mutate({
  //   mutation: DELETE_PROCESS_SPECIFICATION,
  //   variables: {
  //     revisionId
  //   }
  // });
};

export const createResourceSpecification = async (resource: any) => {
  // console.log('createResourceSpecification', resource)
  // const formattedResource = decodeHashFields(resource, ['defaultUnitOfResource'])
  // console.log('createResourceSpecification', resource, formattedResource)
  const newResSpec = await create('rea_resource_specification', resource)
  return newResSpec

  // const res = await client.mutate({
  //   mutation: ADD_RESOURCE_SPECIFICATION,
  //   variables: {
  //     resource
  //   }
  // });
  // return res
};

export const associateResourceSpecificationAndFacetValue = async (identifier: string, facetValueId: string) => {
  console.log('associateResourceSpecificationAndFacetValue', identifier, facetValueId)
  let fs = await client0.callZome({
    cap_secret: null,
    role_name: 'hrea_facets_0',
    zome_name: 'hc_facets',
    fn_name: 'use_facet_value',
    payload: { 
      'identifier': identifier,
      'facetValueId': facetValueId 
    },
  })
  return fs

  // return await client.mutate({
  //   mutation: ASSOCIATE_RESOURCE_SPECIFICATION_AND_FACET_VALUE,
  //   variables: {
  //     identifier,
  //     facetValueId,
  //   }
  // })
}

export const updateResourceSpecification = async (resource: any) => {
  const updatedResSpec = await update('rea_resource_specification', resource)
  return updatedResSpec

  // const res = await client.mutate({
  //   mutation: UPDATE_RESOURCE_SPECIFICATION,
  //   variables: {
  //     resource
  //   }
  // });
  // return res
};

export const deleteResourceSpecification = async (revisionId: string) => {
  await destroy('rea_resource_specification', revisionId)
};

export const createAgent = async (agent: OrganizationCreateParams) => {
  console.log('createAgent', agent)
  agent.agentType = 'Organization'
  const newAgent = await create('rea_agent', agent)
  console.log('newAgent', newAgent)
  // addAnAgent(newAgent)
  return newAgent
  
  // const res = await client.mutate({
  //   mutation: ADD_AGENT,
  //   variables: {
  //     agent
  //   }
  // });
  // return res
};

export const updateAgent = async (agent: OrganizationUpdateParams) => {
  const updatedAgent = await update('rea_agent', agent)
  updateAnAgent(updatedAgent)
  return updatedAgent
  
  // const res = await client.mutate({
  //   mutation: UPDATE_AGENT,
  //   variables: {
  //     agent
  //   }
  // })
  // return res
}

export const associateAgentWithValue = async (identifier: string, facetValueId: string) => {
  let fs = await client0.callZome({
    cap_secret: null,
    role_name: 'hrea_facets_0',
    zome_name: 'hc_facets',
    fn_name: 'use_facet_value',
    payload: { 
      'identifier': identifier,
      'facetValueId': facetValueId 
    },
  })

  let fs2 = await client0.callZome({
    cap_secret: null,
    role_name: 'hrea_facets_0',
    zome_name: 'hc_facets',
    fn_name: 'retrieve_facet_values',
    payload: { 'identifier': identifier },
  })

  console.log('associated ?', fs, fs2)
}

export const deleteAgent = async (revisionId: string) => {
  await destroy('rea_agent', revisionId)
  removeAnAgent(revisionId)
  // return await client.mutate({
  //   mutation: gql`
  //     mutation {
  //       deleteOrganization(revisionId: "${revisionId}")
  //     }
  //   `
  // })
}

export const createEconomicEvent = async (event: any) => {
  console.log('createEconomicEvent', event)
  const res = await create('rea_economic_event', event)
  return res

  // return await client.mutate({
  //   mutation: CREATE_ECONOMIC_EVENT,
  //   variables: {
  //     event,
  //   }
  // })
}

export const deleteEconomicEvent = async (id: string) => {
  await destroy('rea_economic_event', id)

  // return await client.mutate({
  //   mutation: gql`
  //     mutation {
  //       deleteEconomicEvent(revisionId: "${revisionId}")
  //     }
  //   `
  // })
}

export const createEconomicEventWithResource = async (economic_event: any, resource: any) => {
  console.log('createEconomicEventWithResource', economic_event, resource)
  const res = await create('economic_event_with_resource', {
    economic_event,
    resource
  })
  console.log('createEconomicEventWithResource', res)
  return res

  // return await client.mutate({
  //   mutation: CREATE_ECONOMIC_EVENT_WITH_RESOURCE,
  //   variables: {
  //     event,
  //     newInventoriedResource
  //   }
  // })
}

export const updateEconomicResource = async (resource: EconomicResourceUpdateParams) => {
  console.log('updateEconomicResource', resource)
  const updatedResource = await update('rea_economic_resource', resource)
  return updatedResource

  // console.log('updateEconomicResource', resource)
  // return await client.mutate({
  //   mutation: UPDATE_ECONOMIC_RESOURCE,
  //   variables: {
  //     resource
  //   }
  // })
}

export const createFulfillment = async (fulfillment: any) => {
  console.log('createFulfillment', fulfillment)
  const res = await create('rea_fulfillment', fulfillment)
  return res

  // return await client.mutate({
  //   mutation: CREATE_FULFILLMENT,
  //   variables: {
  //     fulfillment
  //   }
  // })
}

export const updateCommitment = async (commitment: any) => {
  console.log("Update commitment", commitment)
  // const commitmentFields = decodeHashFields(commitment, ['fulfills'])
  // console.log("Update commitment", commitmentFields)
  commitment.plannedWithin = commitment.plannedWithin?.id ? commitment.plannedWithin.id : commitment.plannedWithin
  commitment.stage = commitment.stage?.id ? commitment.stage.id : commitment.stage
  let updatedCommitment = await update('rea_commitment', commitment)

  if (updatedCommitment.clauseOfId) {
    const agreementCommitmentLinks = await pull('get_rea_commitments_for_rea_agreement', decodeHashFromBase64(updatedCommitment.clauseOfId))
    const agreementCommitments = await realizeLinks('get_latest_rea_commitment', agreementCommitmentLinks)
    updatedCommitment.clauseOf.commitments = agreementCommitments
    console.log("Update commitment", updatedCommitment)
  }
  return updatedCommitment

  // console.log("Update commitment", JSON.stringify(commitment))
  // return await client.mutate({
  //   mutation: UPDATE_COMMITMENT,
  //   variables: {
  //     commitment
  //   }
  // })
}

export const createCommitmentResponsive = async (commitment: any) => {
  
}

export const createCommitment = async (commitment: any) => {
  // const commitmentFields = decodeHashFields(commitment, ['fulfills'])
  // console.log('createCommitment', commitmentFields)
  commitment.plannedWithin = commitment.plannedWithin?.id ? commitment.plannedWithin.id : commitment.plannedWithin
  commitment.stage = commitment.stage?.id ? commitment.stage.id : commitment.stage
  const newCommitment = await create('rea_commitment', commitment)
  console.log('newCommitment', newCommitment)
  return newCommitment

  // return await client.mutate({
  //   mutation: CREATE_COMMITMENT,
  //   variables: {
  //     commitment
  //   }
  // })
}

export const createAgreement = async (ag: any) => {
  console.log("create agreement", ag)
  const newAgreement = await create('rea_agreement', ag)
  console.log("create agreement", newAgreement)
  addAnAgreement(newAgreement)
  return newAgreement

  // let res = await client.mutate({
  //   mutation: CREATE_AGREEMENT,
  //   variables: {
  //     ag
  //   }
  // })
  // console.log("create agreement", res)
  // return res.data.createAgreement.agreement
}

export const deleteCommitment = async (revisionId: string) => {
  await destroy('rea_commitment', revisionId)

  // console.log("DELETING COMMITMENT", revisionId)
  // return await client.mutate({
  //   mutation: DELETE_COMMITMENT,
  //   variables: {
  //     revisionId
  //   }
  // })
}

export const deleteAgreement = async (id: string) => {
  await destroy('rea_agreement', id)
  console.log("destroyed agreement")
  removeAnAgreement(id)
  console.log("removed agreement")

  // console.log("delete agreement", revisionId)
  // return await client.mutate({
  //   mutation: gql`
  //     mutation {
  //       deleteAgreement(revisionId: "${revisionId}")
  //     }
  //   `
  // })
}

export const updateAgreement = async (ag: any) => {
  console.log("update agreement", ag)
  const updatedAgreement = await update('rea_agreement', ag)
  console.log("update agreement", updatedAgreement)
  return updatedAgreement
  // let res = await client.mutate({
  //   mutation: UPDATE_AGREEMENT,
  //   variables: {
  //     ag
  //   }
  // })
  // return res.data.updateAgreement.agreement
}

export const createPlan = async (plan: any) => {
  const newPlan = await create('rea_plan', plan)
  return newPlan

  // return await client.mutate({
  //   mutation: CREATE_PLAN,
  //   variables: {
  //     plan
  //   }
  // })
}

export const updatePlan = async (plan: any) => {
  const updatedPlan = await update('rea_plan', plan)
  return updatedPlan

  // return await client.mutate({
  //   mutation: UPDATE_PLAN,
  //   variables: {
  //     plan
  //   }
  // })
}

export const deletePlan = async (revisionId: string) => {
  await destroy('rea_plan', revisionId)

  // return await client.mutate({
  //   mutation: DELETE_PLAN,
  //   variables: {
  //     revisionId
  //   }
  // })
}

export const createProcess = async (process: any) => {
  console.log('createProcess', process)
  process.finished = process.finished ? process.finished : false
  const newProcess = await create('rea_process', process)
  console.log('createProcess', newProcess)
  return newProcess

  // return await client.mutate({
  //   mutation: CREATE_PROCESS,
  //   variables: {
  //     process
  //   }
  // })
}

export const updateProcess = async (process: any) => {
  const updatedProcess = await update('rea_process', process)
  return updatedProcess
}

export const deleteProcess = async (revisionId: string) => {
  await destroy('rea_process', revisionId)
}

export const createRecipeFlow = async (recipeFlow: RecipeFlowCreateParams) => {
  // recipeFlow = decodeHashFields(recipeFlow, ['recipeInputOf', 'recipeOutputOf', 'resourceConformsTo', 'stage', 'processConformsTo'])
  // delete recipeFlow.resourceQuantity
  recipeFlow.resourceQuantity = {
    has_numerical_value: recipeFlow.resourceQuantity?.hasNumericalValue,
    has_unit: recipeFlow.resourceQuantity.hasUnit//decodeHashFromBase64(recipeFlow.resourceQuantity.hasUnit)
  }
  console.log('createRecipeFlow', recipeFlow)
  const newRecipeFlow = await create('rea_recipe_flow', recipeFlow)
  console.log('createRecipeFlow', newRecipeFlow)
  return newRecipeFlow

  // console.log('createRecipeFlow', recipeFlow)
  // const res = await client.mutate({
  //   mutation: CREATE_RECIPE_FLOW,
  //   variables: {
  //     recipeFlow
  //   }
  // })
  // console.log('createRecipeFlow', res)
  // return res
}

export const updateRecipeFlow = async (recipeFlow: RecipeFlowUpdateParams) => {
  // recipeFlow = decodeHashFields(recipeFlow, ['recipeInputOf', 'recipeOutputOf', 'resourceConformsTo', 'stage', 'processConformsTo'])
  // delete recipeFlow.resourceQuantity
  recipeFlow.resourceQuantity = {
    has_numerical_value: recipeFlow.resourceQuantity?.hasNumericalValue,
    has_unit: recipeFlow.resourceQuantity.hasUnit//decodeHashFromBase64(recipeFlow.resourceQuantity.hasUnit)
  }
  console.log('updateRecipeFlow', recipeFlow)
  const updatedRecipeFlow = await update('rea_recipe_flow', recipeFlow)
  console.log('updateRecipeFlow', updatedRecipeFlow)
  return updatedRecipeFlow

  // console.log('updateRecipeFlow', recipeFlow)
  // const res = await client.mutate({
  //   mutation: UPDATE_RECIPE_FLOW,
  //   variables: {
  //     recipeFlow
  //   }
  // })
  // console.log('updateRecipeFlow', res)
  // return res
}

export const deleteRecipeFlow = async (revisionId: string) => {
  await destroy('rea_recipe_flow', revisionId)
}

export const createRecipeProcess = async (recipeProcess: RecipeProcessCreateParams) => {
  // recipeProcess = decodeHashFields(recipeProcess, ['processConformsTo'])
  // console.log('createRecipeProcess', recipeProcess)
  const res = await create('rea_recipe_process', recipeProcess)
  console.log('createRecipeProcess', res)
  return res

  // return await client.mutate({
  //   mutation: CREATE_RECIPE_PROCESS,
  //   variables: {
  //     recipeProcess
  //   }
  // })
}

export const updateRecipeProcess = async (recipeProcess: any) => {
  console.log('updateRecipeProcess', recipeProcess)
  const res = await update('rea_recipe_process', recipeProcess)
  console.log('updateRecipeProcess', res)
  return res

  // return await client.mutate({
  //   mutation: UPDATE_RECIPE_PROCESS,
  //   variables: {
  //     recipeProcess
  //   }
  // })
}

export const deleteRecipeProcess = async (revisionId: string) => {
  await destroy('rea_recipe_process', revisionId)
  // return await client.mutate({
  //   mutation: DELETE_RECIPE_PROCESS,
  //   variables: {
  //     revisionId
  //   }
  // })
}

export const createRecipeExchange = async (recipeExchange: any) => {
  console.log('createRecipeExchange', recipeExchange)
  const res = await create('rea_recipe_exchange', recipeExchange)
  console.log('createRecipeExchange', res)
  return res  

  // return await client.mutate({
  //   mutation: CREATE_RECIPE_EXCHANGE,
  //   variables: {
  //     recipeExchange
  //   }
  // })
}

export const updateRecipeExchange = async (recipeExchange: any) => {
  console.log('updateRecipeExchange', recipeExchange)
  const res = await update('rea_recipe_exchange', recipeExchange)
  console.log('updateRecipeExchange', res)
  return res

  // return await client.mutate({
  //   mutation: UPDATE_RECIPE_EXCHANGE,
  //   variables: {
  //     recipeExchange
  //   }
  // })
}

export const deleteRecipeExchange = async (revisionId: string) => {
  await destroy('rea_recipe_exchange', revisionId)
}

export const createProposal = async (proposal: any) => {
  console.log('createProposal', proposal)
  const res = await create('rea_proposal', proposal)
  console.log('createProposal', res)
  return res

  // console.log('createProposal', proposal)
  // return await client.mutate({
  //   mutation: CREATE_PROPOSAL,
  //   variables: {
  //     proposal
  //   }
  // })
}

export const updateProposal = async (proposal: any) => {
  console.log('updateProposal', proposal)
  const res = await update('rea_proposal', proposal)
  console.log('updateProposal', res)
  return res

  // return await client.mutate({
  //   mutation: UPDATE_PROPOSAL,
  //   variables: {
  //     proposal
  //   }
  // })
}

export const deleteProposal = async (revisionId: string) => {
  await destroy('rea_proposal', revisionId)

  // return await client.mutate({
  //   mutation: DELETE_PROPOSAL,
  //   variables: {
  //     revisionId
  //   }
  // })
}

export const createIntent = async (intent: any) => {
  console.log('createIntent', intent)
  return await create('rea_intent', intent)

  // return await client.mutate({
  //   mutation: CREATE_INTENT,
  //   variables: {
  //     intent
  //   }
  // })
}

export const updateIntent = async (intent: any) => {
  console.log('updateIntent', intent)
  return await update('rea_intent', intent)

  // return await client.mutate({
  //   mutation: UPDATE_INTENT,
  //   variables: {
  //     intent
  //   }
  // })
}

export const deleteIntent = async (revisionId: string) => {
  return await destroy('rea_intent',
    revisionId
  )

  // return await client.mutate({
  //   mutation: DELETE_INTENT,
  //   variables: {
  //     revisionId
  //   }
  // })
}

export const createProposedIntent = async (reciprocal: boolean, publishedIn: string, publishes: string) => {
  return await create('rea_proposed_intent', {reciprocal, publishedIn, publishes})

  // console.log('createProposedIntent', reciprocal, publishedIn, publishes)
  // return await client.mutate({
  //   mutation: CREATE_PROPOSED_INTENT,
  //   variables: {
  //     reciprocal,
  //     publishedIn,
  //     publishes
  //   }
  // })
}

export const updateProposedIntent = async (reciprocal: boolean, publishedIn: string, publishes: string) => {
  return await update('rea_proposed_intent', {reciprocal, publishedIn, publishes})
  // return await client.mutate({
  //   mutation: UPDATE_PROPOSED_INTENT,
  //   variables: {
  //     reciprocal,
  //     publishedIn,
  //     publishes
  //   }
  // })
}

export const deleteProposedIntent = async (revisionId: string) => {
  return await destroy('rea_proposed_intent', revisionId)
  // return await client.mutate({
  //   mutation: DELETE_PROPOSED_INTENT,
  //   variables: {
  //     revisionId
  //   }
  // })
}