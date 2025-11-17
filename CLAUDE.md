# Project Notes: Onyxia Helm Chart Quarto Extension

## Executive Summary

We're building **Component #4** of a 5-component reproducible analysis system for the UN Handbook on Remote Sensing for Agricultural Statistics. This component is a **Quarto extension** that creates a "Reproduce this analysis" button in handbook chapters, enabling one-click launches of pre-configured JupyterLab environments on the UN Global Platform.

## Project Context

### The Bigger Picture: 5-Component Architecture

This extension is one piece of a larger system:

**Build-Time Components** (CI/CD):
1. **Portable CI Pipeline (Dagger)** - Builds images, packages data, generates metadata
2. **Curated Compute Images** - Pre-built Docker images with R/Python/GDAL
3. **OCI Data Artifacts** - Content-hashed, immutable data snapshots

**Run-Time Components** (User-Facing):
4. **"Reproduce" Button (Quarto Extension)** ← **THIS IS WHAT WE'RE BUILDING**
5. **"Chapter Session" Helm Chart** - Kubernetes deployment specification

### What Component #4 Does

**User's Entrypoint to Reproducible Sessions**

The Quarto extension:
- Reads `reproducible:` metadata from chapter YAML frontmatter
- Generates an Onyxia deep-link URL with pre-filled parameters
- Injects an HTML button at the top of the rendered chapter
- Passes only semantic values (tier names like "heavy", "gpu") - NO hard-coded infrastructure

### How It Fits Into the Flow

```
[Handbook Reader]
       ↓
[Clicks "Reproduce" button in chapter]
       ↓
[Quarto Extension generates Onyxia deep-link] ← WE ARE HERE
       ↓
[Onyxia Platform]
  - Pre-fills launch parameters from URL
  - User authenticates
  - Clicks "Launch"
       ↓
[Helm Chart (#5) deploys to Kubernetes]
  - Mounts data artifact (#3)
  - Runs compute image (#2)
  - Injects AWS credentials
       ↓
[JupyterLab session ready in 5-15 seconds]
```

## What We Need to Build

### Extension Type: Filter Extension

This is a **filter extension** (NOT a shortcode or format extension) because:
- It operates on document metadata
- It modifies the document AST during rendering
- Similar pattern to `quarto-open-social-comments` example we reviewed

### Core Functionality

1. **Meta() Filter Function**:
   - Read `reproducible:` YAML block from chapter frontmatter
   - Check if `enabled: true`
   - Extract: tier, image-flavor, data-snapshot, estimated-runtime, storage-size

2. **URL Generation**:
   - Build Onyxia deep-link URL with semantic parameters
   - Base: `https://datalab.officialstatistics.org/launcher/handbook/chapter-session`
   - Encode values using Onyxia's special encoding (numbers as-is, strings in «»)

3. **HTML Injection**:
   - Create HTML button with metadata
   - Inject at top of document using `quarto.doc.includeText()` or modify AST

4. **Error Handling**:
   - Gracefully handle missing metadata
   - Provide meaningful warnings if configuration is incomplete

### Files We'll Create

```
_extensions/reproduce-button/
├── _extension.yml       # Extension metadata and configuration
├── reproduce-button.lua # Main filter logic
└── reproduce-button.css # Optional styling (maybe)
```

Plus supporting files:
```
example.qmd             # Demo showing usage
test-examples/          # E2E test cases
  ├── basic.qmd
  ├── full-metadata.qmd
  └── disabled.qmd
test.sh                 # Test runner script
README.md               # Installation & usage docs
```

## Key Design Decisions

### 1. Semantic Configuration (Decoupled Architecture)

**The Quarto extension knows about**:
- Semantic names: `tier: "heavy"`, `imageFlavor: "gpu"`
- Chapter metadata: `chapter.name`, `chapter.version`

**The Quarto extension does NOT know about**:
- CPU counts (e.g., "10 CPU")
- Memory amounts (e.g., "48Gi")
- Image repositories (e.g., "ghcr.io/...")
- Version tags (e.g., "base:v1.1")

**Why?**
- Infrastructure can change without re-rendering the book
- Single Source of Truth in Helm chart templates
- No drift between frontend and backend configs

### 2. Onyxia Deep-Link Integration

**URL Format**:
```
https://datalab.officialstatistics.org/launcher/handbook/chapter-session
  ?autoLaunch=true
  &tier=«medium»
  &imageFlavor=«base»
  &chapter.name=«ct_chile»
  &chapter.version=«sha256-abcdef123»
  &chapter.storageSize=«20Gi»
```

**Encoding Rules** (from Onyxia):
- Numbers: Pass as-is (e.g., `5`)
- Booleans: Pass as-is (e.g., `true`)
- Strings: URL-encode and wrap in `«»` (e.g., `«ct_chile»`)

**Parameter Mapping**:
- URL params use dot notation: `chapter.name=...`
- Maps to Helm values: `.Values.chapter.name`

### 3. Smart Defaults

From task-overview.md, the extension should support smart defaults:
- `tier`: Auto-detected (medium for RF, heavy for large datasets, gpu for torch/luz)
- `image-flavor`: Auto-detected (gpu if torch/luz found, otherwise base)
- `data-snapshot`: Auto-updated by CI pipeline
- `estimated-runtime`: Auto-estimated from data size
- `storage-size`: Auto-calculated from data/ directory

**For POC**: We'll use simple defaults and allow manual overrides. Full auto-detection can be added later.

### 4. Test-Driven Development

We'll start with E2E tests that:
1. Render example .qmd files with different configurations
2. Verify the generated HTML contains the correct button
3. Verify the URL is properly formatted
4. Check that disabled chapters don't show buttons

## Technical Implementation Notes

### URL Encoding Function

From task-overview.md (lines 582-602), here's the encoding logic:

```lua
local function encode_helm_value(value)
  if value == nil then return "null" end
  if value == true then return "true" end
  if value == false then return "false" end

  local str = tostring(value)

  -- Pure numbers pass as-is
  if str:match("^%-?%d+%.?%d*$") then
    return str
  end

  -- Strings: URL encode and wrap in «»
  local encoded = str:gsub("([^%w%-%.%_%~])", function(c)
    return string.format("%%%02X", string.byte(c))
  end)
  return "«" .. encoded .. "»"
end
```

### Meta() Filter Pattern

From our research (open-social-comments example):

```lua
function Meta(meta)
  -- 1. Check if feature enabled
  if not meta.reproducible or not meta.reproducible.enabled then
    return meta
  end

  -- 2. Extract values with pandoc.utils.stringify()
  local tier = pandoc.utils.stringify(meta.reproducible.tier or "medium")

  -- 3. Build URL
  local url = build_onyxia_url(meta)

  -- 4. Inject HTML
  quarto.doc.includeText("in-header", html_content)

  return meta
end
```

### HTML Injection Options

Two approaches we learned:

**Option 1: includeText()** (from open-social-comments):
```lua
quarto.doc.includeText("in-header", html_string)
```

**Option 2: AST Manipulation** (from task-overview.md, lines 660-662):
```lua
local button = pandoc.RawBlock('html', button_html)
table.insert(quarto.doc.body.blocks, 1, button)
```

**Decision**: Use Option 2 (AST manipulation) to insert at document start, not header.

## Metadata Schema

### Minimal Usage (Recommended for Authors)

```yaml
---
title: "Crop Type Mapping - Chile"
reproducible:
  enabled: true
---
```

### Full Usage (All Options)

```yaml
---
title: "Crop Type Mapping - Chile"
reproducible:
  enabled: true
  tier: heavy              # light | medium | heavy | gpu
  image-flavor: base       # base | gpu
  data-snapshot: sha256-abcdef123  # Auto-updated by CI
  estimated-runtime: "45 minutes"
  storage-size: "50Gi"
---
```

## Expected Rendered Output

```html
<div class="reproducible-banner" style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
  <a href="https://datalab.officialstatistics.org/launcher/handbook/chapter-session?autoLaunch=true&tier=«medium»&imageFlavor=«base»&chapter.name=«ct_chile»&chapter.version=«v1-2-3»&chapter.storageSize=«20Gi»"
     target="_blank"
     class="btn btn-primary"
     style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
     🚀 Reproduce this analysis
  </a>
  <span class="metadata" style="margin-left: 15px; color: #555;">
    Estimated runtime: 45 minutes | Session expires after 2 hours
  </span>
</div>
```

## Development Workflow

From lua-development.md research:

1. **Create extension scaffold**: `quarto create extension filter`
2. **Develop with live reload**: `quarto preview example.qmd`
3. **Debug with logging**:
   - `quarto.log.output(obj)` - Dump objects
   - `quarto.log.warning()` - Suppressible warnings
   - `quarto.log.debug()` - Only with `--trace` flag
4. **Test format**: `quarto render --to native` to see raw AST
5. **Use Lua LSP**: VS Code extension for type checking & diagnostics

## Success Criteria

### Phase 1: Documentation (Current)
- ✅ CLAUDE.md - This file
- ⏳ USER_JOURNEY.md - Magic user experience
- ⏳ IMPLEMENTATION_APPROACH.md - Technical strategy
- ⏳ EXTENSION_LEARNINGS.md - Best practices
- ⏳ TEST_STRATEGY.md - TDD approach

### Phase 2: POC Implementation
- ⏳ Extension scaffold created
- ⏳ Core Lua filter working
- ⏳ E2E tests passing (3+ test cases)
- ⏳ example.qmd renders correctly
- ⏳ Button click leads to Onyxia launcher (manual verification)

## Open Questions & Considerations

1. **Chapter naming**: Extract from filename (`ct_chile.qmd` → `ct_chile`) or from metadata?
   - **Decision**: Use filename for simplicity

2. **Version normalization**: Dots to hyphens (`v1.2.3` → `v1-2-3`) for URL compatibility
   - **Decision**: Implement in URL builder

3. **Format compatibility**: Should this work for HTML only, or PDF/DOCX too?
   - **Decision**: HTML only (button makes no sense in PDF)

4. **Error messages**: Where to show warnings if metadata is missing?
   - **Decision**: Use `quarto.log.warning()` for authors during build

5. **Catalog configuration**: Where is the Onyxia catalog URL defined?
   - **Decision**: Hard-code for now, make configurable later if needed

## Resources & References

- **Task Overview**: task-overview.md (read in full above)
- **Lua Docs**: lua-*.md files (10 files covering all aspects)
- **Language Guide**: learnlua.lua (378 lines of Lua tutorial)
- **Example Extensions**:
  - onyxia-quarto (Revealjs theme)
  - quarto-open-social-comments (Filter pattern we'll follow)
- **Quarto Extension Docs**: https://quarto.org/docs/extensions/

## Next Steps

1. Complete Phase 1 documentation (4 more .md files)
2. Review with user
3. Build POC with TDD approach
4. Iterate based on test results
