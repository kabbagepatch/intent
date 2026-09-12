use tauri::Manager;
use tauri::tray::TrayIconBuilder;
use tauri_plugin_positioner::{Position, WindowExt};
use tauri_plugin_store::StoreExt;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let win = app.get_webview_window("main").unwrap();
            let _ = win.as_ref().window().move_window(Position::BottomRight);
            TrayIconBuilder::new()
            .on_tray_icon_event(|app, event| {
                tauri_plugin_positioner::on_tray_event(app.app_handle(), &event);
            })
            .build(app)?;
            let store = app.store("store.json")?;
            store.clear();
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
