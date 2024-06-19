import { gql } from 'graphql-tag'

export const ECONOMIC_EVENT_RETURN_FIELDS = gql`
  fragment EconomicEventReturnFields on EconomicEvent {
    id
    action {
        id
        label
    }
    providerId
    provider {
        id
        name
    }
    receiverId
    resourceQuantity {
        hasNumericalValue
        hasUnitId
    }
    hasBeginning
    resourceConformsTo {
        id
        name
        defaultUnitOfResourceId
    }
  }
`