# Reproducible Analysis Button - Quarto Extension

A Quarto extension that generates "Reproduce this analysis" buttons for launching one-click, pre-configured JupyterLab environments on the UN Global Platform (Onyxia).

## Overview

This extension enables handbook authors to add a single line of YAML to their chapters, which automatically generates a prominent button that readers can click to launch a reproducible computing environment with all code, data, and dependencies ready to use.

**For Readers**: One click → JupyterLab ready in 15 seconds
**For Authors**: Add `reproducible: enabled: true` → Done

## Installation

### From GitHub (Recommended)

```bash
quarto add un-handbook/reproducible
```

### Local Development

```bash
# Clone this repository
git clone https://github.com/un-handbook/reproducible.git

# Use in your project
quarto add path/to/reproducible
```

## Quick Start

Add this to your chapter's YAML frontmatter:

```yaml
---
title: "Your Chapter Title"
filters:
  - reproducible
reproducible:
  enabled: true
---

# Your content here...
```

That's it! When rendered, a button will appear at the top of your chapter.

## Configuration Options

### Minimal (Recommended)

```yaml
reproducible:
  enabled: true
```

Uses smart defaults:
- Tier: `medium` (6 CPU, 24GB RAM)
- Image flavor: `base` (R + Python + geospatial libraries)
- Storage: `20Gi`

### Full Options

```yaml
reproducible:
  enabled: true
  tier: heavy              # light | medium | heavy | gpu
  image-flavor: gpu        # base | gpu
  data-snapshot: v1.2.3    # Auto-updated by CI
  estimated-runtime: "45 minutes"
  storage-size: "50Gi"
```

## Available Resource Tiers

| Tier | CPU | RAM | GPU | Use Case |
|------|-----|-----|-----|----------|
| `light` | 2 | 8GB | - | Theory chapters, small examples |
| `medium` | 6 | 24GB | - | Crop type mapping, Random Forest (default) |
| `heavy` | 10 | 48GB | - | Large-scale classification, SAR preprocessing |
| `gpu` | 8 | 32GB | 1 | Deep learning models (subject to availability) |

**Note**: Resource allocations are defined in the Helm chart, not here. These are semantic labels that allow infrastructure changes without re-rendering content.

## How It Works

### For Readers

1. **Click** the "🚀 Reproduce this analysis" button
2. **Redirected** to Onyxia launcher with pre-filled parameters
3. **Launch** session (auto-starts with one click)
4. **Wait** 5-15 seconds for container to start
5. **Work** in JupyterLab with all code, data, and credentials ready

### For Authors

1. **Add** YAML frontmatter to your chapter
2. **Push** your data files to `data/<your_chapter>/`
3. **CI automatically**:
   - Builds immutable data artifacts
   - Calculates SHA256 hashes
   - Commits hashes back to your `.qmd`
   - Renders the button in published chapter

No Docker, Kubernetes, or DevOps knowledge required.

## Technical Architecture

### Component in Broader System

This extension is **Component #4** of a 5-component reproducible analysis system:

**Build-Time**:
1. Portable CI Pipeline (Dagger) - Builds images and data artifacts
2. Curated Compute Images - Pre-built Docker images
3. OCI Data Artifacts - Content-hashed data snapshots

**Run-Time**:
4. **"Reproduce" Button (This Extension)** ← You are here
5. "Chapter Session" Helm Chart - Kubernetes deployment

### What This Extension Does

- **Reads** `reproducible:` metadata from YAML frontmatter
- **Generates** Onyxia deep-link URL with encoded parameters
- **Injects** HTML button at top of rendered document
- **Validates** configuration and provides warnings for invalid values

### What This Extension Does NOT Do

- ❌ Build Docker images (done by CI)
- ❌ Package data artifacts (done by CI)
- ❌ Deploy Kubernetes sessions (done by Helm chart)
- ❌ Hard-code infrastructure details (uses semantic tier names)

## Development

### Directory Structure

```
reproducible/
├── _extensions/
│   └── reproducible/
│       ├── _extension.yml       # Extension metadata
│       └── reproducible.lua     # Main filter logic
├── test-examples/               # 7 test cases
│   ├── basic.qmd
│   ├── full-metadata.qmd
│   ├── disabled.qmd
│   └── ...
├── test.sh                      # Test runner
├── test-assertions.sh           # Test helpers
├── example.qmd                  # Demo & manual test
├── CLAUDE.md                    # Project notes
├── USER_JOURNEY.md              # User experience spec
├── IMPLEMENTATION_APPROACH.md   # Technical design
├── EXTENSION_LEARNINGS.md       # Best practices
└── TEST_STRATEGY.md             # TDD approach
```

### Running Tests

```bash
# Run full test suite (7 test cases)
bash test.sh

# Render example manually
quarto render example.qmd
open example.html
```

### Test-Driven Development

This extension was built using TDD with end-to-end tests:

1. **Write test** → `test-examples/basic.qmd` + assertions
2. **Run test** → `bash test.sh` (fails initially)
3. **Implement** → `reproducible.lua`
4. **Run again** → Test passes
5. **Refactor** → Improve code quality
6. **Repeat** for next feature

See `TEST_STRATEGY.md` for details.

### Adding New Features

1. Write a new test in `test-examples/`
2. Add test function to `test.sh`
3. Run `bash test.sh` (should fail)
4. Implement feature in `reproducible.lua`
5. Run tests again (should pass)
6. Update documentation

## Documentation

- **CLAUDE.md** - Project context, architecture, design decisions
- **USER_JOURNEY.md** - "Magic" user experience for readers, authors, and infrastructure
- **IMPLEMENTATION_APPROACH.md** - Technical strategy, Lua patterns, URL encoding
- **EXTENSION_LEARNINGS.md** - Best practices from example extensions
- **TEST_STRATEGY.md** - TDD approach, test cases, debugging

## Requirements

- Quarto >= 1.3.0 (for `pandoc.utils.stringify()` support)
- Output format: `html` (button is hidden for PDF/DOCX)

## Examples

See `example.qmd` for a comprehensive demo with:
- All configuration options explained
- Resource tier comparison table
- Code examples
- Technical details about URL generation

## Troubleshooting

### Button doesn't appear

- Check `reproducible: enabled: true` in frontmatter
- Verify rendering to HTML (not PDF/DOCX)
- Look for warnings in Quarto output

### Invalid tier warning

- Valid tiers: `light`, `medium`, `heavy`, `gpu`
- Extension falls back to `medium` if invalid
- Check for typos in tier name

### URL looks wrong

- URLs use special encoding: strings in `«»`, numbers as-is
- This is correct! Onyxia requires this format
- Test the URL by clicking it (should open Onyxia launcher)

## Contributing

This is part of the UN Handbook reproducible analysis system. For contributions:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure `bash test.sh` passes
5. Submit pull request

## License

[License TBD]

## Authors

- UN Handbook Team
- Based on research of `onyxia-quarto` and `quarto-open-social-comments` extensions

## Version

**v0.1.0** - Initial POC implementation

---

**Status**: Proof of concept with test-driven development. Ready for integration testing with actual Onyxia instance.
