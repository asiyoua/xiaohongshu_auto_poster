---
name: bxz-xhs
description: 小红书图片生成器 - 本地版。完整流程：分析内容→选大纲策略→生成图片。输出到 ~/Myxhs。使用 Gemini API + Python 脚本生成图片。说"小红书图片"+内容即可使用。
---

# 小红书图片生成器 (bxz-xhs) - 本地版

Break down complex content into eye-catching infographic series for Xiaohongshu with multiple style options.

> **📚 文档目录**: `docs/INSTALL.md` - 完整安装和配置指南

## Usage

```bash
# Auto-select style and layout based on content
/baoyu-xhs-images posts/ai-future/article.md

# Specify style
/baoyu-xhs-images posts/ai-future/article.md --style notion

# Specify layout
/baoyu-xhs-images posts/ai-future/article.md --layout dense

# Combine style and layout
/baoyu-xhs-images posts/ai-future/article.md --style notion --layout list

# Direct content input
/baoyu-xhs-images
[paste content]

# Direct input with options
/baoyu-xhs-images --style bold --layout comparison
[paste content]
```

## Options

| Option | Description |
|--------|-------------|
| `--style <name>` | Visual style (see Style Gallery) |
| `--layout <name>` | Information layout (see Layout Gallery) |

## Two Dimensions

| Dimension | Controls | Options |
|-----------|----------|---------|
| **Style** | Visual aesthetics: colors, lines, decorations | cute, fresh, warm, bold, minimal, retro, pop, notion, chalkboard, study-notes |
| **Layout** | Information structure: density, arrangement | sparse, balanced, dense, list, comparison, flow, mindmap, quadrant |

Style × Layout can be freely combined. Example: `--style notion --layout dense` creates an intellectual-looking knowledge card with high information density.

## Style Gallery

| Style | Description |
|-------|-------------|
| `cute` (Default) | Sweet, adorable, girly - classic Xiaohongshu aesthetic |
| `fresh` | Clean, refreshing, natural |
| `warm` | Cozy, friendly, approachable |
| `bold` | High impact, attention-grabbing |
| `minimal` | Ultra-clean, sophisticated |
| `retro` | Vintage, nostalgic, trendy |
| `pop` | Vibrant, energetic, eye-catching |
| `notion` | Minimalist hand-drawn line art, intellectual |
| `chalkboard` | Colorful chalk on black board, educational |
| `study-notes` | Realistic handwritten photo style, blue pen + red annotations + yellow highlighter |

Detailed style definitions: `references/presets/<style>.md`

## Layout Gallery

| Layout | Description |
|--------|-------------|
| `sparse` (Default) | Minimal information, maximum impact (1-2 points) |
| `balanced` | Standard content layout (3-4 points) |
| `dense` | High information density, knowledge card style (5-8 points) |
| `list` | Enumeration and ranking format (4-7 items) |
| `comparison` | Side-by-side contrast layout |
| `flow` | Process and timeline layout (3-6 steps) |
| `mindmap` | Center radial mind map layout (4-8 branches) |
| `quadrant` | Four-quadrant / circular section layout |

Detailed layout definitions: `references/elements/canvas.md`

## Auto Selection

| Content Signals | Style | Layout |
|-----------------|-------|--------|
| Beauty, fashion, cute, girl, pink | `cute` | sparse/balanced |
| Health, nature, clean, fresh, organic | `fresh` | balanced/flow |
| Life, story, emotion, feeling, warm | `warm` | balanced |
| Warning, important, must, critical | `bold` | list/comparison |
| Professional, business, elegant, simple | `minimal` | sparse/balanced |
| Classic, vintage, old, traditional | `retro` | balanced |
| Fun, exciting, wow, amazing | `pop` | sparse/list |
| Knowledge, concept, productivity, SaaS | `notion` | dense/list |
| Education, tutorial, learning, teaching, classroom | `chalkboard` | balanced/dense |
| Notes, handwritten, study guide, knowledge, realistic, photo | `study-notes` | dense/list/mindmap |

## Outline Strategies

Three differentiated outline strategies for different content goals:

### Strategy A: Story-Driven (故事驱动型)

| Aspect | Description |
|--------|-------------|
| **Concept** | Personal experience as main thread, emotional resonance first |
| **Features** | Start from pain point, show before/after change, strong authenticity |
| **Best for** | Reviews, personal shares, transformation stories |
| **Structure** | Hook → Problem → Discovery → Experience → Conclusion |

### Strategy B: Information-Dense (信息密集型)

| Aspect | Description |
|--------|-------------|
| **Concept** | Value-first, efficient information delivery |
| **Features** | Clear structure, explicit points, professional credibility |
| **Best for** | Tutorials, comparisons, product reviews, checklists |
| **Structure** | Core conclusion → Info card → Pros/Cons → Recommendation |

### Strategy C: Visual-First (视觉优先型)

| Aspect | Description |
|--------|-------------|
| **Concept** | Visual impact as core, minimal text |
| **Features** | Large images, atmospheric, instant appeal |
| **Best for** | High-aesthetic products, lifestyle, mood-based content |
| **Structure** | Hero image → Detail shots → Lifestyle scene → CTA |

## File Structure

Each session creates an independent directory named by content slug:

```
/Users/bian/Myxhs/{topic-slug}/
├── source-{slug}.{ext}             # Source files (text, images, etc.)
├── analysis.md                     # Deep analysis + questions asked
├── outline-strategy-a.md           # Strategy A: Story-driven
├── outline-strategy-b.md           # Strategy B: Information-dense
├── outline-strategy-c.md           # Strategy C: Visual-first
├── outline.md                      # Final selected/merged outline
├── prompts/
│   ├── 01-cover-[slug].md
│   ├── 02-content-[slug].md
│   └── ...
├── 01-cover-[slug].png
├── 02-content-[slug].png
└── NN-ending-[slug].png
```

**Slug Generation**:
1. Extract main topic from content (2-4 words, kebab-case)
2. Example: "AI工具推荐" → `ai-tools-recommend`

**Conflict Resolution**:
If `xhs-images/{topic-slug}/` already exists:
- Append timestamp: `{topic-slug}-YYYYMMDD-HHMMSS`
- Example: `ai-tools` exists → `ai-tools-20260118-143052`

**Source Files**:
Copy all sources with naming `source-{slug}.{ext}`:
- `source-article.md`, `source-photo.jpg`, etc.
- Multiple sources supported: text, images, files from conversation

## Workflow

### Progress Checklist

Copy and track progress:

```
XHS Infographic Progress:
- [ ] Step 0: Check preferences (EXTEND.md) ⚠️ REQUIRED if not found
- [ ] Step 1: Analyze content → analysis.md
- [ ] Step 2: Confirmation 1 - Content understanding ⚠️ REQUIRED
- [ ] Step 3: Generate 3 outline + style variants
- [ ] Step 4: Confirmation 2 - Outline & style & elements selection ⚠️ REQUIRED
- [ ] Step 5: Generate images (sequential)
- [ ] Step 6: Completion report
```

### Flow

```
Input → Analyze → [Confirm 1] → 3 Outlines → [Confirm 2: Outline + Style + Elements] → Generate → Complete
```

### Step 0: Load Preferences (EXTEND.md) ⚠️

**Purpose**: Load user preferences or run first-time setup. **Do NOT skip setup if EXTEND.md not found.**

Use Bash to check EXTEND.md existence (priority order):

```bash
# Check project-level first
test -f .baoyu-skills/bxz-xhs/EXTEND.md && echo "project"

# Then user-level (cross-platform: $HOME works on macOS/Linux/WSL)
test -f "$HOME/.baoyu-skills/bxz-xhs/EXTEND.md" && echo "user"
```

┌────────────────────────────────────────────────────┬───────────────────┐
│                        Path                        │     Location      │
├────────────────────────────────────────────────────┼───────────────────┤
│ .baoyu-skills/bxz-xhs/EXTEND.md                    │ Project directory │
├────────────────────────────────────────────────────┼───────────────────┤
│ $HOME/.baoyu-skills/bxz-xhs/EXTEND.md              │ User home         │
└────────────────────────────────────────────────────┴───────────────────┘

┌───────────┬───────────────────────────────────────────────────────────────────────────┐
│  Result   │                                  Action                                   │
├───────────┼───────────────────────────────────────────────────────────────────────────┤
│ Found     │ Read, parse, display summary → Continue to Step 1                         │
├───────────┼───────────────────────────────────────────────────────────────────────────┤
│ Not found │ ⚠️ MUST run first-time setup (see below) → Then continue to Step 1        │
└───────────┴───────────────────────────────────────────────────────────────────────────┘

**First-Time Setup** (when EXTEND.md not found):

**Language**: Use user's input language or saved language preference.

Use AskUserQuestion with ALL questions in ONE call. See `references/config/first-time-setup.md` for question details.

**EXTEND.md Supports**: Watermark | Preferred style/layout | Custom style definitions | Language preference

Schema: `references/config/preferences-schema.md`

### Step 1: Analyze Content → `analysis.md`

Read source content, save it if needed, and perform deep analysis.

**Actions**:
1. **Save source content** (if not already a file):
   - If user provides a file path: use as-is
   - If user pastes content: save to `source.md` in target directory
   - **Backup rule**: If `source.md` exists, rename to `source-backup-YYYYMMDD-HHMMSS.md`
2. Read source content
3. **Deep analysis** following `references/workflows/analysis-framework.md`:
   - Content type classification (种草/干货/测评/教程/避坑...)
   - Hook analysis (爆款标题潜力)
   - Target audience identification
   - Engagement potential (收藏/分享/评论)
   - Visual opportunity mapping
   - Swipe flow design
4. Detect source language
5. Determine recommended image count (2-10)
6. **Generate clarifying questions** (see Step 2)
7. **Save to `analysis.md`**

### Step 2: Confirmation 1 - Content Understanding ⚠️

**Purpose**: Validate understanding + collect missing info. **Do NOT skip.**

**Display summary**:
- Content type + topic identified
- Key points extracted
- Tone detected
- Source images count

**Use AskUserQuestion** for:
1. Core selling point (multiSelect: true)
2. Target audience
3. Style preference: Authentic sharing / Professional review / Aesthetic mood / Auto
4. Additional context (optional)

**After response**: Update `analysis.md` → Step 3

### Step 3: Generate 3 Outline + Style Variants

Based on analysis + user context, create three distinct strategy variants. Each variant includes both **outline structure** and **visual style recommendation**.

**For each strategy**:

| Strategy | Filename | Outline | Recommended Style |
|----------|----------|---------|-------------------|
| A | `outline-strategy-a.md` | Story-driven: emotional, before/after | warm, cute, fresh |
| B | `outline-strategy-b.md` | Information-dense: structured, factual | notion, minimal, chalkboard |
| C | `outline-strategy-c.md` | Visual-first: atmospheric, minimal text | bold, pop, retro |

**Outline format** (YAML front matter + content):
```yaml
---
strategy: a  # a, b, or c
name: Story-Driven
style: warm  # recommended style for this strategy
style_reason: "Warm tones enhance emotional storytelling and personal connection"
elements:  # from style preset, can be customized in Step 4
  background: solid-pastel
  decorations: [clouds, stars-sparkles]
  emphasis: star-burst
  typography: highlight
layout: balanced  # primary layout
image_count: 5
---

## P1 Cover
**Type**: cover
**Hook**: "入冬后脸不干了🥹终于找到对的面霜"
**Visual**: Product hero shot with cozy winter atmosphere
**Layout**: sparse

## P2 Problem
**Type**: pain-point
**Message**: Previous struggles with dry skin
**Visual**: Before state, relatable scenario
**Layout**: balanced

...
```

**Differentiation requirements**:
- Each strategy MUST have different outline structure AND different recommended style
- Adapt page count: A typically 4-6, B typically 3-5, C typically 3-4
- Include `style_reason` explaining why this style fits the strategy
- Consider user's style preference from Step 2

Reference: `references/workflows/outline-template.md`

### Step 4: Confirmation 2 - Outline & Style & Elements Selection ⚠️

**Purpose**: User chooses outline strategy, confirms visual style, and customizes elements. **Do NOT skip.**

**Display each strategy**:
- Strategy name + page count + recommended style
- Page-by-page summary (P1 → P2 → P3...)

**Use AskUserQuestion** with three questions:

**Question 1: Outline Strategy**
- Strategy A (Recommended if "authentic sharing")
- Strategy B (Recommended if "professional review")
- Strategy C (Recommended if "aesthetic mood")
- Combine: specify pages from each

**Question 2: Visual Style (Dynamic Live Previews)** ⭐

**NEW: Generate real preview images based on user's content!**

Instead of showing static sample images, generate 3 real previews using the user's actual content:

```python
# Step 1: Analyze content and recommend top 3 matching styles
# For example, if content is "AI tools recommendation":
# Recommended: notion (knowledge card), chalkboard (educational), minimal (clean)

# Step 2: Create preview prompts directory
preview_dir = f"{session_dir}/previews"
mkdir(preview_dir)

# Step 3: Generate preview prompts for each recommended style
previews = [
    {
        "name": "preview-notion",
        "prompt": f"[Content: {user_content}] in notion style - minimalist hand-drawn knowledge card...",
        "aspect_ratio": "3:4"
    },
    {
        "name": "preview-chalkboard",
        "prompt": f"[Content: {user_content}] in chalkboard style - colorful chalk on blackboard...",
        "aspect_ratio": "3:4"
    },
    {
        "name": "preview-minimal",
        "prompt": f"[Content: {user_content}] in minimal style - ultra-clean, no decoration...",
        "aspect_ratio": "3:4"
    }
]

# Step 4: Create Excel file for batch generation
df = pd.DataFrame(previews)
excel_path = f"{preview_dir}/previews.xlsx"
df.to_excel(excel_path, index=False)

# Step 5: Generate preview images using local Python script
subprocess.run([
    "python3", "batch_generate_backup.py",
    excel_path,
    "-o", preview_dir
])

# Step 6: Open previews in user's image viewer
subprocess.run(["open", f"{preview_dir}/preview-notion.png"])
subprocess.run(["open", f"{preview_dir}/preview-chalkboard.png"])
subprocess.run(["open", f"{preview_dir}/preview-minimal.png"])

# Step 7: Also display previews in chat for visibility
for preview in previews:
    img = read_file(f"{preview_dir}/{preview['name']}.png")
    display(f"### {preview['name']}风格")
    display(img)  # This shows the image in chat
```

**User Experience Flow:**

1. ✅ Analyze content → Recommend top 3 styles
2. ✅ Generate 3 real preview images based on ACTUAL content
3. ✅ Auto-open in image viewer (visible on user's screen)
4. ✅ Also display in chat (if Read tool supports images)
5. ✅ User chooses their preferred style
6. ✅ Generate full series (4-5 images) with selected style

**Benefits:**
- Users see REAL previews with their content, not generic samples
- Only 3 previews needed (cost-effective)
- Previews open in local viewer (reliable viewing)
- Better user confidence before committing to full generation

**Fallback:**
If image generation fails, still show static sample previews from `/Users/bian/.claude/skills/bxz-xhs/previews/*.webp`

**Question to ask:**
"请查看图片查看器中的 3 张预览图（基于你的内容生成），选择你喜欢的风格："
- Option 1: [Style 1 name] - brief description
- Option 2: [Style 2 name] - brief description
- Option 3: [Style 3 name] - brief description
- Or: Regenerate previews with different styles
- Or: See all 10 static style samples

**Question 3: Visual Elements** (show after style selection)
Display the selected style's default elements from preset, then ask:
- Use style defaults (Recommended) - show preview: background, decorations, emphasis
- Adjust background - options: solid-pastel / solid-saturated / gradient-linear / gradient-radial / paper-texture / grid
- Adjust decorations - options: hearts / stars-sparkles / flowers / clouds / leaves / confetti
- Type custom element preferences

**After response**:
- Single strategy → copy to `outline.md` with confirmed style
- Combination → merge specified pages with confirmed style
- Custom request → regenerate based on feedback
- Style defaults → use preset's Element Combination as-is
- Background adjustment → update elements.background with user choice
- Decorations adjustment → update elements.decorations with user choice
- Custom elements → parse user's preferences into elements fields
- Update `outline.md` frontmatter with final style and elements

### Step 5: Generate Images

With confirmed outline + style + layout:

**For each image (cover + content + ending)**:
1. Save prompt to `prompts/NN-{type}-[slug].md` (in user's preferred language)
   - **Backup rule**: If prompt file exists, rename to `prompts/NN-{type}-[slug]-backup-YYYYMMDD-HHMMSS.md`
2. Generate image using **local Python script**: `MyCode/batch_generate_backup.py`
   - **Backup rule**: If image file exists, rename to `NN-{type}-[slug]-backup-YYYYMMDD-HHMMSS.png`
3. Report progress after each generation

**Image Generation Method**:
- Uses Google GenAI SDK via `MyCode/batch_generate_backup.py`
- Model: `gemini-3-pro-image-preview`
- Default aspect ratio: `3:4` (小红书竖版)

**API Key Configuration** (按优先级查找):
1. 用户级配置: `~/.config/bxz-xhs/config.ini` (推荐)
2. 项目级配置: `.baoyu-skills/bxz-xhs/config.ini`

**首次使用配置** (推荐方式 1 - 用户级配置):
```bash
# 创建配置目录
mkdir -p ~/.config/bxz-xhs

# 创建配置文件（Gemini Nano Banana API）
cat > ~/.config/bxz-xhs/config.ini << 'EOF'
[gemini_nano]
api_key=YOUR_API_KEY_HERE
EOF

# 替换 YOUR_API_KEY_HERE 为你的 Gemini Nano Banana API Key
```

**注意**: 配置文件包含敏感信息，请勿提交到版本控制系统

**Session Management**:
If image generation skill supports `--sessionId`:
1. Generate unique session ID: `xhs-{topic-slug}-{timestamp}`
2. Use same session ID for all images
3. Ensures visual consistency across generated images

### Step 6: Completion Report

```
Xiaohongshu Infographic Series Complete!

Topic: [topic]
Strategy: [A/B/C/Combined]
Style: [style name]
Layout: [layout name or "varies"]
Location: [directory path]
Images: N total

✓ analysis.md
✓ outline-strategy-a.md
✓ outline-strategy-b.md
✓ outline-strategy-c.md
✓ outline.md (selected: [strategy])

Files:
- 01-cover-[slug].png ✓ Cover (sparse)
- 02-content-[slug].png ✓ Content (balanced)
- 03-content-[slug].png ✓ Content (dense)
- 04-ending-[slug].png ✓ Ending (sparse)
```

**Step 7: Optional Auto-Publish** 📱

After showing completion report, ask user if they want to publish:

```python
# Use AskUserQuestion
question: "图片已生成完成！是否立即发布到小红书？"

options:
  - Yes: 全自动发布
    → Run ~/Myxhs/auto_publish.py
    → 自动提取标题、内容
    → 自动发布到小红书 (xiaohongshu-mcp)
    → 完成！

  - Preview: 预览后发布
    → 显示将要发布的标题和内容
    → 用户确认后再发布

  - No: 仅保存图片
    → Images saved to ~/Myxhs/{topic}/
    → 可以后续手动发布
```

**Implementation**:

```python
# 全自动发布（推荐）
import subprocess

session_dir = f"/Users/bian/Myxhs/{slug}"

# 运行自动发布脚本
result = subprocess.run([
    "python3", "/Users/bian/.claude/skills/bxz-xhs/scripts/auto_publish.py",
    session_dir
], capture_output=True, text=True)

if result.returncode == 0:
    print("✓ 发布成功！")
else:
    print(f"发布失败: {result.stderr}")
```

**Requirements**:
- xiaohongshu-mcp 服务运行中 (`~/xiaohongshu-mcp/xiaohongshu-mcp`)
- 已登录小红书账号

**Manual Publish Later**:
```bash
# 之后随时可以发布
python3 ~/.claude/skills/bxz-xhs/scripts/auto_publish.py ~/Myxhs/{topic-slug}
```

## Image Modification

| Action | Steps |
|--------|-------|
| **Edit** | **Update prompt file FIRST** → Regenerate with same session ID |
| **Add** | Specify position → Create prompt → Generate → Renumber subsequent files (NN+1) → Update outline |
| **Delete** | Remove files → Renumber subsequent (NN-1) → Update outline |

**IMPORTANT**: When updating images, ALWAYS update the prompt file (`prompts/NN-{type}-[slug].md`) FIRST before regenerating. This ensures changes are documented and reproducible.

## Content Breakdown Principles

1. **Cover (Image 1)**: Hook + visual impact → `sparse` layout
2. **Content (Middle)**: Core value per image → `balanced`/`dense`/`list`/`comparison`/`flow`
3. **Ending (Last)**: CTA / summary → `sparse` or `balanced`

**Style × Layout Matrix** (✓✓ = highly recommended, ✓ = works well):

| | sparse | balanced | dense | list | comparison | flow | mindmap | quadrant |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| cute | ✓✓ | ✓✓ | ✓ | ✓✓ | ✓ | ✓ | ✓ | ✓ |
| fresh | ✓✓ | ✓✓ | ✓ | ✓ | ✓ | ✓✓ | ✓ | ✓ |
| warm | ✓✓ | ✓✓ | ✓ | ✓ | ✓✓ | ✓ | ✓ | ✓ |
| bold | ✓✓ | ✓ | ✓ | ✓✓ | ✓✓ | ✓ | ✓ | ✓✓ |
| minimal | ✓✓ | ✓✓ | ✓✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| retro | ✓✓ | ✓✓ | ✓ | ✓✓ | ✓ | ✓ | ✓ | ✓ |
| pop | ✓✓ | ✓✓ | ✓ | ✓✓ | ✓✓ | ✓ | ✓ | ✓ |
| notion | ✓✓ | ✓✓ | ✓✓ | ✓✓ | ✓✓ | ✓✓ | ✓✓ | ✓✓ |
| chalkboard | ✓✓ | ✓✓ | ✓✓ | ✓✓ | ✓ | ✓✓ | ✓✓ | ✓ |
| study-notes | ✗ | ✓ | ✓✓ | ✓✓ | ✓ | ✓ | ✓✓ | ✓ |

## References

Detailed templates in `references/` directory:

**Elements** (Visual building blocks):
- `elements/canvas.md` - Aspect ratios, safe zones, grid layouts
- `elements/image-effects.md` - Cutout, stroke, filters
- `elements/typography.md` - Decorated text (花字), tags, text direction
- `elements/decorations.md` - Emphasis marks, backgrounds, doodles, frames

**Presets** (Style presets):
- `presets/<name>.md` - Element combination definitions (cute, notion, warm...)

**Workflows** (Process guides):
- `workflows/analysis-framework.md` - Content analysis framework
- `workflows/outline-template.md` - Outline template with layout guide
- `workflows/prompt-assembly.md` - Prompt assembly guide

**Config** (Settings):
- `config/preferences-schema.md` - EXTEND.md schema
- `config/first-time-setup.md` - First-time setup flow
- `config/watermark-guide.md` - Watermark configuration

## Notes

- Auto-retry once on failure | Cartoon alternatives for sensitive figures
- Use confirmed language preference | Maintain style consistency
- **Two confirmation points required** (Steps 2 & 4) - do not skip

## Extension Support

Custom configurations via EXTEND.md. See **Step 0** for paths and supported options.
