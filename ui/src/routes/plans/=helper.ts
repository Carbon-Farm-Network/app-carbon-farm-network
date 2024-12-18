import { Decimal } from 'decimal.js'

export function matchingOffer(commitment: any, offers: any[]) {
  return offers.find(offer => {
    return offer?.publishes?.find(
      intent => {
        const offerName = intent.publishes?.resourceConformsTo?.name
        const correctProvider = commitment.providerId ? (intent.publishes?.provider?.id == commitment.providerId) : true
        return offerName == commitment.resourceConformsTo.name && correctProvider
      }
    )
  })
}

// export function makeAgreement1(
//   commitment: any,
//   agreement: undefined | any,
//   offers: any[]
// ): undefined | any {
//   let specific_provider = commitment.provider
//   let numerical_value;
//   let hasUnit;
//   let reciprocal_intent;
//   let primary_intent;
//   // TODO get data to test the matching offer logic
//   const matching_offer = matchingOffer(commitment, offers)
//   if (matching_offer) {
//     reciprocal_intent = matching_offer.publishes.find(
//       intent => intent.reciprocal
//     )
//     primary_intent = matching_offer.publishes.find(
//       intent => !intent.reciprocal
//     )
//     numerical_value = reciprocal_intent.publishes?.resourceQuantity.hasNumericalValue / primary_intent.publishes?.resourceQuantity.hasNumericalValue
    
//     hasUnit = primary_intent.publishes?.resourceQuantity?.hasUnit
//   } else {
//     return
//   }

//   if (!numerical_value || !hasUnit) return

//   return {
//     commitments: [
//     {
//       action: {
//         label: reciprocal_intent?.publishes?.action?.label
//       },
//       provider: reciprocal_intent?.publishes?.receiverId,
//       // stage: reciprocal_clause?.stage,
//       resourceConformsTo: reciprocal_intent?.publishes?.resourceConformsTo,
//       resourceQuantity: {
//         hasNumericalValue: new Decimal(numerical_value)
//           .mul(commitment.resourceQuantity.hasNumericalValue)
//           .toDecimalPlaces(0, Decimal.ROUND_UP)
//           .toString(),
//         hasUnit: hasUnit
//       }
//     }],
//     primaryIntent: primary_intent
//   }
// }

export function makeAgreement(
  commitment: any,
  recipe: undefined | any,
  offers: any[],
  agents: any[] | undefined
): undefined | any {
  const reciprocal_clause = recipe?.has_recipe_reciprocal_clause?.[0]
  if (reciprocal_clause) {
    return {
      name: recipe?.name,
      note: recipe?.note,
      commitment: {
        action:  reciprocal_clause.action?.label,
        provider: agents?.find((a) => a.role == reciprocal_clause.provider_role),
        stage: reciprocal_clause?.stage,
        resourceConformsTo: reciprocal_clause.resourceConformsTo,
        resourceQuantity: {
          ...reciprocal_clause.resourceQuantity,
          hasNumericalValue: reciprocal_clause.resourceQuantity.hasNumericalValue * commitment.resourceQuantity?.hasNumericalValue
        }
      }
    }
  }
  // if (!reciprocal_clause) return
  // let numerical_value = reciprocal_clause.resourceQuantity.hasNumericalValue
  // let hasUnit = reciprocal_clause.resourceQuantity.hasUnit
  let numerical_value;
  let hasUnit;
  let reciprocal_intent;
  let primary_intent;
  // TODO get data to test the matching offer logic
  const matching_offer = matchingOffer(commitment, offers)
  console.log("matching offer 0", matching_offer)
  if (matching_offer) {
    reciprocal_intent = matching_offer.publishes.find(
      intent => intent.reciprocal
    )
    primary_intent = matching_offer.publishes.find(
      intent => !intent.reciprocal
    )
    console.log("TEMP", reciprocal_intent)
    numerical_value = reciprocal_intent.publishes?.resourceQuantity.hasNumericalValue / primary_intent.publishes?.resourceQuantity.hasNumericalValue
    hasUnit = primary_intent.publishes?.resourceQuantity.hasUnit
  } else {
    return
  }

  if (!numerical_value || !hasUnit) return

  return {
    name: recipe?.name,
    note: recipe?.note,
    primaryIntent: primary_intent,
    commitment: {
      // action:  reciprocal_intent?.publishes?.action?.label,
      // provider: reciprocal_intent?.publishes?.receiver,
      // // stage: reciprocal_clause?.stage,
      // resourceConformsTo: reciprocal_intent?.publishes?.resourceConformsTo,
      // resourceQuantity: {
      //   hasNumericalValue: new Decimal(numerical_value)
      //     .mul(commitment.resourceQuantity.hasNumericalValue)
      //     .toDecimalPlaces(0, Decimal.ROUND_UP)
      //     .toString(),
      //   hasUnit: hasUnit
      // }

      action: {
        label: reciprocal_intent?.publishes?.action?.label
      },
      provider: reciprocal_intent?.publishes?.receiverId,
      // stage: reciprocal_clause?.stage,
      resourceConformsTo: reciprocal_intent?.publishes?.resourceConformsTo,
      resourceQuantity: {
        hasNumericalValue: new Decimal(numerical_value)
          .mul(commitment.resourceQuantity.hasNumericalValue)
          .toDecimalPlaces(0, Decimal.ROUND_UP)
          .toString(),
        hasUnit: hasUnit
      }
    }
  }
}

export function findExchange(
  commitment: any,
  based_on_name: string | undefined,
  recipes: any[]
): undefined | { name: string; note: string } {
  return recipes
  .filter(it => it.type == 'recipe_exchange')
  .find(a_recipe => {
    if (based_on_name) {
      return a_recipe?.has_recipe_clause?.some(
        clause =>
          clause.resourceConformsTo.name == commitment?.resourceConformsTo?.name &&
          clause.stage?.name == based_on_name
      )
    }
    return a_recipe?.has_recipe_clause?.some(
      clause =>
        clause.resourceConformsTo.name == commitment?.resourceConformsTo?.name &&
        clause.stage?.name == commitment.stage?.name
    )
  })
}

export function assignProviderReceiver(commitment, agents) {
  const receivers = agents.filter(it => it.role == commitment?.receiver_role)
  const providers = agents.filter(it => it.role == commitment?.provider_role)
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
  based_on: {
    name: string
  }
  committedOutputs: any[]
  committedInputs: any[]
}

export function createAgreements(process: Process, recipes, offers, agents): Process {
  return {
    ...process,
    committedOutputs: process.committedOutputs.map(output => {
      const output_exchange = findExchange(output, process.based_on.name, recipes)
      // console.log("output_exchange", output_exchange, "process", process.based_on)
      if (output_exchange) {
        // console.log("maybe making agreement 1", output_exchange)
        const output_agreement = makeAgreement(output, output_exchange, offers, agents)
        // console.log('output_agreement', output_agreement)
        if (output_agreement) {
          // console.log("actually making agreement 1", output, output_agreement)
          return {
            ...output,
            agreement: output_agreement
          }
        }
      }
      return output
    }),
    committedInputs: process.committedInputs.map(input => {
      // if there is no input, we don't need to make an agreement
      const input_exchange = findExchange(input, process.based_on.name, recipes)
      // console.log("input_exchange", input_exchange, "process", process.based_on)
      if (input_exchange) {
        // console.log("maybe making agreement 2", input_exchange)
        const input_agreement = makeAgreement(input, input_exchange, offers, agents)
        if (input_agreement) {
          // console.log("actually making agreement 2", input, input_agreement)
          return {
            ...input,
            provider: input_agreement.commitment.provider,
            agreement: input_agreement
          }
        }
      }
      return input
    })
  }
}

export function createCommitments(requests: { publishes: { proposedIntent: { intent: any }[] }[] }[]): any[] {
  console.log("requests", requests)
  return requests.flatMap(request =>
    request.publishes.filter(it => !it.reciprocal).map(proposed_intent => ({
      ...proposed_intent.publishes,
      action: {
        label: 'transfer',
      },
      satisfies: proposed_intent.id,
      id: crypto.randomUUID(),
      revisionId: undefined,
    }))
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
        console.log("commitment ^^^", commitment)
        acc[commitment.resourceConformsTo.name] = {
          ...commitment,
          // resourceQuantity: commitment.resourceQuantity,
          // resourceConformsTo: commitment.resourceConformsTo,
          // stage: commitment.stage
          // stage: { name: 'Ship' }
        }
      }
      return acc
    }, {})
  )
}