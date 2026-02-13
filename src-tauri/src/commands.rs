use crate::error::{AppError, AppResult};

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub fn greet_checked(name: &str) -> AppResult<String> {
    if name.trim().is_empty() {
        return Err(AppError::Validation("Name cannot be empty".to_string()));
    }
    Ok(format!("Hello, {}! You've been greeted from Rust!", name))
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
}
