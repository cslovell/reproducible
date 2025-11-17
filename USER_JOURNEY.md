# User Journey: The "Magic" Experience

## Overview

This document describes the ideal user experience for both **handbook authors** (who add reproducibility to chapters) and **handbook readers** (who use the "Reproduce" button). These journeys define our success criteria and drive our end-to-end tests.

---

## Journey 1: The Handbook Reader (The "Magic")

### Persona: Dr. Maria Santos
- **Role**: Agricultural statistician at national statistics office
- **Goal**: Understand and adapt crop classification methods from the handbook
- **Technical Level**: Proficient in R, familiar with remote sensing, never used Kubernetes
- **Pain Point**: "I want to run the analysis, but I don't have time to install GDAL, debug package versions, or download 50GB of training data"

### The Magic Experience

#### Step 1: Discovery (In the Handbook Chapter)
Maria is reading **Chapter: Crop Type Mapping - Chile** at:
```
https://fao-eostat.github.io/UN-Handbook/ct_chile.html
```

At the top of the chapter, she sees a prominent blue banner:

```
┌─────────────────────────────────────────────────────────────────┐
│  🚀 Reproduce this analysis                                     │
│                                                                 │
│  Resources: Medium (6 CPU, 24GB RAM)                            │
│  Estimated runtime: 20 minutes                                  │
│  Session expires after 2 hours                                  │
└─────────────────────────────────────────────────────────────────┘
```

**What Maria thinks**: *"Wow, I can actually run this? Let me try!"*

#### Step 2: Click (One-Click Launch)
Maria clicks the "🚀 Reproduce this analysis" button.

**What happens**:
- Browser navigates to: `https://datalab.officialstatistics.org/launcher/...`
- Onyxia platform opens with all parameters pre-filled
- Maria is prompted to log in (if not already authenticated)

**What Maria sees**:
```
┌─────────────────────────────────────────────────────────────┐
│  UN Global Platform - Onyxia                                │
│                                                             │
│  ✓ Service: Chapter Session                                │
│  ✓ Chapter: ct_chile                                        │
│  ✓ Resources: Medium (6 CPU, 24GB RAM)                      │
│  ✓ Environment: R 4.5.1, Python 3.11, GDAL 3.6.2           │
│                                                             │
│  [ Launch Session ]                                         │
└─────────────────────────────────────────────────────────────┘
```

**What Maria thinks**: *"Everything is already configured. I just click Launch."*

#### Step 3: Wait (Instant Feedback - 5-15 seconds)
Maria clicks "Launch Session".

**What Maria sees**:
```
┌─────────────────────────────────────────────────────────────┐
│  Launching your session...                                  │
│                                                             │
│  ✓ Pulling container image (cached)                         │
│  ✓ Mounting data artifact (sha256-abc...)                   │
│  ✓ Configuring AWS credentials                              │
│  ⏳ Starting JupyterLab...                                   │
│                                                             │
│  Estimated time remaining: 8 seconds                        │
└─────────────────────────────────────────────────────────────┘
```

**What Maria thinks**: *"This is actually happening. Fast!"*

#### Step 4: Arrival (JupyterLab Ready)
After ~10 seconds, Maria's browser opens JupyterLab.

**What Maria sees**:
```
┌─────────────────────────────────────────────────────────────┐
│  JupyterLab - ct_chile                        [Session: 1h 59m remaining] │
│                                                             │
│  📁 File Browser                    │  📓 ct_chile.qmd      │
│    ├── ct_chile.qmd                 │                       │
│    ├── data/                        │  # Crop Type Mapping │
│    │   ├── training_points.rds      │                       │
│    │   ├── rf_model.rds             │  This chapter de...  │
│    │   └── roi_boundary.gpkg        │                       │
│    └── renv.lock                    │  ```{r}               │
│                                     │  library(sits)        │
│  🖥️ Console (R 4.5.1)               │  ```                  │
│  >                                  │                       │
└─────────────────────────────────────────────────────────────┘
```

**What Maria sees in the file browser**:
- ✅ The chapter `.qmd` file (ready to execute)
- ✅ All data files (training points, models, boundaries)
- ✅ All R packages installed (via `renv`)

**What Maria can do immediately**:
1. Open `ct_chile.qmd`
2. Click "Run All Chunks"
3. See the analysis execute (plots, maps, metrics)
4. Modify parameters and re-run
5. Download results before session expires

**What Maria doesn't have to do**:
- ❌ Install R packages
- ❌ Configure AWS credentials
- ❌ Download training data
- ❌ Debug GDAL versions
- ❌ Clone Git repositories

**What Maria thinks**: *"This is incredible. Everything just works. I can focus on understanding the methodology, not fighting with setup."*

#### Step 5: Explore & Adapt
Maria spends 45 minutes:
- Running the original analysis
- Understanding the Random Forest approach
- Modifying parameters for her country's data
- Taking notes

The session shows a countdown timer: **1h 15m remaining**

#### Step 6: Download & Exit
Maria saves her modified notebook and downloads it before the session expires.

**What Maria sees**:
```
┌─────────────────────────────────────────────────────────────┐
│  Session expiring in 5 minutes                              │
│                                                             │
│  Download your work:                                        │
│  [ Download Notebook ] [ Download All Files ]              │
└─────────────────────────────────────────────────────────────┘
```

Maria downloads her files. The session automatically terminates at 2 hours.

**What Maria achieved**:
- ✅ Understood the methodology
- ✅ Ran the full analysis
- ✅ Adapted it for her use case
- ✅ Total time: 45 minutes (not 2 days of setup)

---

## Journey 2: The Handbook Author (The "Magic")

### Persona: Dr. Carlos Rodríguez
- **Role**: Remote sensing researcher, handbook chapter author
- **Goal**: Enable readers to reproduce his Chile crop classification chapter
- **Technical Level**: Expert in R/remote sensing, basic Git, never used Docker/Kubernetes
- **Pain Point**: "I want readers to run my code, but I don't want to learn DevOps"

### The Magic Experience

#### Step 1: Write the Chapter
Carlos has written `ct_chile.qmd` with:
- R code using `sits`, `randomForest`, `terra`
- Training data in `data/ct_chile/` directory (57 MB)
- An `renv.lock` file (managed by `renv::snapshot()`)

#### Step 2: Enable Reproducibility (2 lines of YAML)
Carlos opens his chapter's YAML frontmatter and adds:

```yaml
---
title: "Crop Type Mapping - Chile"
author: "Dr. Carlos Rodríguez"
reproducible:
  enabled: true
---
```

**That's it.** No Dockerfile. No Helm charts. No Docker Hub accounts.

**What happens automatically**:
- ✅ CI detects `reproducible: enabled: true`
- ✅ CI calculates SHA256 of `data/ct_chile/`
- ✅ CI builds immutable OCI data artifact
- ✅ CI commits the hash back to `ct_chile.qmd`:
  ```yaml
  reproducible:
    enabled: true
    data-snapshot: sha256-7a8b9c...  # Auto-added by CI
  ```

#### Step 3: Push to Git
```bash
$ git add ct_chile.qmd data/ct_chile/
$ git commit -m "Add Chile crop classification chapter"
$ git push
```

**What Carlos sees** (GitHub Actions output):
```
✓ Building data artifact for ct_chile
✓ Pushed to ghcr.io/fao-eostat/handbook-data:ct_chile-sha256-7a8b9c
✓ Auto-committing hash to ct_chile.qmd
✓ Rendering handbook with reproduce button
✓ Deploying to GitHub Pages
```

#### Step 4: Verify the Button
Carlos visits the published chapter:
```
https://fao-eostat.github.io/UN-Handbook/ct_chile.html
```

He sees the "🚀 Reproduce this analysis" button at the top.

**What Carlos thinks**: *"I didn't have to learn Docker. The CI did everything."*

#### Step 5: (Optional) Advanced Configuration
Later, Carlos decides his chapter needs more CPU:

```yaml
reproducible:
  enabled: true
  tier: heavy  # Override default (was: medium)
```

He pushes the change. The button now launches with 10 CPU / 48GB RAM.

**What Carlos didn't have to learn**:
- ❌ Docker / Dockerfile syntax
- ❌ Kubernetes / Helm charts
- ❌ OCI artifact specifications
- ❌ Container registries
- ❌ YAML beyond basic frontmatter

---

## Journey 3: The Infrastructure Engineer (Hidden Magic)

### Persona: DevOps Team
- **Goal**: Maintain the reproducible analysis system
- **Constraint**: Budget changes, need to update resource tiers

### The Magic Experience

#### Scenario: Update "heavy" tier (10 CPU → 12 CPU)

**What they do**:
1. Edit Helm chart `templates/deployment.yaml`:
   ```yaml
   {{- if eq .Values.tier "heavy" }}
   resources:
     limits:
       cpu: "12000m"      # Changed from 10000m
       memory: "48Gi"
   {{- end }}
   ```

2. Deploy new Helm chart version (`v1.1.0`)

**What they DON'T have to do**:
- ❌ Re-render the Quarto handbook
- ❌ Update documentation
- ❌ Notify chapter authors
- ❌ Change 48 chapter YAML files

**What happens automatically**:
- Next reader clicks "Reproduce" button
- Onyxia passes `tier=heavy` to Helm chart v1.1.0
- Session launches with 12 CPU
- Frontend (Quarto site) is unchanged

**Why this matters**: Decoupled architecture means infrastructure changes don't require content changes.

---

## User Acceptance Test Scenarios (Derived from Journeys)

### Test 1: Basic Chapter (Reader Journey - Step 1-4)
**Given**: A chapter with `reproducible: enabled: true`
**When**: Reader renders the chapter
**Then**:
- ✅ Blue banner appears at top
- ✅ Button link includes `autoLaunch=true`
- ✅ URL parameters include `tier`, `imageFlavor`, `chapter.name`

### Test 2: Disabled Chapter
**Given**: A chapter with `reproducible: enabled: false`
**When**: Reader renders the chapter
**Then**:
- ✅ No button appears
- ✅ No error messages

### Test 3: Custom Configuration (Author Journey - Step 5)
**Given**: A chapter with `tier: heavy`, `estimated-runtime: "45 minutes"`
**When**: Reader renders the chapter
**Then**:
- ✅ URL includes `tier=«heavy»`
- ✅ Banner shows "Estimated runtime: 45 minutes"

### Test 4: Missing Metadata
**Given**: A chapter with only `reproducible: enabled: true` (no tier specified)
**When**: Reader renders the chapter
**Then**:
- ✅ Button appears with default values
- ✅ URL includes `tier=«medium»` (smart default)

### Test 5: Chapter Name Extraction
**Given**: A chapter file named `ct_chile.qmd`
**When**: Reader renders the chapter
**Then**:
- ✅ URL includes `chapter.name=«ct_chile»`

### Test 6: Version Normalization
**Given**: `data-snapshot: sha256-abc.def.123`
**When**: Reader renders the chapter
**Then**:
- ✅ URL includes `chapter.version=«sha256-abc-def-123»` (dots → hyphens)

### Test 7: URL Encoding
**Given**: A chapter with special characters in metadata
**When**: Reader renders the chapter
**Then**:
- ✅ Strings are URL-encoded and wrapped in `«»`
- ✅ Numbers pass as-is
- ✅ Booleans pass as-is

---

## Success Metrics

### For Readers
- **Time to first run**: < 60 seconds from click to JupyterLab
- **Setup steps**: 0 (one-click)
- **Success rate**: > 95% of launches succeed

### For Authors
- **Lines of config**: < 5 YAML lines to enable
- **Docker knowledge required**: 0
- **Time to enable**: < 5 minutes

### For Infrastructure
- **Cost per session**: Auto-cleanup keeps costs predictable
- **Maintenance burden**: Infrastructure changes don't require content updates
- **Observability**: Usage metrics tracked per chapter

---

## Anti-Patterns (What We Must Avoid)

### ❌ Reader sees configuration form
**Bad**: Button leads to form where reader must fill in parameters
**Good**: Button uses `autoLaunch=true` with pre-filled values

### ❌ Author must learn Docker
**Bad**: "Create a Dockerfile for your chapter"
**Good**: "Add `reproducible: enabled: true` to your YAML"

### ❌ Hard-coded infrastructure in Quarto
**Bad**: Button URL includes `cpu=6000m&memory=24Gi`
**Good**: Button URL includes `tier=«medium»` (Helm chart interprets)

### ❌ Session never terminates
**Bad**: Sessions run forever, costing money
**Good**: 2-hour auto-cleanup with download option

### ❌ No feedback during launch
**Bad**: Blank screen for 15 seconds
**Good**: Progress indicator showing launch steps

---

## The "Magic" Checklist

When we demo the POC, these statements should be true:

**Reader Experience**:
- [ ] I clicked one button
- [ ] I waited less than 30 seconds
- [ ] JupyterLab opened with everything ready
- [ ] I ran the code without errors
- [ ] I understood how to adapt it for my use case
- [ ] I downloaded my modified notebook before expiration

**Author Experience**:
- [ ] I added 2 lines of YAML
- [ ] I pushed to Git
- [ ] CI built everything automatically
- [ ] The button appeared in my rendered chapter
- [ ] I didn't touch Docker or Kubernetes

**Infrastructure Experience**:
- [ ] I changed a resource tier in one place (Helm chart)
- [ ] All chapters using that tier got the update
- [ ] I didn't have to re-render the Quarto book
- [ ] The system scaled to handle concurrent users
- [ ] Sessions auto-cleaned up after 2 hours

---

## Conclusion

The "magic" is:
1. **For readers**: One click, zero setup, everything works
2. **For authors**: Two lines of YAML, Git push, done
3. **For infrastructure**: Change once, apply everywhere, no content coupling

Our Quarto extension is the **entrypoint** to this magic. It bridges the reader's click to the infrastructure's deployment, while keeping authors completely insulated from complexity.
