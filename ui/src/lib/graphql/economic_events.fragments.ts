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
    resourceConformsTo {
        id
        name
        defaultUnitOfResourceId
    }
    resourceQuantity {
        hasNumericalValue
        hasUnitId
    }
    hasBeginning
  }
`