#!/usr/bin/env bash
set -euo pipefail

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

echo ""
echo "Renaming OxideDock → $APP_NAME ($PKG_NAME)"
echo ""

# package.json
sed -i.bak "s/\"oxidedock\"/\"$PKG_NAME\"/" package.json

# Cargo.toml
sed -i.bak "s/name = \"oxidedock\"/name = \"$PKG_NAME\"/" src-tauri/Cargo.toml
sed -i.bak "s/name = \"oxidedock_lib\"/name = \"${PKG_NAME}_lib\"/" src-tauri/Cargo.toml
sed -i.bak "s/OxideDock: a Rust + Vue desktop application foundation/$APP_NAME: a Rust + Vue desktop application/" src-tauri/Cargo.toml

# tauri.conf.json
sed -i.bak "s/\"OxideDock\"/\"$APP_NAME\"/g" src-tauri/tauri.conf.json
sed -i.bak "s/com.oxidedock.desktop/$BUNDLE_ID/" src-tauri/tauri.conf.json

# index.html
sed -i.bak "s/<title>OxideDock<\/title>/<title>$APP_NAME<\/title>/" index.html

# main.rs
sed -i.bak "s/oxidedock_lib/${PKG_NAME}_lib/" src-tauri/src/main.rs

# Clean up .bak files
find . -name "*.bak" -delete

echo "Done! Review the changes with 'git diff' and run 'make ci' to verify."
