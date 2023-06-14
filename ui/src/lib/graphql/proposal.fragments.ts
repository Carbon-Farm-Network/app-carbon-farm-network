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
  fragment ProposalCoreFields on Intent {
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
  fragment ProposalCoreFields on ProposedIntent {
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