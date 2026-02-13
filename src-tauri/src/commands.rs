use crate::error::{AppError, AppResult};
use crate::state::AppState;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct AppInfo {
    pub name: String,
    pub visit_count: u32,
}

#[derive(Debug, Serialize)]
pub struct ReadFileResult {
    pub path: String,
    pub content: String,
    pub size_bytes: usize,
}

pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

pub fn greet_checked(name: &str) -> AppResult<String> {
    if name.trim().is_empty() {
        return Err(AppError::Validation("Name cannot be empty".to_string()));
    }
    Ok(format!("Hello, {}! You've been greeted from Rust!", name))
}

pub fn get_app_info(state: &AppState) -> AppResult<AppInfo> {
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

pub fn read_text_file(path: String) -> AppResult<ReadFileResult> {
    let content = std::fs::read_to_string(&path)
        .map_err(|e| AppError::FileSystem(format!("Failed to read {}: {}", path, e)))?;
    let size_bytes = content.len();
    Ok(ReadFileResult {
        path,
        content,
        size_bytes,
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
    fn test_get_app_info() {
        let state = AppState::default();
        let result = get_app_info(&state);
        assert!(result.is_ok());
        let info = result.unwrap();
        assert_eq!(info.name, "OxideDock");
        assert_eq!(info.visit_count, 1);
    }

    #[test]
    fn test_get_app_info_increments() {
        let state = AppState::default();
        let _ = get_app_info(&state).unwrap();
        let info = get_app_info(&state).unwrap();
        assert_eq!(info.visit_count, 2);
    }

    #[test]
    fn test_get_app_info_poisoned_mutex() {
        let state = AppState::default();
        // Poison the mutex by panicking while holding it
        let _ = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            let _lock = state.visit_count.lock().unwrap();
            panic!("poison the mutex");
        }));
        let result = get_app_info(&state);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(matches!(err, AppError::Internal(_)));
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

    #[test]
    fn test_read_file_result_serialization() {
        let result = ReadFileResult {
            path: "/test/file.txt".to_string(),
            content: "hello".to_string(),
            size_bytes: 5,
        };
        let json = serde_json::to_value(&result).unwrap();
        assert_eq!(json["path"], "/test/file.txt");
        assert_eq!(json["content"], "hello");
        assert_eq!(json["size_bytes"], 5);
    }

    #[test]
    fn test_read_text_file_nonexistent() {
        let result = read_text_file("/nonexistent/path/file.txt".to_string());
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(matches!(err, AppError::FileSystem(_)));
    }

    #[test]
    fn test_read_text_file_real_file() {
        use std::io::Write;
        let dir = std::env::temp_dir();
        let file_path = dir.join("oxidedock_test_read.txt");
        let mut file = std::fs::File::create(&file_path).unwrap();
        write!(file, "test content").unwrap();

        let result = read_text_file(file_path.to_string_lossy().to_string());
        assert!(result.is_ok());
        let res = result.unwrap();
        assert_eq!(res.content, "test content");
        assert_eq!(res.size_bytes, 12);

        std::fs::remove_file(file_path).unwrap();
    }
}
