import { gql } from 'graphql-tag'

export const ECONOMIC_EVENT_RETURN_FIELDS = gql`
  fragment EconomicEventReturnFields on EconomicEvent {
    id
    action {
        id
        label
    }
    inputOfId
    outputOfId
    providerId
    receiverId
    resourceQuantity {
        hasNumericalValue
        hasUnitId
    }
    hasBeginning
    resourceInventoriedAs {
      id
      name
      note
      image
      conformsTo {
        id
      }
    }
    resourceConformsTo {
        id
        name
        defaultUnitOfResourceId
    }
  }
`