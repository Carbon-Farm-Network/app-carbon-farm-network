import { Proposal, RecipeExchange, Agent } from '@valueflows/vf-graphql'
import { Decimal } from 'decimal.js'

export function matchingOffer(commitment: any, offers: any[]) {
  // console.log("looking for matching offer", commitment)
  return offers.find(offer => {
    return offer?.publishes?.find(
      intent => {
        const offerName = intent?.resourceConformsTo?.name
        const correctProvider = commitment.provider?.id ? (intent?.provider?.id == commitment.provider?.id) : true
        const correctProviderRole = commitment.providerRole ? (intent?.provider?.classifiedAs[2] == commitment.providerRole) : true
        return offerName == commitment.resourceConformsTo.name && correctProvider && correctProviderRole
      }
    )
  })
}

export function makeAgreement(
  commitment: any,
  recipe: undefined | any,
  offers: any[],
  agents: any[] | undefined
): undefined | any {
  // console.log("reciprocal_clause", recipe)
  const reciprocal_clause = recipe?.recipeReciprocalClauses?.[0]
  const matching_offer = matchingOffer(commitment, offers)

  if (matching_offer) {
    // console.log("matching offer", matching_offer)
    const reciprocal_intent = matching_offer.reciprocal[0]
    // console.log("reciprocal_intent", reciprocal_intent)
    const primary_intent = matching_offer.publishes[0]
    const unit_size = primary_intent.resourceQuantity.hasNumericalValue
    const fits_into_request: number = Math.ceil(commitment.resourceQuantity.hasNumericalValue / unit_size)
    // console.log("making agreement", reciprocal_intent.resourceConformsTo.name, fits_into_request, commitment.resourceQuantity.hasNumericalValue, unit_size)
    return {
      name: recipe?.name,
      note: recipe?.note,
      commitment: {
        action: reciprocal_intent.action,
        provider: reciprocal_intent.provider,
        receiver: reciprocal_intent.receiver,
        stage: reciprocal_intent.stage,
        resourceConformsTo: reciprocal_intent.resourceConformsTo,
        resourceQuantity: {
          ...reciprocal_intent.resourceQuantity,
          hasNumericalValue: fits_into_request * reciprocal_intent.resourceQuantity.hasNumericalValue
        }
      }
    }
  } else if (reciprocal_clause) {
    const primary_clause = recipe?.recipeClauses?.find(
      (clause: any) => !clause.reciprocal
    )
    const unit_size = primary_clause.resourceQuantity.hasNumericalValue
    const fits_into_request: number = Math.ceil(commitment.resourceQuantity.hasNumericalValue / unit_size)
    return {
      name: recipe?.name,
      note: recipe?.note,
      commitment: {
        action:  reciprocal_clause.action?.label,
        provider: agents?.find((a) => a.role == reciprocal_clause.providerRole),
        stage: reciprocal_clause?.stage,
        resourceConformsTo: reciprocal_clause.resourceConformsTo,
        resourceQuantity: {
          ...reciprocal_clause.resourceQuantity,
          hasNumericalValue: fits_into_request * reciprocal_clause.resourceQuantity.hasNumericalValue
        }
      }
    }
  }
  // // if (!reciprocal_clause) return
  // // let numerical_value = reciprocal_clause.resourceQuantity.hasNumericalValue
  // // let hasUnit = reciprocal_clause.resourceQuantity.hasUnit
  // let numerical_value;
  // let hasUnit;
  // let reciprocal_intent;
  // let primary_intent;
  // // TODO get data to test the matching offer logic
  // // const matching_offer = matchingOffer(commitment, offers)
  // console.log("matching offer 0", matching_offer)
  // if (matching_offer) {
  //   reciprocal_intent = matching_offer.publishes.find(
  //     intent => intent.reciprocal
  //   )
  //   primary_intent = matching_offer.publishes.find(
  //     intent => !intent.reciprocal
  //   )
  //   console.log("TEMP", reciprocal_intent)
  //   numerical_value = reciprocal_intent.publishes?.resourceQuantity.hasNumericalValue / primary_intent.publishes?.resourceQuantity.hasNumericalValue
  //   hasUnit = primary_intent.publishes?.resourceQuantity.hasUnit
  // } else {
  //   return
  // }

  // if (!numerical_value || !hasUnit) return

  // return {
  //   name: recipe?.name,
  //   note: recipe?.note,
  //   primaryIntent: primary_intent,
  //   commitment: {
  //     action: {
  //       label: reciprocal_intent?.publishes?.action?.label
  //     },
  //     provider: reciprocal_intent?.publishes?.receiverId,
  //     // stage: reciprocal_clause?.stage,
  //     resourceConformsTo: reciprocal_intent?.publishes?.resourceConformsTo,
  //     resourceQuantity: {
  //       hasNumericalValue: new Decimal(numerical_value)
  //         .mul(commitment.resourceQuantity.hasNumericalValue)
  //         .toDecimalPlaces(0, Decimal.ROUND_UP)
  //         .toString(),
  //       hasUnit: hasUnit
  //     }
  //   }
  // }
}

export function findExchange(
  commitment: any,
  based_on_name: string | undefined,
  recipeExchanges: any[]
): undefined | { name: string; note: string } {
  console.log("findExchange", commitment, based_on_name, recipeExchanges)
  return recipeExchanges
  .find(a_recipe => {
    if (based_on_name) {
      return a_recipe?.recipeClauses?.some(
        clause =>
          clause.resourceConformsTo.name == commitment?.resourceConformsTo?.name &&
          clause.stage?.name == based_on_name
      )
    }
    return a_recipe?.recipeClauses?.some(
      clause =>
        clause.resourceConformsTo.name == commitment?.resourceConformsTo?.name &&
        clause.stage?.name == commitment.stage?.name
    )
  })
}

export function assignProviderReceiver(commitment, agents) {
  console.log("assignProviderReceiver", commitment, agents)
  const receivers = agents.filter(it => it.classifiedAs[2] == commitment?.receiverRole)
  const providers = agents.filter(it => it.classifiedAs[2] == commitment?.providerRole)
  console.log("assignProviderReceiver 2", receivers, providers)
  return Object.assign(
    {},
    commitment,
    receivers.length == 1
      ? {
          receiver: receivers[0]
        }
      : {},
    providers.length == 1
      ? {
          provider: providers[0]
        }
      : {}
  )
}

export type Process = {
  id: string
  name: string
  basedOn: {
    name: string
  }
  committedOutputs: any[]
  committedInputs: any[]
}

export function createAgreements(process: Process, recipeExchanges: RecipeExchange[], offers: Proposal[], agents: Agent[]): Process {
  return {
    ...process,
    committedOutputs: process.committedOutputs.map(output => {
      const output_exchange = findExchange(output, process.basedOn.name, recipeExchanges)
      // console.log("output_exchange", output_exchange, "process", process.basedOn)
      // if (output_exchange) {
        // console.log("maybe making agreement 1", output_exchange)
        const output_agreement = makeAgreement(output, output_exchange, offers, agents)
        console.log('output_agreement', output_agreement)
        if (output_agreement?.commitment?.provider && !output.provider) {
          output.provider = output_agreement.commitment.provider
        }
        if (output_agreement) {
          // console.log("actually making agreement 1", output, output_agreement)
          return {
            ...output,
            // provider: output_agreement.commitment.provider,
            agreement: output_agreement
          }
        }
      // }
      return output
    }),
    committedInputs: process.committedInputs.map(input => {
      // if there is no input, we don't need to make an agreement
      const input_exchange = findExchange(input, process.basedOn.name, recipeExchanges)
      // console.log("input_exchange", input_exchange, "process", process.basedOn)
      // if (input_exchange) {
        // console.log("maybe making agreement 2", input_exchange)
        const input_agreement = makeAgreement(input, input_exchange, offers, agents)
        // console.log('input_agreement', input_agreement)
        if (input_agreement?.commitment?.provider && !input.provider) {
          input.provider = input_agreement.commitment.provider
        }
        if (input_agreement) {
          // console.log("actually making agreement 2", input, input_agreement)
          return {
            ...input,
            provider: input_agreement.commitment.receiver,
            agreement: input_agreement
          }
        }
      // }
      return input
    })
  }
}

export function createCommitments(requests: Proposal[]) {
  return requests.flatMap(request =>
    request.publishes = [{
      ...request.publishes[0],
      // action: {
      //   label: 'transfer',
      // },
      // satisfies: proposed_intent.id,
      id: crypto.randomUUID(),
      // revisionId: undefined,
    }]
  )
}

export type Commitment = {
  resourceConformsTo: { name: string }
  resourceQuantity: { hasNumericalValue: string; hasUnit: { label: string } }
  receiver: { name: string }
  action: {
    label: string
  }
  id: string
}

export type Demand = {
  resourceConformsTo: { name: string }
  resourceQuantity: { hasNumericalValue: string; hasUnit: { label: string } }
}

export function aggregateCommitments(commitments: Commitment[]): Demand[] {
  return Object.values(
    commitments.reduce((acc, commitment) => {
      // console.log("aggregating commitment", commitment)
      if (acc[commitment.resourceConformsTo.name]) {
        let existing = acc[commitment.resourceConformsTo.name]
        acc[commitment.resourceConformsTo.name] = {
          ...existing,
          resourceQuantity: {
            ...existing.resourceQuantity,
            hasNumericalValue:
              existing.resourceQuantity.hasNumericalValue +
              commitment.resourceQuantity.hasNumericalValue
          }
        }
      } else {
        acc[commitment.resourceConformsTo.name] = {
          resourceQuantity: commitment.resourceQuantity,
          resourceConformsTo: commitment.resourceConformsTo,
          stage: { name: 'Ship' }
        }
      }
      return acc
    }, {})
  )
}