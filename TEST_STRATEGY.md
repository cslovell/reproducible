# Test Strategy: Test-Driven Development Approach

## Overview

This document outlines our test-driven development (TDD) strategy for the reproduce button extension. We use **end-to-end tests** that render actual `.qmd` files and verify the generated HTML, serving as proxies for user acceptance tests.

---

## Testing Philosophy

### Why End-to-End Tests?

**Traditional unit tests** (testing individual functions) are challenging for Quarto extensions because:
- Lua filters operate within Quarto's rendering pipeline
- Need actual Pandoc AST and Quarto environment
- Mocking the entire Quarto API is complex and brittle

**End-to-end tests** are more practical:
- Test the *actual behavior* users will experience
- Verify integration with Quarto's rendering pipeline
- Catch issues with real-world `.qmd` files
- Serve as living documentation (test files are examples)

### Test-Driven Development Workflow

**Red-Green-Refactor cycle**:

1. **RED**: Write a failing test
   ```bash
   $ bash test.sh test-examples/basic.qmd
   FAIL: Expected button not found in HTML
   ```

2. **GREEN**: Implement minimal code to pass
   ```lua
   function Meta(meta)
     -- Simplest implementation
     local html = '<div class="reproducible-banner">...</div>'
     -- Inject into document
   end
   ```

3. **REFACTOR**: Improve code quality
   ```lua
   function Meta(meta)
     -- Extract to helper functions
     -- Add error handling
     -- Improve readability
   end
   ```

4. **Repeat** for next test case

---

## Test Suite Structure

### Directory Layout

```
reproduce-button/
├── _extensions/
│   └── reproduce-button/
│       └── reproduce-button.lua     # Code under test
├── test-examples/                   # Test input files
│   ├── basic.qmd                    # Minimal configuration
│   ├── full-metadata.qmd            # All options specified
│   ├── disabled.qmd                 # reproducible.enabled: false
│   ├── no-metadata.qmd              # No reproducible: block
│   ├── custom-tier.qmd              # Override tier
│   ├── invalid-tier.qmd             # Invalid tier value
│   └── special-chars.qmd            # Unicode in metadata
├── test-outputs/                    # Generated during tests (gitignored)
│   ├── basic.html
│   ├── full-metadata.html
│   └── ...
├── test.sh                          # Test runner script
├── test-assertions.sh               # Assertion helpers
└── example.qmd                      # Main demo (also a manual test)
```

### Test Runner: test.sh

**Purpose**: Orchestrate test execution

```bash
#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Source assertion helpers
source test-assertions.sh

# Run all tests
run_tests() {
  echo "======================================"
  echo "Reproduce Button Extension - Test Suite"
  echo "======================================"
  echo ""

  # Clean previous outputs
  rm -rf test-outputs
  mkdir -p test-outputs

  # Run each test
  test_basic
  test_full_metadata
  test_disabled
  test_no_metadata
  test_custom_tier
  test_invalid_tier
  test_special_chars

  # Summary
  echo ""
  echo "======================================"
  echo "Test Summary"
  echo "======================================"
  echo -e "${GREEN}PASSED: $PASSED${NC}"
  echo -e "${RED}FAILED: $FAILED${NC}"
  echo ""

  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
  else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
  fi
}

# Run tests
run_tests
```

### Assertion Helpers: test-assertions.sh

**Purpose**: Reusable assertion functions

```bash
#!/usr/bin/env bash

# Render a .qmd file
render_test() {
  local input=$1
  local output_name=$(basename "$input" .qmd)
  local output="test-outputs/${output_name}.html"

  echo -n "Rendering ${input}... "

  if quarto render "$input" --output "$output" --quiet 2>&1 > /dev/null; then
    echo -e "${GREEN}✓${NC}"
    echo "$output"
    return 0
  else
    echo -e "${RED}✗ (render failed)${NC}"
    return 1
  fi
}

# Assert HTML contains pattern
assert_contains() {
  local file=$1
  local pattern=$2
  local description=$3

  if grep -q "$pattern" "$file"; then
    echo -e "  ${GREEN}✓${NC} $description"
    ((PASSED++))
    return 0
  else
    echo -e "  ${RED}✗${NC} $description"
    echo "    Expected: $pattern"
    echo "    In file: $file"
    ((FAILED++))
    return 1
  fi
}

# Assert HTML does NOT contain pattern
assert_not_contains() {
  local file=$1
  local pattern=$2
  local description=$3

  if ! grep -q "$pattern" "$file"; then
    echo -e "  ${GREEN}✓${NC} $description"
    ((PASSED++))
    return 0
  else
    echo -e "  ${RED}✗${NC} $description"
    echo "    Should NOT contain: $pattern"
    echo "    But found in: $file"
    ((FAILED++))
    return 1
  fi
}

# Assert URL parameter exists
assert_url_param() {
  local file=$1
  local param=$2
  local description=$3

  # URL params are in href="..." attributes
  if grep -oP 'href="[^"]*"' "$file" | grep -q "$param"; then
    echo -e "  ${GREEN}✓${NC} $description"
    ((PASSED++))
    return 0
  else
    echo -e "  ${RED}✗${NC} $description"
    echo "    Expected URL param: $param"
    ((FAILED++))
    return 1
  fi
}
```

---

## Test Cases

### Test 1: Basic Configuration

**File**: `test-examples/basic.qmd`

```yaml
---
title: "Basic Test Chapter"
reproducible:
  enabled: true
---

# Test Content

This is a basic test with minimal configuration.
```

**Test function**:
```bash
test_basic() {
  echo "Test 1: Basic configuration"

  local output=$(render_test "test-examples/basic.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  # Assertions
  assert_contains "$output" 'class="reproducible-banner"' \
    "Button banner element exists"

  assert_contains "$output" "🚀 Reproduce this analysis" \
    "Button text present"

  assert_url_param "$output" "autoLaunch=true" \
    "autoLaunch parameter included"

  assert_url_param "$output" "tier=«medium»" \
    "Default tier is medium"

  assert_url_param "$output" "chapter.name=«basic»" \
    "Chapter name extracted from filename"

  assert_contains "$output" "Session expires after 2 hours" \
    "Session expiration warning"
}
```

**Expected outcome**: All assertions pass

---

### Test 2: Full Metadata

**File**: `test-examples/full-metadata.qmd`

```yaml
---
title: "Full Metadata Test"
reproducible:
  enabled: true
  tier: heavy
  image-flavor: gpu
  data-snapshot: sha256-abc123def456
  estimated-runtime: "45 minutes"
  storage-size: "50Gi"
---

# Test Content

This test specifies all available options.
```

**Test function**:
```bash
test_full_metadata() {
  echo "Test 2: Full metadata configuration"

  local output=$(render_test "test-examples/full-metadata.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  assert_url_param "$output" "tier=«heavy»" \
    "Custom tier applied"

  assert_url_param "$output" "imageFlavor=«gpu»" \
    "GPU image flavor specified"

  assert_url_param "$output" "chapter.version=«sha256-abc123def456»" \
    "Data snapshot hash included"

  assert_url_param "$output" "chapter.storageSize=«50Gi»" \
    "Custom storage size applied"

  assert_contains "$output" "Estimated runtime: 45 minutes" \
    "Custom runtime displayed"

  assert_contains "$output" "Heavy (10 CPU, 48GB RAM)" \
    "Heavy tier label shown"
}
```

---

### Test 3: Disabled Chapter

**File**: `test-examples/disabled.qmd`

```yaml
---
title: "Disabled Test"
reproducible:
  enabled: false
---

# Test Content

This chapter has reproducibility explicitly disabled.
```

**Test function**:
```bash
test_disabled() {
  echo "Test 3: Reproducibility disabled"

  local output=$(render_test "test-examples/disabled.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  assert_not_contains "$output" 'class="reproducible-banner"' \
    "No button when disabled"

  assert_not_contains "$output" "Reproduce this analysis" \
    "No button text when disabled"
}
```

---

### Test 4: No Metadata

**File**: `test-examples/no-metadata.qmd`

```yaml
---
title: "No Metadata Test"
---

# Test Content

This chapter has no `reproducible:` block at all.
```

**Test function**:
```bash
test_no_metadata() {
  echo "Test 4: No reproducible metadata"

  local output=$(render_test "test-examples/no-metadata.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  assert_not_contains "$output" 'class="reproducible-banner"' \
    "No button when metadata missing"
}
```

---

### Test 5: Custom Tier

**File**: `test-examples/custom-tier.qmd`

```yaml
---
title: "Custom Tier Test"
reproducible:
  enabled: true
  tier: gpu
  estimated-runtime: "2 hours"
---

# Test Content

This chapter uses GPU tier.
```

**Test function**:
```bash
test_custom_tier() {
  echo "Test 5: Custom tier (GPU)"

  local output=$(render_test "test-examples/custom-tier.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  assert_url_param "$output" "tier=«gpu»" \
    "GPU tier specified"

  assert_contains "$output" "GPU (8 CPU, 32GB RAM, 1 GPU)" \
    "GPU tier label includes GPU count"

  assert_contains "$output" "Estimated runtime: 2 hours" \
    "Custom runtime for GPU workload"
}
```

---

### Test 6: Invalid Tier

**File**: `test-examples/invalid-tier.qmd`

```yaml
---
title: "Invalid Tier Test"
reproducible:
  enabled: true
  tier: super-heavy  # Invalid!
---

# Test Content

This chapter has an invalid tier value.
```

**Test function**:
```bash
test_invalid_tier() {
  echo "Test 6: Invalid tier value"

  local output=$(render_test "test-examples/invalid-tier.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  # Should fall back to default (medium)
  assert_url_param "$output" "tier=«medium»" \
    "Falls back to medium tier"

  assert_contains "$output" "Medium (6 CPU, 24GB RAM)" \
    "Shows medium tier label"

  # Check for warning in Quarto output (optional)
  # This is harder to test in E2E, might skip
}
```

---

### Test 7: Special Characters

**File**: `test-examples/special-chars.qmd`

```yaml
---
title: "Special Characters Test"
reproducible:
  enabled: true
  data-snapshot: "v1.2.3-beta+build.456"
---

# Test Content

This chapter has special characters in version string.
```

**Test function**:
```bash
test_special_chars() {
  echo "Test 7: Special characters in metadata"

  local output=$(render_test "test-examples/special-chars.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  # Version should be URL-encoded
  # Dots → %2E, Plus → %2B (but we normalize dots to hyphens first)
  assert_url_param "$output" "chapter.version=«v1-2-3-beta" \
    "Version dots normalized to hyphens"

  # URL encoding should work
  assert_contains "$output" 'href="https://datalab.officialstatistics.org' \
    "Valid URL generated"
}
```

---

## Continuous Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Test Extension

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Quarto
        uses: quarto-dev/quarto-actions/setup@v2
        with:
          version: 1.4.0

      - name: Run tests
        run: bash test.sh

      - name: Upload test outputs (on failure)
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-outputs
          path: test-outputs/
```

**Benefits**:
- Automatic testing on every push
- Prevents broken code from merging
- Test artifacts available for debugging

---

## Manual Testing Checklist

### After All E2E Tests Pass

**Manual verification steps**:

1. **Render example.qmd locally**
   ```bash
   quarto render example.qmd
   open example.html
   ```

2. **Visual inspection**
   - [ ] Button appears at top of page
   - [ ] Button is styled correctly (blue, readable)
   - [ ] Metadata is formatted nicely

3. **Button functionality**
   - [ ] Click button
   - [ ] Opens new tab
   - [ ] Navigates to Onyxia launcher
   - [ ] Parameters are pre-filled (check URL)

4. **Cross-browser testing** (if possible)
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari

5. **Format compatibility**
   ```bash
   quarto render example.qmd --to html    # Should work
   quarto render example.qmd --to pdf     # Should NOT show button
   ```

---

## Test Coverage Matrix

| Scenario | Test File | Assertions |
|----------|-----------|------------|
| Minimal config | `basic.qmd` | Button exists, default tier, chapter name extracted |
| Full config | `full-metadata.qmd` | Custom tier, version, runtime, storage |
| Disabled | `disabled.qmd` | No button |
| No metadata | `no-metadata.qmd` | No button |
| Custom tier | `custom-tier.qmd` | GPU tier, custom runtime |
| Invalid tier | `invalid-tier.qmd` | Fallback to default |
| Special chars | `special-chars.qmd` | URL encoding, version normalization |

**Total test cases**: 7
**Total assertions**: ~25

---

## Debugging Failed Tests

### When a test fails

**Step 1**: Identify which assertion failed
```
Test 2: Full metadata configuration
Rendering test-examples/full-metadata.qmd... ✓
  ✓ Custom tier applied
  ✗ GPU image flavor specified
    Expected URL param: imageFlavor=«gpu»
```

**Step 2**: Inspect generated HTML
```bash
cat test-outputs/full-metadata.html | grep -C 5 'reproducible-banner'
```

**Step 3**: Check URL parameters
```bash
cat test-outputs/full-metadata.html | grep -oP 'href="[^"]*"'
```

**Step 4**: Add debug logging to Lua filter
```lua
function Meta(meta)
  quarto.log.output(meta.reproducible)  -- Dump metadata
  -- ... rest of function
end
```

**Step 5**: Re-run with trace
```bash
quarto render test-examples/full-metadata.qmd --trace
```

---

## Performance Testing

### Test: Render Time Impact

**Benchmark**: Extension should add < 100ms to render time

```bash
# Baseline (no extension)
time quarto render basic.qmd

# With extension
time quarto render test-examples/basic.qmd

# Compare
```

**Acceptance criteria**: Extension adds < 10% overhead

---

## Future Enhancements

### Phase 2: Integration Tests

**If we deploy a test Onyxia instance**:
1. Click button
2. Verify session launches
3. Check environment has correct resources
4. Verify data is mounted

**Tools**: Selenium/Playwright for browser automation

### Phase 3: Property-Based Testing

**Idea**: Generate random metadata, verify no crashes

```bash
# Hypothetical
for i in {1..100}; do
  generate_random_qmd > test.qmd
  quarto render test.qmd
  if [ $? -ne 0 ]; then
    echo "CRASH on iteration $i"
    exit 1
  fi
done
```

---

## Success Criteria

### Definition of Done

**Phase 1 (POC) is complete when**:
- [ ] All 7 E2E tests pass
- [ ] `example.qmd` renders correctly
- [ ] Manual button click reaches Onyxia
- [ ] No warnings during render (except for expected invalid tier warning)
- [ ] CI runs tests automatically

**Phase 2 (Production) is complete when**:
- [ ] Tests run on every PR
- [ ] 100% pass rate for 2 weeks
- [ ] Button used successfully by 3+ handbook authors
- [ ] No bug reports related to URL generation

---

## Summary: TDD Workflow

### Our Approach

1. **Write test first** → `test-examples/basic.qmd` + assertions
2. **Run test** → `bash test.sh` (should fail initially)
3. **Implement code** → `reproduce-button.lua`
4. **Run test again** → Should pass
5. **Refactor** → Improve code quality
6. **Repeat** → Next test case

### Why This Works

- **Tests = specification**: Test files document expected behavior
- **Fast feedback**: Know immediately if code works
- **Regression prevention**: Old tests catch new bugs
- **Confidence**: Refactor without fear
- **Living documentation**: Test files are examples

### Key Principles

1. **E2E over unit**: Test real rendering, not mocked functions
2. **Red-Green-Refactor**: Follow TDD cycle strictly
3. **Fail fast**: Stop on first failure for quick debugging
4. **Automate**: CI runs tests, not humans
5. **Document**: Test names explain what's being tested

---

## Next Steps

1. Create `test-examples/` directory
2. Write all 7 test `.qmd` files
3. Implement `test.sh` and `test-assertions.sh`
4. Run tests (they should fail - no code yet!)
5. Implement `reproduce-button.lua` to make tests pass
6. Iterate until all tests green
7. Set up GitHub Actions CI

With this test strategy, we have a clear roadmap for development. Let's build it!
