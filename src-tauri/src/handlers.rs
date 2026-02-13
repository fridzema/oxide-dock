use crate::commands;
use crate::error::AppResult;
use crate::state::AppState;
use log::info;

#[tauri::command]
pub fn greet(name: &str) -> String {
    info!("greet called with name={}", name);
    commands::greet(name)
}

#[tauri::command]
pub fn greet_checked(name: &str) -> AppResult<String> {
    info!("greet_checked called with name={}", name);
    commands::greet_checked(name)
}

#[tauri::command]
pub fn get_app_info(state: tauri::State<'_, AppState>) -> AppResult<commands::AppInfo> {
    info!("get_app_info called");
    commands::get_app_info(&state)
}

#[tauri::command]
pub fn read_text_file(path: String) -> AppResult<commands::ReadFileResult> {
    info!("read_text_file called with path={}", path);
    commands::read_text_file(path)
}
