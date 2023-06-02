import type { 
  ActionHash,
} from '@holochain/client';

export interface FacetGroup { 
  group_id: string;
  note: string;
}

export interface FacetOption { 
  facet_id: string;
  option: string;
  facet_group: ActionHash | undefined;
}

export interface FacetValue { 
  facet_value: string;
  facet_option: ActionHash;
  record_type: string | undefined;
}



// export interface Facet {
//   // :TODO:
// }

// export interface FacetOptions {
//   facet_id: string
//   value: string
// }

// export interface FacetValueOptions {
//   facet_eh: Uint8Array
//   value: string
//   note: string
// }

// export interface FacetValueParams {
//   facetValue: FacetValueOptions
// }

// export interface FacetResponse {
//   facet: Facet
// }

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
