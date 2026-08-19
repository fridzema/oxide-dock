/**
 * Recipe: window-state
 *
 * Restores each window's size, position and maximized state on launch, and
 * saves it again on exit. The plugin does all of that on its own once it is
 * registered — there is no frontend code and no capability to grant.
 *
 * Run with `make add-window-state`. Safe to run twice.
 */

import { addCargoDependency, insertAtMarker, log } from '../_lib/apply'

const LIB_RS = 'src-tauri/src/lib.rs'
const CRATE = 'tauri-plugin-window-state'
const VERSION = '2.4.1'

addCargoDependency(CRATE, VERSION)

insertAtMarker(
  LIB_RS,
  '// oxide:plugins',
  '.plugin(tauri_plugin_window_state::Builder::new().build())',
)

console.log('Recipe: window-state')
log(`${CRATE} ${VERSION} is in src-tauri/Cargo.toml`)
log(`the plugin is registered at // oxide:plugins in ${LIB_RS}`)
log('nothing else to do — windows restore their size and position from the next launch on')
log('details: recipes/window-state/README.md')
