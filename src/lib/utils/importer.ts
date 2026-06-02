import { marked } from 'marked';
import * as Y from 'yjs';
import type { Project, Scene, SceneVersion, ReviewRecipe, TodoItem } from '$lib/state/document.svelte';
import type { SettingsState } from '$lib/state/settings.svelte';

// ─── Frontmatter parser ───────────────────────────────────────────────────────

function parseFrontmatter(text: string): { meta: Record<string, any>; body: string } {
	const match = text.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
	if (!match) return { meta: {}, body: text };
	const meta: Record<string, any> = {};
	for (const line of match[1].split('\n')) {
		const colon = line.indexOf(': ');
		if (colon === -1) continue;
		const key = line.slice(0, colon).trim();
		const val = line.slice(colon + 2).trim();
		try { meta[key] = JSON.parse(val); } catch { meta[key] = val; }
	}
	return { meta, body: match[2] };
}

// ─── Markdown → Yjs ──────────────────────────────────────────────────────────

function inlineDomToYText(el: Element): Y.XmlText {
	const yText = new Y.XmlText();
	let offset = 0;

	function processNode(node: Node, marks: Record<string, any> = {}) {
		if (node.nodeType === Node.TEXT_NODE) {
			const content = node.textContent || '';
			if (content) {
				yText.insert(offset, content, Object.keys(marks).length ? marks : undefined);
				offset += content.length;
			}
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const elem = node as Element;
			const tag = elem.tagName.toLowerCase();
			const newMarks = { ...marks };
			if (tag === 'strong' || tag === 'b') newMarks.bold = true;
			if (tag === 'em' || tag === 'i') newMarks.italic = true;
			if (tag === 'code') newMarks.code = true;
			if (tag === 's' || tag === 'del') newMarks.strike = true;
			for (const child of Array.from(elem.childNodes)) {
				processNode(child, newMarks);
			}
		}
	}

	for (const child of Array.from(el.childNodes)) processNode(child);
	return yText;
}

function domToYxml(parentDom: Element, parentY: Y.XmlElement | Y.XmlFragment) {
	for (const child of Array.from(parentDom.childNodes)) {
		if (child.nodeType !== Node.ELEMENT_NODE) continue;
		const el = child as Element;
		const tag = el.tagName.toLowerCase();

		if (tag === 'p') {
			const para = new Y.XmlElement('paragraph');
			para.push([inlineDomToYText(el)]);
			parentY.push([para]);
		} else if (/^h[1-6]$/.test(tag)) {
			const heading = new Y.XmlElement('heading');
			heading.setAttribute('level', tag[1]);
			heading.push([inlineDomToYText(el)]);
			parentY.push([heading]);
		} else if (tag === 'ul') {
			const list = new Y.XmlElement('bulletList');
			for (const li of Array.from(el.children)) {
				const listItem = new Y.XmlElement('listItem');
				const para = new Y.XmlElement('paragraph');
				para.push([inlineDomToYText(li)]);
				listItem.push([para]);
				list.push([listItem]);
			}
			parentY.push([list]);
		} else if (tag === 'ol') {
			const list = new Y.XmlElement('orderedList');
			for (const li of Array.from(el.children)) {
				const listItem = new Y.XmlElement('listItem');
				const para = new Y.XmlElement('paragraph');
				para.push([inlineDomToYText(li)]);
				listItem.push([para]);
				list.push([listItem]);
			}
			parentY.push([list]);
		} else if (tag === 'blockquote') {
			const bq = new Y.XmlElement('blockquote');
			domToYxml(el, bq);
			parentY.push([bq]);
		} else if (tag === 'pre') {
			const codeEl = el.querySelector('code');
			const codeBlock = new Y.XmlElement('codeBlock');
			const yText = new Y.XmlText();
			yText.insert(0, (codeEl ?? el).textContent || '');
			codeBlock.push([yText]);
			parentY.push([codeBlock]);
		} else if (tag === 'hr') {
			parentY.push([new Y.XmlElement('horizontalRule')]);
		}
	}
}

export function setYjsContent(ydoc: Y.Doc, versionId: string, markdown: string) {
	const html = marked(markdown) as string;
	const dom = new DOMParser().parseFromString(html, 'text/html');
	const fragment = ydoc.getXmlFragment('scene-' + versionId);
	ydoc.transact(() => {
		while (fragment.length > 0) fragment.delete(0, 1);
		domToYxml(dom.body, fragment);
	});
}

// ─── Folder scanner ───────────────────────────────────────────────────────────

export interface ScannedFile {
	handle: FileSystemFileHandle;
	name: string;
}

export interface ScanResult {
	storyFiles: ScannedFile[];
	versionFiles: ScannedFile[];
	recipeFiles: ScannedFile[];
	todoFiles: ScannedFile[];
	contextFiles: ScannedFile[];
	chatHistoryFiles: ScannedFile[];
	lintHistoryFiles: ScannedFile[];
	todoHistoryFiles: ScannedFile[];
	settingsFile: FileSystemFileHandle | null;
}

async function collectDir(root: FileSystemDirectoryHandle, ...path: string[]): Promise<ScannedFile[]> {
	try {
		let dir: FileSystemDirectoryHandle = root;
		for (const seg of path) dir = await dir.getDirectoryHandle(seg);
		const files: ScannedFile[] = [];
		for await (const [name, entry] of (dir as any).entries()) {
			if (entry.kind === 'file' && (name.endsWith('.md') || name.endsWith('.json')))
				files.push({ handle: entry as FileSystemFileHandle, name });
		}
		return files.sort((a, b) => a.name.localeCompare(b.name));
	} catch {
		return [];
	}
}

export async function scanImportFolder(root: FileSystemDirectoryHandle): Promise<ScanResult> {
	const [storyFiles, versionFiles, recipeFiles, todoFiles, contextFiles, chatHistoryFiles, lintHistoryFiles, todoHistoryFiles] =
		await Promise.all([
			collectDir(root, 'Story'),
			collectDir(root, 'Version'),
			collectDir(root, 'Recipe'),
			collectDir(root, 'Todo'),
			collectDir(root, 'Context'),
			collectDir(root, 'History', 'Chat'),
			collectDir(root, 'History', 'Lint'),
			collectDir(root, 'History', 'Todo')
		]);

	let settingsFile: FileSystemFileHandle | null = null;
	try {
		const settingsDir = await root.getDirectoryHandle('Settings');
		settingsFile = await settingsDir.getFileHandle('settings.json');
	} catch {}

	return { storyFiles, versionFiles, recipeFiles, todoFiles, contextFiles, chatHistoryFiles, lintHistoryFiles, todoHistoryFiles, settingsFile };
}

// ─── Scene / version helpers ──────────────────────────────────────────────────

function findOrCreateScene(project: Project, ch: number, sc: number): Scene {
	let scene = project.scenes.find((s) => s.chapterNumber === ch && s.sceneNumber === sc);
	if (!scene) {
		const id = crypto.randomUUID();
		scene = {
			id,
			chapterNumber: ch,
			sceneNumber: sc,
			title: `Chapter ${ch} Scene ${sc}`,
			wordCount: 0,
			versions: [],
			activeVersionId: ''
		};
		project.scenes.push(scene);
		project.scenes.sort((a, b) => a.chapterNumber - b.chapterNumber || a.sceneNumber - b.sceneNumber);
	}
	return scene;
}

function ensureVersion(scene: Scene, index: number, name: string, isFinal: boolean): SceneVersion {
	while (scene.versions.length <= index) {
		const id = scene.versions.length === 0 ? scene.id : crypto.randomUUID();
		scene.versions.push({
			id,
			name: `Version ${scene.versions.length + 1}`,
			isFinalOutput: false,
			createdAt: Date.now(),
			objectivesText: '',
			todoList: [],
			reviewRecipes: [],
			contextItems: [],
			annotations: []
		});
	}
	const v = scene.versions[index];
	if (name) v.name = name;
	v.isFinalOutput = isFinal;
	if (!scene.activeVersionId) scene.activeVersionId = v.id;
	return v;
}

// ─── Import options ───────────────────────────────────────────────────────────

export interface ImportOptions {
	mode: 'fresh' | 'overwrite';
	story: boolean;
	versions: boolean;
	recipes: boolean;
	todos: boolean;
	context: boolean;
	historyChat: boolean;
	historyTodo: boolean;
	settings: boolean;
}

// ─── Main import ──────────────────────────────────────────────────────────────

async function readText(fh: FileSystemFileHandle): Promise<string> {
	return (await fh.getFile()).text();
}

export async function importFromFolder(
	root: FileSystemDirectoryHandle,
	scan: ScanResult,
	options: ImportOptions,
	project: Project,
	ydoc: Y.Doc,
	settingsState: SettingsState
): Promise<void> {
	if (options.mode === 'fresh') {
		project.id = crypto.randomUUID();
		project.scenes = [];
	}

	// ── Text content ──────────────────────────────────────────────────────────
	// Version files take precedence over Story files (they have positional info)
	const textFiles: ScannedFile[] = [];
	if (options.versions && scan.versionFiles.length) textFiles.push(...scan.versionFiles);
	else if (options.story) textFiles.push(...scan.storyFiles);

	for (const f of textFiles) {
		const raw = await readText(f.handle);
		const { meta, body } = parseFrontmatter(raw);
		const ch = Number(meta.chapter ?? 1);
		const sc = Number(meta.scene ?? 1);
		const vi = Number(meta.version ?? 1) - 1;
		const scene = findOrCreateScene(project, ch, sc);
		if (meta.scene_title) scene.title = meta.scene_title;
		const version = ensureVersion(scene, vi, meta.version_name || '', meta.is_final === true);
		setYjsContent(ydoc, version.id, body);
	}

	// Ensure all scenes have a valid activeVersionId
	for (const scene of project.scenes) {
		if (!scene.versions.find((v) => v.id === scene.activeVersionId))
			scene.activeVersionId = scene.versions[0]?.id ?? '';
	}

	// ── Recipes ───────────────────────────────────────────────────────────────
	if (options.recipes) {
		for (const f of scan.recipeFiles) {
			const raw = await readText(f.handle);
			const { meta, body } = parseFrontmatter(raw);
			const ch = Number(meta.chapter ?? 1);
			const sc = Number(meta.scene ?? 1);
			const scene = project.scenes.find((s) => s.chapterNumber === ch && s.sceneNumber === sc);
			if (!scene) continue;
			const ver = scene.versions.find((v) => v.id === scene.activeVersionId);
			if (!ver) continue;
			try {
				const recipes = JSON.parse(body) as Omit<ReviewRecipe, 'id' | 'feedback' | 'isGenerating' | 'chatHistory'>[];
				ver.reviewRecipes = recipes.map((r) => ({
					...r,
					id: crypto.randomUUID(),
					feedback: '',
					isGenerating: false,
					chatHistory: []
				}));
			} catch {}
		}
	}

	// ── Todos ─────────────────────────────────────────────────────────────────
	if (options.todos) {
		for (const f of scan.todoFiles) {
			const raw = await readText(f.handle);
			const { meta, body } = parseFrontmatter(raw);
			const ch = Number(meta.chapter ?? 1);
			const sc = Number(meta.scene ?? 1);
			const scene = project.scenes.find((s) => s.chapterNumber === ch && s.sceneNumber === sc);
			if (!scene) continue;
			const ver = scene.versions.find((v) => v.id === scene.activeVersionId);
			if (!ver) continue;
			const open: TodoItem[] = [];
			for (const line of body.split('\n')) {
				const m = line.match(/^- (\[[ ~]\]) \[(\w+)\] (.+)$/);
				if (!m) continue;
				open.push({
					id: crypto.randomUUID(),
					text: m[3],
					status: m[1] === '[~]' ? 'ignored' : 'open',
					source: m[2] as any,
					createdAt: Date.now()
				});
			}
			ver.todoList = [...open, ...ver.todoList.filter((t) => t.status === 'completed')];
		}
	}

	// ── Context items ─────────────────────────────────────────────────────────
	if (options.context) {
		for (const f of scan.contextFiles) {
			const raw = await readText(f.handle);
			const { meta, body } = parseFrontmatter(raw);
			const ch = Number(meta.chapter ?? 1);
			const sc = Number(meta.scene ?? 1);
			const scene = project.scenes.find((s) => s.chapterNumber === ch && s.sceneNumber === sc);
			if (!scene) continue;
			const ver = scene.versions.find((v) => v.id === scene.activeVersionId);
			if (!ver) continue;
			try {
				const data = JSON.parse(body);
				if (Array.isArray(data)) {
					ver.contextItems = data;
				} else {
					if (typeof data.objectivesText === 'string') ver.objectivesText = data.objectivesText;
					if (Array.isArray(data.contextItems)) ver.contextItems = data.contextItems;
				}
			} catch {}
		}
	}

	// ── Chat history ──────────────────────────────────────────────────────────
	if (options.historyChat) {
		for (const f of scan.chatHistoryFiles) {
			const raw = await readText(f.handle);
			const { meta, body } = parseFrontmatter(raw);
			const ch = Number(meta.chapter ?? 1);
			const sc = Number(meta.scene ?? 1);
			const vi = Number(meta.version ?? 1) - 1;
			const scene = project.scenes.find((s) => s.chapterNumber === ch && s.sceneNumber === sc);
			if (!scene || vi >= scene.versions.length) continue;
			const ver = scene.versions[vi];
			const recipe = ver.reviewRecipes.find((r) => r.title === meta.recipe_title);
			if (!recipe) continue;
			recipe.chatHistory = body
				.split('\n\n---\n\n')
				.map((block) => ({
					id: crypto.randomUUID(),
					role: (block.startsWith('**User:**') ? 'user' : 'assistant') as 'user' | 'assistant',
					content: block.replace(/^\*\*(User|Assistant):\*\*\n\n/, ''),
					timestamp: Date.now()
				}))
				.filter((m) => m.content.trim());
		}
	}

	// ── Completed todo history ────────────────────────────────────────────────
	if (options.historyTodo) {
		for (const f of scan.todoHistoryFiles) {
			const raw = await readText(f.handle);
			const { meta, body } = parseFrontmatter(raw);
			const ch = Number(meta.chapter ?? 1);
			const sc = Number(meta.scene ?? 1);
			const vi = Number(meta.version ?? 1) - 1;
			const scene = project.scenes.find((s) => s.chapterNumber === ch && s.sceneNumber === sc);
			if (!scene || vi >= scene.versions.length) continue;
			const ver = scene.versions[vi];
			const completed: TodoItem[] = [];
			for (const line of body.split('\n')) {
				const m = line.match(/^- \[x\] \[(\w+)\] (.+)$/);
				if (!m) continue;
				completed.push({
					id: crypto.randomUUID(),
					text: m[2],
					status: 'completed',
					source: m[1] as any,
					createdAt: Date.now()
				});
			}
			ver.todoList = [...ver.todoList.filter((t) => t.status !== 'completed'), ...completed];
		}
	}

	// ── Settings ──────────────────────────────────────────────────────────────
	if (options.settings && scan.settingsFile) {
		const raw = await readText(scan.settingsFile);
		try {
			const data = JSON.parse(raw);
			if (Array.isArray(data.profiles)) settingsState.profiles = data.profiles;
			if (data.tiers) settingsState.tiers = data.tiers;
			if (typeof data.debugAiCalls === 'boolean') settingsState.debugAiCalls = data.debugAiCalls;
		} catch {}
	}
}
