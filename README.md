# Reproducible Analysis Button - Quarto Extension

A Quarto extension that generates "Reproducible Environment" buttons for launching one-click, pre-configured JupyterLab environments on Onyxia platforms (such as the UN Global Platform).

**Version:** 0.1.0
**Requirements:** Quarto >= 1.3.0

## Overview

This extension enables handbook authors to add reproducibility to their chapters by including a single YAML configuration. When enabled, a button is automatically generated that readers can click to launch a fully-configured computing environment with all code, data, and dependencies ready to use.

**For Readers:** One click launches a JupyterLab session in 5-15 seconds
**For Authors:** Add `reproducible: enabled: true` to your YAML frontmatter

---

## Quick Start

### Installation

**Step 1: Install the extension**

Install in your Quarto project:

```bash
quarto add un-handbook/reproducible
```

Or install from a local directory:

```bash
quarto add path/to/reproducible
```

**Step 2: Activate the filter**

Add the filter to your project's `_quarto.yml`:

```yaml
project:
  type: book  # or website, default, etc.

filters:
  - reproducible

format:
  html:
    theme: cosmo
```

### Basic Usage

**Step 3: Enable in your chapters**

Add this to your chapter's YAML frontmatter:

```yaml
---
title: "Your Chapter Title"
reproducible:
  enabled: true
---

# Your content here...
```

When rendered to HTML, a notice will appear at the top of the chapter with a button to launch the reproducible environment.

---

## Configuration

The extension supports three levels of configuration with a clear precedence hierarchy:

**Precedence:** Document > Project > Extension defaults

### Level 1: Extension Defaults

The extension provides sensible defaults for the UN Global Platform deployment. No configuration is required for basic usage.

Default settings include:
- Onyxia URL: `https://datalab.officialstatistics.org`
- Helm catalog: `handbook`
- Helm chart: `chapter-session`
- Button text: "Launch Environment"
- Notice style: Full (title + button + metadata)
- Branding: Onyxia colors (orange/black)

### Level 2: Project-Level Configuration

Configure deployment-wide settings in your project's `_quarto.yml` file using the `reproducible-config` namespace. This is useful for:
- Deploying to a different Onyxia instance
- Customizing branding and UI text
- Setting different default values

**Example: Custom Onyxia Instance**

```yaml
# _quarto.yml
project:
  type: book

filters:
  - reproducible

reproducible-config:
  onyxia:
    base-url: "https://onyxia.example.org"
    catalog: "custom-catalog"
    chart: "analysis-environment"

  ui:
    button-text: "Launch Analysis"
    notice-style: "minimal"
```

**Example: Custom Branding**

```yaml
reproducible-config:
  branding:
    primary-color: "#0066cc"
    text-color: "#333333"
    background-color: "#f5f5f5"

  ui:
    notice-title: "Interactive Environment Available"
    session-duration: "4h"
```

### Level 3: Document-Level Configuration

Configure chapter-specific settings in individual `.qmd` files using the `reproducible` namespace.

**Minimal Configuration:**

```yaml
---
title: "Chapter Title"
reproducible:
  enabled: true
---
```

**Full Configuration:**

```yaml
---
title: "Chapter Title"
reproducible:
  enabled: true

  # Resource configuration
  tier: heavy                      # light | medium | heavy | gpu
  image-flavor: gpu                # base | gpu
  data-snapshot: v1.2.3            # Version tag
  storage-size: "50Gi"             # Storage request
  estimated-runtime: "45 minutes"  # Display text

  # UI overrides (optional)
  button-text: "Launch Tutorial"   # Override button text
  notice-style: "button-only"      # full | minimal | button-only
---
```

---

## Configuration Reference

### Onyxia Deployment Settings

Configure in `_quarto.yml` under `reproducible-config.onyxia`:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `base-url` | string | `https://datalab.officialstatistics.org` | Onyxia instance URL (no trailing slash) |
| `catalog` | string | `handbook` | Helm chart catalog name |
| `chart` | string | `chapter-session` | Helm chart name |
| `auto-launch` | boolean | `true` | Pre-fill autoLaunch parameter |

### UI Customization

Configure in `_quarto.yml` under `reproducible-config.ui`:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `button-text` | string | `Launch Environment` | Text displayed on button |
| `notice-title` | string | `Reproducible Environment Available` | Title of notice wrapper |
| `notice-style` | enum | `full` | Display style (see below) |
| `session-duration` | string | `2h` | Session expiration display text |
| `show-runtime` | boolean | `true` | Show/hide estimated runtime |

**Notice Styles:**

- `full` - Title + button + metadata (default)
- `minimal` - Button + metadata, no title
- `button-only` - Just the button, no wrapper or metadata

### Branding

Configure in `_quarto.yml` under `reproducible-config.branding`:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `primary-color` | string | `rgb(255, 86, 44)` | Button and border color |
| `text-color` | string | `rgb(44, 50, 63)` | Text color in notice |
| `background-color` | string | `#fafafa` | Notice background color |

### Resource Tier Labels

Configure in `_quarto.yml` under `reproducible-config.tier-labels`:

These are display-only labels. Actual resource allocations are defined in the Helm chart.

| Tier | Default Label |
|------|---------------|
| `light` | Light (2 CPU, 8GB RAM) |
| `medium` | Medium (6 CPU, 24GB RAM) |
| `heavy` | Heavy (10 CPU, 48GB RAM) |
| `gpu` | GPU (8 CPU, 32GB RAM, 1 GPU) |

### Default Chapter Values

Configure in `_quarto.yml` under `reproducible-config.defaults`:

| Setting | Default | Description |
|---------|---------|-------------|
| `tier` | `medium` | Default resource tier |
| `image-flavor` | `base` | Default container image |
| `data-snapshot` | `latest` | Default version tag |
| `storage-size` | `20Gi` | Default storage request |
| `estimated-runtime` | `Unknown` | Default runtime estimate |

### Document-Level Settings

Configure in `.qmd` frontmatter under `reproducible`:

| Setting | Type | Required | Description |
|---------|------|----------|-------------|
| `enabled` | boolean | Yes | Show button or not |
| `tier` | enum | No | Resource tier (light, medium, heavy, gpu) |
| `image-flavor` | string | No | Container image variant |
| `data-snapshot` | string | No | Chapter version/snapshot |
| `storage-size` | string | No | Storage request (e.g., "50Gi") |
| `estimated-runtime` | string | No | Runtime estimate display |
| `chapter-name` | string | No | Override filename-based name |
| `button-text` | string | No | Override button text for this chapter |
| `notice-style` | enum | No | Override notice style for this chapter |

---

## Common Use Cases

### Use Case 1: Simple Book with Defaults

**Goal:** Add reproducibility to chapters using default UN Global Platform settings.

**Setup (_quarto.yml):**
```yaml
project:
  type: book

filters:
  - reproducible
```

**Chapter (chapter.qmd):**
```yaml
---
title: "My Chapter"
reproducible:
  enabled: true
---
```

**Result:** Full notice with default button and Onyxia orange branding.

---

### Use Case 2: Custom Deployment

**Goal:** Deploy handbook to a different Onyxia instance with custom branding.

**Setup (_quarto.yml):**
```yaml
project:
  type: book

filters:
  - reproducible

reproducible-config:
  onyxia:
    base-url: "https://onyxia.stats-france.org"
    catalog: "formation"
    chart: "jupyter-session"

  branding:
    primary-color: "#003366"

  ui:
    button-text: "Lancer l'environnement"
    notice-title: "Environnement reproductible disponible"
```

**Chapter:**
```yaml
---
title: "Chapitre 1"
reproducible:
  enabled: true
---
```

**Result:** Button points to French instance with French text and custom blue color.

---

### Use Case 3: Mixed Notice Styles

**Goal:** Use full notices for main chapters, minimal style for appendices.

**Setup (_quarto.yml):**
```yaml
reproducible-config:
  ui:
    notice-style: "full"  # Default
```

**Main Chapter:**
```yaml
---
title: "Core Analysis"
reproducible:
  enabled: true
  # Uses default "full" style
---
```

**Appendix:**
```yaml
---
title: "Appendix: Code Examples"
reproducible:
  enabled: true
  notice-style: "button-only"  # Override for minimal appearance
---
```

---

### Use Case 4: Different Resource Tiers

**Goal:** Assign appropriate compute resources to different chapters.

**Theory Chapter:**
```yaml
---
title: "Introduction to Remote Sensing"
reproducible:
  enabled: true
  tier: light
  estimated-runtime: "5 minutes"
---
```

**Analysis Chapter:**
```yaml
---
title: "Crop Classification with Random Forest"
reproducible:
  enabled: true
  tier: heavy
  estimated-runtime: "45 minutes"
  storage-size: "50Gi"
---
```

**Deep Learning Chapter:**
```yaml
---
title: "Yield Prediction with Neural Networks"
reproducible:
  enabled: true
  tier: gpu
  image-flavor: gpu
  estimated-runtime: "2 hours"
  storage-size: "100Gi"
---
```

---

## How It Works

### URL Generation

The extension generates Onyxia deep-link URLs that pre-fill all launch parameters:

```
https://datalab.officialstatistics.org/launcher/handbook/chapter-session
  ?autoLaunch=true
  &tier=«medium»
  &imageFlavor=«base»
  &chapter.name=«chapter-name»
  &chapter.version=«v1-0-0»
  &chapter.storageSize=«20Gi»
```

**URL Encoding Rules:**
- Numbers: Pass as-is (e.g., `5`)
- Booleans: Pass as-is (e.g., `true`)
- Strings: URL-encoded and wrapped in `«»` (e.g., `«medium»`)

### Chapter Name Extraction

The extension determines the chapter name using this priority:

1. Explicit override: `chapter-name` in metadata
2. Filename: Extract from `.qmd` filename (e.g., `ct_chile.qmd` → `ct_chile`)
3. Title: Sanitized version of document title
4. Fallback: `unknown-chapter`

### Version Normalization

Version strings are normalized for URL compatibility:
- Dots converted to hyphens: `v1.2.3` → `v1-2-3`
- Special characters URL-encoded

---

## Troubleshooting

### Problem: Button doesn't appear

**Possible causes:**

1. **Feature not enabled**
   - Solution: Ensure `reproducible: enabled: true` in frontmatter

2. **Rendering to non-HTML format**
   - Solution: Button only appears in HTML output (not PDF/DOCX)
   - Check: `quarto render --to html`

3. **Extension not installed**
   - Solution: Run `quarto add un-handbook/reproducible`
   - Verify: Check `_extensions/reproducible/` directory exists

4. **Syntax error in YAML**
   - Solution: Validate YAML formatting (proper indentation, colons, etc.)
   - Check: Quarto render output for error messages

### Problem: "Error in loadNamespace(x): there is no package called 'rmarkdown'"

**Cause:** Quarto is trying to execute R code, but R packages aren't installed.

**Solution:** Add `engine: markdown` to your YAML frontmatter:

```yaml
---
title: "Chapter Title"
engine: markdown
reproducible:
  enabled: true
---
```

This tells Quarto to treat code blocks as literal markdown, not executable code.

### Problem: Invalid tier warning

**Symptom:** Console shows "Invalid tier: X, using 'medium'"

**Cause:** Tier value is not one of: `light`, `medium`, `heavy`, `gpu`

**Solution:** Check spelling and use valid tier names:

```yaml
reproducible:
  enabled: true
  tier: heavy  # Correct
  # tier: super-heavy  # Invalid
```

### Problem: Button text contains HTML entities

**Symptom:** Button shows `&lt;` instead of `<`

**Cause:** Special characters in button text

**Solution:** Quarto automatically escapes HTML. This is expected and safe. If you need literal HTML, consider using a different approach or simplified text.

### Problem: URL looks wrong (contains `«»` characters)

**This is correct behavior.** Onyxia requires string parameters to be wrapped in `«»` delimiters. The URL is properly formatted.

**Example correct URL:**
```
...?tier=«medium»&chapter.name=«ct_chile»
```

### Problem: Custom configuration not working

**Possible causes:**

1. **Incorrect namespace**
   - Project-level: Use `reproducible-config` in `_quarto.yml`
   - Document-level: Use `reproducible` in `.qmd` frontmatter

2. **Indentation error**
   - YAML requires exact 2-space indentation
   - Check: No tabs, proper nesting

3. **Quarto not finding _quarto.yml**
   - Ensure `_quarto.yml` is in project root
   - Check: Render from correct directory

**Debug steps:**

1. Add debug output to check what Quarto sees:
   ```bash
   quarto render chapter.qmd --log-level debug
   ```

2. Check generated HTML:
   ```bash
   grep "reproducible" chapter.html
   ```

3. Verify extension version:
   ```bash
   cat _extensions/reproducible/_extension.yml | grep version
   ```

### Problem: Changes to _extension.yml not taking effect

**Cause:** Quarto caches extension metadata

**Solution:**

1. Remove extension cache:
   ```bash
   rm -rf .quarto/
   ```

2. Re-render:
   ```bash
   quarto render
   ```

3. For persistent issues, reinstall extension:
   ```bash
   quarto remove reproducible
   quarto add un-handbook/reproducible
   ```

---

## Development & Testing

### Running Tests

The extension includes an end-to-end test suite:

```bash
cd reproducible/
bash test.sh
```

This runs 10 test cases covering:
- Basic configuration
- Full metadata
- Disabled chapters
- Custom tiers
- Invalid values
- Custom button text
- Notice style variants

### Test Structure

```
test-examples/          # Test input files
  ├── basic.qmd
  ├── full-metadata.qmd
  ├── disabled.qmd
  ├── custom-button-text.qmd
  └── ...
test.sh                 # Test runner
test-assertions.sh      # Assertion helpers
test-outputs/           # Generated HTML (gitignored)
```

### Manual Testing

Render the example document:

```bash
quarto render example.qmd
open example.html
```

Verify:
- Button appears at top of page
- Button link is correct
- Styling looks appropriate
- Text is correct

### Debugging Tips

1. **View generated HTML:**
   ```bash
   quarto render chapter.qmd
   cat chapter.html | grep -A 10 "reproducible"
   ```

2. **Check metadata merging:**
   ```bash
   quarto inspect chapter.qmd
   ```

3. **Enable Lua debugging:**
   Add to your Lua filter:
   ```lua
   quarto.log.output(config)  -- Dump config to console
   ```

4. **Test with minimal example:**
   Create a minimal test file to isolate issues

---

## Architecture & Technical Details

### Component in Broader System

This extension is **Component #4** of a 5-component reproducible analysis system:

**Build-Time:**
1. Portable CI Pipeline (Dagger) - Builds images and packages data
2. Curated Compute Images - Pre-built Docker images
3. OCI Data Artifacts - Content-hashed data snapshots

**Run-Time:**
4. **"Reproduce" Button (This Extension)** - User's entrypoint
5. "Chapter Session" Helm Chart - Kubernetes deployment

### What This Extension Does

- Reads `reproducible:` and `reproducible-config:` metadata
- Generates Onyxia deep-link URL with encoded parameters
- Injects HTML button/notice into rendered document
- Validates configuration with warnings for invalid values

### What This Extension Does NOT Do

- Build Docker images (done by CI pipeline)
- Package data artifacts (done by CI pipeline)
- Deploy Kubernetes sessions (done by Helm chart)
- Hard-code infrastructure details (uses semantic tier names)

### Design Principles

**Decoupled Architecture:**
- Frontend (Quarto) knows only semantic names (`tier: "heavy"`)
- Backend (Helm chart) translates to actual resources (10 CPU, 48GB RAM)
- Infrastructure changes don't require re-rendering the handbook

**Backward Compatibility:**
- Simple `enabled: true` configs continue to work
- New configuration features are opt-in
- Sensible defaults for all values

**Fail Gracefully:**
- Invalid config → warning + fallback to default
- Missing config → use extension defaults
- Never fail rendering due to config issues

---

## Version History

### v0.2.0 (Current)

- Added comprehensive configuration system
- Support for three notice styles (full, minimal, button-only)
- Configurable Onyxia deployment (URL, catalog, chart)
- Customizable button text and branding
- Project-level configuration via `reproducible-config`
- Document-level UI overrides
- 10 end-to-end tests
- Full backward compatibility with v0.1.x

### v0.1.0

- Initial proof-of-concept implementation
- Basic button generation with hard-coded values
- Document-level configuration only
- Single notice style
- 7 end-to-end tests

---

## Contributing

This extension is part of the UN Handbook reproducible analysis system. For issues or contributions:

1. Report issues on GitHub
2. Follow the test-driven development approach
3. Ensure all tests pass before submitting
4. Update documentation for new features

---

## License

[License TBD]

## Authors

- UN Handbook Team
- Based on research of onyxia-quarto and quarto-open-social-comments extensions

---

## Additional Resources

- [Quarto Extensions Documentation](https://quarto.org/docs/extensions/)
- [Onyxia Platform](https://onyxia.sh/)
- [UN Global Platform](https://datalab.officialstatistics.org/)

For questions about this extension, consult the documentation files:
- `CLAUDE.md` - Project notes and architecture
- `USER_JOURNEY.md` - User experience specifications
- `IMPLEMENTATION_APPROACH.md` - Technical design details
- `EXTENSION_LEARNINGS.md` - Best practices
- `TEST_STRATEGY.md` - Testing approach
