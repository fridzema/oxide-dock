use crate::error::{AppError, AppResult};
use crate::state::AppState;
use log::info;
use serde::Serialize;

#[derive(Serialize)]
pub struct AppInfo {
    pub name: String,
    pub visit_count: u32,
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    info!("greet called with name={}", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub fn greet_checked(name: &str) -> AppResult<String> {
    info!("greet_checked called with name={}", name);
    if name.trim().is_empty() {
        return Err(AppError::Validation("Name cannot be empty".to_string()));
    }
    Ok(format!("Hello, {}! You've been greeted from Rust!", name))
}

#[tauri::command]
pub fn get_app_info(state: tauri::State<'_, AppState>) -> AppResult<AppInfo> {
    info!("get_app_info called");
    let mut count = state
        .visit_count
        .lock()
        .map_err(|e| AppError::Internal(format!("Lock poisoned: {e}")))?;
    *count += 1;
    Ok(AppInfo {
        name: state.app_name.clone(),
        visit_count: *count,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet() {
        let result = greet("World");
        assert_eq!(result, "Hello, World! You've been greeted from Rust!");
    }

    #[test]
    fn test_greet_empty() {
        let result = greet("");
        assert_eq!(result, "Hello, ! You've been greeted from Rust!");
    }

    #[test]
    fn test_greet_checked_valid() {
        let result = greet_checked("World");
        assert_eq!(
            result.unwrap(),
            "Hello, World! You've been greeted from Rust!"
        );
    }

    #[test]
    fn test_greet_checked_empty() {
        let result = greet_checked("");
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(matches!(err, AppError::Validation(_)));
        assert_eq!(format!("{err}"), "Validation failed: Name cannot be empty");
    }

    #[test]
    fn test_greet_checked_whitespace() {
        let result = greet_checked("   ");
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(matches!(err, AppError::Validation(_)));
    }

    #[test]
    fn test_app_info_serialization() {
        let info = AppInfo {
            name: "Test".to_string(),
            visit_count: 42,
        };
        let json = serde_json::to_value(&info).unwrap();
        assert_eq!(json["name"], "Test");
        assert_eq!(json["visit_count"], 42);
    }
}
