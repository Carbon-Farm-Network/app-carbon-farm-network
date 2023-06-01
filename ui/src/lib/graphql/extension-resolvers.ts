/**
 * Carbon Farm Network app-specific GraphQL extensions
 *
 * Integrates the following Holochain Cells with hREA's Valueflows-based
 * GraphQL API to enable easy querying in UI component logic.
 *
 * @package Carbon Farm Network
 * @since   2023-05-24
 */
import type { CellId } from '@holochain/client'
import { mapZomeFn } from '@valueflows/vf-graphql-holochain'
import type { DNAIdMappings } from '@valueflows/vf-graphql-holochain'

import type { Organization } from '@valueflows/vf-graphql'
import type {
  FacetValueParams,
  FacetResponse, Facet,
} from './extension-schemas'

// key names here are auto-matched by Cell role name convention in `happ.yaml`
export type ExtendedDnaConfig = DNAIdMappings & {
  facets: CellId
}

export interface ByIdentifier {
  identifier: string
}

const bindResolvers = async (dnaConfig: ExtendedDnaConfig, conductorUri: string) =>
{
  const runCreate = mapZomeFn<FacetValueParams, FacetResponse>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'create_facet_value')
  const readFacetValues = mapZomeFn<ByIdentifier, Facet[]>(dnaConfig, conductorUri, 'facets', 'hc_facets', 'retrieve_facet_values')

  // return all resolvers for GraphQL engine
  return {
    Mutation: {
      putFacetValue: async function (_root: any, args: FacetValueParams): Promise<FacetResponse> {
        return runCreate(args)
      },
    },
    Organization: {
      facets: async function (record: Organization): Promise<Facet[]> {
        return readFacetValues({ identifier: record.id })
      },
    },
  }
}

export default bindResolvers
