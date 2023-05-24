/**
 * Carbon Farm Network app-specific GraphQL extensions
 *
 * Integrates the following Holochain Cells with hREA's Valueflows-based
 * GraphQL API to enable easy querying in UI component logic.
 *
 * @package Carbon Farm Network
 * @since   2023-05-24
 */

import { AppWebsocket, CellType } from '@holochain/client'
import type {
  DNAIdMappings,
} from '@valueflows/vf-graphql-holochain'
import type {
  Organization,
} from '@valueflows/vf-graphql'

import type {
  FacetValueOptions,
  FacetResponse, FacetConnection,
} from './extension-schemas'

// per @valueflows/vf-graphql-holochain core
const ENV_HOLOCHAIN_APP_ID = process.env.REACT_APP_HC_APP_ID as string || ''

// :SHONK: Holochain cell discovery / connection logic
async function connectFacetsCell(conn: AppWebsocket) {
  const { dnaConfig } = await sniffHolochainAppCells(conn)
}

export async function sniffHolochainAppCells(conn: AppWebsocket, appId?: string) {
  // use the default set by the environment variable
  // and furthermore, note that both of these will be ignored
  // in the Holochain Launcher context
  // which will override any given value to the AppWebsocket
  // for installed_app_id
  appId = appId || ENV_HOLOCHAIN_APP_ID
  const appInfo = await conn.appInfo({ installed_app_id: appId })
  if (!appInfo) {
    throw new Error(`appInfo call failed for Holochain app '${appId}' - ensure the name is correct and that the app installation has succeeded`)
  }

  let dnaConfig: DNAIdMappings = {}
  Object.entries(appInfo.cell_info).forEach(([roleName, cellInfos]) => {
    // this is the "magic pattern" of having for
    // example the "agreement" DNA, it should have
    // an assigned "role_name" in the happ of
    // "hrea_agreement_1" or "hrea_observation_2"
    // and the middle section should match the expected name
    // for DNAIdMappings, which are also used during zome calls
    const cell_match = roleName.match(/^hc_facets$/)
    if (!cell_match) return
    // @ts-ignore
    const firstCell = cellInfos[0]
    if (CellType.Provisioned in firstCell) {
      dnaConfig['facets'] = firstCell[CellType.Provisioned].cell_id
    }
  })

  console.info('Connecting to detected Holochain facets cell:', dnaConfig)

  return {
    dnaConfig,
    appId,
  }
}

export default async (/* :TODO: pass Holochain websocket connection here */) => {
  // :TODO: connect to Holochain facets module
  const facetsZome = await connectFacetsCell(/* :TODO: pass Holochain websocket connection here */)

  // return all resolvers for GraphQL engine
  return {
    Mutation: {
      createFacet: async function (_root: any, args: { facet: FacetValueOptions }): FacetResponse {
        const result = await facetsZome.callZome(/* standard Holochain args */{
          zome_name: 'facets',
          fn_name: 'create_facet_or_evs',
          payload: args.facet,
        }) as FacetResponse
        return result
      },
    },
    Organization: {
      facets: async function (record: Organization, args: { first: number, after: string, last: number, before: string }): FacetConnection {
        const result = await facetsZome.callZome(/* :TODO: implement */{
          zome_name: 'facets',
          fn_name: 'get_facet_values_for_facet_option', // or whichever it is for `getFacetValues` in API spec
          payload: {
            ...args,
            identifier: record.id,
          },
        }) as FacetConnection
        return result
      },
    },
  }
}
