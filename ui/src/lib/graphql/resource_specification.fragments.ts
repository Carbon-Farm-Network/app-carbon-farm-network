import { gql } from 'graphql-tag'

export const RESOURCE_SPECIFICATION_CORE_FIELDS = gql`
  fragment ResourceSpecificationCoreFields on ResourceSpecification {
    id
    revisionId
    name
    image
    note
    defaultUnitOfResource {
      id
      label
      symbol
      revisionId
    }
    resourceClassifiedAs
  }
`