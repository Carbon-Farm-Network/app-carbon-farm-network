export interface Facet {
  // :TODO:
}

export interface FacetOptions {
  facet_id: string
  value: string
}

export interface FacetValueOptions {
  identifier: string // ID of the 'thing' being assigned to a FacetValue
  facet_option_id: string
  value: string
}

export interface FacetResponse {
  facet: Facet
}

export interface FacetEdge {
  node: Facet
  cursor: string
}

export interface FacetConnection {
  edges: FacetEdge[]
  pageInfo: any
}

export default [`
type Facet {
  # :TODO:
}

input FacetCreateParams {
  # :TODO:
}

type FacetConnection {
  edges: [FacetEdge!]!
  pageInfo: PageInfo
}
type FacetEdge {
  node: Facet!
  cursor: ID!
}
type FacetResponse {
  facet: Facet
}

type Organization implements Agent {
  facets(first: Int, after: String, last: Int, before: String): FacetConnection
}

type Mutation  {
  "Create a new facet classification."
  createFacet(facet: FacetCreateParams!): FacetResponse!
}
`]
