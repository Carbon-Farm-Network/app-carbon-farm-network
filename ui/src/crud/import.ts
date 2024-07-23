import type { CommitmentCreateParams, PlanCreateParams, ProcessCreateParams,  Process, AgreementCreateParams, EconomicEventCreateParams, FulfillmentCreateParams, Fulfillment } from "@valueflows/vf-graphql"
import { addHashChange, createCommitment, createAgreement, createPlan, createProcess, createEconomicEvent, createEconomicEventWithResource, createFulfillment } from "./commit"
import { allHashChanges, allProcessSpecifications, allUnits } from "./store"
import { EconomicEvent } from "$lib/icons"

let hashChanges: any = {}
allHashChanges.subscribe(value => {
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

export async function importPlan(fullPlan: any) {
  console.log('importPlan', fullPlan)
  const plan = fullPlan.plan
  const planCreateParams: PlanCreateParams = {
    name: plan.name,
    note: plan.note,
  }
  const res = await createPlan(planCreateParams)
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
      const res = await createCommitment(commitmentCreateParams)
      await addHashChange(commitment.id, res.data.createCommitment.commitment.id)
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
        const res = await createCommitment(commitmentCreateParams)
        await addHashChange(commitment.id, res.data.createCommitment.commitment.id)
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
      const res = await createProcess(processCreateParams)
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
            const agreementRes = await createAgreement(agreementCreateParams)
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
            const savedPayment = await createCommitment(costCommitmentCreateParams)
            console.log('importedCostCommitment', savedPayment)
            await addHashChange(payment.id, savedPayment.id)
            console.log("added hash change", payment.id, savedPayment.id)
        }

        const savedCommitment = await createCommitment(commitmentCreateParams)
        console.log('importedCommitment', savedCommitment)
        await addHashChange(commitment.id, savedCommitment.data.createCommitment.commitment.id)
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
      provider: hashChanges[event.providerId],// ? hashChanges[event.providerId] : event.providerId,
      receiver: hashChanges[event.receiverId],// ? hashChanges[event.receiverId] : event.receiverId,
      note: event.note,
      hasBeginning: event.hasBeginning ? event.hasBeginning : new Date().toISOString(),
      resourceConformsTo: hashChanges[event.resourceConformsTo.id],// ? hashChanges[event.resourceConformsTo.id] : event.resourceConformsTo.id,
      resourceQuantity: {
        hasNumericalValue: event.resourceQuantity?.hasNumericalValue,
        hasUnit: units.find((u: any) => u.id.split(":")[0] === event.resourceQuantity?.hasUnitId.split(":")[0])?.id,
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

      const res = await createEconomicEventWithResource(eventCreateParams, resourceCreateParams)
      createdResources.push(event.resourceInventoriedAs.id)
      console.log("created resource", event.resourceInventoriedAs)
      createdEventId = res.data.createEconomicEvent.economicEvent.id
      await addHashChange(event.id, createdEventId)
      // await new Promise(resolve => setTimeout(resolve, 4000))
    } else {
      console.log("already added resource", event.resourceInventoriedAs)
      console.log('importEvent', eventCreateParams)
      const res = await createEconomicEvent(eventCreateParams)
      createdEventId = res.data.createEconomicEvent.economicEvent.id
      await addHashChange(event.id, createdEventId)
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
      await createFulfillment(fulfillmentCreateParams)
      // await new Promise(resolve => setTimeout(resolve, 4000))
    }
  }
}