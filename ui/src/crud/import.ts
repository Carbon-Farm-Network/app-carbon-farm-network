import type { CommitmentCreateParams, PlanCreateParams, ProcessCreateParams,  Process, AgentCreateParams, 
  ProcessSpecificationCreateParams, AgreementCreateParams, EconomicEventCreateParams, FulfillmentCreateParams, Fulfillment, RecipeProcessCreateParams, RecipeFlowCreateParams, RecipeExchangeCreateParams } from "@leosprograms/vf-graphql"
import type { FacetParams, FacetGroupParams } from "$lib/graphql/extension-schemas"
// import { addHashChange, createCommitment, createAgreement, createPlan, createProcess, createEconomicEvent, 
//   createEconomicEventWithResource, createFulfillment, createUnit, createFacetGroup, createFacet, 
//   createFacetValue, createAgent, associateAgentWithValue, associateResourceSpecificationAndFacetValue,
//   createProcessSpecification } from "./commit"
import * as c from "./commit"
import { allHashChanges, allProcessSpecifications, allUnits } from "./store"

let hashChanges: any = {}
allHashChanges.subscribe(value => {
  delete value.undefined
  hashChanges = value
})

let processSpecifications: any = []
allProcessSpecifications.subscribe(value => {
  processSpecifications = value
})

let units: any = []
allUnits.subscribe(value => {
  units = value
})

export async function importRecipeExchanges(data: any) {
  for (let i = 0; i < data.length; i++) {
    let recipeExchange = data[i]
    console.log(recipeExchange)
    let recipeExchangeCreateParams: RecipeExchangeCreateParams = {
      name: recipeExchange.name,
      note: recipeExchange.note,
    }
    console.log(recipeExchangeCreateParams)
    const res = await c.createRecipeExchange(recipeExchangeCreateParams)
    await c.addHashChange(recipeExchange.id, res.id)//res.data.createRecipeExchange.recipeExchange.id)

    let recipeFlows = [...recipeExchange.recipeClauses, ...recipeExchange.recipeReciprocalClauses]
    const recipeClausesLength = recipeExchange.recipeClauses.length
    for (let j = 0; j < recipeFlows.length; j++) {
      let recipeFlow = recipeFlows[j]
      console.log("recipeFlow", recipeFlow)
      let recipeFlowCreateParams: RecipeFlowCreateParams = {
        action: recipeFlow.action.id,
        effortQuantity: recipeFlow.effortQuantity,
        providerRole: recipeFlow.providerRole,
        receiverRole: recipeFlow.receiverRole,
        instructions: recipeFlow.instructions,
        note: recipeFlow.note,
        resourceConformsTo: hashChanges[recipeFlow.resourceConformsTo.id] ? hashChanges[recipeFlow.resourceConformsTo.id] : recipeFlow.resourceConformsTo.id,
        resourceQuantity: {
          hasUnit: hashChanges[recipeFlow.resourceQuantity.hasUnit.id] ? hashChanges[recipeFlow.resourceQuantity.hasUnit.id] : recipeFlow.resourceQuantity.hasUnit.id,
          hasNumericalValue: recipeFlow.resourceQuantity.hasNumericalValue
        },
        stage: hashChanges[recipeFlow.stage?.id] ? hashChanges[recipeFlow.stage?.id] : recipeFlow.stage?.id,
        state: recipeFlow.state,
      }
      if (j < recipeClausesLength) {
        recipeFlowCreateParams.recipeClauseOf = hashChanges[recipeExchange.id]
      } else {
        recipeFlowCreateParams.recipeReciprocalClauseOf = hashChanges[recipeExchange.id]
      }
      console.log(recipeFlowCreateParams)
      const res2 = await c.createRecipeFlow(recipeFlowCreateParams)
      await c.addHashChange(recipeFlow.id, res2.id) //.data.createRecipeFlow.recipeFlow.id)
    }
  }
}
  

export async function importRecipes(data: any) {
  for (let i = 0; i < data.length; i++) {
    let recipe = data[i]
    console.log(recipe)

    const foundProcessConformsToHashChange = hashChanges[recipe.processConformsToId]
    console.log("foundProcessConformsToHashChange", recipe.processConformsToId, foundProcessConformsToHashChange, hashChanges)

    let recipeProcessCreateParams: RecipeProcessCreateParams = {
      name: recipe.name,
      note: recipe.note,
      hasDuration: recipe.hasDuration,
      processClassifiedAs: hashChanges[recipe.processClassifiedAs?.id] ? hashChanges[recipe.processClassifiedAs?.id] : recipe.processClassifiedAs?.id,
      processConformsTo: hashChanges[recipe.processConformsTo?.id] ? hashChanges[recipe.processConformsTo?.id] : recipe.processConformsTo?.id,
    }
    if (recipe.processConformsToId) {
      recipeProcessCreateParams.processConformsTo = hashChanges[recipe.processConformsToId] ? hashChanges[recipe.processConformsToId] : recipe.processConformsToId
    }

    console.log(recipeProcessCreateParams)
    const res = await c.createRecipeProcess(recipeProcessCreateParams)
    console.log(res)
    await c.addHashChange(data[i].id, res.id)//res.data.createRecipeProcess.recipeProcess.id)
    console.log("hash change rec process", hashChanges[data[i].id])

    let recipeFlows = [...recipe.recipeInputs, ...recipe.recipeOutputs]
    const recipeInputsLength = recipe.recipeInputs.length
    for (let j = 0; j < recipeFlows.length; j++) {
      let recipeFlow = recipeFlows[j]
      console.log("recipeFlow", recipeFlow)
      let recipeFlowCreateParams: RecipeFlowCreateParams = {
        action: recipeFlow.action.id,
        effortQuantity: recipeFlow.effortQuantity,
        providerRole: recipeFlow.providerRole,
        receiverRole: recipeFlow.receiverRole,
        instructions: recipeFlow.instructions,
        note: recipeFlow.note,
        resourceConformsTo: hashChanges[recipeFlow.resourceConformsTo.id] ? hashChanges[recipeFlow.resourceConformsTo.id] : recipeFlow.resourceConformsTo.id,
        resourceQuantity: {
          hasUnit: hashChanges[recipeFlow.resourceQuantity.hasUnit.id] ? hashChanges[recipeFlow.resourceQuantity.hasUnit.id] : recipeFlow.resourceQuantity.hasUnit.id,
          hasNumericalValue: recipeFlow.resourceQuantity.hasNumericalValue
        },
        stage: hashChanges[recipeFlow.stage?.id] ? hashChanges[recipeFlow.stage?.id] : recipeFlow.stage?.id,
        state: recipeFlow.state,
      }
      if (j < recipeInputsLength) {
        recipeFlowCreateParams.recipeInputOf = res.id //res.data.createRecipeProcess.recipeProcess.id
      } else {
        recipeFlowCreateParams.recipeOutputOf = res.id //res.data.createRecipeProcess.recipeProcess.id
      }
      console.log(recipeFlowCreateParams)
      const res2 = await c.createRecipeFlow(recipeFlowCreateParams)
      await c.addHashChange(recipeFlow.id, res2.id) //.data.createRecipeFlow.recipeFlow.id)
    }
  }
}

export async function importProposals(data: any) {
  console.log(data)
  for (let i = 0; i < data.length; i++) {
    let intent = data[i]?.publishes?.find(({ reciprocal }) => !reciprocal)?.publishes

    if (intent) {
      // delete revisionId and typename from intent
      delete intent?.revisionId
      delete intent?.__typename
      console.log(intent)
      if (!intent.resourceConformsTo) { console.log("Stopped import due to dependency data"); return }
      
      // Assign the correct values to the intent
      intent.action = intent.action.id
      intent.resourceConformsTo = hashChanges[intent.resourceConformsTo.id] ? hashChanges[intent.resourceConformsTo.id] : intent.resourceConformsTo.id
      intent.provider = hashChanges[intent.provider?.id] ? hashChanges[intent.provider?.id] : intent.provider?.id
      intent.receiver = hashChanges[intent.receiver?.id] ? hashChanges[intent.receiver?.id] : intent.receiver?.id
      intent.resourceQuantity = {
        hasUnit: hashChanges[intent.resourceQuantity.hasUnit.id] ? hashChanges[intent.resourceQuantity.hasUnit.id] : intent.resourceQuantity.hasUnit.id,
        hasNumericalValue: intent.resourceQuantity.hasNumericalValue
      }
      intent.availableQuantity.hasUnit = intent.availableQuantity = {
        hasUnit: hashChanges[intent.availableQuantity.hasUnit.id] ? hashChanges[intent.availableQuantity.hasUnit.id] : intent.availableQuantity.hasUnit.id,
        hasNumericalValue: intent.availableQuantity.hasNumericalValue
      }
    }
  
    // Assign the correct values to the reciprocal intent
    let reciprocalIntent = data[i]?.publishes?.find(({ reciprocal }) => reciprocal)?.publishes
    if (reciprocalIntent) {
      // delete revisionId and typename from intent
      delete reciprocalIntent?.revisionId
      delete reciprocalIntent?.__typename
      console.log(reciprocalIntent)
      reciprocalIntent.action = reciprocalIntent.action.id
      reciprocalIntent.provider = hashChanges[reciprocalIntent?.provider?.id] ? hashChanges[reciprocalIntent?.provider?.id] : reciprocalIntent?.provider?.id
      reciprocalIntent.receiver = hashChanges[reciprocalIntent?.receiver?.id] ? hashChanges[reciprocalIntent?.receiver?.id] : reciprocalIntent?.receiver?.id
      reciprocalIntent.resourceConformsTo = hashChanges[reciprocalIntent.resourceConformsTo.id] ? hashChanges[reciprocalIntent.resourceConformsTo.id] : reciprocalIntent.resourceConformsTo.id
      reciprocalIntent.resourceQuantity = {
        hasNumericalValue: reciprocalIntent.resourceQuantity.hasNumericalValue,
        hasUnit: hashChanges[reciprocalIntent.resourceQuantity?.hasUnit?.id] ? hashChanges[reciprocalIntent.resourceQuantity?.hasUnit?.id] : reciprocalIntent.resourceQuantity?.hasUnit?.id
      }
      delete reciprocalIntent.revisionId
      delete reciprocalIntent.__typename
    }

    console.log("----")
    console.log(intent)
    console.log(reciprocalIntent)

    if (!intent && !reciprocalIntent) {
      console.log("No intent or reciprocal intent, skipping")
      continue
    }

    let proposal = {
      hasBeginning: data[i].hasBeginning,
      unitBased: data[i].unitBased,
      note: data[i].note,
    }

    console.log(proposal)
    
    // Create the proposal
    const proposalRes = await c.createProposal(proposal)
    // Add hash change
    await c.addHashChange(data[i].id, proposalRes.id)//.data.createProposal.proposal.id)

    if (intent) {
      // Create the intent
      delete intent.note
      console.log("1", intent)
      delete intent.id
      const intentRes = await c.createIntent(intent)
      console.log("2", intentRes)
      // Add hash change
      await c.addHashChange(intent.id, intentRes.id)//.data.createIntent.intent.id)
      console.log("added hash change", intent.id, intentRes.id)//.data.createIntent.intent.id)
      // Create the proposed intent
      // console.log(false, intentRes.data.createIntent.intent.id, proposalRes.data.createProposal.proposal.id)
      await c.createProposedIntent(false, proposalRes.id, intentRes.id)
      // await c.createProposedIntent(false, proposalRes.data.createProposal.proposal.id, intentRes.data.createIntent.intent.id)
      console.log("created proposed intent")
    }

    if (reciprocalIntent) {
      // Create the reciprocal intent
      console.log("3", reciprocalIntent)
      delete reciprocalIntent.id
      const recipIntentRes = await c.createIntent(reciprocalIntent)
      console.log("4", recipIntentRes)
      // Add hash change
      await c.addHashChange(reciprocalIntent.id, recipIntentRes.id)//.data.createIntent.intent.id)
      // Create the reciprocal proposed intent
      await c.createProposedIntent(true, proposalRes.id, recipIntentRes.id)
      // await c.createProposedIntent(true, proposalRes.data.createProposal.proposal.id, recipIntentRes.data.createIntent.intent.id)
    }    
  }
}

export async function importResourceSpecifications(data: any) {
  console.log(data)
  for (let i = 0; i < data.length; i++) {
    const resourceSpecification = data[i]
    const hashChangeOfDefaultUnit = hashChanges[resourceSpecification.defaultUnitOfResource.id]
    console.log("hashChangeOfDefaultUnit", resourceSpecification.defaultUnitOfResource.id, hashChangeOfDefaultUnit, hashChanges)
    const resourceSpecificationCreateParams = {
      name: resourceSpecification.name,
      defaultUnitOfResource: hashChanges[resourceSpecification.defaultUnitOfResource.id] ? hashChanges[resourceSpecification.defaultUnitOfResource.id] : resourceSpecification.defaultUnitOfResource.id,
      note: resourceSpecification.note,
      image: resourceSpecification.image,
    }

    const res = await c.createResourceSpecification(resourceSpecificationCreateParams)
    const identifier = res.id//.data.createResourceSpecification.resourceSpecification.id
    await c.addHashChange(data[i].id, identifier)
    try {
      const selectedFacets = data[i].facets?.map((f: any) => hashChanges[f.id] ? hashChanges[f.id] : f.id)
      // for each facet in selectedFacets, associate the agent with the selected value
      for (let facet in selectedFacets) {
        console.log(facet)
        console.log(selectedFacets)
        console.log(selectedFacets[facet])
        if (selectedFacets[facet] == null) {
          continue
        }
        await c.associateResourceSpecificationAndFacetValue(identifier, selectedFacets[facet])
      }
    }
    catch (e) {
      console.log(e)
    }
  }
}

export async function importProcessSpecifications(data: any) {
  for (let i = 0; i < data.length; i++) {
    let currentProcessSpecification = data[i]
    let process: ProcessSpecificationCreateParams = {
      name: currentProcessSpecification.name,
      note: currentProcessSpecification.note,
      image: currentProcessSpecification.image,
    }
    const res = await c.createProcessSpecification(process)
    console.log(res)
    await c.addHashChange(data[i].id, res.id)//.data.createProcessSpecification.processSpecification.id)
  }
}

export async function importAgents(data: any) {
  console.log(data)

  for (let i = 0; i < data.length; i++) {
    let agent: AgentCreateParams = {
      name: data[i].name,
      note: data[i].note,
      image: data[i].image,
      classifiedAs: data[i].classifiedAs,
    }
    let facets = data[i].facets.map((f) => hashChanges[f.id])
    console.log(agent)

    const res = await c.createAgent(agent)
    // const identifier = res.data.createOrganization.agent.id
    const identifier = res.id
    // for each facet in selectedFacets, associate the agent with the selected value
    for (let facet in facets) {
      if (facets[facet] == null) {
        continue
      }
      const res2 = await c.associateAgentWithValue(identifier, facets[facet])
      console.log("associate", res2)
    }

    console.log(res)
    console.log("adding hash change", data[i].id, identifier)
    c.addHashChange(data[i].id, identifier)
  }
}

export async function importUnits(data: any) {
  console.log(data)
  for (const unit of data) {
    const unitCreateParams = {
      label: unit.label,
      symbol: unit.symbol,
      omUnitIdentifier: unit.omUnitIdentifier,
    }
    console.log('importUnit', unitCreateParams)
    const newUnit = await c.createUnit(unitCreateParams)
    await c.addHashChange(unit.id, newUnit.id)
    console.log("added hash change", unit.id, newUnit.id, hashChanges)
  }
}

export async function importFacets(data: any) {
  try {
    console.log(data)
    for (let i = 0; i < data.length; i++) {
      let facetGroupId = data[i].id
      // console.log(facetGroupId)
      // let facetGroup: FacetGroupParams = {
      //   name: data[i].name,
      //   note: data[i].note
      // }
      // let g = await addFacetGroup(facetGroup)
      // console.log(g)

      let facets = data[i].facets || data[i].facetOptions

      for (let j = 0; j < facets.length; j++) {
        let facet: FacetParams = {
          name: facets[j].name,
          note: facets[j].note,
          facetGroupId: facetGroupId
        }
        try {
          let f = await c.createFacet({
            name: facet.name,
            note: facet.note,
            facetGroupId: facetGroupId
          })
          console.log(facets[j].id, f.id)//.data.putFacet.facet.id)
          try {
            await c.addHashChange(facets[j].id, f.id)//.data.putFacet.facet.id)
          } catch (e) {
            console.log(e)
          }

          // add facet values
          let facetValues = facets[j].values || facets[j].facetValues
          for (let k = 0; k < facetValues.length; k++) {
            let facetValue = {
              value: facetValues[k].value,
              note: facetValues[k].note,
              facetId: f.id//.data.putFacet.facet.id
            }
            console.log(facetValue)
            try {
              let fv = await c.createFacetValue(facetValue)
              console.log(fv)
              try {
                await c.addHashChange(facetValues[k].id, fv.id)//.data.putFacetValue.facetValue.id)
              } catch (e) {
                console.log(e)
              }

              console.log(fv)
            } catch (e) {
              console.log(e)
            }
          }
        } catch (e) {
          console.log(e)
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
}

export async function importPlan(fullPlan: any) {
  console.log('importPlan', fullPlan)
  const plan = fullPlan.plan
  const planCreateParams: PlanCreateParams = {
    name: plan.name,
    note: plan.note,
  }
  const res = await c.createPlan(planCreateParams)
  const savedPlan = res.data.createPlan.plan
  console.log('importedPlan', savedPlan)

  // IMPORT INDEPENDENT DEMANDS
  for (const commitment of fullPlan.commitments) {
    const commitmentCreateParams: CommitmentCreateParams = {
        action: commitment.action.id,
        provider: hashChanges[commitment.providerId],// ? hashChanges[commitment.providerId] : commitment.providerId,
        receiver: hashChanges[commitment.receiverId],// ? hashChanges[commitment.receiverId] : commitment.receiverId,
        plannedWithin: savedPlan.id,
        independentDemandOf: savedPlan.id,
        finished: commitment.finished,
        note: commitment.note,
        hasBeginning: commitment.hasBeginning ? commitment.hasBeginning : new Date().toISOString(),
        resourceConformsTo: hashChanges[commitment.resourceConformsTo.id],// ? hashChanges[commitment.resourceConformsTo.id] : commitment.resourceConformsTo.id,
        resourceQuantity: {
          hasNumericalValue: commitment.resourceQuantity?.hasNumericalValue,
          hasUnit: units.find((u: any) => u.id.split(":")[0] === commitment.resourceQuantity?.hasUnitId.split(":")[0])?.id,
        },
    }

    if (!commitment.provider) {
      commitmentCreateParams.provider = commitmentCreateParams.receiver
    }

    console.log('importCommitment', commitmentCreateParams)
    try {
      const res = await c.createCommitment(commitmentCreateParams)
      await c.addHashChange(commitment.id, res.data.createCommitment.commitment.id)
      console.log("added hash change", commitment.id, res.data.createCommitment.commitment.id)
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (e) {
      console.log(e)
    }
  }

  // IMPORT NON-PROCESS COMMITMENTS
  for (const commitment of fullPlan.nonProcessCommitments) {
    if (commitment.action.label === 'transfer' && commitment.stageId && commitment.stageId !== 'undefined') {
      const commitmentCreateParams: CommitmentCreateParams = {
        action: commitment.action.id,
        provider: hashChanges[commitment.providerId],// ? hashChanges[commitment.providerId] : commitment.providerId,
        receiver: hashChanges[commitment.receiverId],// ? hashChanges[commitment.receiverId] : commitment.receiverId,
        plannedWithin: savedPlan.id,
        finished: commitment.finished,
        note: commitment.note,
        stage: hashChanges[commitment.stageId],// ? hashChanges[commitment.stageId] : commitment.stageId,
        hasBeginning: commitment.hasBeginning ? commitment.hasBeginning : new Date().toISOString(),
        resourceConformsTo: hashChanges[commitment.resourceConformsTo.id],// ? hashChanges[commitment.resourceConformsTo.id] : commitment.resourceConformsTo.id,
        resourceQuantity: {
          hasNumericalValue: commitment.resourceQuantity?.hasNumericalValue,
          hasUnit: units.find((u: any) => u.id.split(":")[0] === commitment.resourceQuantity?.hasUnitId.split(":")[0])?.id,
        },
      }
      console.log('importNonProcessCommitment', commitmentCreateParams)
      try {
        const res = await c.createCommitment(commitmentCreateParams)
        await c.addHashChange(commitment.id, res.data.createCommitment.commitment.id)
        console.log("added hash change", commitment.id, res.data.createCommitment.commitment.id)
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (e) {
        console.log(e)
      }
    }
  }

  // ITERATE OVER COLUMNS
  for (const column of fullPlan.allColumns) {
    console.log('importColumn', column)
    for (const process of column) {
      console.log('raw process', process)
      // CREATE PROCESS
      const processCreateParams: ProcessCreateParams = {
        name: process.name,
        note: process.note,
        basedOn: hashChanges[process.basedOn?.id],// ? hashChanges[process.basedOn?.id] : process.basedOn?.id,
        plannedWithin: savedPlan.id,
      }
      console.log('importProcess', processCreateParams)
      console.log(processSpecifications)
      const res = await c.createProcess(processCreateParams)
      const savedProcess = res.data.createProcess.process
      console.log('importedProcess', savedProcess)

      async function processComplexCommitment(commitment: any, side: string) {
        console.log('raw commitment', commitment)
        const commitmentCreateParams: CommitmentCreateParams = {
            action: commitment.action.id,
            provider: hashChanges[commitment.providerId],// ? hashChanges[commitment.providerId] : commitment.providerId,
            receiver: hashChanges[commitment.receiverId],// ? hashChanges[commitment.receiverId] : commitment.receiverId,
            plannedWithin: savedPlan.id,
            finished: commitment.finished,
            note: commitment.note,
            hasBeginning: commitment.hasBeginning ? commitment.hasBeginning : new Date().toISOString(),
            resourceConformsTo: hashChanges[commitment.resourceConformsTo.id], // ? hashChanges[commitment.resourceConformsTo.id] : commitment.resourceConformsTo.id,
            resourceQuantity: {
              hasNumericalValue: commitment.resourceQuantity?.hasNumericalValue,
              hasUnit: units.find((u: any) => u.id.split(":")[0] === commitment.resourceQuantity?.hasUnitId.split(":")[0])?.id,
            },
        }

        commitmentCreateParams[side + 'Of'] = savedProcess.id

        console.log('importCommitment', commitmentCreateParams)

        // IF COST COMMITMENT
        if (commitment.clauseOf) {
            const agreementCreateParams: AgreementCreateParams = {
              name: commitment.clauseOf.name,
              note: commitment.clauseOf.note
            }

            console.log('importAgreement', agreementCreateParams)
            const agreementRes = await c.createAgreement(agreementCreateParams)
            console.log('importedAgreement', agreementRes)
            commitmentCreateParams.clauseOf = agreementRes.id

            const payment = commitment.clauseOf?.commitments?.find((c: any) => c.action.label === 'transfer')

            console.log('raw payment', payment)
            const costCommitmentCreateParams: CommitmentCreateParams = {
              clauseOf: agreementRes.id,
              action: payment.action.id,
              provider: hashChanges[payment.providerId],// ? hashChanges[payment.providerId] : payment.providerId,
              receiver: hashChanges[payment.receiverId],// ? hashChanges[payment.receiverId] : payment.receiverId,
              hasBeginning: payment.hasBeginning ? payment.hasBeginning : new Date().toISOString(),
              plannedWithin: savedPlan.id,
              resourceConformsTo: hashChanges[payment.resourceConformsTo?.id],// ? hashChanges[payment.resourceConformsTo?.id] : payment.resourceConformsTo?.id,
              resourceQuantity: {
                  hasNumericalValue: payment.resourceQuantity?.hasNumericalValue,
                  hasUnit: units.find((u: any) => u.id.split(":")[0] === payment.resourceQuantity?.hasUnitId.split(":")[0])?.id,
              },
              finished: payment.finished,
              note: payment.note,
            }

            console.log('importCostCommitment', costCommitmentCreateParams)
            const savedPayment = await c.createCommitment(costCommitmentCreateParams)
            console.log('importedCostCommitment', savedPayment)
            await c.addHashChange(payment.id, savedPayment.id)
            console.log("added hash change", payment.id, savedPayment.id)
        }

        const savedCommitment = await c.createCommitment(commitmentCreateParams)
        console.log('importedCommitment', savedCommitment)
        await c.addHashChange(commitment.id, savedCommitment.data.createCommitment.commitment.id)
        console.log("added hash change", commitment.id, savedCommitment.data.createCommitment.commitment.id)
      }

      for (const commitment of process.committedInputs) {
        await processComplexCommitment(commitment, 'input')
      }

      for (const commitment of process.committedOutputs) {
        await processComplexCommitment(commitment, 'output')
      }
    }
  }
  return savedPlan.id
}

export async function importEconomicEvents(data: any) {
  console.log(data)
  const events = [...data.economicEvents].reverse();
  const fulfillments = data.fulfillments
  let createdResources: any = []
  for (const event of events) {
    console.log('raw event', event)
    let createdEventId: string;

    // if (!event?.resourceInventoriedAs && ( (event.action.label == "pickup" && event.providerId != event.receiverId) || event.action.label == "produce") ) {

    let eventCreateParams: EconomicEventCreateParams = {
      action: event.action.id,
      provider: hashChanges[event.providerId || event.provider?.id],// ? hashChanges[event.providerId] : event.providerId,
      receiver: hashChanges[event.receiverId || event.receiver?.id],// ? hashChanges[event.receiverId] : event.receiverId,
      note: event.note,
      hasBeginning: event.hasBeginning ? event.hasBeginning : new Date().toISOString(),
      resourceConformsTo: hashChanges[event.resourceConformsTo.id],// ? hashChanges[event.resourceConformsTo.id] : event.resourceConformsTo.id,
      resourceQuantity: {
        hasNumericalValue: event.resourceQuantity?.hasNumericalValue,
        hasUnit: units.find((u: any) => u.id.split(":")[0] === event.resourceQuantity?.hasUnit?.id.split(":")[0])?.id,
      },
    }

    if (event.inputOfId && event.inputOfId != '') {
      eventCreateParams.inputOf = hashChanges[event.inputOfId] ? hashChanges[event.inputOfId] : event.inputOfId
    }

    if (event.outputOfId && event.outputOfId != '') {
      eventCreateParams.outputOf = hashChanges[event.outputOfId] ? hashChanges[event.outputOfId] : event.outputOfId
    }

    console.log('importEvent', eventCreateParams)

    if (event.resourceInventoriedAs && !createdResources.includes(event.resourceInventoriedAs.id)) {
      let resourceCreateParams = {
        name: event.resourceInventoriedAs.name,
        note: event.resourceInventoriedAs.note,
        image: event.resourceInventoriedAs.image,
        conformsTo: hashChanges[event.resourceInventoriedAs.conformsTo.id],// ? hashChanges[event.resourceInventoriedAs.conformsTo.id] : event.resourceInventoriedAs.conformsTo.id,
      }

      const res = await c.createEconomicEventWithResource(eventCreateParams, resourceCreateParams)
      createdResources.push(event.resourceInventoriedAs.id)
      console.log("created resource", event.resourceInventoriedAs)
      createdEventId = res.id//.data.createEconomicEvent.economicEvent.id
      await c.addHashChange(event.id, createdEventId)
      // await new Promise(resolve => setTimeout(resolve, 4000))
    } else {
      console.log("already added resource", event.resourceInventoriedAs)
      console.log('importEvent', eventCreateParams)
      const res = await c.createEconomicEvent(eventCreateParams)
      createdEventId = res.id//.data.createEconomicEvent.economicEvent.id
      await c.addHashChange(event.id, createdEventId)
      // await new Promise(resolve => setTimeout(resolve, 4000))
    }

    // Add fulfillment
    const fulfillment = fulfillments.find((f: any) => f.fulfilledBy == event.id)
    console.log('fulfillment', fulfillment)
    if (fulfillment) {
      const commitmentId = hashChanges[fulfillment.fulfills]// ? hashChanges[fulfillment.fulfills] : fulfillment.fulfills
      const fulfillmentCreateParams: FulfillmentCreateParams = {
        fulfilledBy: createdEventId,
        fulfills: commitmentId,
      }
      console.log('importFulfillment', fulfillmentCreateParams)
      await c.createFulfillment(fulfillmentCreateParams)
      // await new Promise(resolve => setTimeout(resolve, 4000))
    }
  }
}