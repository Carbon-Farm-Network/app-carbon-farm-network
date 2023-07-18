import { gql } from 'graphql-tag'

export const FACET_VALUE_CORE_FIELDS = gql`
  fragment FacetValueCoreFields on FacetValue {
    id
    value
    note
    facet {
      id
      name
      note
      group {
        id
        name
        note
      }
    }
  }
`

// export const FACET_VALUE_CORE_FIELDS = gql`
//   fragment FacetValueCoreFields on FacetValue {
//     id
//     revisionId
//     value
//     note
//   }
// `

// export const FACET_CORE_FIELDS = gql`
//   fragment FacetCoreFields on Facet {
//     name
//     note
//     id
//     revisionId
//   }
// `
// export const PERSON_CORE_FIELDS = gql`
//   fragment PersonCoreFields on Person {
//     id
//     revisionId
//     name
//     image
//     note
//     classifiedAs
//   }
// `
// export const ORGANIZATION_CORE_FIELDS = gql`
//   fragment OrganizationCoreFields on Organization {
//     id
//     revisionId
//     name
//     image
//     note
//     classifiedAs
//   }
// `
