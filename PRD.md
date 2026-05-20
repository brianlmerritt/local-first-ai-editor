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
