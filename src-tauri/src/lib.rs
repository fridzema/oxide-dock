#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn greet_checked(name: &str) -> Result<String, String> {
    if name.trim().is_empty() {
        return Err("Name cannot be empty".to_string());
    }
    Ok(format!("Hello, {}! You've been greeted from Rust!", name))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![greet, greet_checked])
        .run(tauri::generate_context!())?;
    Ok(())
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
            result,
            Ok("Hello, World! You've been greeted from Rust!".to_string())
        );
    }

    #[test]
    fn test_greet_checked_empty() {
        let result = greet_checked("");
        assert_eq!(result, Err("Name cannot be empty".to_string()));
    }

    #[test]
    fn test_greet_checked_whitespace() {
        let result = greet_checked("   ");
        assert_eq!(result, Err("Name cannot be empty".to_string()));
    }
}
