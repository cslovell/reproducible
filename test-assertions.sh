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

  echo -n "  Rendering ${input}... " >&2

  # Render (quietly, but preserve exit code)
  if quarto render "$input" --quiet > /dev/null 2>&1; then
    # Move generated HTML to test-outputs
    local input_dir=$(dirname "$input")
    local generated_html="${input_dir}/${output_name}.html"
    if [ -f "$generated_html" ]; then
      mv "$generated_html" "$output"
      # Also clean up _files directory if it exists
      local files_dir="${input_dir}/${output_name}_files"
      if [ -d "$files_dir" ]; then
        rm -rf "$files_dir"
      fi
      echo -e "${GREEN}✓${NC}" >&2
      echo "$output"  # Only output path to stdout
      return 0
    else
      echo -e "${RED}✗ (output not found at $generated_html)${NC}" >&2
      return 1
    fi
  else
    echo -e "${RED}✗ (render failed)${NC}" >&2
    return 1
  fi
}

# Assert HTML contains pattern
assert_contains() {
  local file=$1
  local pattern=$2
  local description=$3

  if grep -q -F "$pattern" "$file"; then
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

  if ! grep -q -F "$pattern" "$file"; then
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
