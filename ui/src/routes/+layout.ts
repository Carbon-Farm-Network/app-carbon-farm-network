import { browser } from '$app/environment'
import { error } from '@sveltejs/kit'
// import autoConnect from '@vf-ui/graphql-client-mock' // enable to use in-memory mock API
import autoConnect from '@leosprograms/graphql-client-holochain'
import { openConnection, sniffHolochainAppCells } from '@leosprograms/vf-graphql-holochain'
import { AppWebsocket, AdminWebsocket } from '@holochain/client'
import extensionSchemas from '$lib/graphql/extension-schemas'
import bindResolvers from '$lib/graphql/extension-resolvers'
import type { ExtendedDnaConfig } from '$lib/graphql/extension-resolvers'
import type { AppSignalCb, CellId } from '@holochain/client'
import { appletServices } from '../../we';
import { onMount } from 'svelte';
import { WeaveClient, isWeContext, initializeHotReload, type WAL} from '@lightningrodlabs/we-applet';
import { ApolloClient } from "@apollo/client/core";
import { setClient } from "../crud/store"

const appId = 'acfn'
const ENV_CONNECTION_URI = process.env.REACT_APP_HC_CONN_URL as string || ''
const adminPort = import.meta.env.VITE_ADMIN_PORT
const appPort = import.meta.env.VITE_APP_PORT
const url = `ws://localhost:${appPort}`;
let weClient: WeaveClient
let client: AppWebsocket
let createView
let connected = false

enum RenderType {
  App,
  WAL,
  CreateSpreadsheet,
  BlockActiveBoards
}

let renderType = RenderType.App
let wal: WAL

// export async function loadNormal() {
export async function load() {
  if (!browser) return
  console.log(import.meta.env)
  let profilesClient
  if ((import.meta as any).env.DEV) {
    try {
      await initializeHotReload();
    } catch (e) {
      console.warn("Could not initialize applet hot-reloading. This is only expected to work in a We context in dev mode.")
    }
  }
  try {
    if (isWeContext()) {
      weClient = await WeaveClient.connect(appletServices);
      const weAppId = weClient.renderInfo.appletClient.installedAppId
      console.log("weClient", {...weClient.renderInfo.appletClient, callZome: weClient.renderInfo.appletClient.callZome})
      const weAppWebsocketUrl = weClient.renderInfo.appletClient.client.url
      console.log("weAppWebsocketUrl", weAppWebsocketUrl)
      const mockConn = {
        ...weClient.renderInfo.appletClient.client,
        appInfo: async (installed_app_id) => {
          return {
            cell_info: weClient.renderInfo.appletClient.cachedAppInfo.cell_info
          }
        }
      }
      const { dnaConfig } = await sniffHolochainAppCells(mockConn, weAppId)
      console.log("dna config", dnaConfig)

      const extensionResolvers = await bindResolvers(dnaConfig as ExtendedDnaConfig, weAppWebsocketUrl)

      const autoConnectInput = {
        weaveAppAgentClient: {...weClient.renderInfo.appletClient, 
          callZome: weClient.renderInfo.appletClient.callZome,
          appWebsocket: mockConn},
        appID: weAppId,
        extensionSchemas,
        extensionResolvers,
        conductorUri: weAppWebsocketUrl,
        adminConductorUri: undefined,
      }

      console.log("autoconnect input", autoConnectInput)

      const output = await autoConnect(autoConnectInput)
      // autoconnect ends

      console.log("output", output)
      await setClient(output)

      return {
        client: output
      }
      
    } else if (appPort) {
      // env.APP_INTERFACE_PORT = appPort
      // window.env.APP_INTERFACE_PORT = appPort
      console.log("adminPort is", adminPort)
      console.log("url is", url)
      console.log("appId is", appId)
      let cellID: CellId;
      if (adminPort) {
        console.log("1")
        console.log(new URL(`ws://localhost:${adminPort}`))
        const adminWebsocket = await AdminWebsocket.connect({url: new URL(`ws://localhost:${adminPort}`)})
        console.log("2")
        const x = await adminWebsocket.listApps({})
        console.log("apps", x)
        const cellIds = await adminWebsocket.listCellIds()
        cellID = cellIds[0]
        console.log("CELL IDS",cellIds)
        await adminWebsocket.authorizeSigningCredentials(cellIds[0])
        await adminWebsocket.authorizeSigningCredentials(cellIds[1])
        await adminWebsocket.authorizeSigningCredentials(cellIds[2])
        console.log("authorized three cells")
      } else {
        console.log("no admin port")
      }
 
      console.log('new url', new URL(url))
      // pull DNA config separately in order to bind to CFN-specific extension Cells
      const conn = await AppWebsocket.connect({url: new URL(url)})
      // const conn = await AppWebsocket.connect(ENV_CONNECTION_URI)
      console.log("conn is ", conn)
      const { dnaConfig } = await sniffHolochainAppCells(conn, appId)
      console.log("dna config", dnaConfig)
      let boundResolvers = await bindResolvers(dnaConfig as ExtendedDnaConfig, url)
      console.log("bound resolvers", boundResolvers)
      let oc = await openConnection(url)
      console.log("oc", oc)
      const autoConnectInput = {
        weaveAppAgentClient: undefined,
        appID: appId,
        extensionSchemas,
        extensionResolvers: boundResolvers,
        conductorUri: url,
        adminConductorUri: undefined,
      }
      console.log("autoconnect input", autoConnectInput)
      const output = await autoConnect(autoConnectInput)
      await setClient(output)
      return {
        client: output
      }      // return {
      //   client: await autoConnect({
      //     weaveAppAgentClient: undefined,
      //     appID: appId,
      //     extensionSchemas,
      //     extensionResolvers: await bindResolvers(dnaConfig as ExtendedDnaConfig, url),
      //     conductorUri: url,
      //     adminConductorUri: `ws://localhost:${adminPort}`,
      //   }),
      // }
    } else {
      throw error(500, "Holochain connection error, couldn't connect to client")
    }
  } catch (e) {
    console.error("Holochain connection error", e)
    throw error(500, "Holochain connection error")
  }
    
}
