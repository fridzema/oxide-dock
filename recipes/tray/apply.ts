/**
 * Recipe: tray
 *
 * Adds a system tray icon with a menu. Tauri gates the tray behind the
 * `tray-icon` feature and PNG icon decoding behind `image-png`, neither of
 * which is in the crate's default feature set, so both are enabled here.
 *
 * The setup closure ships with an unused `_app` binding; tray construction
 * needs the real handle, so the recipe renames it. Run with `make add-tray`.
 * Safe to run twice.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { addCargoFeatures, insertAtMarker, log, repoRoot } from '../_lib/apply'

const LIB_RS = 'src-tauri/src/lib.rs'
const FEATURES = ['tray-icon', 'image-png']

/**
 * Renames the setup closure's placeholder `_app` binding to `app`.
 *
 * Idempotent by construction: after the first run the `_app` form no longer
 * exists, so the second run finds nothing to rename and leaves the file alone.
 * Only an unrecognizable closure signature is an error worth reporting.
 */
function bindSetupApp(): void {
  const path = join(repoRoot, LIB_RS)
  const content = readFileSync(path, 'utf8')
  if (content.includes('.setup(|app|')) return
  if (!content.includes('.setup(|_app|')) {
    throw new Error(
      `No \`.setup(|_app|\` or \`.setup(|app|\` closure in ${LIB_RS}. ` +
        'The tray recipe needs the app handle — restore the setup block and re-run.',
    )
  }
  writeFileSync(path, content.replace('.setup(|_app|', '.setup(|app|'))
}

const TRAY_SETUP = `
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

// The bundled app always has an icon; a \`tauri dev\` run without one still works.
if let Some(icon) = app.default_window_icon() {
    tray = tray.icon(icon.clone());
}

tray.build(app)?;
`

addCargoFeatures('tauri', FEATURES)
bindSetupApp()
insertAtMarker(LIB_RS, '// oxide:setup', TRAY_SETUP)

console.log('Recipe: tray')
log(`tauri features ${FEATURES.join(' and ')} are enabled in src-tauri/Cargo.toml`)
log(`the setup closure in ${LIB_RS} now binds \`app\` instead of \`_app\``)
log(`the tray icon and its Quit menu are built at // oxide:setup in ${LIB_RS}`)
log('run `make dev` — the icon appears in the system tray, and Quit exits the app')
log('details: recipes/tray/README.md')
