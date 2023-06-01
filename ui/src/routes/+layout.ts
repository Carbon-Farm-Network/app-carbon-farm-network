import { browser } from '$app/environment'
import { error } from '@sveltejs/kit'
// import autoConnect from '@vf-ui/graphql-client-mock' // enable to use in-memory mock API
import autoConnect from '@vf-ui/graphql-client-holochain'
import { sniffHolochainAppCells } from '@valueflows/vf-graphql-holochain'
import { AppWebsocket } from '@holochain/client'

import extensionSchemas from '$lib/graphql/extension-schemas'
import bindResolvers from '$lib/graphql/extension-resolvers'
import type { ExtendedDnaConfig } from '$lib/graphql/extension-resolvers'

const ENV_CONNECTION_URI = process.env.REACT_APP_HC_CONN_URL as string || ''

export async function load() {
  if (!browser) return
  try {
    // pull DNA config separately in order to bind to CFN-specific extension Cells
    const conn = await AppWebsocket.connect(ENV_CONNECTION_URI)
    const { dnaConfig } = await sniffHolochainAppCells(conn)

    return {
      client: await autoConnect({
        // passthrough detected DNA config to skip unnecessary redetect
        dnaConfig,
        // bind extension GraphQL schema defs and bound resolver callbacks
        extensionSchemas,
        extensionResolvers: await bindResolvers(dnaConfig as ExtendedDnaConfig, ENV_CONNECTION_URI),
      }),
    }
  } catch (e) {
    console.error("Holochain connection error", e)
    throw error(500, "Holochain connection error")
  }
}
