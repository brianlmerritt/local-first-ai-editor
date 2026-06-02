import * as Y from 'yjs';
import type { Project, ContextItem } from '$lib/state/document.svelte';
import { yjsFragmentToMarkdown, slugify } from '$lib/utils/exporter';
import { toFrontmatter } from './frontmatter';
import { sanitizeFilename, sceneFilename, sceneSuffix, capitalize } from './filenames';
import { generateTemplate } from './templates';
import {
	generateDirectoryPage,
	generateSceneDirectoryPage,
	generateHomePage,
} from './directories';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ObsidianExportOptions {
	includeScenes: boolean;
	includeTemplates: boolean;
	includeDirectories: boolean;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface CollectedItem {
	item: ContextItem;
	chapterNumber: number;
	sceneNumber: number;
}

interface DedupGroup {
	type: string | undefined;
	title: string;
	/** hash → scenes that have this variant */
	variants: Map<string, CollectedItem[]>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** FNV-1a 32-bit hash, returned as a 6-char hex string. */
function fnv32(s: string): string {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619) >>> 0;
	}
	return h.toString(16).padStart(8, '0').slice(0, 6);
}

/** Deterministic stable ID for a codex entry. */
export function stableId(type: string | undefined, title: string, content: string): string {
	const prefix = type ? `${slugify(type)}-` : 'ctx-';
	return `${prefix}${slugify(title)}-${fnv32(title + content)}`;
}

async function writeFile(
	root: FileSystemDirectoryHandle,
	pathSegments: string[],
	filename: string,
	content: string
): Promise<void> {
	let dir: FileSystemDirectoryHandle = root;
	for (const seg of pathSegments) {
		dir = await dir.getDirectoryHandle(seg, { create: true });
	}
	const fh = await dir.getFileHandle(filename, { create: true });
	const writable = await fh.createWritable();
	await writable.write(content);
	await writable.close();
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * Collect context items from all scenes' active versions, grouped by (type, title).
 * Within each group, items are further grouped by content hash for deduplication.
 */
function collectAndDedup(project: Project): Map<string, DedupGroup> {
	const groups = new Map<string, DedupGroup>();

	for (const scene of project.scenes) {
		const ver = scene.versions.find((v) => v.id === scene.activeVersionId);
		if (!ver) continue;

		for (const item of ver.contextItems) {
			const key = `${item.type ?? ''}::${item.title}`;
			if (!groups.has(key)) {
				groups.set(key, { type: item.type, title: item.title, variants: new Map() });
			}
			const group = groups.get(key)!;
			const hash = fnv32(item.content);
			if (!group.variants.has(hash)) {
				group.variants.set(hash, []);
			}
			group.variants.get(hash)!.push({
				item,
				chapterNumber: scene.chapterNumber,
				sceneNumber: scene.sceneNumber,
			});
		}
	}

	return groups;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function exportObsidianVault(
	project: Project,
	ydoc: Y.Doc,
	options: ObsidianExportOptions
): Promise<void> {
	const root: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
		mode: 'readwrite',
	});

	const now = new Date().toISOString();
	const today = now.slice(0, 10);

	const groups = collectAndDedup(project);

	// Track unique types and the titles exported per type (for directory pages).
	const uniqueTypes = new Set<string>();
	// folderName is the capitalised type used as the Codex subfolder
	const folderByType = new Map<string, string>();
	const codexTitlesByType = new Map<string, string[]>();

	// ── Codex notes ──────────────────────────────────────────────────────────
	for (const [, group] of groups) {
		const { type, title, variants } = group;
		const folderName = type ? sanitizeFilename(capitalize(type)) : undefined;

		if (type) {
			uniqueTypes.add(type);
			folderByType.set(type, folderName!);
			if (!codexTitlesByType.has(type)) codexTitlesByType.set(type, []);
		}

		const pathSegs = folderName ? ['Codex', folderName] : ['Codex'];

		if (variants.size === 1) {
			// Single content hash → one deduplicated note
			const [[, scenes]] = [...variants.entries()];
			const representativeItem = scenes[0].item;
			const id = stableId(type, title, representativeItem.content);
			const filename = sanitizeFilename(title) + '.md';
			const fm = toFrontmatter({
				id,
				type: type ?? 'context',
				canonical_name: title,
				aliases: [],
				status: 'active',
				tags: [type ? `codex/${type}` : 'codex'],
				created: today,
				updated: today,
			});
			await writeFile(root, pathSegs, filename, `${fm}\n# ${title}\n\n${representativeItem.content}\n`);
			if (type) codexTitlesByType.get(type)!.push(title);
		} else {
			// Multiple content variants → one note per scene, with scene suffix
			for (const [, scenes] of variants.entries()) {
				for (const { item, chapterNumber, sceneNumber } of scenes) {
					const suffix = ' ' + sceneSuffix(chapterNumber, sceneNumber);
					const id = stableId(type, title + suffix, item.content);
					const filename = sanitizeFilename(title + suffix) + '.md';
					const fm = toFrontmatter({
						id,
						type: type ?? 'context',
						canonical_name: title,
						aliases: [],
						status: 'active',
						scene_source: `ch${String(chapterNumber).padStart(2, '0')}sc${String(sceneNumber).padStart(2, '0')}`,
						tags: [type ? `codex/${type}` : 'codex'],
						created: today,
						updated: today,
					});
					await writeFile(
						root,
						pathSegs,
						filename,
						`${fm}\n# ${title}${suffix}\n\n${item.content}\n`
					);
					if (type) codexTitlesByType.get(type)!.push(title + suffix);
				}
			}
		}
	}

	// ── Scene notes ──────────────────────────────────────────────────────────
	if (options.includeScenes) {
		for (const scene of project.scenes) {
			const ver = scene.versions.find((v) => v.id === scene.activeVersionId);
			if (!ver) continue;

			const text = yjsFragmentToMarkdown(ydoc.getXmlFragment('scene-' + ver.id));
			const sceneId = `scene-ch${String(scene.chapterNumber).padStart(2, '0')}-sc${String(scene.sceneNumber).padStart(2, '0')}`;
			const storyOrder = scene.chapterNumber * 100 + scene.sceneNumber;

			const fm = toFrontmatter({
				id: sceneId,
				type: 'scene',
				chapter: scene.chapterNumber,
				scene: scene.sceneNumber,
				story_order: storyOrder,
				title: scene.title,
				version_name: ver.name,
				is_final: ver.isFinalOutput,
				status: 'draft',
				exported: now,
			});

			const body = [
				`# ${scene.title}`,
				'',
				'## Writing Objectives',
				'',
				ver.objectivesText || '_No writing objectives set._',
				'',
				'## Scene Text',
				'',
				text || '_No content yet._',
				'',
			].join('\n');

			const filename = sceneFilename(scene.chapterNumber, scene.sceneNumber) + '.md';
			await writeFile(root, ['Scenes'], filename, `${fm}\n${body}`);
		}
	}

	// ── Templates ────────────────────────────────────────────────────────────
	if (options.includeTemplates) {
		for (const type of uniqueTypes) {
			await writeFile(root, ['_templates'], sanitizeFilename(type) + '.md', generateTemplate(type));
		}
		await writeFile(root, ['_templates'], 'scene.md', generateTemplate('scene'));
	}

	// ── 00 Index ─────────────────────────────────────────────────────────────
	if (options.includeDirectories) {
		const typeEntries = [...uniqueTypes].map((type) => ({
			type,
			folderName: `Codex/${folderByType.get(type) ?? capitalize(type)}`,
		}));

		await writeFile(
			root,
			['00 Index'],
			'Home.md',
			generateHomePage(typeEntries, project.scenes.length)
		);

		for (const { type, folderName } of typeEntries) {
			const titles = codexTitlesByType.get(type) ?? [];
			const filename = sanitizeFilename(capitalize(type)) + ' Directory.md';
			await writeFile(root, ['00 Index'], filename, generateDirectoryPage(type, folderName, titles));
		}

		if (options.includeScenes) {
			const sceneTitles = project.scenes.map((s) =>
				sceneFilename(s.chapterNumber, s.sceneNumber)
			);
			await writeFile(root, ['00 Index'], 'Scene Directory.md', generateSceneDirectoryPage(sceneTitles));
		}
	}
}
