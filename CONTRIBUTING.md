# Contributing to Reproducible Button Extension

Thank you for your interest in contributing to the Reproducible Analysis Button extension!

## Development Setup

### Prerequisites

- Quarto >= 1.3.0
- Node.js >= 18 (for Playwright tests)
- Git

### Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR-ORG/reproducible.git
   cd reproducible
   ```

2. Install test dependencies:
   ```bash
   npm install
   npx playwright install
   ```

3. Verify setup:
   ```bash
   npm run test:bash    # Quick smoke test
   npm test             # Full Playwright suite
   ```

## Development Workflow

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes to `_extensions/reproducible/reproducible.lua`

3. Add or update tests (TDD approach recommended)

4. Run tests frequently:
   ```bash
   # Quick feedback (15 seconds)
   npm run test:bash

   # Comprehensive validation (60 seconds)
   npm test
   ```

### Test-Driven Development

We follow TDD for all new features:

1. **Write test first** - Add test case to appropriate spec file
2. **Run test** - Verify it fails (red)
3. **Implement feature** - Write minimal code to pass
4. **Run test again** - Verify it passes (green)
5. **Refactor** - Improve code quality
6. **Repeat** - Next feature

### Adding New Features

**For new configuration options:**

1. Update schema in `_extension.yml`
2. Update Lua filter to read config
3. Add test in `tests/e2e/02-configuration.spec.ts`
4. Document in README.md
5. Add to CHANGELOG.md under [Unreleased]

**For new notice styles:**

1. Implement in `generate_button_html()` function
2. Add test QMD fixture in `tests/bash/examples/`
3. Add Playwright test in `tests/e2e/03-notice-styles.spec.ts`
4. Add visual regression test with screenshot
5. Document in README.md

## Testing

### Running Tests

**Quick Smoke Tests (Bash):**
```bash
npm run test:bash
# Or directly:
bash tests/bash/test.sh
```

**Comprehensive Tests (Playwright):**
```bash
# All tests
npm test

# Specific test file
npx playwright test e2e/01-url-generation

# With UI (interactive)
npm run test:ui

# Debug mode
npm run test:debug
```

**Visual Regression:**
```bash
# Run visual tests
npx playwright test visual/

# Update baselines (after intentional design changes)
npx playwright test visual/ --update-snapshots
```

### Writing Tests

**Bash Tests** (in `tests/bash/`):
- Create new `.qmd` file in `tests/bash/examples/`
- Add test function to `test.sh`
- Use `assert_contains` and `assert_url_param` helpers

**Playwright Tests** (in `tests/e2e/`):
- Add test to appropriate spec file
- Use semantic locators (role, text)
- Verify DOM structure and CSS
- Test URLs with `OnyxiaUrlParser` helper

### Test Coverage Goals

- All configuration options tested
- All notice styles tested
- All error cases tested
- Cross-browser compatibility (3 browsers)
- Accessibility compliance

## Code Style

### Lua Code

- Use `local` for all variables (avoid globals)
- Descriptive function names (verbs: `build_`, `generate_`, `extract_`)
- Comment complex logic
- Follow existing indentation (2 spaces)
- Group related functions together

### TypeScript/JavaScript

- Use TypeScript for all test files
- Descriptive test names: `'should [behavior]'`
- One assertion per test (when possible)
- Use page object patterns for reusable selectors

## Documentation

### When to Update Docs

**Always update when:**
- Adding new configuration options
- Changing default values
- Adding new notice styles
- Fixing bugs users might encounter

**Files to update:**
- README.md - User-facing documentation
- CHANGELOG.md - Add to [Unreleased] section
- tests/README.md - If test changes affect developers
- example.qmd - If new features should be demonstrated

### Documentation Style

- Clear, concise language
- Code examples for all features
- Troubleshooting section for common issues
- No emojis (per project guidelines)

## Pull Request Process

1. **Before submitting:**
   - Run full test suite: `npm test`
   - Ensure all tests pass (visual tests may need baseline updates)
   - Update documentation
   - Add entry to CHANGELOG.md under [Unreleased]
   - Run bash tests: `npm run test:bash`

2. **PR Title Format:**
   - `feat: Add [feature name]`
   - `fix: Fix [bug description]`
   - `docs: Update [documentation area]`
   - `test: Add tests for [feature]`

3. **PR Description:**
   - What changed and why
   - Which tests verify the change
   - Screenshots for UI changes
   - Migration notes if breaking change

4. **Review Process:**
   - Maintainer reviews code
   - CI runs full test suite
   - Visual regression checked
   - Merge after approval

## Release Process

For maintainers releasing new versions:

1. **Update version:**
   - `_extension.yml`
   - `package.json`
   - `README.md`

2. **Update CHANGELOG.md:**
   - Move [Unreleased] items to new version section
   - Add release date

3. **Commit and tag:**
   ```bash
   git add -A
   git commit -m "Release v0.x.0"
   git tag -a v0.x.0 -m "Release v0.x.0"
   ```

4. **Push:**
   ```bash
   git push origin main
   git push origin v0.x.0
   ```

5. **Create GitHub Release:**
   - Use tag v0.x.0
   - Copy CHANGELOG content
   - Attach any artifacts if needed

## Getting Help

- Check `tests/README.md` for testing help
- Review `example.qmd` for usage examples
- Read planning docs in `../planning/` for design decisions
- Open an issue for questions or bugs

## Code of Conduct

Be respectful, constructive, and collaborative. This is a tool for the research community.
