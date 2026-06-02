import * as Y from 'yjs';
import type { Project, ContextItem } from '$lib/state/document.svelte';
import { setYjsContent } from '$lib/utils/importer';
import { parseFrontmatter, extractSection } from './frontmatterParse';
import type { ObsidianScanResult } from './vaultScan';
import { emptyConflictReport, type ConflictReport } from './conflictReport';

// ─── Import options ───────────────────────────────────────────────────────────

export type ObsidianImportMode = 'overwrite' | 'fresh' | 'codex-only';

export interface ObsidianImportOptions {
	mode: ObsidianImportMode;
	codexNotes: boolean;
	sceneNotes: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function readText(fh: FileSystemFileHandle): Promise<string> {
	return (await fh.getFile()).text();
}

/**
 * Upsert a context item into a scene version's contextItems array.
 * Matching is by title + type. Updates content if found; appends if not.
 */
function upsertContextItem(
	contextItems: ContextItem[],
	incoming: ContextItem
): void {
	const idx = contextItems.findIndex(
		(c) =>
			c.title === incoming.title &&
			(c.type ?? undefined) === (incoming.type ?? undefined)
	);
	if (idx !== -1) {
		contextItems[idx] = { ...contextItems[idx], ...incoming };
	} else {
		contextItems.push(incoming);
	}
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Imports an Obsidian vault scan result into the editor's project state.
 *
 * - `codex-only`: imports context items from Codex notes; ignores scene text.
 * - `fresh`: clears all existing scenes before importing.
 * - `overwrite`: upserts into existing project state.
 *
 * Context items are broadcast to ALL scenes' active versions (upsert by title+type).
 * Scene notes update Writing Objectives + scene text (unless mode is `codex-only`).
 */
export async function importObsidianVault(
	root: FileSystemDirectoryHandle,
	scan: ObsidianScanResult,
	options: ObsidianImportOptions,
	project: Project,
	ydoc: Y.Doc
): Promise<ConflictReport> {
	const report = emptyConflictReport();

	if (options.mode === 'fresh') {
		project.id = crypto.randomUUID();
		project.scenes = [];
	}

	// ── Codex notes → context items ──────────────────────────────────────────
	if (options.codexNotes && scan.codexNotes.length > 0) {
		const incoming: ContextItem[] = [];

		for (const note of scan.codexNotes) {
			let raw: string;
			try {
				raw = await readText(note.handle);
			} catch {
				report.invalidFrontmatter.push(note.name);
				continue;
			}

			let meta: Record<string, unknown>;
			let body: string;
			try {
				({ meta, body } = parseFrontmatter(raw));
			} catch {
				report.invalidFrontmatter.push(note.name);
				continue;
			}

			// Derive the display name: prefer canonical_name, fall back to filename stem
			const canonicalName =
				typeof meta.canonical_name === 'string' && meta.canonical_name.trim()
					? meta.canonical_name.trim()
					: note.name.replace(/\.md$/, '');

			if (!meta.id) {
				report.missingIds.push(note.name);
			}

			// Strip the frontmatter header line and the H1 title line from the body;
			// the content starts after the first "# Title" heading.
			const contentBody = body
				.replace(/^#\s+.+\n+/, '')
				.trim();

			incoming.push({
				id: typeof meta.id === 'string' ? meta.id : crypto.randomUUID(),
				title: canonicalName,
				content: contentBody,
				type: note.type,
			});
		}

		// Broadcast to all scenes' active versions
		for (const scene of project.scenes) {
			const ver = scene.versions.find((v) => v.id === scene.activeVersionId);
			if (!ver) continue;
			for (const item of incoming) {
				upsertContextItem(ver.contextItems, item);
			}
		}
	}

	// ── Scene notes → scene text + writing objectives ────────────────────────
	if (options.sceneNotes && options.mode !== 'codex-only' && scan.sceneNotes.length > 0) {
		for (const note of scan.sceneNotes) {
			let raw: string;
			try {
				raw = await readText(note.handle);
			} catch {
				report.invalidFrontmatter.push(note.name);
				continue;
			}

			let meta: Record<string, unknown>;
			let body: string;
			try {
				({ meta, body } = parseFrontmatter(raw));
			} catch {
				report.invalidFrontmatter.push(note.name);
				continue;
			}

			// Parse chapter/scene from frontmatter; fall back to filename
			let ch = typeof meta.chapter === 'number' ? meta.chapter : NaN;
			let sc = typeof meta.scene === 'number' ? meta.scene : NaN;

			if (isNaN(ch) || isNaN(sc)) {
				// Try to parse from filename "Chapter 01 Scene 03.md"
				const m = note.name.match(/chapter\s+(\d+)\s+scene\s+(\d+)/i);
				if (m) {
					ch = Number(m[1]);
					sc = Number(m[2]);
				}
			}

			if (isNaN(ch) || isNaN(sc)) continue;

			// Find matching scene
			const scene = project.scenes.find(
				(s) => s.chapterNumber === ch && s.sceneNumber === sc
			);
			if (!scene) continue;

			const ver = scene.versions.find((v) => v.id === scene.activeVersionId);
			if (!ver) continue;

			// Writing Objectives
			const objectives = extractSection(body, 'Writing Objectives');
			if (objectives) ver.objectivesText = objectives;

			// Scene Text
			const sceneText = extractSection(body, 'Scene Text');
			if (sceneText) setYjsContent(ydoc, ver.id, sceneText);
		}
	}

	return report;
}
