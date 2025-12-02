# Changelog

All notable changes to the Reproducible Analysis Button extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-12-02

### Changed

- Updated default Onyxia catalog from `ide` to `capacity`
- Updated README to reflect correct default values (catalog: `capacity`, chart: `eostat`)

---

## [0.1.0] - 2025-11-17

### Added

**Core Features:**
- Quarto filter extension that generates "Reproducible Environment" buttons
- Automatic Onyxia deep-link URL generation with proper parameter encoding
- Support for three notice styles: full, minimal, button-only
- Comprehensive configuration system with 3 levels (extension, project, document)
- Metadata extraction from YAML frontmatter
- Chapter name extraction with 4-level fallback priority
- Version normalization (dots to hyphens)
- Tier validation with fallback to safe defaults

**Configuration:**
- `reproducible-config` namespace for project-level settings
- Configurable Onyxia deployment (base-url, catalog, chart)
- Customizable UI text (button-text, notice-title, session-duration)
- Brandable colors (primary-color, text-color, background-color)
- Customizable tier labels
- Per-document configuration via `reproducible` namespace

**Testing:**
- Comprehensive Playwright test suite (54 tests)
- Cross-browser testing (Chromium, Firefox, WebKit)
- Visual regression testing with screenshot comparison
- Accessibility testing (ARIA, keyboard, contrast)
- Bash test suite for quick local validation (10 tests)
- 10 QMD test fixtures covering all scenarios

**Documentation:**
- Comprehensive README with installation, configuration, troubleshooting
- 5 design documents (CLAUDE.md, USER_JOURNEY.md, etc.)
- tests/README.md for testing guide
- Inline code documentation

### Technical Details

**URL Generation:**
- Onyxia-compliant parameter encoding (strings in guillemets: «»)
- Boolean and number parameters passed as-is
- URL-safe character encoding
- Semantic tier names (no hard-coded infrastructure)

**Notice Styles:**
- Full: Title + Button + Metadata (default)
- Minimal: Button + Metadata
- Button-only: Just the button

**Supported Tiers:**
- light: 2 CPU, 8GB RAM
- medium: 6 CPU, 24GB RAM (default)
- heavy: 10 CPU, 48GB RAM
- gpu: 8 CPU, 32GB RAM, 1 GPU

**Branding:**
- Default: Onyxia color scheme (orange/black)
- Fully customizable via configuration

### Known Limitations

- Extension metadata (`contributes.metadata.project`) not fully merged by Quarto
  - Workaround: Built-in fallback values in Lua code
- Visual regression baselines generated on macOS/Darwin
  - May need platform-specific baselines for CI
- Button only renders for HTML output (not PDF/DOCX)

### Installation

```bash
# From GitHub (after push)
quarto add owner/reproducible@v0.1.0

# From local path
quarto add path/to/reproducible
```

### Minimum Requirements

- Quarto >= 1.3.0
- For testing: Node.js >= 18, Playwright

---

## [Unreleased]

### Planned for v0.2.0

- Project-level configuration precedence testing
- Custom Onyxia instance deployment examples
- CI/CD integration with GitHub Actions
- Multi-language support (i18n)
- Advanced tier auto-detection
