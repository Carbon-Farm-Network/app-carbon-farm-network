import { assert, test } from "vitest";

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeDnaHash, fakeActionHash, fakeAgentPubKey, fakeEntryHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { createReaAgent, sampleReaAgent } from './common.js';

test('create ReaAgent', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/acfn.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a ReaAgent
    const record: Record = await createReaAgent(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read ReaAgent', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/acfn.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const sample = await sampleReaAgent(alice.cells[0]);

    // Alice creates a ReaAgent
    const record: Record = await createReaAgent(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await pause(1200);

    // Bob gets the created ReaAgent
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "rea_map",
      fn_name: "get_rea_agent",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test('create and update ReaAgent', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/acfn.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a ReaAgent
    const record: Record = await createReaAgent(alice.cells[0]);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the ReaAgent
    let contentUpdate: any = await sampleReaAgent(alice.cells[0]);
    let updateInput = {
      original_rea_agent_hash: originalActionHash,
      previous_rea_agent_hash: originalActionHash,
      updated_rea_agent: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "rea_map",
      fn_name: "update_rea_agent",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated ReaAgent
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "rea_map",
      fn_name: "get_rea_agent",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the ReaAgent again
    contentUpdate = await sampleReaAgent(alice.cells[0]);
    updateInput = { 
      original_rea_agent_hash: originalActionHash,
      previous_rea_agent_hash: updatedRecord.signed_action.hashed.hash,
      updated_rea_agent: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "rea_map",
      fn_name: "update_rea_agent",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated ReaAgent
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "rea_map",
      fn_name: "get_rea_agent",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);
  });
});

test('create and delete ReaAgent', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/acfn.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a ReaAgent
    const record: Record = await createReaAgent(alice.cells[0]);
    assert.ok(record);
        
    // Alice deletes the ReaAgent
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "rea_map",
      fn_name: "delete_rea_agent",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await pause(1200);
        
    // Bob tries to get the deleted ReaAgent
    const readDeletedOutput = await bob.cells[0].callZome({
      zome_name: "rea_map",
      fn_name: "get_rea_agent",
      payload: record.signed_action.hashed.hash,
    });
    assert.notOk(readDeletedOutput);
  });
});
