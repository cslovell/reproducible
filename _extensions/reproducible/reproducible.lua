-- Reproducible Analysis Button - Quarto Extension
-- Generates Onyxia deep-link buttons for launching reproducible sessions

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Encode values for Onyxia URL parameters
-- Numbers/booleans pass as-is, strings are URL-encoded and wrapped in «»
local function encode_helm_value(value)
  if value == nil then
    return "null"
  end

  if type(value) == "boolean" then
    return tostring(value)
  end

  if type(value) == "number" then
    return tostring(value)
  end

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

-- Safe metadata extraction with default
local function get_meta_string(meta, key, default)
  if meta and meta[key] then
    return pandoc.utils.stringify(meta[key])
  end
  return default
end

-- Extract chapter name from filename
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
    return title:lower():gsub("[^%w]+", "-"):gsub("^%-+", ""):gsub("%-+$", "")
  end

  return "unknown-chapter"
end

-- Normalize version string (dots to hyphens)
local function normalize_version(version_str)
  if not version_str then
    return "latest"
  end
  return version_str:gsub("%.", "-")
end

-- Build Onyxia deep-link URL
local function build_onyxia_url(meta)
  local base_url = "https://datalab.officialstatistics.org/launcher/handbook/chapter-session"

  -- Extract metadata with defaults
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

  -- Build parameters
  local params = {
    "autoLaunch=true",
    "name=" .. encode_helm_value("chapter-" .. chapter_name),
    "tier=" .. encode_helm_value(tier),
    "imageFlavor=" .. encode_helm_value(image_flavor),
    "chapter.name=" .. encode_helm_value(chapter_name),
    "chapter.version=" .. encode_helm_value(version_normalized),
    "chapter.storageSize=" .. encode_helm_value(storage_size)
  }

  return base_url .. "?" .. table.concat(params, "&")
end

-- Generate HTML button markup
local function generate_button_html(url, reproducible_meta)
  local tier = get_meta_string(reproducible_meta, "tier", "medium")
  local estimated_runtime = get_meta_string(reproducible_meta, "estimated-runtime", "Unknown")

  -- Tier labels (display only - actual resources defined in Helm chart)
  local tier_labels = {
    light = "Light (2 CPU, 8GB RAM)",
    medium = "Medium (6 CPU, 24GB RAM)",
    heavy = "Heavy (10 CPU, 48GB RAM)",
    gpu = "GPU (8 CPU, 32GB RAM, 1 GPU)"
  }

  local tier_label = tier_labels[tier] or tier_labels["medium"]

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

-- ============================================
-- MAIN FILTER FUNCTION
-- ============================================

function Meta(meta)
  -- Only inject for HTML output
  if not quarto.doc.is_format("html") then
    return meta
  end

  -- Check if feature is enabled
  if not meta.reproducible then
    return meta
  end

  if not meta.reproducible.enabled then
    return meta
  end

  -- Build URL
  local url = build_onyxia_url(meta)

  -- Generate HTML
  local html = generate_button_html(url, meta.reproducible)

  -- Inject into document (before body content)
  quarto.doc.include_text("before-body", html)

  return meta
end
