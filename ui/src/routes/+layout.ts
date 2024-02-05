import { browser } from '$app/environment'
import { error } from '@sveltejs/kit'
// import autoConnect from '@vf-ui/graphql-client-mock' // enable to use in-memory mock API
import autoConnect from '@vf-ui/graphql-client-holochain'
import { sniffHolochainAppCells } from '@valueflows/vf-graphql-holochain'
import { AppWebsocket, AdminWebsocket, AppAgentWebsocket } from '@holochain/client'

import extensionSchemas from '$lib/graphql/extension-schemas'
import bindResolvers from '$lib/graphql/extension-resolvers'
import type { ExtendedDnaConfig } from '$lib/graphql/extension-resolvers'
import type { AppSignalCb, CellId } from '@holochain/client'

const appId = 'acfn'
const ENV_CONNECTION_URI = process.env.REACT_APP_HC_CONN_URL as string || ''
const adminPort = import.meta.env.VITE_ADMIN_PORT
const appPort = import.meta.env.VITE_APP_PORT
const url = `ws://localhost:${appPort}`;

export async function load() {
  if (!browser) return
  try {
    // env.APP_INTERFACE_PORT = appPort
    // window.env.APP_INTERFACE_PORT = appPort
    console.log("adminPort is", adminPort)
    console.log("url is", url)
    console.log("appId is", appId)
    let cellID: CellId;
    if (adminPort) {
      const adminWebsocket = await AdminWebsocket.connect(new URL(`ws://localhost:${adminPort}`))
      const x = await adminWebsocket.listApps({})
      console.log("apps", x)
      const cellIds = await adminWebsocket.listCellIds()
      cellID = cellIds[0]
      console.log("CELL IDS",cellIds)
      await adminWebsocket.authorizeSigningCredentials(cellIds[0])
    } else {
      console.log("no admin port")
    }
    console.log('hi', url)
    // pull DNA config separately in order to bind to CFN-specific extension Cells
    const conn = await AppWebsocket.connect(url)
    // const conn = await AppWebsocket.connect(ENV_CONNECTION_URI)
    console.log("conn is ", conn)
    const { dnaConfig } = await sniffHolochainAppCells(conn, appId)
    console.log("dna config", dnaConfig)
    // const cl = await AppAgentWebsocket.connect(new URL(url), appId)
    // console.log("cl", cl)
    // const traceAppSignals: AppSignalCb = (signal) => {
    //   return {
    //     cell_id: signal.cell_id,
    //     zome_name: signal.zome_name,
    //     payload: signal.payload,
    //   }
    // }
    return {
      client: await autoConnect({
        appID: appId,
        // passthrough detected DNA config to skip unnecessary redetect
        // dnaConfig: dnaConfig,
        // bind extension GraphQL schema defs and bound resolver callbacks
        // traceAppSignals: traceAppSignals,
        extensionSchemas,
        extensionResolvers: await bindResolvers(dnaConfig as ExtendedDnaConfig, url),
        conductorUri: url,
        adminConductorUri: `ws://localhost:${adminPort}`,
      }),
      // client: cl
    }
  } catch (e) {
    console.error("Holochain connection error", e)
    throw error(500, "Holochain connection error")
  }
}
