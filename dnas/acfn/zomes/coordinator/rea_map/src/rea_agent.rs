use hdk::prelude::*;
use rea_map_integrity::*;
#[hdk_extern]
pub fn create_rea_agent(rea_agent: ReaAgent) -> ExternResult<Record> {
    let rea_agent_hash = create_entry(&EntryTypes::ReaAgent(rea_agent.clone()))?;
    let record = get(rea_agent_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created ReaAgent"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_rea_agent(
    original_rea_agent_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        original_rea_agent_hash.clone(),
        LinkTypes::ReaAgentUpdates,
        None,
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));
    let latest_rea_agent_hash = match latest_link {
        Some(link) => ActionHash::from(link.target.clone()),
        None => original_rea_agent_hash.clone(),
    };
    get(latest_rea_agent_hash, GetOptions::default())
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateReaAgentInput {
    pub original_rea_agent_hash: ActionHash,
    pub previous_rea_agent_hash: ActionHash,
    pub updated_rea_agent: ReaAgent,
}
#[hdk_extern]
pub fn update_rea_agent(input: UpdateReaAgentInput) -> ExternResult<Record> {
    let updated_rea_agent_hash = update_entry(
        input.previous_rea_agent_hash.clone(),
        &input.updated_rea_agent,
    )?;
    create_link(
        input.original_rea_agent_hash.clone(),
        updated_rea_agent_hash.clone(),
        LinkTypes::ReaAgentUpdates,
        (),
    )?;
    let record = get(updated_rea_agent_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated ReaAgent"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_rea_agent(
    original_rea_agent_hash: ActionHash,
) -> ExternResult<ActionHash> {
    delete_entry(original_rea_agent_hash)
}
