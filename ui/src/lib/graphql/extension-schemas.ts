export interface Facet {
  // :TODO:
}

export interface FacetOptions {
  facet_id: string
  value: string
}

export interface FacetValueOptions {
  facet_eh: Uint8Array
  value: string
  note: string
}

export interface FacetValueParams {
  facetValue: FacetValueOptions
}

export interface FacetResponse {
  facet: Facet
}

export default [`
type Facet {
  # :TODO:
}

input FacetCreateParams {
  # :TODO:
}

type FacetResponse {
  facet: Facet
}

type Organization implements Agent {
  facets(): Facet[]
}

type Mutation  {
  "Create a new facet classification."
  createFacet(facet: FacetCreateParams!): FacetResponse!
}
`]
