.PHONY: help dev dev-frontend build build-debug lint lint-fix format format-check \
	test test-unit test-e2e test-watch rust-lint rust-format rust-audit rust-test \
	rust-coverage coverage ci setup clean release-status

# Help (default target)
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  dev            Start Tauri dev server"
	@echo "  dev-frontend   Start frontend dev server only"
	@echo "  build          Build for production"
	@echo "  build-debug    Build with debug symbols"
	@echo ""
	@echo "Linting & Formatting:"
	@echo "  lint           Run all linters"
	@echo "  lint-fix       Auto-fix lint issues"
	@echo "  format         Format all code"
	@echo "  format-check   Check formatting without changes"
	@echo ""
	@echo "Testing:"
	@echo "  test           Run all tests"
	@echo "  test-unit      Run unit tests"
	@echo "  test-e2e       Run e2e tests"
	@echo "  test-watch     Run unit tests in watch mode"
	@echo ""
	@echo "Rust:"
	@echo "  rust-lint      Run cargo clippy"
	@echo "  rust-format    Run cargo fmt"
	@echo "  rust-audit     Run cargo audit"
	@echo "  rust-test      Run cargo test"
	@echo "  rust-coverage  Run Rust tests with coverage"
	@echo "  coverage       Run all coverage (Rust + Vue)"
	@echo ""
	@echo "Release:"
	@echo "  release-status Check for open Release PRs"
	@echo ""
	@echo "CI & Setup:"
	@echo "  ci             Run full CI pipeline"
	@echo "  setup          Install dependencies"
	@echo "  clean          Remove build artifacts"

# Development
dev:
	bun tauri dev

dev-frontend:
	bun run dev

build:
	bun tauri build

build-debug:
	bun tauri build --debug

# Linting & Formatting
lint:
	bun run lint
	cd src-tauri && cargo clippy -- -D warnings

lint-fix:
	bun run lint:fix
	cd src-tauri && cargo clippy --fix --allow-dirty

format:
	bun run format
	cd src-tauri && cargo fmt

format-check:
	bun run format:check
	cd src-tauri && cargo fmt -- --check

# Testing
test: test-unit test-e2e rust-test

test-unit:
	bun run test:unit

test-e2e:
	bun run test:e2e

test-watch:
	bun run test:unit:watch

# Rust-specific
rust-lint:
	cd src-tauri && cargo clippy -- -D warnings

rust-format:
	cd src-tauri && cargo fmt

rust-audit:
	@command -v cargo-audit >/dev/null 2>&1 || { echo "cargo-audit not installed. Run: cargo install cargo-audit"; exit 1; }
	cd src-tauri && cargo audit

rust-test:
	cd src-tauri && cargo test

rust-coverage:
	@command -v cargo-llvm-cov >/dev/null 2>&1 || { echo "cargo-llvm-cov not installed. Run: cargo install cargo-llvm-cov"; exit 1; }
	cd src-tauri && cargo llvm-cov --fail-under-lines 100 --ignore-filename-regex '(main|lib)\.rs'

coverage: rust-coverage
	bun run test:unit:coverage

# CI
ci: lint format-check test-unit test-e2e rust-test rust-coverage build

# Setup
setup:
	bun install
	bunx playwright install --with-deps chromium firefox webkit
	bunx lefthook install
	@echo "Optional: cargo install cargo-audit (for make rust-audit)"

clean:
	rm -rf node_modules dist
	cd src-tauri && cargo clean

# Release
release-status:
	@echo "Current version: $$(grep '"version"' package.json | head -1 | awk -F'"' '{print $$4}')"
	@echo ""
	@gh pr list --label "autorelease: pending" 2>/dev/null || echo "No release PRs found (install gh CLI to check)"
	@echo ""
	@echo "Release workflow: push conventional commits to main → release-please creates a Release PR → merge it to tag and release"
