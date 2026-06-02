Here is the Product Requirements Document (PRD) for the Phase 1 MVP. This acts as our blueprint, explicitly outlining what we are building right now and what is being deferred, ensuring we don't succumb to feature creep.

---

# Product Requirements Document (PRD)

**Project:** Offline AI Writer & Semantic Reviewer (Phase 3)
**Date:** April 29, 2026

## 1. Executive Summary

A browser-native, privacy-first writing application designed for serious authors. The platform shifts AI usage from "generative writing" to "editorial review," acting as a semantic linter. It operates entirely client-side without a runtime server, utilizing local browser storage and standard AI API endpoints to provide context-aware critiques without altering the user's base manuscript unless explicitly approved.

## 2. Core Technology Stack

- **Application Framework:** SvelteKit (configured for Static Site Generation / Single Page App).
- **Styling:** Tailwind CSS (for rapid, responsive multi-pane layouts).
- **Editor Engine:** Tiptap (Headless wrapper for ProseMirror).
- **State & Offline Persistence:** Yjs integrated with `y-indexeddb`.
- **Icons:** Lucide-Svelte.

## 3. User Interface Architecture

The application will utilize an ultrawide-optimized 4-column layout, which gracefully degrades to drawers/popovers on laptop displays.

- **Column 1: Navigation / File System (Far Left)**
  - File tree for chapter and scene navigation.
  - _Phase 1 implementation:_ Mocked internal list managed by Svelte State, paving the way for the File System Access API.
- **Column 2: The Canvas (Center Left)**
  - The core Tiptap writing environment.
  - Visually constrained to an optimal reading width (e.g., ~65-80 characters / `max-w-2xl`).
  - Supports standard Markdown shortcuts via Tiptap Starter Kit.
- **Column 3: The Active Review / Inbox (Center Right)**
  - Displays AI-generated critiques natively aligned with the corresponding paragraphs.
  - Uses a localized commenting model (e.g., `tiptap-comment-extension`) rather than inline text replacement.
  - **Review Recipes Panel:** A dynamic array of modular "Recipe Cards." Each card has an active toggle switch (boolean), an editable title, an editable prompt instruction, and a delete button. Recipes can be toggled on/off to assemble custom semantic linting criteria.
- **Column 4: The Context Board (Far Right)**
  - **Writing Objectives:** A fixed, permanent text area capturing the immediate scene goals.
  - **Dynamic Context Items:** A vertically stacked list of editable cards (for _Characters, Locations, Lore, etc._), each featuring a configurable title and content body, which can be created, edited, and deleted dynamically.

## 4. Functional Requirements

### 4.1 Local Storage & Document State

- **Offline First:** The application must not require an external database to save work.
- **Continuous Save:** All editor changes and panel updates must stream into Yjs and persist in the browser's IndexedDB automatically.
- **Session Recovery:** Users must be able to close the browser, reopen the app, and find their exact document state restored.

### 4.2 The `ContextStore` & AI Integration

- **Bring Your Own Key (BYOK):** The settings panel will accept an API Key and a Base URL, strictly utilizing the standard `/v1/chat/completions` schema to support OpenAI, Anthropic, OpenRouter, or local proxy endpoints.
- **Prompt Assembly (`ContextStore`):** When a user triggers a review, the application must automatically assemble a system prompt combining:
  1.  The active "Review Recipe" string.
  2.  The content of the Context Board panels (Objectives, Characters, etc.).
  3.  The active scene text from the Tiptap editor.
- **Targeted Critiques:** The AI must be prompted to return structured responses (e.g., JSON containing the critique and a text snippet/reference) so the app can anchor the comment to the correct paragraph in Column 3.

## 5. Non-Functional Requirements

- **Zero Server Runtime:** The application must compile to static HTML/CSS/JS. There will be no Node.js server required at runtime.
- **Privacy:** The user's text must never leave their local machine unless they explicitly trigger an AI review, at which point it is sent only to the API endpoint they configured.

## 6. Phase 2 Requirements — Delivered

- **Enhanced Editor:** Justification, strike-through, code text, text highlights, task lists, undo/redo, tables.
- **AI Recipes & ToDo UX:** Drag-and-drop reordering, recipe highlight colors, scrollbar fixes, selection-based ToDos with gray annotations.
- **AI Chat Panel:** Conversational panel per recipe with streaming responses, scene text context, and per-recipe chat history persisted per version.
- **Complex Recipe Builder:** Temperature slider, max tokens selector, output format selection (lints / todos / chat).
- **Versioning:** Full per-scene versioning — named versions, Final Output marker, clone, delete, per-version recipes/todos/context board/chat history. Version panel in header strip.
- **Export:** File System Access API export to structured folders with YAML-frontmatted files. Covers story text, individual scenes, all versions, recipes, todos, context board (objectives + items), chat/lint/todo histories, and settings. API keys obfuscated on export.
- **Import:** Folder scan → findings summary → per-category checkboxes → import in Overwrite or Start Fresh mode. Reconstructs all data types including Yjs text content (markdown → Yjs via `marked` + DOMParser).

## 7. Phase 3 Requirements

- **Configurable CODEX:** Expand the current Context Board for scenes into a full CODEX system with Top Level, Chapter, and Scene/Section.
- **Integrate CODEX:** Add support for lightRAG and integrate the existing TODO system.
- **Agentic editing support:** Add support for agentic editing, linting, todo handling, and continuity.
- **Multi-story support:** Add ability to open, switch between, and manage multiple independent projects.
- **Collapsible Text Output:** Toggle visibility for raw output on "Text" recipe cards in the review panel.
- **In-Editor AI:** Add slash commands or bubble menus inside the editor (e.g. `/reword`, `/check_story`).
- **Inline Diff/Tracked Changes:** Inline rewrites and diff views (using tools like `prosemirror-multi-editor-diff` or Tiptap Snapshots) for applying AI suggestions directly to the manuscript.
- **WebGPU / Local Browser AI:** Download and run quantized models (WebLLM or Transformers.js) for fully offline AI generation.
- **Beta Release:** Configure static build pipeline and publish for public Beta Testing.

---

## 8. Obsidian-Compatible Codex/Vault Support (Phases 3A–3E)

**Date added:** June 2, 2026

### 8.1 Purpose

Users should be able to maintain or share a human-readable codex for a writing or research project using Obsidian-compatible Markdown files. The exported vault must be useful directly in Obsidian while remaining importable back into the editor. The existing editor remains the primary writing and versioning environment; Obsidian support is an interoperability and codex workflow layer, not a replacement.

### 8.2 Core Concepts — Codex Entry Types

A project may define one or more codex entry types. The system is non-opinionated; these types are recipes/templates, not hardcoded application classes.

**Fiction examples:** Character, Location, Faction, Object, Scene, Scene Beat, Plot Thread, Motif, Mystery, Open Loop, Continuity Issue.

**Literary fiction examples:** Character, Relationship, Motif, Image, Symbol, Echo, Scene Beat, Emotional Turn, Contradiction, Theme Pressure.

**Non-fiction / research examples:** Concept, Claim, Source, Evidence, Theory, Method, Dataset, Citation, Counterclaim, Open Question.

### 8.3 Vault Structure

Export an Obsidian-compatible vault. The exact folder structure is configurable or generated from codex recipes; the following represents sensible MVP defaults:

```
Project Vault/
  00 Index/
    Home.md
    Character Directory.md
    Location Directory.md
    Concept Directory.md
    Claim Directory.md
    Thread Directory.md
    Open Loops.md
    Tasks.md
  Codex/
    Characters/
    Locations/
    Threads/
    Motifs/
    Concepts/
    Claims/
    Sources/
  Scenes/
  Chapters/
  _templates/
    character.md
    location.md
    scene.md
    thread.md
    motif.md
    concept.md
    claim.md
    source.md
    changelog-rename.md
    changelog-merge.md
  _changelog/
    Rename Log.md
    Merge Log.md
  Tasks/
    All Tasks.md
    Continuity Tasks.md
    Research Tasks.md
    Revision Tasks.md
  Boards/
    Continuity Board.md
    Revision Board.md
    Research Board.md
  _ai/
    Suggestions/
    Relationship Candidates/
  _exports/
```

### 8.4 YAML Frontmatter Requirements

Every codex note must include YAML frontmatter with at minimum:

```yaml
---
id: stable-id-here
type: character
canonical_name: Display Name
aliases: []
status: active
tags:
  - codex/character
created:
updated:
---
```

The `id` field is mandatory and must remain stable even when the filename or display name changes. Filenames must never be used as canonical IDs.

### 8.5 Wikilink Requirements

Export uses Obsidian `[[wikilink]]` syntax for human-readable relationships in both YAML fields and body text. Examples:

```yaml
characters:
  - "[[Brin Flip]]"
location: "[[Meridian Archive]]"
threads:
  - "[[Archive password mystery]]"
```

```markdown
## Relationships

- Trusts: [[Marcus Vale]]
- Opposes: [[House Veyr]]
- Foreshadows: [[Archive password reveal]]
```

### 8.6 Directory / Index Pages

Generate directory pages with Dataview-compatible code blocks. Pages must remain readable as plain Markdown if Dataview is not installed. Example:

````markdown
# Character Directory

```dataview
TABLE canonical_name AS "Name", status, aliases, appears_in
FROM "Codex/Characters"
WHERE type = "character"
SORT canonical_name ASC
```
````

### 8.7 Template Requirements

Generate `_templates/` Markdown files for each codex recipe. Templates include YAML frontmatter and body section headings. Examples: character, location, scene, thread, motif, concept, claim, source, changelog-rename, changelog-merge.

### 8.8 Scene / Chapter Codex Export

Each scene exports a Markdown note including chapter, scene number, story_order, POV, characters, location, timeline, threads, open loops, foreshadow/payoff metadata, status, version ID, and final-output flag. Chapters export a summary note with links to their scenes.

### 8.9 Change-Control Requirements

Support rename and merge change records. On rename, the exported file preserves `aliases` and `renamed_from` fields. Changelog notes are exported to `_changelog/`. Example:

```yaml
---
id: char-brin-flip-7f3a
type: character
canonical_name: Brin Flip
aliases:
  - Yan Darn
renamed_from:
  - Yan Darn
last_rename: 2026-06-02
---
```

Changelog note format:

```yaml
---
type: change
change_type: rename
object_id: char-brin-flip-7f3a
old_name: Yan Darn
new_name: Brin Flip
preserve_alias: true
date: 2026-06-02
---
```

### 8.10 CardBoard-Compatible Todo Export

Export todos as CommonMark checkbox tasks. Each todo must have a stable `editor_id` and a Markdown block ID (e.g. `^todo-8f13`). Status, kind, and priority are represented as tags. Due dates use `@due(YYYY-MM-DD)`. Related passage/codex links use inline fields. Example:

```markdown
- [ ] Fix Brin password continuity #status/backlog #kind/continuity #priority/high @due(2026-06-10) ^todo-8f13
  passage:: [[Chapter 07 Scene 03]]
  related:: [[Brin Flip]], [[Archive password reveal]]
  source:: ai-lint
  editor_id:: todo:8f13
```

**Status tags:** `#status/backlog`, `#status/triaged`, `#status/doing`, `#status/blocked`, `#status/done`, `#status/ignored`

**Kind tags:** `#kind/continuity`, `#kind/research`, `#kind/revision`, `#kind/foreshadowing`, `#kind/payoff`, `#kind/style`, `#kind/source-check`

**Priority tags:** `#priority/high`, `#priority/medium`, `#priority/low`

Primary export target: `Tasks/All Tasks.md`. Category-specific files: `Continuity Tasks.md`, `Research Tasks.md`, `Revision Tasks.md`. Optional Kanban board files in `Boards/`.

### 8.11 Todo Import Requirements

When importing from Obsidian-compatible task files:

- Parse CommonMark checkbox tasks.
- Match existing todos by `editor_id::` first; fall back to block ID (`^todo-…`).
- Parse completion state, status/kind/priority tags, `@due(YYYY-MM-DD)`, inline fields.
- Update editor todo state accordingly.
- MVP conflict strategy: last-modified-wins with a recorded warning.

### 8.12 Vault Import Requirements

Extend the importer to detect Obsidian vault structure (`00 Index/`, `Codex/`, `Scenes/`, `Chapters/`, `_templates/`, `_changelog/`, `Tasks/`, `Boards/`). The import findings screen reports: codex note counts by type, scene/chapter note counts, template counts, todo counts, changelog record counts, potential ID conflicts, notes missing stable IDs, and unknown types.

Import modes:

| Mode | Behaviour |
|---|---|
| Overwrite/Merge | Update existing records by stable ID |
| Start Fresh | Wipe current project and import vault |
| Codex Only | Import codex/templates/todos without replacing manuscript text |
| Tasks Only | Import only Obsidian task changes |

### 8.13 Non-Functional Requirements

- Must preserve the existing browser-only / static-deployment model — no runtime server.
- Must not require Obsidian, Dataview, CardBoard, or any Obsidian plugin to be installed.
- Must produce valid, human-readable Markdown and YAML frontmatter.
- Must not expose API keys in exported files.
- Must remain compatible with all existing export/import categories and must not break existing scene/version export/import.
- Must be tested with unit tests and Playwright smoke tests.

### 8.14 Explicit Non-Goals (Phases 3A–3E)

- No LightRAG or any backend GraphRAG system.
- No runtime server.
- No full ontology editor or graph database.
- No replacement of Yjs/IndexedDB persistence.
- No destructive auto-merge on import.
- Obsidian is not required for any export or import operation.

---
