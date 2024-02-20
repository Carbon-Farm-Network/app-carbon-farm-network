import { browser } from '$app/environment'
import { error } from '@sveltejs/kit'
// import autoConnect from '@vf-ui/graphql-client-mock' // enable to use in-memory mock API
import autoConnect from '@vf-ui/graphql-client-holochain'
import { sniffHolochainAppCells } from '@valueflows/vf-graphql-holochain'
import { AppWebsocket, AdminWebsocket, AppAgentWebsocket } from '@holochain/client'
// import { WeClient, isWeContext, initializeHotReload, type HrlWithContext, type Hrl } from '@lightningrodlabs/we-applet';
import extensionSchemas from '$lib/graphql/extension-schemas'
import bindResolvers from '$lib/graphql/extension-resolvers'
import type { ExtendedDnaConfig } from '$lib/graphql/extension-resolvers'
import type { AppSignalCb, CellId } from '@holochain/client'
import { appletServices } from '../../we';

const appId = 'acfn'
const ENV_CONNECTION_URI = process.env.REACT_APP_HC_CONN_URL as string || ''
const adminPort = import.meta.env.VITE_ADMIN_PORT
const appPort = import.meta.env.VITE_APP_PORT
const url = `ws://localhost:${appPort}`;
// let weClient: WeClient
let connected = false

// enum RenderType {
//   App,
//   Hrl,
//   BlockActiveBoards
// }

// let renderType = RenderType.App
// let hrlWithContext: HrlWithContext

// export async function load() : Promise<void> {
//   console.log("loading......")
//   if ((import.meta as any).env.DEV) {
//     try {
//       await initializeHotReload();
//     } catch (e) {
//       console.warn("Could not initialize applet hot-reloading. This is only expected to work in a We context in dev mode.")
//     }
//   }
//   if (!isWeContext()) {
//       loadNormal();
//   }
//   else {
//     weClient = await WeClient.connect(appletServices);

//     switch (weClient.renderInfo.type) {
//       case "applet-view":
//         switch (weClient.renderInfo.view.type) {
//           case "main":
//             // here comes your rendering logic for the main view
//             break;
//           case "block":
//             switch(weClient.renderInfo.view.block) {
//               case "active_boards":
//                 renderType = RenderType.BlockActiveBoards
//                 break;
//               default:
//                 throw new Error("Unknown applet-view block type:"+weClient.renderInfo.view.block);
//             }
//             break;
//           case "attachable":
//             switch (weClient.renderInfo.view.roleName) {
//               case "calcy":
//                 switch (weClient.renderInfo.view.integrityZomeName) {
//                   case "syn_integrity":
//                     switch (weClient.renderInfo.view.entryType) {
//                       case "document":
//                         renderType = RenderType.Hrl
//                         hrlWithContext = weClient.renderInfo.view.hrlWithContext
//                         break;
//                       default:
//                         throw new Error("Unknown entry type:"+weClient.renderInfo.view.entryType);
//                     }
//                     break;
//                   default:
//                     throw new Error("Unknown integrity zome:"+weClient.renderInfo.view.integrityZomeName);
//                 }
//                 break;
//               default:
//                 throw new Error("Unknown role name:"+weClient.renderInfo.view.roleName);
//             }
//             break;
//           default:
//             throw new Error("Unsupported applet-view type");
//         }
//         break;
//       default:
//         throw new Error("Unknown render view type");

//     }
    
//     //@ts-ignore
//     client = weClient.renderInfo.appletClient;
//     //@ts-ignore
//     profilesClient = weClient.renderInfo.profilesClient;
//   }
//   connected = true
// }

// export async function loadNormal() {
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
