# Local First Editor with AIReviewer

An AI powered, browser-native, privacy-first writing application. This platform shifts AI usage from "write this for me and lose my voice in the process" to "help me review and improve my writing". It acts as a semantic linter for your prose, with in document commentary, a todo list, plus chapter and scene navigation.

It operates entirely client-side without a backend runtime server. It utilizes local browser storage (IndexedDB) for secure, offline-first saving, and standard AI API endpoints to provide context-aware critiques without altering your base manuscript unless explicitly approved.

## 🛠 Tech Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/) (Configured for Static/SPA deployment)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & Typography/Forms plugins
- **Editor Engine:** [Tiptap](https://tiptap.dev/) (Headless wrapper for ProseMirror)
- **State & Offline Storage:** [Yjs](https://yjs.dev/) + `y-indexeddb`
- **Icons:** [Lucide-Svelte](https://lucide.dev/guide/packages/lucide-svelte)
- **Testing:** Vitest (Unit/Component) & Playwright (E2E)

---

## Getting Started (for Users)

[DOCUMENTATION](https://github.com/brianlmerritt/local-first-ai-editor/blob/main/DOCUMENTATION.md)

##  Getting Started (Development)

### Prerequisites

- Node.js (v18 or higher recommended)
- NPM (or pnpm/yarn)

### Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### Development

Start the development server with Hot Module Replacement (HMR):

```bash
npm run dev

# Or start the server and automatically open it in your browser
npm run dev -- --open
```

---

## 🏗 Building for Production

The app ships in two pre-configured branches. Check out the correct branch for your hosting target, then build — no manual config changes or package installs needed.

```bash
npm run build
npm run preview   # preview the build locally
```

---

### Mode 1 — Pure Static Hosting · `main` branch

**Branch:** `main`  
**Targets:** GitHub Pages, Cloudflare Pages (static), any CDN, local file server

The `main` branch uses `adapter-static` and outputs pure HTML/CSS/JS to `build/`. There is no server-side proxy; the AI client (`callAI`) calls the AI provider directly from the browser.

```bash
git checkout main
npm run build   # outputs to build/
```

Note this page is pushed up to github automatically using github actions and you can use it there [Test this out here](https://brianlmerritt.github.io/local-first-ai-editor/)

Upload the `build/` directory to your static host of choice.

> **Note:** API keys are sent directly from the browser to the AI provider. All supported providers (OpenAI, OpenRouter, Ollama) accept browser-direct requests. Keys are stored only in your browser's `localStorage` — they are never sent to any server you operate and are never exported in the settings.

---

### Mode 2 — Serverless Deployment · `deploy_with_server` branch

**Branch:** `deploy_with_server`  
**Targets:** Vercel, Cloudflare Pages (with Functions), Netlify

The `deploy_with_server` branch uses `adapter-auto` and includes the SvelteKit server route at `/api/ai/review`, which acts as a CORS proxy. `callAI` routes all AI requests through this proxy, keeping API keys out of browser network logs.

```bash
git checkout deploy_with_server
npm run build   # adapter-auto outputs the correct format for the detected platform
```

Push this branch to Vercel, Cloudflare Pages, or Netlify. The platform is detected automatically and no further configuration is required.

---

## 🧪 Testing and Linting

This project is configured with comprehensive testing suites.

**Run Unit & Component Tests (Vitest):**

```bash
npm run test:unit
```

**Run End-to-End Tests (Playwright):**

```bash
npm run test:e2e
```

**Run Linter (ESLint) & Formatter (Prettier):**

```bash
npm run lint
npm run format
```

---

## Phase 1 Roadmap (MVP)

- [x] Scaffold SvelteKit project with TypeScript, Tailwind, and testing suites.
- [x] Install core dependencies (Tiptap, Yjs, Lucide).
- [x] **Layout:** Build the responsive, ultrawide 4-column UI shell.
- [x] **Editor:** Implement the base `Tiptap.svelte` component with standard Markdown shortcuts.
- [x] **Persistence:** Integrate Yjs with `y-indexeddb` to ensure document state survives page reloads natively.
- [x] **Context Management:** Build Svelte Stores for managing the "Context Board" (Characters, Story So Far, Writing Objectives).
- [x] **AI Integration:** Implement the standard `/v1/chat/completions` API fetch logic (BYOK - Bring Your Own Key).
- [x] **Review Logic:** Build the `ContextStore` prompt assembly (combining active recipes, context board, and scene text).
- [x] **Critique UI:** Integrate a selection-based annotation system (e.g., `tiptap-comment-extension`) to anchor AI feedback to specific paragraphs.

---

## Phase 2 Roadmap (Beta) — Complete

- [x] **Enhance Editor:** Justification, strike-through, code text, text highlights, task lists, undo/redo, and tables via Tiptap.
- [x] **AI Recipes & ToDos UX:** Recipe-specific highlight colors, drag-and-drop reordering, scrollbar fixes, and background pattern tracking from Lint to ToDo.
- [x] **Selection-based ToDos:** Dynamic binding of selected editor text to manual ToDos with gray annotations.
- [x] **AI Chat Panel:** Conversational AI panel with per-recipe chat history, scene text context, and streaming responses.
- [x] **Complex Recipe Builder UI:** Temperature slider, max tokens selector, and output format controls per recipe.
- [x] **Versioning:** Full scene versioning system — named versions, Final Output marker, clone/delete, per-version recipes/todos/context/chat history.
- [x] **Export (File System Access API):** Export story, scenes, versions, recipes, todos, context board, chat/lint/todo histories, and settings to structured folders with YAML frontmatter. API keys obfuscated on export.
- [x] **Import (File System Access API):** Import from an exported folder in Overwrite or Start Fresh mode. Folder scan shows findings per category; per-item checkboxes control what is imported.

---

## Phase 3 Roadmap

- [ ] **Configurable CODEX:** Expand the current Context Board for scenes into a full CODEX system with Top Level, Chapter, and Scene/Section
- [ ] **Integrate CODEX:** Add support for lightRAG and integrate the existing TODO system
- [ ] **Agentic editing support:** Everything is agentic these days - add support for Agentic editing / linting / todo / continuity.
- [ ] **Multi-story support:** Add ability to open, switch between, and manage multiple independent projects.
- [ ] **In-Editor AI:** Adding `/` commands or bubble menus into the editor (e.g. `/reword`, `/check_story`).
- [ ] **Inline Diff/Tracked Changes:** Inline rewrites and diff views (using tools like `prosemirror-multi-editor-diff` or Tiptap Snapshots) for applying AI suggestions directly.
- [ ] **WebGPU / Local Browser AI:** Support downloading quantized models via WebLLM or Transformers.js for fully local offline AI generation.
- [ ] **Beta Release:** Configure build pipelines and publish the compiled application for public Beta Testing.

---

## Editor Working View

![Local First AI Editor](docs/Local_First_AI_Editor-Example.png)

---

## Example story to import with AI reviews

I wrote Moon Dark as a writing contest for [Reddit WritingWithAI](https://www.reddit.com/r/WritingWithAI/)

I realised the quality of the other stories were high, but I wanted to rewrite this in my own voice rather than have so I built Local First AI Editor.

In the webpage, you can import this story with versions and see the prompts and chat I had to look at the story and work out a rewrite plan.

[Download Starter Story — Moon Dark Example](https://github.com/brianlmerritt/local-first-ai-editor/releases/download/examples-v1/moon_dark_example_import.zip)

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

_Developed for a distraction-free, privacy-first writing experience._
