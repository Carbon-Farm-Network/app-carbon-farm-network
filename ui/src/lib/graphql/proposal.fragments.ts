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