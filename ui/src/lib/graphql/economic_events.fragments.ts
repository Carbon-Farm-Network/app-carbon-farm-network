import { gql } from 'graphql-tag'

export const ECONOMIC_EVENT_RETURN_FIELDS = gql`
  fragment EconomicEventReturnFields on EconomicEvent {
    id
    revisionId
    action {
      id
      symbol
      label
    }
    inputOf {
      id
      revisionId
    }
    outputOf {
      id
      revisionId
    }
    provider {
      id
      name
    }
    receiver {
      id
      name
    }
    resourceQuantity {
        hasNumericalValue
        hasUnit {
          id
          label
          symbol
        }
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
        image
        defaultUnitOfResource {
          id
          label
          symbol
        }
    }
  }
`