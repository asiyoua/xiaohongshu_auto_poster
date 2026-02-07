---
version: 1
watermark:
  enabled: false
  content: ""
  position: bottom-right
  opacity: 0.7
preferred_style:
  name: null
  description: "Auto-select based on content analysis"
preferred_layout: null
language: null
custom_styles: []
---

# bxz-xhs User Preferences

This file stores your personalized settings for the Xiaohongshu infographic generator.

## Current Settings

- **Watermark**: Disabled (no watermark)
- **Style**: Auto-select based on content
- **Layout**: Auto-select based on content
- **Language**: Auto-detect from input

## Modifying Preferences

You can edit the YAML frontmatter above to change settings:

- `watermark.enabled`: Set to `true` to enable watermarking
- `watermark.content`: Your watermark text (e.g., "@yourhandle")
- `preferred_style.name`: Set a default style (cute, notion, fresh, etc.)
- `preferred_layout`: Set a default layout (sparse, balanced, dense, etc.)
- `language`: Force a specific language (zh, en)

For full schema, see: `/Users/bian/.claude/skills/bxz-xhs/references/config/preferences-schema.md`
