import { browser } from '$app/environment'
import { error } from '@sveltejs/kit'
// import autoConnect from '@vf-ui/graphql-client-mock' // enable to use in-memory mock API
import autoConnect from '@leosprograms/graphql-client-holochain'
import { sniffHolochainAppCells } from '@leosprograms/vf-graphql-holochain'
import { AppWebsocket, AdminWebsocket, AppAgentWebsocket } from '@holochain/client'
import extensionSchemas from '$lib/graphql/extension-schemas'
import bindResolvers from '$lib/graphql/extension-resolvers'
import type { ExtendedDnaConfig } from '$lib/graphql/extension-resolvers'
import type { AppSignalCb, CellId } from '@holochain/client'
import { appletServices } from '../../we';
import { onMount } from 'svelte';
import { WeClient, isWeContext, initializeHotReload, type WAL} from '@lightningrodlabs/we-applet';
import { ApolloClient } from "@apollo/client/core";

const appId = 'acfn'
const ENV_CONNECTION_URI = process.env.REACT_APP_HC_CONN_URL as string || ''
const adminPort = import.meta.env.VITE_ADMIN_PORT
const appPort = import.meta.env.VITE_APP_PORT
const url = `ws://localhost:${appPort}`;
let weClient: WeClient
let client: AppAgentWebsocket
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



// initialize()
  
async function initialize() : Promise<void> {
  console.log("initialize")
  console.log("browser", browser)
  if (!browser) return
  // let profilesClient
  if ((import.meta as any).env.DEV) {
    try {
      await initializeHotReload();
    } catch (e) {
      console.warn("Could not initialize applet hot-reloading. This is only expected to work in a We context in dev mode.")
    }
  }
  // if (!isWeContext()) {
  //     // console.log("adminPort is", adminPort)
  //     // if (adminPort) {
  //     //   const url = `ws://localhost:${adminPort}`
  //     //   const adminWebsocket = await AdminWebsocket.connect({url: new URL(url)})
  //     //   const x = await adminWebsocket.listApps({})
  //     //   console.log("apps", x)
  //     //   const cellIds = await adminWebsocket.listCellIds()
  //     //   console.log("CELL IDS",cellIds)
  //     //   await adminWebsocket.authorizeSigningCredentials(cellIds[0])
  //     // }
  //     // console.log("appPort and Id is", appPort, appId)
  //     // client = await AppAgentWebsocket.connect(appId, {url: new URL(url)})

  //     // console.log('hi', new URL(url))
  //     // // pull DNA config separately in order to bind to CFN-specific extension Cells
  //     // const conn = await AppWebsocket.connect({url: new URL(url)})
  //     // // const conn = await AppWebsocket.connect(ENV_CONNECTION_URI)
  //     // console.log("conn is ", conn)
  //     // const { dnaConfig } = await sniffHolochainAppCells(conn, appId)
  //     // console.log("dna config", dnaConfig)
  // }
  else {
    weClient = await WeClient.connect(appletServices);
    console.log(weClient.appletInfo)
    // const { dnaConfig } = await sniffHolochainAppCells(weClient, appId)

    switch (weClient.renderInfo.type) {
      case "applet-view":
        switch (weClient.renderInfo.view.type) {
          case "main":
            // here comes your rendering logic for the main view
            break;
          case "block":
            switch(weClient.renderInfo.view.block) {
              case "active_boards":
                renderType = RenderType.BlockActiveBoards
                break;
              default:
                throw new Error("Unknown applet-view block type:"+weClient.renderInfo.view.block);
            }
            break;
          case "creatable":
          switch (weClient.renderInfo.view.name) {
              case "spreadsheet":
                renderType = RenderType.CreateSpreadsheet
                createView = weClient.renderInfo.view
            }              
            break;
          case "asset":
            switch (weClient.renderInfo.view.roleName) {
              case "calcy":
                switch (weClient.renderInfo.view.integrityZomeName) {
                  case "syn_integrity":
                    switch (weClient.renderInfo.view.entryType) {
                      case "document":
                        renderType = RenderType.WAL
                        wal = weClient.renderInfo.view.wal
                        break;
                      default:
                        throw new Error("Unknown entry type:"+weClient.renderInfo.view.entryType);
                    }
                    break;
                  default:
                    throw new Error("Unknown integrity zome:"+weClient.renderInfo.view.integrityZomeName);
                }
                break;
              default:
                throw new Error("Unknown role name:"+weClient.renderInfo.view.roleName);
            }
            break;
          default:
            throw new Error("Unsupported applet-view type");
        }
        break;
      // case "cross-applet-view":
      //   switch (this.weClient.renderInfo.view.type) {
      //     case "main":
      //       // here comes your rendering logic for the cross-applet main view
      //       //break;
      //     case "block":
      //       //
      //       //break;
      //     default:
      //       throw new Error("Unknown cross-applet-view render type.")
      //   }
      //   break;
      default:
        throw new Error("Unknown render view type");

    }
    
    //@ts-ignore
    client = weClient.renderInfo.appletClient;
    //@ts-ignore
    profilesClient = weClient.renderInfo.profilesClient;
  }
  connected = true
}

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
      console.log('hi-0')
      weClient = await WeClient.connect(appletServices);
      const weAppId = weClient.renderInfo.appletClient.installedAppId
      // console.log("applet info 1", weAppId)
      let weAppWebsocket = weClient.renderInfo.appletClient.appWebsocket
      const weAppWebsocketUrl = weAppWebsocket.client.url
      // console.log("render info", weAppWebsocket)
      const { dnaConfig } = await sniffHolochainAppCells(weAppWebsocket, weAppId)
      console.log("applet info", weClient.renderInfo)

      // -----------------
      let adminConn: AdminWebsocket | null = null
      // if (adminConductorUri) {
      //   adminConn = await AdminWebsocket.connect({url: adminConductorUri})
      //   for await (let cellId of Object.values(dnaConfig)) {
      //     await adminConn.authorizeSigningCredentials(cellId)
      //   }
      // }
      // -----------------

      console.log("hi-2")

      const output = await autoConnect({
        appID: weAppId,
        extensionSchemas,
        extensionResolvers: await bindResolvers(dnaConfig as ExtendedDnaConfig, weAppWebsocketUrl),
        conductorUri: weAppWebsocketUrl,
        adminConductorUri: undefined,
      })

      console.log("output", output)

      return {
        client: output
      }
      
    } else {
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
      } else {
        console.log("no admin port")
      }
 
      console.log('hi', new URL(url))
      // pull DNA config separately in order to bind to CFN-specific extension Cells
      const conn = await AppWebsocket.connect({url: new URL(url)})
      // const conn = await AppWebsocket.connect(ENV_CONNECTION_URI)
      console.log("conn is ", conn)
      const { dnaConfig } = await sniffHolochainAppCells(conn, appId)
      console.log("dna config", dnaConfig)
      return {
        client: await autoConnect({
          appID: appId,
          extensionSchemas,
          extensionResolvers: await bindResolvers(dnaConfig as ExtendedDnaConfig, url),
          conductorUri: url,
          adminConductorUri: `ws://localhost:${adminPort}`,
        }),
      }
    }
  } catch (e) {
    console.error("Holochain connection error", e)
    throw error(500, "Holochain connection error")
  }
    
}
