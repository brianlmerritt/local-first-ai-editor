# ToDo Project Tracker

## Done Items

### Milestone 1: Global State Management (The Brains)

Before extracting components, we need a central place to hold the data so the panels can talk to each other and the editor.

- [x] **Create `src/lib/state/ui.svelte.ts`:** Move the panel visibility toggles (`showExplorer`, `showContextBoard`, etc.) into a global state object so the Header component can toggle them, and the Main Page can react to them. Add another state `showReviewPanel`.
- [x] **Create `src/lib/state/document.svelte.ts`:** Define the data structure for your current work. This should hold `currentChapter`, `currentScene`, `wordCount`, the `todoList` array, the `reviewRecipes` array, and the text strings for Characters/Locations/Objectives.
- [x] **Setup Code and Browser tests to confirm Milestone 1 is working **

### Milestone 2: Component Extraction (Cleaning the Shell)

Let's break that massive `+page.svelte` file into modular, manageable pieces inside a new `src/lib/components/` folder.

- [x] **Create `Header.svelte`:** Extract the sticky top toolbar (dashboard, save/load, toggle icons) plus add an extra toggle for ReviewPanel just to the left of the button for ContextPanel.
- [x] **Create `ExplorerPanel.svelte`:** Extract the far-left file tree UI.
- [x] **Create `ReviewPanel.svelte`:** Extract the inner-right panel (Active Recipes & ToDos).
- [x] **Create `ContextPanel.svelte`:** Extract the far-right panel (Writing Objectives, Characters, Locations).
- [x] **Update `+page.svelte`:** Import these new components so your main layout file is clean and just handles the Flexbox structure.
- [x] **Update Code and Browser tests to confirm Milestones 1 and 2 are working **

### Milestone 3: The Tiptap Editor (The Core)

Time to replace the `contenteditable` placeholder with a real, robust text editor.

- [x] **Create `Tiptap.svelte`:** Initialize a vanilla Tiptap instance using `@tiptap/core` and `@tiptap/starter-kit` inside an `onMount` lifecycle hook.
- [x] **Bind the Editor:** Attach the Tiptap instance to a `bind:this` div reference in your Svelte markup.
- [x] **Character/Word Count:** Add the `@tiptap/extension-character-count` plugin and wire its output to your `document.svelte.ts` state so the Header updates as you type.
- [x] **Update Code and Browser tests to confirm Milestones 1, 2 and 3 are working **

### Milestone 4A: Panel Data Structure & CRUD UI

Before persisting, we need reactive data structures for the Review and Context panels.

- [x] **Update `document.svelte.ts`:** Replace simple string/array states with proper typed arrays of objects (e.g., `ReviewRecipe[]` and `ContextItem[]`).
- [x] **ReviewPanel UI (`Active Recipes`):** Build a stack of recipe cards with a checkbox toggle (`isActive`), editable `title`, editable `prompt`, and a delete button. Add an "+ Add Recipe" action.
- [x] **ContextPanel UI (`Context Board`):** Keep a fixed "Writing Objectives" area, but implement a dynamic list of cards for other context items (Characters, Locations, etc.) with editable titles, contents, and delete buttons. Add an "+ Add Context" action.
- [x] **Update Code and Browser tests to confirm Milestone 4A is working**

### Milestone 4B: Project Hierarchy & Navigation

Before attempting to save our flat data state, we must introduce the concept of "Scenes" and "Projects" into our state hierarchy so the "Save" action creates specific scene snapshots.

- [x] **Refactor `document.svelte.ts`:** Create new `Scene` and `Project` interfaces. Move `todoList`, `objectivesText`, and `content` (from Editor) inside the `Scene` interface. Make `ReviewRecipe` and `ContextItem` collections global to the Project.
- [x] **Implement Active State:** Introduce an `activeSceneId` pointer. Ensure that modifying a local panel updates the specific array living inside that active scene in the project state.
- [x] **Update `ExplorerPanel.svelte`:** Replace the hardcoded "CH 1 / SC 1" with a dynamically rendering `{#each}` loop over the project's scenes. Allow users to add a new scene and click existing scenes to change the active view.
- [x] **Update Code and Browser tests to confirm Milestone 4B is working**

### Milestone 4C: Yjs & Offline Storage (Persistence)

This is where the magic happens. We want everything saved to the browser automatically.

- [x] **Initialize Yjs:** Create a global `Y.Doc` instance in your state manager.
- [x] **Bind Tiptap to Yjs:** Install `@tiptap/extension-collaboration` and bind your Tiptap instance to a `Y.XmlFragment` inside your Yjs document. _(Note: Even though we are offline and single-player, this extension is the best way to handle Yjs text binding)._
- [x] **Setup `y-indexeddb`:** Connect your `Y.Doc` to an IndexedDB provider.
- [x] **Persist Panel Data:** Sync your `Scene[]`, `ReviewRecipe[]`, and `ContextItem[]` states with `Y.Array` or `Y.Map` within the Yjs document, ensuring your notes and manuscript are saved and versioned together.
- [x] **Update Code and Browser tests to confirm Milestone 4C is working **

### Milestone 5: AI Provider Profiles & Context Assembly

Getting ready for the AI integration, supporting multiple models and routing specific recipes to specific AI systems.

- [x] **Define AI Profiles State:** Create a store (e.g., in `document.svelte.ts` or a new `settings.svelte.ts`) to manage an array of `ProviderProfile` objects (Name, API Key, Base URL, default Model ID, type: OpenAI/Anthropic/Gemini/Local).
- [x] **Create a Settings Modal:** Build a UI to manage these AI Provider Profiles and save them securely in the browser's `localStorage` or sync them via Yjs conditionally.
- [x] **Bind Recipes to Models:** Update the `ReviewRecipe` interface and the ReviewPanel UI so each recipe has a dropdown to select which `ProviderProfile` and Model it should specifically use (e.g., "Fast Typos" -> Ollama Llama 3; "Deep Critique" -> OpenRouter Claude 3.5 Sonnet).
- [x] **Build the Context Assembler:** Write a utility function that grabs the current Tiptap text content, grabs the active "Writing Objectives" and "Characters", and concatenates them into a single System Prompt string.
- [x] **Update Code and Browser tests to confirm Milestones 5 is working **

### Milestone 6: The AI Review Logic (Async & Streaming)

Wiring up the LLMs with real-time feedback and robust parsing.

- [x] **The Fetch Engine / Proxy:** Write an async fetch handler (a SvelteKit `+server.ts` pass-through route) to handle CORS safely for external APIs.
- [x] **Unified API Adapters:** Build a generalized request handler that formats the request for OpenAI-compatible endpoints and handles Streaming Text vs. JSON modes based on the recipe's configuration.
- [x] **Robust JSON Parsing:** Implement a fallback extractor. If an LLM returns malformed JSON or wraps it in markdown (`json ... `), use regex to strip it. If that fails, optionally trigger a fast retry or pass it to a secondary "JSON Cleaner" function.
- [x] **Trigger Mechanism:** Add "Run" buttons next to your Active Review Recipes. When clicked, it passes the Context + specific Recipe to the chosen Model.
- [x] **Handle Streaming Output:** Process `ReadableStream` chunks so the AI feedback cards in the `ReviewPanel.svelte` sidebar type out in real-time.
- [x] **Update Code and Browser tests to confirm Milestone 6 is working **

### Milestone 7: The "Code Review" UX (Annotations)

Connecting the AI's thoughts back to the specific words in the editor.

- [x] **Exact String Matching Strategy:** Instruct the LLM in JSON-mode recipes to always return `{ "original_text": "...", "suggestion": "...", "reasoning": "..." }` for lints, or flat strings for todos.
- [x] **Implement Comments:** Add a custom Tiptap mark (or use an open-source comment extension) to allow wrapping text ranges in highlighted backgrounds.
- [x] **Anchor AI Feedback:** When the JSON is successfully parsed, write logic that searches the Tiptap document for the exact `original_text` and wraps it in a comment mark tied to a unique ID.
- [x] **Resolve/Ignore:** Add buttons to the AI feedback cards in the sidebar to remove the highlight from the text (Ignore) or trigger a diff/replacement (Resolve).
- [x] **Update Code and Browser tests to confirm Milestones 7 is working **

---

## Phase 2: Beta Features — Complete

- [x] **Enhance Editor:** Justification, strike-through, code text, text highlights, task lists, undo/redo, tables.
- [x] **AI Recipes and Todo:** Drag-and-drop reordering, recipe highlight colours, scrollbar fixes.
- [x] **UX Design Review (Review Recipes Panel):**
  - [x] Discuss and agree on a UX design for the Review Recipes Panel.
  - [x] Fix missing scrollbars on text output cards and lint output cards.
  - [x] Review drag-and-drop mechanics vs text selection on lint cards.
  - [x] Review nested scrollbar issues between the Scene ToDos area and the main panel.
  - [x] Ensure Scene ToDos preserve their assigned background colors when copied from lints and implement missing drag-and-drop.
  - [x] Add ability for ToDos to highlight any selected text and associate that with the ToDo.
- [x] **AI Chat Panel:** Conversational panel per recipe with streaming, scene text context, per-recipe chat history persisted per version.
- [x] **Complex Recipe Builder UI:** Temperature slider, max tokens selector, output format controls per recipe.
- [x] **Versioning:** Named scene versions, Final Output marker, clone/delete, per-version recipes/todos/context/chat history. Version strip panel in header.
- [x] **Export (File System Access API):** Structured folder export with YAML frontmatter — story, scene, versions, recipes, todos, context board (objectives + items), chat/lint/todo histories, settings. API keys obfuscated.
- [x] **Import (File System Access API):** Folder scan → findings → checkboxes → Overwrite or Start Fresh import. Reconstructs all data types including Yjs text via `marked`.

---

## Phase 3: Next Features

- [ ] **Configurable CODEX:** Expand the current Context Board for scenes into a full CODEX system with Top Level, Chapter, and Scene/Section
- [ ] **Integrate CODEX:** Add support for lightRAG and integrate the existing TODO system
- [ ] **Agentic editing support:** Everything is agentic these days - add support for Agentic editing / linting / todo / continuity.
- [ ] **Multi-story support:** Add ability to edit multiple stories — open, switch between, and manage multiple independent projects.
- [ ] **Collapsible Text Output:** Toggle visibility for raw output on "Text" recipe cards in the review panel.
- [ ] **In-Editor AI:** Adding `/` commands or bubble menus into the editor (e.g. `/reword`, `/check_story`).
- [ ] **Inline Diff/Tracked Changes:** Inline rewrites and diff views (using tools like `prosemirror-multi-editor-diff` or Tiptap Snapshots) for applying AI suggestions directly.
- [ ] **WebGPU / Local Browser AI:** Download and run quantized models (WebLLM or Transformers.js) for fully offline AI generation.
- [ ] **Beta Release:** Configure static build pipeline and publish for public Beta Testing.

---

## Phase 3A: Obsidian-Compatible Codex Export

> Export the editor's project data as an Obsidian-compatible vault with codex notes, templates, directory pages, scene/chapter notes, and wikilinks.

- [ ] Add `ObsidianExportOptions` type (codex recipe, folder name, included categories).
- [ ] Add export category checkbox: **Obsidian Vault / Codex** to the Export Modal.
- [ ] Define default codex recipes with associated entry types:
  - [ ] Minimal (Scene, Chapter)
  - [ ] Fiction (Character, Location, Faction, Object, Scene, Scene Beat, Plot Thread, Motif, Mystery, Open Loop, Continuity Issue)
  - [ ] Literary Fiction (Character, Relationship, Motif, Image, Symbol, Echo, Scene Beat, Emotional Turn, Contradiction, Theme Pressure)
  - [ ] Research / Non-fiction (Concept, Claim, Source, Evidence, Theory, Method, Dataset, Citation, Counterclaim, Open Question)
- [ ] Create stable ID generation utility (`src/lib/codex/stableIds.ts`) — deterministic, collision-resistant, prefix-typed (e.g. `char-brin-flip-7f3a`).
- [ ] Add stable IDs to exported scene, chapter, and codex records (non-destructive: only add if absent).
- [ ] Create filename sanitization utility — strip invalid characters, truncate, preserve human-readability.
- [ ] Create wikilink generation utility (`src/lib/export/obsidian/wikilinks.ts`) — convert internal object references to `[[Display Name]]`; preserve aliases.
- [ ] Create YAML frontmatter serializer (`src/lib/export/obsidian/frontmatter.ts`) — produces valid, human-readable YAML; never exposes API keys.
- [ ] Create vault folder structure generator (`src/lib/export/obsidian/vaultExport.ts`):
  - [ ] `00 Index/`
  - [ ] `Codex/<Type>/`
  - [ ] `Scenes/`
  - [ ] `Chapters/`
  - [ ] `_templates/`
  - [ ] `_changelog/`
  - [ ] `Tasks/`
  - [ ] `Boards/`
- [ ] Generate default `_templates/*.md` files for each active codex recipe entry type.
- [ ] Generate directory/index pages (`src/lib/export/obsidian/directories.ts`) with Dataview-compatible code blocks for each entry type.
- [ ] Export scene notes with full YAML frontmatter (chapter, scene, story_order, POV, characters, location, timeline, threads, open_loops, foreshadows, pays_off, status, version_id, final_output).
- [ ] Export chapter notes with YAML frontmatter and links to member scenes.
- [ ] Export context board entries (objectives, context items) as Obsidian codex notes with appropriate type.
- [ ] Export changelog notes for rename/merge events if present (`src/lib/export/obsidian/changelog.ts`).
- [ ] Unit tests:
  - [ ] Stable ID generation (determinism, uniqueness, prefix typing)
  - [ ] Filename sanitization (invalid characters, length, edge cases)
  - [ ] Wikilink generation (display name, alias fallback, escaping)
  - [ ] YAML frontmatter generation (valid output, no API key leakage)
  - [ ] Dataview directory page generation
  - [ ] Template file generation for each codex recipe
- [ ] Playwright export smoke test: export a minimal project as Obsidian vault and verify folder structure and file presence.

---

## Phase 3B: Obsidian-Compatible Codex Import

> Extend the importer to detect and ingest Obsidian vault files including codex notes, scene notes, templates, and changelog records.

- [ ] Extend import scanner (`src/lib/import/obsidian/vaultScan.ts`) to detect Obsidian vault structure (`00 Index/`, `Codex/`, `Scenes/`, `Chapters/`, `_templates/`, `_changelog/`, `Tasks/`, `Boards/`).
- [ ] Parse YAML frontmatter from Obsidian Markdown files (`src/lib/import/obsidian/frontmatterParse.ts`).
- [ ] Detect codex entries by `type` field in frontmatter.
- [ ] Detect and report notes missing `id` fields as warnings (not fatal).
- [ ] Match imported notes to existing records by stable `id`; fall back to filename/title matching only when no ID exists.
- [ ] Parse wikilinks from YAML fields (`src/lib/import/obsidian/wikilinkParse.ts`).
- [ ] Parse `aliases` fields.
- [ ] Parse scene notes (chapter, scene, story_order, characters, location, threads, etc.).
- [ ] Parse chapter notes.
- [ ] Parse template files (store as codex recipe templates).
- [ ] Parse changelog rename records (`src/lib/import/obsidian/changelogParse.ts`).
- [ ] Parse changelog merge records.
- [ ] Add import mode: **Codex Only** — import codex/templates/todos without replacing manuscript text.
- [ ] Add import mode: **Tasks Only** — import only Obsidian task file changes.
- [ ] Update import findings summary UI with Obsidian-specific counts (codex notes by type, scene notes, chapter notes, templates, todos, changelog records).
- [ ] Add conflict reporting (`src/lib/import/obsidian/conflictReport.ts`): duplicate IDs, missing IDs, unknown types, invalid YAML, unresolved wikilinks.
- [ ] Unit tests for vault scanning (directory detection, file enumeration).
- [ ] Unit tests for frontmatter parsing (valid, malformed, missing fields).
- [ ] Unit tests for changelog record parsing (rename, merge).
- [ ] Playwright import smoke test using a small fixture vault (`tests/fixtures/obsidian-vault-minimal/`).

---

## Phase 3C: CardBoard-Compatible Todo Export/Import

> Export todos as CommonMark checkbox tasks readable by Obsidian task plugins and CardBoard; import changed task state back into the editor.

- [ ] Define Markdown task export format (spec doc or inline comment).
- [ ] Add stable `editor_id` to todos if not already present.
- [ ] Add block ID generation for todos (e.g. `^todo-8f13`).
- [ ] Map todo status to Obsidian tags: `#status/backlog`, `#status/triaged`, `#status/doing`, `#status/blocked`, `#status/done`, `#status/ignored`.
- [ ] Map todo kind to tags: `#kind/continuity`, `#kind/research`, `#kind/revision`, `#kind/foreshadowing`, `#kind/payoff`, `#kind/style`, `#kind/source-check`.
- [ ] Map todo priority to tags: `#priority/high`, `#priority/medium`, `#priority/low`.
- [ ] Export all todos to `Tasks/All Tasks.md` with inline fields (`passage::`, `related::`, `source::`, `editor_id::`).
- [ ] Export category-specific task files: `Continuity Tasks.md`, `Research Tasks.md`, `Revision Tasks.md`.
- [ ] Generate optional Kanban board files in `Boards/` (`src/lib/export/obsidian/todos.ts`).
- [ ] Parse Markdown task lines on import (`src/lib/import/obsidian/todoParse.ts`).
- [ ] Parse task block IDs (`^todo-…`).
- [ ] Parse inline fields: `passage::`, `related::`, `source::`, `editor_id::`.
- [ ] Parse status/kind/priority tags.
- [ ] Parse `@due(YYYY-MM-DD)` dates.
- [ ] Parse completed checkbox state (`- [x]`).
- [ ] Match parsed todos to editor state by `editor_id::` first, then block ID.
- [ ] Update editor todo state from imported values (last-modified-wins for MVP; record conflict warnings).
- [ ] Round-trip test: export todos → modify one in Markdown → import → verify editor state updated.
- [ ] Unit tests for Markdown task serialization (all tag types, inline fields, block IDs).
- [ ] Unit tests for Markdown task parsing (completed, incomplete, missing fields, malformed lines).
- [ ] Fixture test for CardBoard-style task board compatibility (`tests/fixtures/cardboard-tasks/`).

---

## Phase 3D: Rename, Alias, and Change Control

> Support rename and merge change records in the codex so stable IDs and aliases survive display-name changes.

- [ ] Define `CodexChangeRecord` type (`src/lib/codex/changeRecords.ts`) supporting: `rename`, `merge`, `split`, `deprecate`, `alias-added`.
- [ ] Add utility to preserve aliases on rename — copies old canonical name to `aliases[]` and `renamed_from[]`.
- [ ] Export rename changelog records to `_changelog/Rename Log.md`.
- [ ] Export merge changelog records to `_changelog/Merge Log.md`.
- [ ] Import changelog records and apply to editor codex state.
- [ ] Apply imported rename records: update `aliases` non-destructively.
- [ ] Apply imported merge records as suggestions/warnings rather than automatic destructive merges.
- [ ] Unit test: "Yan Darn → Brin Flip" rename — verify alias preserved, changelog record generated, ID unchanged.
- [ ] Unit test: alias preservation round-trip (export → import → aliases intact).
- [ ] Unit test: changelog record round-trip (rename, merge).
- [ ] Unit test: malformed changelog YAML is reported, not fatal.

---

## Phase 3E: Documentation and Release Notes

> Update user-facing documentation only after all implementation tasks and tests pass.

- [ ] Update `README.md` with Obsidian vault support section.
- [ ] Update `DOCUMENTATION.md` with user workflows:
  - [ ] Exporting an Obsidian vault from an existing project.
  - [ ] Opening the exported vault in Obsidian.
  - [ ] Using generated templates for codex entries.
  - [ ] Using Dataview directory pages.
  - [ ] Using CardBoard-compatible task files.
  - [ ] Importing changed tasks/codex notes back into the editor.
- [ ] Add caveats: File System Access API browser support; Dataview/CardBoard/Kanban are optional plugins; the vault is plain Markdown without Obsidian.
- [ ] Add release notes entry for Phases 3A–3D.

