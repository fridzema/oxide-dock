.PHONY: help dev dev-frontend build build-debug lint lint-fix format format-check \
	test test-unit test-e2e test-watch rust-lint rust-format rust-audit rust-test \
	rust-coverage coverage ci check setup bootstrap clean release-status

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
	@echo ""
	@echo "Release:"
	@echo "  release-status Check for open Release PRs"
	@echo ""
	@echo "Setup & Bootstrap:"
	@echo "  check          Verify prerequisites are installed"
	@echo "  setup          Install dependencies (runs check first)"
	@echo "  bootstrap      Rename project via scripts/bootstrap.sh"
	@echo ""
	@echo "CI & Cleanup:"
	@echo "  ci             Run full CI pipeline"
	@echo "  coverage       Run all coverage (Rust + Vue)"
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
	cd src-tauri && cargo llvm-cov --fail-under-lines 100 --ignore-filename-regex '(main|lib|handlers)\.rs'

coverage: rust-coverage
	bun run test:unit:coverage

# Runs targets sequentially (stops at first failure). GitHub CI runs in parallel.
# If you want all failures at once, run individual targets separately.
ci: lint format-check test-unit test-e2e rust-test rust-coverage build

# Setup & Bootstrap
check:
	@echo "Checking prerequisites..."
	@echo ""
	@command -v rustc >/dev/null 2>&1 \
		&& echo "  rustc: $$(rustc --version)" \
		|| { echo "  rustc: NOT FOUND — install from https://www.rust-lang.org/tools/install"; exit 1; }
	@command -v cargo >/dev/null 2>&1 \
		&& echo "  cargo: $$(cargo --version)" \
		|| { echo "  cargo: NOT FOUND — install from https://www.rust-lang.org/tools/install"; exit 1; }
	@command -v bun >/dev/null 2>&1 \
		&& echo "  bun:   $$(bun --version)" \
		|| { echo "  bun:   NOT FOUND — install from https://bun.sh"; exit 1; }
	@echo ""
	@echo "Optional tools:"
	@command -v cargo-audit >/dev/null 2>&1 \
		&& echo "  cargo-audit:    installed" \
		|| echo "  cargo-audit:    not installed (cargo install cargo-audit)"
	@command -v cargo-llvm-cov >/dev/null 2>&1 \
		&& echo "  cargo-llvm-cov: installed" \
		|| echo "  cargo-llvm-cov: not installed (cargo install cargo-llvm-cov)"
	@echo ""
	@echo "All prerequisites satisfied."

setup: check
	bun install
	bunx playwright install --with-deps chromium firefox webkit
	bunx lefthook install
	@test -f .env || { cp .env.example .env && echo "Created .env from .env.example"; }
	@echo ""
	@echo "Optional: cargo install cargo-audit    (for make rust-audit)"
	@echo "Optional: cargo install cargo-llvm-cov (for make rust-coverage)"

bootstrap:
	@test -f scripts/bootstrap.sh || { echo "scripts/bootstrap.sh not found"; exit 1; }
	bash scripts/bootstrap.sh

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
