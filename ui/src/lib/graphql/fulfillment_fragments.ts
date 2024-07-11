import { gql } from 'graphql-tag'

export const FULFILLMENT_CORE_FIELDS = gql`
  fragment FulfillmentCoreFields on Fulfillment {
    id
    revisionId
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
    fulfills {
      id
    }
  }
`