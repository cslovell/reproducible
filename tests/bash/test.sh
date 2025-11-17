#!/usr/bin/env bash
set -euo pipefail

# Reproducible Extension - Bash Test Suite
# Quick smoke tests for local development

# Change to script directory
cd "$(dirname "$0")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Source assertion helpers
source ./test-assertions.sh

# Individual test functions

test_basic() {
  echo -e "\n${YELLOW}Test 1: Basic configuration${NC}"

  local output=$(render_test "test-examples/basic.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  assert_contains "$output" 'class="reproducible-notice' \
    "Notice element exists"

  assert_contains "$output" "Launch Environment" \
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

test_full_metadata() {
  echo -e "\n${YELLOW}Test 2: Full metadata configuration${NC}"

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

  assert_contains "$output" "Est. runtime: 45 minutes" \
    "Custom runtime displayed"

  assert_contains "$output" "Heavy (10 CPU, 48GB RAM)" \
    "Heavy tier label shown"
}

test_disabled() {
  echo -e "\n${YELLOW}Test 3: Reproducibility disabled${NC}"

  local output=$(render_test "test-examples/disabled.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  assert_not_contains "$output" 'class="reproducible-notice' \
    "No notice when disabled"

  assert_not_contains "$output" "Launch Environment" \
    "No button text when disabled"
}

test_no_metadata() {
  echo -e "\n${YELLOW}Test 4: No reproducible metadata${NC}"

  local output=$(render_test "examples/no-metadata.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  assert_not_contains "$output" 'class="reproducible-notice' \
    "No notice when metadata missing"
}

test_custom_tier() {
  echo -e "\n${YELLOW}Test 5: Custom tier (GPU)${NC}"

  local output=$(render_test "examples/custom-tier.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  assert_url_param "$output" "tier=«gpu»" \
    "GPU tier specified"

  assert_contains "$output" "GPU (8 CPU, 32GB RAM, 1 GPU)" \
    "GPU tier label includes GPU count"

  assert_contains "$output" "Est. runtime: 2 hours" \
    "Custom runtime for GPU workload"
}

test_invalid_tier() {
  echo -e "\n${YELLOW}Test 6: Invalid tier value${NC}"

  local output=$(render_test "examples/invalid-tier.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  # Should fall back to default (medium)
  assert_url_param "$output" "tier=«medium»" \
    "Falls back to medium tier"

  assert_contains "$output" "Medium (6 CPU, 24GB RAM)" \
    "Shows medium tier label"
}

test_special_chars() {
  echo -e "\n${YELLOW}Test 7: Special characters in metadata${NC}"

  local output=$(render_test "examples/special-chars.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  # Version should have dots normalized to hyphens
  assert_url_param "$output" "chapter.version=«v1-2-3" \
    "Version dots normalized to hyphens"

  # URL should be valid
  assert_contains "$output" 'href="https://datalab.officialstatistics.org' \
    "Valid URL generated"
}

test_custom_button_text() {
  echo -e "\n${YELLOW}Test 8: Custom button text${NC}"

  local output=$(render_test "examples/custom-button-text.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  assert_contains "$output" ">Start Analysis<" \
    "Custom button text appears"

  assert_not_contains "$output" ">Launch Environment<" \
    "Default text not present"
}

test_minimal_style() {
  echo -e "\n${YELLOW}Test 9: Minimal notice style${NC}"

  local output=$(render_test "examples/minimal-style.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  assert_contains "$output" 'class="reproducible-notice minimal"' \
    "Minimal style class present"

  assert_not_contains "$output" ">Reproducible Environment Available<" \
    "No title in minimal style"

  assert_contains "$output" "Medium (6 CPU, 24GB RAM)" \
    "Metadata still present"
}

test_button_only_style() {
  echo -e "\n${YELLOW}Test 10: Button-only style${NC}"

  local output=$(render_test "examples/button-only-style.qmd")
  if [ $? -ne 0 ]; then
    ((FAILED++))
    return 1
  fi

  assert_contains "$output" 'class="reproducible-button"' \
    "Button-only class present"

  assert_not_contains "$output" "Medium (6 CPU, 24GB RAM)" \
    "No metadata in button-only style"

  assert_not_contains "$output" ">Reproducible Environment Available<" \
    "No title in button-only style"
}

# Main test runner
run_tests() {
  echo "======================================"
  echo "Reproducible Button Extension - Test Suite"
  echo "======================================"

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
  test_custom_button_text
  test_minimal_style
  test_button_only_style

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
