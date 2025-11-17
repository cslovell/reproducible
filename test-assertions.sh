#!/usr/bin/env bash

# Test assertion helpers for reproducible extension

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Render a .qmd file
render_test() {
  local input=$1
  local output_name=$(basename "$input" .qmd)
  local output="test-outputs/${output_name}.html"

  echo -n "  Rendering ${input}... "

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
    echo -e "    ${GREEN}✓${NC} $description"
    ((PASSED++))
    return 0
  else
    echo -e "    ${RED}✗${NC} $description"
    echo "      Expected pattern: $pattern"
    echo "      In file: $file"
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
    echo -e "    ${GREEN}✓${NC} $description"
    ((PASSED++))
    return 0
  else
    echo -e "    ${RED}✗${NC} $description"
    echo "      Should NOT contain: $pattern"
    echo "      But found in: $file"
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
  if grep -oE 'href="[^"]*"' "$file" | grep -q "$param"; then
    echo -e "    ${GREEN}✓${NC} $description"
    ((PASSED++))
    return 0
  else
    echo -e "    ${RED}✗${NC} $description"
    echo "      Expected URL param: $param"
    ((FAILED++))
    return 1
  fi
}
