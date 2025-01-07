import { gql } from 'graphql-tag'

export const RESOURCE_SPECIFICATION_CORE_FIELDS = gql`
  fragment ResourceSpecificationCoreFields on ResourceSpecification {
    id
    revisionId
    name
    image
    note
    resourceClassifiedAs
    facets {
      name
      value
    }
  }
`

export const UNIT_CORE_FIELDS = gql`
  fragment UnitCoreFields on Unit {
    id
    label
    symbol
    omUnitIdentifier
    revisionId
  }
`
