import { gql } from 'graphql-tag'

export const AGREEMENT_CORE_FIELDS = gql`
  fragment AgreementCoreFields on Agreement {
        id
        name
        note
        revisionId
        commitments {
          finished
          fulfilledBy {
            id
          }
          id
          revisionId
          providerId
          receiverId
          hasBeginning
          provider {
            id
            name
          }
          receiver {
            id
            name
          }
          action {
            id
            label
          }
          resourceConformsTo {
            id
            name
            defaultUnitOfResourceId
            resourceClassifiedAs
          }
          resourceQuantity {
            hasNumericalValue
            hasUnitId
          }
      }
  }
`