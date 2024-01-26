import { browser } from '$app/environment'
import { error } from '@sveltejs/kit'
// import autoConnect from '@vf-ui/graphql-client-mock' // enable to use in-memory mock API
import autoConnect from '@vf-ui/graphql-client-holochain'
import { sniffHolochainAppCells } from '@valueflows/vf-graphql-holochain'
import { AppWebsocket, AdminWebsocket, AppAgentWebsocket } from '@holochain/client'

import extensionSchemas from '$lib/graphql/extension-schemas'
import bindResolvers from '$lib/graphql/extension-resolvers'
import type { ExtendedDnaConfig } from '$lib/graphql/extension-resolvers'

const appId = import.meta.env.VITE_APP_ID ? import.meta.env.VITE_APP_ID : 'acfn'
const ENV_CONNECTION_URI = process.env.REACT_APP_HC_CONN_URL as string || ''
const adminPort = import.meta.env.VITE_ADMIN_PORT
const appPort = import.meta.env.VITE_APP_PORT ? import.meta.env.VITE_APP_PORT : 8888
const url = `ws://localhost:${appPort}`;

export async function load() {
  if (!browser) return
  try {
    console.log("adminPort is", adminPort)
    console.log("url is", url)
    console.log("appId is", appId)
    if (adminPort) {
      const adminWebsocket = await AdminWebsocket.connect(new URL(`ws://localhost:${adminPort}`))
      const x = await adminWebsocket.listApps({})
      console.log("apps", x)
      const cellIds = await adminWebsocket.listCellIds()
      console.log("CELL IDS",cellIds)
      await adminWebsocket.authorizeSigningCredentials(cellIds[0])
    } else {
      console.log("no admin port")
    }
    console.log('hi')
    // pull DNA config separately in order to bind to CFN-specific extension Cells
    const conn = await AppWebsocket.connect(new URL(url))
    // const conn = await AppWebsocket.connect(ENV_CONNECTION_URI)
    console.log(conn)
    const { dnaConfig } = await sniffHolochainAppCells(conn)
    console.log("dna config", dnaConfig)
    return {
      client: await autoConnect({
        // passthrough detected DNA config to skip unnecessary redetect
        dnaConfig,
        // bind extension GraphQL schema defs and bound resolver callbacks
        extensionSchemas,
        extensionResolvers: await bindResolvers(dnaConfig as ExtendedDnaConfig, url),
      }),
      // client: await AppAgentWebsocket.connect(new URL(url), appId)
    }
  } catch (e) {
    console.error("Holochain connection error", e)
    throw error(500, "Holochain connection error")
  }
}
