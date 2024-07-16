import type { CommitmentCreateParams, PlanCreateParams, ProcessCreateParams,  Process, AgreementCreateParams } from "@valueflows/vf-graphql"
import { addHashChange, createCommitment, createAgreement, createPlan, createProcess } from "./commit"
import { allHashChanges, allProcessSpecifications } from "./store"

let hashChanges: any = {}
allHashChanges.subscribe(value => {
  hashChanges = value
})

let processSpecifications: any = []
allProcessSpecifications.subscribe(value => {
  processSpecifications = value
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
        independentDemandOf: savedPlan.id,
        // action: commitment.action.id,
        // note: commitment.note ? commitment.note : '',
        // provider: hashChanges[commitment.providerId] ? hashChanges[commitment.providerId] : commitment.providerId,
        // receiver: hashChanges[commitment.receiverId] ? hashChanges[commitment.receiverId] : commitment.receiverId,
        // resourceConformsTo: hashChanges[commitment.resourceConformsTo?.id] ? hashChanges[commitment.resourceConformsTo?.id] : commitment.resourceConformsTo?.id,
        // hasBeginning: commitment.hasBeginning ? commitment.hasBeginning : new Date().toISOString(),
        // // finished: commitment.finished ? commitment.finished : false,
        // resourceQuantity: {
        //     hasNumericalValue: commitment.resourceQuantity?.hasNumericalValue,
        //     hasUnit: commitment.resourceQuantity?.hasUnitId,
        // },

        action: commitment.action.id,
        provider: hashChanges[commitment.providerId] ? hashChanges[commitment.providerId] : commitment.providerId,
        receiver: hashChanges[commitment.receiverId] ? hashChanges[commitment.receiverId] : commitment.receiverId,
        plannedWithin: savedPlan.id,
        finished: commitment.finished,
        note: commitment.note,
        hasBeginning: commitment.hasBeginning ? commitment.hasBeginning : new Date().toISOString(),
        resourceConformsTo: commitment.resourceConformsTo.id,
        resourceQuantity: {
          hasNumericalValue: commitment.resourceQuantity?.hasNumericalValue,
          hasUnit: commitment.resourceQuantity?.hasUnitId,
        },
    }

    if (!commitment.provider) {
      commitmentCreateParams.provider = commitmentCreateParams.receiver
    }

    console.log('importCommitment', commitmentCreateParams)
    await createCommitment(commitmentCreateParams)
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
        // finished: process.finished,
        // hasBeginning: process.hasBeginning,
        // hasEnd: process.hasEnd,
        // basedOn: process.basedOn?.id,
        basedOn: hashChanges[process.basedOn?.id] ? hashChanges[process.basedOn?.id] : process.basedOn?.id,
        plannedWithin: savedPlan.id,
        // classifiedAs: process.classifiedAs,
        // inScopeOf: process.inScopeOf,
      }
      console.log('importProcess', processCreateParams)
      console.log(processSpecifications)
      const res = await createProcess(processCreateParams)
      const savedProcess = res.data.createProcess.process
      console.log('importedProcess', savedProcess)

      async function processComplexCommitment(commitment: any, side: string) {
        console.log('raw commitment', commitment)
        const commitmentCreateParams: CommitmentCreateParams = {
            // independentDemandOf: savedPlan.id,
            action: commitment.action.id,
            // note: commitment.note ? commitment.note : '',
            provider: hashChanges[commitment.providerId] ? hashChanges[commitment.providerId] : commitment.providerId,
            receiver: hashChanges[commitment.receiverId] ? hashChanges[commitment.receiverId] : commitment.receiverId,
            // // due: commitment.due,
            // inputOf: process.id,
            // resourceConformsTo: hashChanges[commitment.resourceConformsTo.id] ? hashChanges[commitment.resourceConformsTo.id] : commitment.resourceConformsTo.id,
            // hasBeginning: commitment.hasBeginning,
            // finished: commitment.finished,
            // resourceQuantity: {
            //     hasNumericalValue: commitment.resourceQuantity?.hasNumericalValue,
            //     hasUnit: hashChanges[commitment.resourceQuantity?.hasUnitId] ? hashChanges[commitment.resourceQuantity?.hasUnitId] : commitment.resourceQuantity?.hasUnitId,
            // },
            plannedWithin: savedPlan.id,
            finished: commitment.finished,
            note: commitment.note,
            hasBeginning: commitment.hasBeginning ? commitment.hasBeginning : new Date().toISOString(),
            resourceConformsTo: commitment.resourceConformsTo.id,
            resourceQuantity: {
              hasNumericalValue: commitment.resourceQuantity?.hasNumericalValue,
              hasUnit: commitment.resourceQuantity?.hasUnitId,
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
              provider: hashChanges[payment.providerId] ? hashChanges[payment.providerId] : payment.providerId,
              receiver: hashChanges[payment.receiverId] ? hashChanges[payment.receiverId] : payment.receiverId,
              hasBeginning: payment.hasBeginning ? payment.hasBeginning : new Date().toISOString(),
              plannedWithin: savedPlan.id,
              resourceConformsTo: hashChanges[payment.resourceConformsTo?.id] ? hashChanges[payment.resourceConformsTo?.id] : payment.resourceConformsTo?.id,
              resourceQuantity: {
                  hasNumericalValue: payment.resourceQuantity?.hasNumericalValue,
                  hasUnit: hashChanges[payment.resourceQuantity?.hasUnitId] ? hashChanges[payment.resourceQuantity?.hasUnitId] : payment.resourceQuantity?.hasUnitId,
              },
              finished: payment.finished,
              note: payment.note,
            }

            console.log('importCostCommitment', costCommitmentCreateParams)
            const savedPayment = await createCommitment(costCommitmentCreateParams)
            console.log('importedCostCommitment', savedPayment)
            addHashChange(payment.id, savedPayment.id)
        }

        const savedCommitment = await createCommitment(commitmentCreateParams)
        addHashChange(commitment.id, savedCommitment.id)
      }

      for (const commitment of process.committedInputs) {
        await processComplexCommitment(commitment, 'input')
      }

      for (const commitment of process.committedOutputs) {
        await processComplexCommitment(commitment, 'output')
      }
    }
  }
}