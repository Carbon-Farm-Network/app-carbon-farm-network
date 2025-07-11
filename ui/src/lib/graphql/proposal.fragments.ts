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
    inputOf {
      id
      basedOn {
        id
        name
        image
      }
    }
    outputOf {
      id
      basedOn {
        id
        name
        image
      }
    }
    receiver {
      id
      name
      classifiedAs
    }
    action {
      id
      symbol
      label
    }
    resourceQuantity {
      hasNumericalValue
      hasUnit {
        id
        label
        symbol
        omUnitIdentifier
      }
    }
    availableQuantity {
      hasNumericalValue
      hasUnit {
        id
        symbol
        label
        omUnitIdentifier
      }
    }
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
        id
        label
      }
    }
    note
  }
`

export const PROPOSAL_RETURN_FIELDS = gql`
  ${INTENT_CORE_FIELDS}
  fragment ProposalReturnFields on Proposal {
    id
    revisionId
    name
    hasBeginning
    hasEnd
    unitBased
    reciprocal {
      ...IntentCoreFields
    }
    publishes {
      ...IntentCoreFields
    }
  }
`
