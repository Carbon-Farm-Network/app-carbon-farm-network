use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct ReaAgent {
    pub name: String,
    pub latitude: i32,
    pub longitude: i32,
    pub image_url: String,
    pub address: String,
    pub icon_url: String,
}
pub fn validate_create_rea_agent(
    _action: EntryCreationAction,
    _rea_agent: ReaAgent,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_rea_agent(
    _action: Update,
    _rea_agent: ReaAgent,
    _original_action: EntryCreationAction,
    _original_rea_agent: ReaAgent,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_rea_agent(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_rea_agent: ReaAgent,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_rea_agent_updates(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Check the entry type for the given action hash
    let action_hash = ActionHash::from(base_address);
    let record = must_get_valid_record(action_hash)?;
    let _rea_agent: crate::ReaAgent = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    // Check the entry type for the given action hash
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _rea_agent: crate::ReaAgent = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Linked action must reference an entry"))
            ),
        )?;
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_rea_agent_updates(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(
        ValidateCallbackResult::Invalid(
            String::from("ReaAgentUpdates links cannot be deleted"),
        ),
    )
}
