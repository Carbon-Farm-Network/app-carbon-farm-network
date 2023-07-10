import { gql } from 'graphql-tag'

export const PROPOSAL_CORE_FIELDS = gql`
  fragment ProposalCoreFields on Proposal {
    id
    hasBeginning
    hasEnd
    unitBased
    note
  }
`
export const INTENT_CORE_FIELDS = gql`
  fragment IntentCoreFields on Intent {
    id
    provider {
      name
    }
    action {
      label
    }
    availableQuantity {
      hasNumericalValue
      hasUnit {
        label
      }
    }
    resourceQuantity {
      hasNumericalValue
      hasUnit {
        label
      }
    }
    note
  }
`
export const PROPOSED_INTENT_CORE_FIELDS = gql`
  fragment ProposedIntentCoreFields on ProposedIntent {
    id
    reciprocal
    publishes {
      id
      provider {
        name
      }
      resourceConformsTo {
        name
      }
    }
    publishedIn {
      id
    }
  }
`

export const PROPOSAL_RETURN_FIELDS = gql`
  fragment ProposalReturnFields on Proposal {
    id
    revisionId
    name
    hasBeginning
    hasEnd
    unitBased
    publishes {
      reciprocal
      publishes {
        revisionId
        resourceConformsTo {
          name
          id
          defaultUnitOfResource {
            label
            id
            symbol
          }
        }
        resourceQuantity {
          hasNumericalValue
          hasUnit {
            label
            id
            symbol
          }
        }
        availableQuantity {
          hasNumericalValue
          hasUnit {
            label
            id
            symbol
          }
        }
        provider {
          id
          name
        }
        receiver {
          id
          name
        }
        finished
        note
      }
    }
  }
`
