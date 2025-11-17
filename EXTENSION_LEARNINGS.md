# Extension Learnings: Best Practices from Examples

## Overview

This document distills essential patterns and best practices from analyzing two Quarto extensions:
1. **onyxia-quarto** - Revealjs theme extension (light/dark variants)
2. **quarto-open-social-comments** - Filter extension for social media comments

These learnings directly inform our implementation of the reproduce button extension.

---

## Example 1: onyxia-quarto (Revealjs Theme)

**Repository**: https://github.com/InseeFrLab/onyxia-quarto.git
**Type**: Format extension (custom Revealjs theme)
**Version reviewed**: v1.1.0

### Key Files Analyzed

```
onyxia-quarto/
├── _extensions/
│   └── onyxia/
│       ├── _extension.yml          # Extension metadata
│       ├── bg.lua                  # Lua filter for backgrounds
│       ├── onyxia.scss             # Custom styles
│       ├── logo.css                # Logo styling
│       ├── background.svg          # SVG asset
│       ├── logo.svg                # Logo asset
│       └── favicon-32x32.png       # Favicon
├── template.qmd                    # Working example
└── README.md                       # User docs
```

### Learnings for Our Extension

#### 1. Resource Management Pattern

**What they do**:
```lua
-- _extensions/onyxia/bg.lua
local function copyResource(file)
    path = quarto.utils.resolvePath(file)
    quarto.doc.addFormatResource(path)
end

function Header(el)
    copyResource('background.svg')
    copyResource('favicon-32x32.png')
    -- ...
end
```

**Why it matters**:
- `quarto.utils.resolvePath()` resolves paths relative to the extension directory
- `quarto.doc.addFormatResource()` ensures files are copied to output directory
- Works regardless of where the user's `.qmd` file is located

**Application to our extension**:
- We don't need external files (button is pure HTML)
- BUT: If we later add a separate CSS file, use this pattern

#### 2. _extension.yml Configuration

**What they do**:
```yaml
title: Onyxia Presentation (light theme)
author: Romain Lesur
version: 1.1.0
quarto-required: ">=1.0.15"
contributes:
  formats:
    revealjs:
      filters: [bg.lua]
      theme: [default, onyxia.scss]
      css: [logo.css]
      title-slide-attributes:
        data-background-image: background.svg
        data-background-size: contain
      format-resources:
        - logo.svg
        - background.svg
        - favicon-32x32.png
```

**Learnings**:
- `contributes:` section defines what the extension adds
- Can contribute to `formats:`, `filters:`, or `shortcodes:`
- `format-resources:` lists static files to include
- `quarto-required:` specifies minimum Quarto version

**Application to our extension**:
```yaml
title: Reproducible Analysis Button
author: UN Handbook Team
version: 0.1.0
quarto-required: ">=1.3.0"
contributes:
  filters:
    - reproduce-button.lua
```

#### 3. Conditional Element Modification

**What they do**:
```lua
function Header(el)
    if not el.attributes['background-image'] then
        el.attributes['background-image'] = 'background.svg'
        el.attributes['background-size'] = 'contain'
    end
    return el
end
```

**Pattern**: Set defaults, but allow user overrides

**Application to our extension**:
- We provide default `tier: medium`, but users can override
- Similar philosophy: smart defaults + override capability

#### 4. Multi-Variant Support

**What they do**:
- Two extensions in same repo: `onyxia/` and `onyxia-dark/`
- Share structure, differ only in SCSS and SVG assets
- Users choose: `format: onyxia-revealjs` vs `onyxia-dark-revealjs`

**Application to our extension**:
- Start with single extension
- Could later add variants (e.g., different Onyxia instances, different button styles)

#### 5. Development Workflow (from their README)

**What they recommend**:
1. `quarto use template InseeFrLab/onyxia-quarto` to scaffold
2. Edit `template.qmd` as working example
3. `quarto render template.qmd` to test
4. GitHub Actions auto-publishes to GitHub Pages

**Application to our extension**:
- Create `example.qmd` as living documentation
- Use `quarto preview example.qmd` for live development
- GitHub Actions for CI (run tests on push)

---

## Example 2: quarto-open-social-comments (Filter)

**Repository**: https://github.com/AndreasThinks/quarto-open-social-comments.git
**Type**: Filter extension
**Purpose**: Inject Mastodon/Bluesky comments into blog posts

### Key Files Analyzed

```
quarto-open-social-comments/
├── _extensions/
│   └── open-social-comments/
│       ├── _extension.yml           # Extension metadata
│       ├── social-comments.lua      # Main filter logic
│       └── social-comments.js       # JavaScript for fetching comments
├── example.qmd                      # Usage example
└── README.md                        # Installation & docs
```

### Learnings for Our Extension

#### 1. Meta() Filter Pattern (MOST RELEVANT)

**What they do**:
```lua
function Meta(m)
  ensureHtmlDeps()  -- Add JavaScript dependencies

  local has_comments = false

  -- Check for Mastodon metadata
  if m.mastodon_comments and m.mastodon_comments.user then
      local user = pandoc.utils.stringify(m.mastodon_comments.user)
      local toot_id = pandoc.utils.stringify(m.mastodon_comments.toot_id)
      has_comments = true
  end

  -- Check for Bluesky metadata
  if m.bluesky_comments and m.bluesky_comments.post_uri then
      local post_uri = pandoc.utils.stringify(m.bluesky_comments.post_uri)
      has_comments = true
  end

  if has_comments then
      quarto.doc.includeText("in-header", script_html)
  end

  return m
end
```

**Pattern breakdown**:
1. **Check for metadata presence**: `if m.mastodon_comments then`
2. **Extract with stringify**: `pandoc.utils.stringify(m.field)`
3. **Conditional logic**: Only inject if metadata exists
4. **Inject HTML**: `quarto.doc.includeText()`
5. **Return modified metadata**: `return m`

**Application to our extension**:
```lua
function Meta(meta)
  -- 1. Check presence
  if not meta.reproducible or not meta.reproducible.enabled then
    return meta
  end

  -- 2. Extract with stringify
  local tier = pandoc.utils.stringify(meta.reproducible.tier or "medium")

  -- 3. Conditional logic
  local url = build_onyxia_url(meta)

  -- 4. Inject HTML (using AST modification, not includeText)
  local button = pandoc.RawBlock('html', button_html)
  table.insert(quarto.doc.body.blocks, 1, button)

  -- 5. Return
  return meta
end
```

**This is the exact pattern we'll use.**

#### 2. Metadata Extraction with pandoc.utils.stringify()

**What they do**:
```lua
local user = pandoc.utils.stringify(m.mastodon_comments.user)
```

**Why it matters**:
- Metadata values in Pandoc are `Inlines` (structured AST nodes), not plain strings
- `stringify()` safely converts to plain text
- Handles edge cases (quotes, formatting, etc.)

**Application to our extension**:
```lua
local function get_meta_string(meta, key, default)
  if meta[key] then
    return pandoc.utils.stringify(meta[key])
  end
  return default
end

-- Usage
local tier = get_meta_string(meta.reproducible, "tier", "medium")
```

#### 3. HTML Dependency Injection

**What they do**:
```lua
local function ensureHtmlDeps()
  quarto.doc.addHtmlDependency({
      name = 'open-social-comments',
      version = '1.0.0',
      scripts = {"social-comments.js"}
  })
end
```

**Use case**: When you need external JavaScript or CSS files

**Application to our extension**:
- We don't need this (button is pure HTML)
- BUT: Good to know for future enhancements (e.g., button click analytics)

#### 4. Conditional Rendering Based on Metadata

**What they do**:
```lua
if m.mastodon_comments and m.mastodon_comments.user then
    -- Only inject if both exist
end
```

**Pattern**: Guard against partial/missing metadata

**Application to our extension**:
```lua
if not meta.reproducible then
  return meta  -- No reproducible config at all
end

if not meta.reproducible.enabled then
  return meta  -- Explicitly disabled
end

-- Proceed with injection
```

#### 5. Dynamic HTML Generation

**What they do**:
```lua
local js_vars = '<script type="text/javascript">\n'
js_vars = js_vars .. 'var mastodonHost = "' .. host .. '";\n'
js_vars = js_vars .. 'var mastodonUser = "' .. user .. '";\n'
js_vars = js_vars .. '</script>'
```

**Pattern**: Build HTML strings dynamically from metadata

**Application to our extension**:
```lua
local function generate_button_html(url, metadata)
  return string.format([[
<div class="reproducible-banner" style="...">
  <a href="%s" target="_blank" class="btn btn-primary">
    🚀 Reproduce this analysis
  </a>
  <span class="metadata">
    Resources: %s | Estimated runtime: %s
  </span>
</div>
]], url, tier_label, estimated_runtime)
end
```

#### 6. Usage Pattern (from example.qmd)

**What they show**:
```yaml
---
title: "My Blog Post"
filters:
  - open-social-comments
mastodon_comments:
  user: "AndreasThinks"
  host: "fosstodon.org"
  toot_id: "113816106546915207"
---
```

**Learning**: Clean separation between filter activation and configuration

**Application to our extension**:
```yaml
---
title: "My Chapter"
filters:
  - reproduce-button
reproducible:
  enabled: true
  tier: heavy
---
```

---

## Cross-Cutting Patterns

### Pattern 1: Extension Directory Structure

**Standard structure** (both examples follow this):
```
extension-name/
├── _extensions/
│   └── extension-name/
│       ├── _extension.yml       # Required: Metadata
│       ├── filter.lua            # Required: Main logic
│       └── assets/               # Optional: Static files
├── example.qmd                   # Recommended: Usage example
├── README.md                     # Recommended: Docs
└── LICENSE                       # Recommended: License
```

**Why this structure**:
- `_extensions/` is where Quarto looks for extensions
- Nested `extension-name/` allows multiple extensions in one repo
- `example.qmd` serves as both docs and test

**Our structure**:
```
reproduce-button/
├── _extensions/
│   └── reproduce-button/
│       ├── _extension.yml
│       └── reproduce-button.lua
├── example.qmd
├── test-examples/
│   ├── basic.qmd
│   ├── full-metadata.qmd
│   └── disabled.qmd
├── test.sh
├── README.md
└── LICENSE
```

### Pattern 2: Quarto API Usage

**Common Quarto API functions** (used across examples):

| Function | Purpose | Example Use |
|----------|---------|-------------|
| `quarto.doc.is_format("html")` | Detect output format | Only inject for HTML |
| `quarto.utils.resolvePath(file)` | Resolve relative paths | Find extension assets |
| `quarto.doc.addFormatResource(path)` | Copy files to output | Include SVG, CSS, etc. |
| `quarto.doc.addHtmlDependency({...})` | Add JS/CSS dependencies | Include external scripts |
| `quarto.doc.includeText(where, html)` | Inject raw HTML | Add to header/footer |
| `quarto.log.output(obj)` | Debug logging | Inspect metadata |
| `quarto.log.warning(msg)` | User warnings | Alert about issues |

**Our usage**:
- `quarto.doc.is_format("html")` - Only show button for HTML output
- `quarto.log.warning()` - Warn about invalid tiers
- `quarto.doc.body.blocks` - AST modification (not in examples, but from task-overview.md)

### Pattern 3: Pandoc API Usage

**Common Pandoc API functions** (used across examples):

| Function | Purpose | Example Use |
|----------|---------|-------------|
| `pandoc.utils.stringify(inlines)` | Convert to plain string | Extract metadata values |
| `pandoc.RawBlock(format, content)` | Create raw HTML/LaTeX block | Inject custom HTML |
| `table.insert(list, pos, item)` | Modify AST | Add blocks to document |

**Our usage**:
- `pandoc.utils.stringify()` - Extract all metadata
- `pandoc.RawBlock('html', button_html)` - Create button block
- `table.insert(quarto.doc.body.blocks, 1, button)` - Insert at document start

### Pattern 4: Error Handling Philosophy

**Both examples demonstrate**:
- Silent success (no console spam when things work)
- Graceful degradation (missing metadata → no injection, not crash)
- Informative warnings (use `quarto.log.warning()` for issues)

**Our approach**:
```lua
-- Silent: No reproducible config → no button (expected)
if not meta.reproducible then
  return meta
end

-- Warn: Invalid value → use default + notify
if not valid_tiers[tier] then
  quarto.log.warning("Invalid tier: " .. tier .. ", using 'medium'")
  tier = "medium"
end

-- Succeed silently
return meta
```

### Pattern 5: Version Specification

**Both examples specify**:
```yaml
# _extension.yml
version: 1.0.0
quarto-required: ">=1.2.0"
```

**Why it matters**:
- Users know which version they're using
- Quarto enforces minimum version requirement
- Helps with bug reports ("I'm using v1.0.0")

**Our spec**:
```yaml
version: 0.1.0          # Start at 0.1.0 for POC
quarto-required: ">=1.3.0"  # pandoc.utils.stringify requires 1.3+
```

---

## Essential Lua Language Patterns

### Pattern 1: Safe Table Access

**Bad** (crashes if key doesn't exist):
```lua
local tier = meta.reproducible.tier
```

**Good** (safe navigation):
```lua
local tier
if meta.reproducible and meta.reproducible.tier then
  tier = pandoc.utils.stringify(meta.reproducible.tier)
else
  tier = "medium"
end
```

**Better** (helper function):
```lua
local function get_meta_string(meta, key, default)
  if meta and meta[key] then
    return pandoc.utils.stringify(meta[key])
  end
  return default
end

local tier = get_meta_string(meta.reproducible, "tier", "medium")
```

### Pattern 2: String Formatting

**Method 1**: Concatenation (clunky)
```lua
local html = "<div><a href=\"" .. url .. "\">" .. text .. "</a></div>"
```

**Method 2**: `string.format()` (cleaner)
```lua
local html = string.format('<div><a href="%s">%s</a></div>', url, text)
```

**Method 3**: Multiline literal (best for HTML)
```lua
local html = string.format([[
<div>
  <a href="%s">%s</a>
</div>
]], url, text)
```

**Our approach**: Use method 3 for readability

### Pattern 3: Table Initialization

**Arrays** (1-indexed in Lua):
```lua
local params = {
  "autoLaunch=true",
  "tier=" .. tier,
  "chapter.name=" .. name
}
```

**Dictionaries**:
```lua
local tier_labels = {
  light = "Light (2 CPU, 8GB RAM)",
  medium = "Medium (6 CPU, 24GB RAM)",
  heavy = "Heavy (10 CPU, 48GB RAM)"
}
```

**Lookup**:
```lua
local label = tier_labels[tier] or "Unknown"
```

### Pattern 4: String Manipulation

**Pattern matching** (Lua's "regex"):
```lua
-- Extract filename without extension
local name = input_file:match("([^/]+)%.qmd$")

-- Check if pure number
if str:match("^%-?%d+%.?%d*$") then
  -- It's a number
end
```

**Replacement**:
```lua
-- Dots to hyphens
local normalized = version:gsub("%.", "-")

-- URL encoding
local encoded = str:gsub("([^%w%-%.%_%~])", function(c)
  return string.format("%%%02X", string.byte(c))
end)
```

---

## Testing & Development Best Practices

### From onyxia-quarto

**Best practice 1**: Template as test
- `template.qmd` is both example and manual test
- Rendered output published to GitHub Pages
- Users can see what it looks like before installing

**Best practice 2**: GitHub Actions for publishing
- Auto-render on push to main
- Deploy to GitHub Pages
- Users always see latest version

**Application to our extension**:
- `example.qmd` as living documentation
- CI runs `quarto render example.qmd` on every push
- Fail CI if render fails

### From quarto-open-social-comments

**Best practice 1**: Minimal example
- `example.qmd` shows all configuration options
- Clear comments explaining each field

**Best practice 2**: README explains installation
```markdown
## Installation

quarto add AndreasThinks/quarto-open-social-comments
```

**Application to our extension**:
```markdown
## Installation

quarto add fao-eostat/reproduce-button
```

---

## Antipatterns to Avoid

### ❌ Don't: Hard-code paths

**Bad**:
```lua
local logo = "/home/user/extension/logo.svg"
```

**Good**:
```lua
local logo = quarto.utils.resolvePath("logo.svg")
```

### ❌ Don't: Assume metadata exists

**Bad**:
```lua
local tier = pandoc.utils.stringify(meta.reproducible.tier)
-- Crashes if meta.reproducible is nil!
```

**Good**:
```lua
if not meta.reproducible then return meta end
local tier = pandoc.utils.stringify(meta.reproducible.tier or "medium")
```

### ❌ Don't: Inject for all formats

**Bad**:
```lua
function Meta(meta)
  -- Runs for PDF, DOCX, etc. (button makes no sense there)
end
```

**Good**:
```lua
function Meta(meta)
  if not quarto.doc.is_format("html") then
    return meta
  end
  -- Rest of logic
end
```

### ❌ Don't: Use global variables

**Bad**:
```lua
tier = "medium"  -- Global! Pollutes namespace
```

**Good**:
```lua
local tier = "medium"  -- Local to file
```

### ❌ Don't: Skip user-facing examples

**Bad**: No `example.qmd`, users have to guess usage

**Good**: Working `example.qmd` with comments

---

## Summary: What We Learned

### From onyxia-quarto (Format Extension)

- Resource management: `quarto.utils.resolvePath()` + `addFormatResource()`
- _extension.yml structure: `contributes:` section
- Conditional defaults: Set if not present, allow overrides
- Multi-variant support: Light/dark themes in same repo
- GitHub Actions publishing workflow

### From quarto-open-social-comments (Filter Extension)

- **Meta() filter pattern** (THIS IS OUR BLUEPRINT)
- `pandoc.utils.stringify()` for metadata extraction
- HTML dependency injection: `addHtmlDependency()`
- Conditional rendering based on metadata presence
- Dynamic HTML generation with `string.format()`

### Patterns We'll Use

| Aspect | Pattern | Source |
|--------|---------|--------|
| **Filter function** | `Meta(meta)` | open-social-comments |
| **Metadata extraction** | `pandoc.utils.stringify()` | open-social-comments |
| **HTML injection** | `pandoc.RawBlock` + `table.insert` | task-overview.md |
| **Resource management** | `quarto.utils.resolvePath()` | onyxia-quarto |
| **Error handling** | Warn + default | Both |
| **Format detection** | `quarto.doc.is_format("html")` | Best practice |
| **Directory structure** | `_extensions/name/` | Both |
| **Example docs** | `example.qmd` | Both |

### Key Takeaways

1. **Follow established patterns**: Both examples use similar structures
2. **Keep it simple**: Our extension needs < 200 lines of Lua
3. **Fail gracefully**: Missing metadata → no button, not crash
4. **Document with examples**: `example.qmd` is essential
5. **Test early**: Render example.qmd on every change

---

## Next: Apply These Learnings

With these patterns documented, we're ready to:
1. Create TEST_STRATEGY.md (define E2E tests)
2. Scaffold extension structure
3. Implement reproduce-button.lua following these patterns
4. Test against example.qmd
5. Iterate based on failures

The examples have given us a clear blueprint. Now we execute.
