import { gql } from 'graphql-tag'

export const RESOURCE_SPECIFICATION_CORE_FIELDS = gql`
  fragment ResourceSpecificationCoreFields on ResourceSpecification {
    id
    revisionId
    name
    image
    note
    resourceClassifiedAs
  }
`

export const UNIT_CORE_FIELDS = gql`
  fragment UnitCoreFields on Unit {
    id
    label
    symbol
    revisionId
  }
`
