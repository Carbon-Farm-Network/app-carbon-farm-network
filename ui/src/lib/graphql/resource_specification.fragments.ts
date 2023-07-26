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

export const MEASURE_CORE_FIELDS = gql`
  fragment MeasureCoreFields on Measure {
    id
    label
    symbol
    revisionId
  }
`
