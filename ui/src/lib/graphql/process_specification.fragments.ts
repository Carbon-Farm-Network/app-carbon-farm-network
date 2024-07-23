import { gql } from 'graphql-tag'

export const PROCESS_SPECIFICATION_CORE_FIELDS = gql`
  fragment ProcessSpecificationCoreFields on ProcessSpecification {
    id
    revisionId
    name
    image
    note
  }
`