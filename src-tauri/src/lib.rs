mod commands;
mod error;
mod handlers;
mod state;

/// # Errors
///
/// Returns an error if the Tauri runtime fails to initialize or run.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    // Workaround for tauri-apps/tauri#6200 and #14427: scrolling is broken in
    // AppImage bundles on Wayland because the bundled webkit2gtk uses the
    // DMA-BUF renderer. Disabling it restores wheel scroll. Must be set before
    // the webview initializes. Harmless on X11; does not affect .deb builds.
    #[cfg(target_os = "linux")]
    // SAFETY: single-threaded process startup, no other threads read env yet.
    unsafe {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .manage(state::AppState::default())
        .invoke_handler(tauri::generate_handler![
            handlers::greet,
            handlers::greet_checked,
            handlers::get_app_info
        ])
        .run(tauri::generate_context!())?;
    Ok(())
}
