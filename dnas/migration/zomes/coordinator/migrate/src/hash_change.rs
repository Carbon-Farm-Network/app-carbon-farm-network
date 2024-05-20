use hdk::prelude::*;
use migrate_integrity::*;
#[hdk_extern]
pub fn create_hash_change(hash_change: HashChange) -> ExternResult<Record> {
    let hash_change_hash = create_entry(&EntryTypes::HashChange(hash_change.clone()))?;
    let record = get(hash_change_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created HashChange"))
            ),
        )?;
    let path = Path::from("all_hash_changes");
    create_link(
        path.path_entry_hash()?,
        hash_change_hash.clone(),
        LinkTypes::AllHashChanges,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_hash_change(hash_change_hash: ActionHash) -> ExternResult<Option<Record>> {
    let Some(details) = get_details(hash_change_hash, GetOptions::default())? else {
        return Ok(None);
    };
    match details {
        Details::Record(details) => Ok(Some(details.record)),
        _ => {
            Err(
                wasm_error!(
                    WasmErrorInner::Guest(String::from("Malformed get details response"))
                ),
            )
        }
    }
}
