# tray

```bash
make add-tray
```

Puts an icon for your app in the system tray — the macOS menu bar, the Windows notification area,
the Linux status area — with a menu behind it. It is what makes an app feel like it is *running*
rather than just open, and it is the natural home for "show window", "start/stop", and Quit.

## What it does

Enables the two `tauri` crate features the tray needs, then builds a tray icon in the app's
`setup` closure: the window icon, a tooltip, and a one-item menu whose Quit entry calls
`app.exit(0)`.

## Cargo features, and why they are off by default

`tauri`'s default features are `wry`, `compression`, `common-controls-v6`, `dynamic-acl`, `x11`
and `dbus`. Tray support is not among them, because most apps do not want a tray and the feature
pulls in the platform tray stack (`tray-icon`, `muda`) on every target. The recipe turns on:

| Feature | Why |
| --- | --- |
| `tray-icon` | The `tauri::tray` module itself — without it `TrayIconBuilder` does not exist |
| `image-png` | Decoding the PNG icon that `app.default_window_icon()` hands back |

Leaving `image-png` off compiles, then fails at runtime with an unsupported-image error. Both are
required; the recipe enables both.

## Files it changes

| File | Change |
| --- | --- |
| `src-tauri/Cargo.toml` | `tauri = { version = "2", features = ["tray-icon", "image-png"] }` |
| `src-tauri/src/lib.rs` | Renames the setup closure's `_app` binding to `app`, and inserts the tray code at the `// oxide:setup` anchor |

No frontend code, no capability: the tray lives entirely on the Rust side.

## The generated code

```rust
.setup(|app| {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::TrayIconBuilder;

    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&quit])?;

    let mut tray = TrayIconBuilder::with_id("main")
        .tooltip("OxideDock")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| {
            if event.id() == "quit" {
                app.exit(0);
            }
        });

    // The bundled app always has an icon; a `tauri dev` run without one still works.
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }

    tray.build(app)?;
    // oxide:setup
    Ok(())
})
```

## Customizing

**More menu items.** Build another `MenuItem::with_id`, add it to `Menu::with_items`, and match
its id in `on_menu_event`. A "show the window" item is the usual second entry:

```rust
let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
let menu = Menu::with_items(app, &[&show, &PredefinedMenuItem::separator(app)?, &quit])?;
```

```rust
.on_menu_event(|app, event| match event.id().as_ref() {
    "show" => {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
    "quit" => app.exit(0),
    _ => {}
})
```

`tauri::menu` also has `PredefinedMenuItem` (separators, platform items), `CheckMenuItem`, and
`Submenu`.

**Click behavior.** `show_menu_on_left_click(false)` plus `.on_tray_icon_event(...)` lets a left
click toggle the window while a right click still opens the menu. On macOS the menu bar convention
is a left click opening the menu, which is the default here.

**A different icon.** Replace `app.default_window_icon()` with your own
`tauri::image::Image::from_bytes(include_bytes!("../icons/tray.png"))?`. Menu-bar icons on macOS
should be a monochrome template image; `.icon_as_template(true)` tells the OS to tint it for the
current appearance.

**Tooltip.** `.tooltip("...")` is what shows on hover on Windows and Linux; macOS ignores it.

See the [Tauri system tray guide](https://v2.tauri.app/learn/system-tray/) and the
[`TrayIconBuilder` API docs](https://docs.rs/tauri/latest/tauri/tray/struct.TrayIconBuilder.html).

## Undo

```bash
git checkout -- src-tauri/Cargo.toml src-tauri/src/lib.rs
```

Recipes have no uninstall; reverting the diff is the supported undo.
