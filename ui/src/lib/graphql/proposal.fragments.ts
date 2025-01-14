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
    revisionId
    provider {
      id
      name
      classifiedAs
    }
    receiver {
      id
      name
      classifiedAs
    }
    action {
      label
    }
    availableQuantity {
      hasNumericalValue
      hasUnit {
        id
        label
      }
    }
    resourceQuantity {
      hasNumericalValue
      hasUnit {
        id
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
      revisionId
      provider {
        name
        classifiedAs
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
      id
      revisionId
      reciprocal
      publishes {
        id
        revisionId
        action {
          id
          label
        }
        resourceConformsTo {
          name
          id
          defaultUnitOfResource {
            label
            id
            symbol
          }
          facets {
            id
            value
            facet {
              id
              name
            }
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
        stage {
          id
          name
        }
        provider {
          id
          name
          classifiedAs
        }
        receiver {
          id
          name
          classifiedAs
        }
        finished
        note
      }
    }
  }
`
