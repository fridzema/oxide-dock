#!/usr/bin/env bash
set -euo pipefail

# Escape special characters for use in sed replacement strings
sed_escape() {
  printf '%s' "$1" | sed 's/[\/&\\.^$*[]/\\&/g'
}

echo "OxideDock Bootstrap — Rename your project"
echo "==========================================="
echo ""

read -rp "App name (e.g. MyApp): " APP_NAME
read -rp "Package name (lowercase, e.g. myapp): " PKG_NAME
read -rp "Bundle identifier (e.g. com.example.myapp): " BUNDLE_ID

if [[ -z "$APP_NAME" || -z "$PKG_NAME" || -z "$BUNDLE_ID" ]]; then
  echo "Error: All fields are required."
  exit 1
fi

SAFE_APP_NAME=$(sed_escape "$APP_NAME")
SAFE_PKG_NAME=$(sed_escape "$PKG_NAME")
SAFE_BUNDLE_ID=$(sed_escape "$BUNDLE_ID")

echo ""
echo "Renaming OxideDock → $APP_NAME ($PKG_NAME)"
echo ""

# package.json
sed -i.bak "s/\"oxidedock\"/\"$SAFE_PKG_NAME\"/" package.json

# Cargo.toml
sed -i.bak "s/name = \"oxidedock\"/name = \"$SAFE_PKG_NAME\"/" src-tauri/Cargo.toml
sed -i.bak "s/name = \"oxidedock_lib\"/name = \"${SAFE_PKG_NAME}_lib\"/" src-tauri/Cargo.toml
sed -i.bak "s/OxideDock: a Rust + Vue desktop application foundation/$SAFE_APP_NAME: a Rust + Vue desktop application/" src-tauri/Cargo.toml

# tauri.conf.json
sed -i.bak "s/\"OxideDock\"/\"$SAFE_APP_NAME\"/g" src-tauri/tauri.conf.json
sed -i.bak "s/com.oxidedock.desktop/$SAFE_BUNDLE_ID/" src-tauri/tauri.conf.json

# index.html
sed -i.bak "s/<title>OxideDock<\/title>/<title>$SAFE_APP_NAME<\/title>/" index.html

# main.rs
sed -i.bak "s/oxidedock_lib/${SAFE_PKG_NAME}_lib/" src-tauri/src/main.rs

# README heading
sed -i.bak "s/^# OxideDock$/# $SAFE_APP_NAME/" README.md

# CONTRIBUTING heading
sed -i.bak "s/^# Contributing to OxideDock$/# Contributing to $SAFE_APP_NAME/" CONTRIBUTING.md

# state.rs — default app name
sed -i.bak "s/\"OxideDock\"/\"$SAFE_APP_NAME\"/" src-tauri/src/state.rs

# DefaultLayout.vue — nav brand
sed -i.bak "s/alt=\"OxideDock\"/alt=\"$SAFE_APP_NAME\"/" src/layouts/DefaultLayout.vue
sed -i.bak "s/>OxideDock</>$SAFE_APP_NAME</" src/layouts/DefaultLayout.vue

# HomePage.vue — hero heading and description
sed -i.bak "s/>OxideDock</>$SAFE_APP_NAME</" src/pages/HomePage.vue
sed -i.bak "s/OxideDock is powered/$SAFE_APP_NAME is powered/" src/pages/HomePage.vue

# AboutPage.vue — about heading
sed -i.bak "s/About OxideDock/About $SAFE_APP_NAME/" src/pages/AboutPage.vue

# commands.rs — test assertions
sed -i.bak "s/\"OxideDock\"/\"$SAFE_APP_NAME\"/g" src-tauri/src/commands.rs

# release.yml — release name
sed -i.bak "s/OxideDock/$SAFE_APP_NAME/" .github/workflows/release.yml

# Clean up .bak files
find . -name "*.bak" -delete

echo "Done! Review the changes with 'git diff' and run 'make ci' to verify."
