# Implementation Approach: Technical Strategy

## Overview

This document outlines the "native" Quarto approach for implementing the reproduce button extension, detailing technical design choices, Lua patterns, and implementation tactics.

---

## Extension Architecture Decision

### Why a Filter Extension (Not Shortcode or Format)

**Decision**: Implement as a **Lua filter extension**

**Rationale**:
1. **Metadata-driven**: We need to read YAML frontmatter (`reproducible:` block)
2. **Document-level modification**: Insert button once per document, not per invocation
3. **Automatic injection**: Button should appear without requiring `{{< shortcode >}}` in content
4. **Format-agnostic rendering**: Works for any HTML-based Quarto output

**Pattern we're following**: `quarto-open-social-comments` (reviewed in research)
- Reads metadata via `Meta(m)` function
- Conditionally injects HTML based on metadata
- Uses `quarto.doc.includeText()` for injection

**Patterns we're NOT using**:
- ❌ Shortcode: Would require authors to manually add `{{< reproduce-button >}}` to every chapter
- ❌ Format extension: Too heavy (we don't need custom Pandoc templates)
- ❌ Revealjs plugin: Wrong output format (we target HTML documents, not presentations)

---

## Core Implementation Strategy

### 1. Lua Filter Structure

```lua
-- File: _extensions/reproduce-button/reproduce-button.lua

-- ============================================
-- HELPER FUNCTIONS (Pure Lua, no Pandoc API)
-- ============================================

-- Encode values for Onyxia URL parameters
local function encode_helm_value(value)
  -- Numbers, booleans pass as-is
  -- Strings: URL-encode and wrap in «»
end

-- Build the full Onyxia deep-link URL
local function build_onyxia_url(meta)
  -- Extract metadata
  -- Construct URL with encoded parameters
  -- Return URL string
end

-- Generate HTML button markup
local function generate_button_html(url, metadata)
  -- Create styled HTML banner
  -- Include button and metadata display
  -- Return HTML string
end

-- ============================================
-- MAIN FILTER FUNCTION (Pandoc API)
-- ============================================

function Meta(meta)
  -- 1. Check if feature is enabled
  if not meta.reproducible or not meta.reproducible.enabled then
    return meta
  end

  -- 2. Build URL
  local url = build_onyxia_url(meta)

  -- 3. Generate HTML
  local html = generate_button_html(url, meta.reproducible)

  -- 4. Inject into document
  local button = pandoc.RawBlock('html', html)
  table.insert(quarto.doc.body.blocks, 1, button)

  -- 5. Return modified metadata
  return meta
end
```

### 2. Design Choices

#### Choice 1: AST Modification vs. Header Injection

**Options**:
- **A**: `quarto.doc.includeText("in-header", html)` - Injects in `<head>`
- **B**: `table.insert(quarto.doc.body.blocks, 1, button)` - Inserts at document start

**Decision**: Option B (AST modification)

**Rationale**:
- Button should be visible at top of *content*, not in HTML header
- Gives us precise control over position (before title vs. after title)
- More "native" Pandoc approach (modifying AST, not injecting raw HTML in header)

**Implementation**:
```lua
-- Create a Pandoc RawBlock node
local button = pandoc.RawBlock('html', button_html)

-- Insert at position 1 (top of document body)
table.insert(quarto.doc.body.blocks, 1, button)
```

#### Choice 2: Metadata Extraction Strategy

**Challenge**: Pandoc metadata values are `Inlines` (structured AST nodes), not plain strings

**Options**:
- **A**: Use `pandoc.utils.stringify()` to convert to plain text
- **B**: Manually traverse `Inlines` to extract text

**Decision**: Option A (`stringify`)

**Rationale**:
- Simpler and more robust
- Handles edge cases (formatted text, quotes, etc.)
- Standard Quarto extension pattern

**Implementation**:
```lua
-- Safe extraction with default fallback
local function get_meta_string(meta, key, default)
  if meta[key] then
    return pandoc.utils.stringify(meta[key])
  end
  return default
end

-- Usage
local tier = get_meta_string(meta.reproducible, "tier", "medium")
```

#### Choice 3: URL Encoding Implementation

**Challenge**: Onyxia requires special encoding (`«»` delimiters for strings)

**Approach**: Implement custom encoder based on task-overview.md spec

**Implementation**:
```lua
local function encode_helm_value(value)
  -- Handle nil
  if value == nil then
    return "null"
  end

  -- Handle booleans
  if type(value) == "boolean" then
    return tostring(value)  -- "true" or "false"
  end

  -- Handle numbers
  if type(value) == "number" then
    return tostring(value)
  end

  -- Handle strings
  local str = tostring(value)

  -- Check if pure number (as string)
  if str:match("^%-?%d+%.?%d*$") then
    return str
  end

  -- URL encode (excluding safe chars: alphanumeric, - . _ ~)
  local encoded = str:gsub("([^%w%-%.%_%~])", function(c)
    return string.format("%%%02X", string.byte(c))
  end)

  -- Wrap in Onyxia delimiters
  return "«" .. encoded .. "»"
end
```

**Test cases**:
```lua
encode_helm_value(5)               --> "5"
encode_helm_value(true)            --> "true"
encode_helm_value("medium")        --> "«medium»"
encode_helm_value("ct_chile")      --> "«ct_chile»"
encode_helm_value("sha256-abc123") --> "«sha256-abc123»"
encode_helm_value("hello world")   --> "«hello%20world»"
```

#### Choice 4: Chapter Name Extraction

**Challenge**: How to identify the chapter?

**Options**:
- **A**: Use `title` from metadata
- **B**: Extract from filename (`ct_chile.qmd` → `ct_chile`)
- **C**: Require explicit `chapter.name` in metadata

**Decision**: Option B (filename extraction), with Option C as fallback

**Rationale**:
- Filenames are canonical (used in URLs already)
- Titles may have spaces, special chars (bad for Helm release names)
- Authors can override if needed

**Implementation**:
```lua
local function extract_chapter_name(meta)
  -- Option 1: Explicit override
  if meta.reproducible and meta.reproducible["chapter-name"] then
    return pandoc.utils.stringify(meta.reproducible["chapter-name"])
  end

  -- Option 2: Extract from filename
  local input_file = quarto.doc.input_file
  if input_file then
    local name = input_file:match("([^/]+)%.qmd$")
    if name then
      return name
    end
  end

  -- Option 3: Fallback to sanitized title
  if meta.title then
    local title = pandoc.utils.stringify(meta.title)
    -- Convert to slug (lowercase, replace spaces/special chars with hyphens)
    return title:lower():gsub("[^%w]+", "-"):gsub("^%-+", ""):gsub("%-+$", "")
  end

  -- Last resort
  return "unknown-chapter"
end
```

#### Choice 5: Version Normalization

**Challenge**: OCI tags and URLs don't allow dots in certain contexts

**Decision**: Convert dots to hyphens in version strings

**Implementation**:
```lua
local function normalize_version(version_str)
  if not version_str then
    return "v1-0-0"
  end

  -- Convert dots to hyphens (v1.2.3 → v1-2-3)
  return version_str:gsub("%.", "-")
end
```

#### Choice 6: Smart Defaults

**Challenge**: Authors may not specify all metadata

**Decision**: Provide sensible defaults, document them clearly

**Defaults**:
```lua
local defaults = {
  tier = "medium",
  imageFlavor = "base",
  dataSnapshot = "latest",
  storageSize = "20Gi",
  estimatedRuntime = "Unknown"
}
```

**Future enhancement** (not in POC):
- Auto-detect `tier` based on code analysis (look for `torch`, `randomForest`, etc.)
- Auto-calculate `storageSize` from `data/` directory
- Auto-estimate `runtime` from data size

#### Choice 7: Error Handling

**Philosophy**: Fail gracefully, warn loudly

**Scenarios**:

**Scenario 1: Missing metadata**
```lua
if not meta.reproducible then
  -- Silent: Don't show button (chapter doesn't want reproducibility)
  return meta
end
```

**Scenario 2: Enabled but incomplete**
```lua
if meta.reproducible.enabled and not meta.reproducible.tier then
  quarto.log.warning("reproducible.tier not specified, using default: medium")
end
```

**Scenario 3: Invalid values**
```lua
local valid_tiers = {light = true, medium = true, heavy = true, gpu = true}
if not valid_tiers[tier] then
  quarto.log.warning(string.format(
    "Invalid tier '%s', using 'medium'. Valid: light, medium, heavy, gpu",
    tier
  ))
  tier = "medium"
end
```

---

## URL Construction Algorithm

### Full URL Structure

```
https://datalab.officialstatistics.org/launcher/handbook/chapter-session
  ?autoLaunch=true
  &name=«chapter-ct_chile»
  &tier=«medium»
  &imageFlavor=«base»
  &chapter.name=«ct_chile»
  &chapter.version=«v1-2-3»
  &chapter.storageSize=«20Gi»
```

### Components

| Component | Source | Encoding |
|-----------|--------|----------|
| Base URL | Hard-coded in extension | N/A |
| `autoLaunch` | Always `true` | Boolean (no encoding) |
| `name` | Helm release name (`chapter-{name}`) | String («») |
| `tier` | `meta.reproducible.tier` or default | String («») |
| `imageFlavor` | `meta.reproducible["image-flavor"]` or default | String («») |
| `chapter.name` | Extracted from filename | String («») |
| `chapter.version` | `meta.reproducible["data-snapshot"]` (normalized) | String («») |
| `chapter.storageSize` | `meta.reproducible["storage-size"]` or default | String («») |

### Build Function

```lua
local function build_onyxia_url(meta)
  local base_url = "https://datalab.officialstatistics.org/launcher/handbook/chapter-session"

  -- Extract and default all values
  local chapter_name = extract_chapter_name(meta)
  local tier = get_meta_string(meta.reproducible, "tier", "medium")
  local image_flavor = get_meta_string(meta.reproducible, "image-flavor", "base")
  local data_snapshot = get_meta_string(meta.reproducible, "data-snapshot", "latest")
  local storage_size = get_meta_string(meta.reproducible, "storage-size", "20Gi")

  -- Normalize version
  local version_normalized = normalize_version(data_snapshot)

  -- Validate tier
  local valid_tiers = {light = true, medium = true, heavy = true, gpu = true}
  if not valid_tiers[tier] then
    quarto.log.warning("Invalid tier: " .. tier .. ", using 'medium'")
    tier = "medium"
  end

  -- Build parameters array
  local params = {
    "autoLaunch=true",
    "name=" .. encode_helm_value("chapter-" .. chapter_name),
    "tier=" .. encode_helm_value(tier),
    "imageFlavor=" .. encode_helm_value(image_flavor),
    "chapter.name=" .. encode_helm_value(chapter_name),
    "chapter.version=" .. encode_helm_value(version_normalized),
    "chapter.storageSize=" .. encode_helm_value(storage_size)
  }

  -- Concatenate
  return base_url .. "?" .. table.concat(params, "&")
end
```

---

## HTML Generation Strategy

### Design Goals

1. **Visible**: Clear, prominent banner
2. **Informative**: Show resource tier, runtime estimate
3. **Accessible**: Semantic HTML, proper ARIA labels
4. **Styled**: Self-contained CSS (no external dependencies)

### HTML Structure

```html
<div class="reproducible-banner" style="...">
  <a href="{URL}" target="_blank" class="btn btn-primary" style="...">
    🚀 Reproduce this analysis
  </a>
  <span class="metadata" style="...">
    Resources: {TIER_LABEL} |
    Estimated runtime: {RUNTIME} |
    Session expires after 2 hours
  </span>
</div>
```

### Tier Label Mapping

**Decision**: Translate semantic tiers to human-readable labels

```lua
local tier_labels = {
  light = "Light (2 CPU, 8GB RAM)",
  medium = "Medium (6 CPU, 24GB RAM)",
  heavy = "Heavy (10 CPU, 48GB RAM)",
  gpu = "GPU (8 CPU, 32GB RAM, 1 GPU)"
}
```

**Note**: These are *display labels* only. The actual resource allocation is defined in the Helm chart. If infrastructure changes (e.g., `medium` → 8 CPU), we update both the Helm chart and the extension in lockstep.

### HTML Generation Function

```lua
local function generate_button_html(url, reproducible_meta)
  local tier = get_meta_string(reproducible_meta, "tier", "medium")
  local estimated_runtime = get_meta_string(reproducible_meta, "estimated-runtime", "Unknown")

  local tier_labels = {
    light = "Light (2 CPU, 8GB RAM)",
    medium = "Medium (6 CPU, 24GB RAM)",
    heavy = "Heavy (10 CPU, 48GB RAM)",
    gpu = "GPU (8 CPU, 32GB RAM, 1 GPU)"
  }

  local tier_label = tier_labels[tier] or "Medium (6 CPU, 24GB RAM)"

  return string.format([[
<div class="reproducible-banner" style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #1976d2;">
  <a href="%s"
     target="_blank"
     class="btn btn-primary"
     style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
    🚀 Reproduce this analysis
  </a>
  <span class="metadata" style="margin-left: 15px; color: #555; font-size: 0.9em;">
    Resources: %s | Estimated runtime: %s | Session expires after 2 hours
  </span>
</div>
]], url, tier_label, estimated_runtime)
end
```

---

## Testing Strategy Integration

### Test-Driven Development Approach

**Principle**: Write tests *before* full implementation

**Process**:
1. Write E2E test that renders `.qmd` → HTML
2. Assert expected HTML structure
3. Implement Lua filter to make test pass
4. Refactor
5. Repeat

### Testable Behaviors

**Test 1: Enabled chapter shows button**
```qmd
---
reproducible:
  enabled: true
---
```
**Assert**: HTML contains `<div class="reproducible-banner">`

**Test 2: Disabled chapter hides button**
```qmd
---
reproducible:
  enabled: false
---
```
**Assert**: HTML does NOT contain `reproducible-banner`

**Test 3: URL encoding correctness**
```qmd
---
reproducible:
  enabled: true
  tier: heavy
---
```
**Assert**: URL contains `tier=«heavy»` (with delimiters)

**Test 4: Chapter name extraction**
```
File: ct_chile.qmd
```
**Assert**: URL contains `chapter.name=«ct_chile»`

**Test 5: Version normalization**
```qmd
---
reproducible:
  enabled: true
  data-snapshot: v1.2.3
---
```
**Assert**: URL contains `chapter.version=«v1-2-3»` (dots → hyphens)

---

## Format Compatibility

### Target Formats

**Supported**:
- ✅ `html` - Primary target
- ✅ `html:default` - Works
- ✅ Any HTML-based format (e.g., Bootstrap, custom themes)

**Not supported** (by design):
- ❌ `pdf` - Button makes no sense in static PDF
- ❌ `docx` - No interactive elements
- ❌ `epub` - No external links during reading

### Format Detection

**Strategy**: Conditionally inject button only for HTML formats

```lua
function Meta(meta)
  -- Only inject for HTML output
  if not quarto.doc.is_format("html") then
    return meta
  end

  -- Rest of logic...
end
```

**Rationale**:
- Prevents errors when rendering to PDF
- Authors can use same `.qmd` source for multiple outputs

---

## Performance Considerations

### Minimal Overhead

**Goal**: Extension should add < 100ms to render time

**Strategies**:
1. **No external dependencies**: No HTTP calls, no file I/O
2. **Simple string operations**: URL building is O(n) where n = # of params (small)
3. **Single AST modification**: One `table.insert()` call

### Caching (Future Enhancement)

**Idea**: If metadata doesn't change between renders, cache the button HTML

**Not in POC**: Adds complexity for negligible gain (button generation is fast)

---

## Debugging & Development Workflow

### Recommended Workflow

1. **Setup**: `quarto create extension filter` to scaffold
2. **Develop**: `quarto preview example.qmd` for live reload
3. **Debug**: Add `quarto.log.output()` calls
4. **Test**: Run E2E tests via `bash test.sh`
5. **Inspect AST**: `quarto render --to native` to see Pandoc AST

### Debug Logging

**Strategy**: Use Quarto's built-in logging

```lua
-- Dump entire metadata for inspection
quarto.log.output(meta.reproducible)

-- Warn on questionable values
quarto.log.warning("Using default tier: medium")

-- Debug (only with --trace flag)
quarto.log.debug("Built URL: " .. url)
```

### Native Format Inspection

**Use case**: Verify button is inserted at correct position

```bash
$ quarto render example.qmd --to native

# Output shows Pandoc AST:
[ RawBlock (Format "html") "<div class=\"reproducible-banner\">..."
, Header 1 ("title", [], []) [Str "Chapter", Space, Str "Title"]
, Para [Str "Content..."]
]
```

---

## Edge Cases & Robustness

### Edge Case 1: No Input Filename

**Scenario**: `quarto.doc.input_file` is `nil` (rendering from stdin)

**Handling**:
```lua
local function extract_chapter_name(meta)
  local input_file = quarto.doc.input_file
  if not input_file then
    quarto.log.warning("Cannot extract chapter name (no input file), using title")
    -- Fallback to title-based slug
  end
end
```

### Edge Case 2: Special Characters in Metadata

**Scenario**: Author uses `tier: "Heavy (Custom)"` (invalid value)

**Handling**: Validate and warn
```lua
if not valid_tiers[tier] then
  quarto.log.warning("Invalid tier: " .. tier)
  tier = "medium"
end
```

### Edge Case 3: Unicode in Chapter Names

**Scenario**: File named `análisis_méxico.qmd`

**Handling**: URL encoding handles it automatically
```lua
encode_helm_value("análisis_méxico")
--> "«an%C3%A1lisis_m%C3%A9xico»"
```

### Edge Case 4: Missing `reproducible:` Block Entirely

**Scenario**: Chapter has no `reproducible:` key in frontmatter

**Handling**: Silent no-op (this is expected for non-reproducible chapters)
```lua
if not meta.reproducible then
  return meta  -- No warning needed
end
```

---

## Extension Configuration

### _extension.yml

```yaml
title: Reproducible Analysis Button
author: UN Handbook Team
version: 0.1.0
quarto-required: ">=1.3.0"
contributes:
  filters:
    - reproduce-button.lua
```

**Minimal configuration**: No custom options needed (everything driven by document metadata)

### Future: Configurable Base URL

**Idea**: Allow overriding Onyxia instance URL

```yaml
# In _quarto.yml (project-level)
reproducible-button:
  base-url: https://custom-onyxia.example.com/launcher
```

**Not in POC**: Hard-code for UN Global Platform initially

---

## Summary: The "Native" Quarto Approach

### What Makes This Approach "Native"?

1. **Metadata-driven**: Uses YAML frontmatter (standard Quarto pattern)
2. **Filter-based**: Modifies Pandoc AST (standard extension mechanism)
3. **Zero markup**: Authors don't add shortcodes to content
4. **Format-aware**: Only activates for HTML output
5. **Quarto API**: Uses `quarto.doc.*` functions (not Pandoc hacks)
6. **Self-contained**: No external dependencies (no npm, no Python)

### Key Implementation Tactics

| Aspect | Tactic | Rationale |
|--------|--------|-----------|
| **Extension type** | Filter | Metadata-driven, automatic injection |
| **Injection method** | AST modification (`table.insert`) | Precise control, "native" Pandoc |
| **Metadata extraction** | `pandoc.utils.stringify()` | Robust, handles edge cases |
| **URL encoding** | Custom function (Onyxia spec) | Special «» delimiters required |
| **Chapter naming** | Filename extraction | Canonical, URL-safe |
| **Error handling** | Warn + fallback | Fail gracefully, inform authors |
| **Format detection** | `quarto.doc.is_format("html")` | Prevent errors in PDF/DOCX |

### Next Steps

1. Scaffold extension: `quarto create extension filter`
2. Implement core Lua filter (this spec)
3. Write E2E tests (TEST_STRATEGY.md)
4. Iterate based on test failures
5. Document learnings in EXTENSION_LEARNINGS.md
