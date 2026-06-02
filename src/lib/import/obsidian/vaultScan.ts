// ─── Reserved folder names ────────────────────────────────────────────────────

/**
 * Folder names (lowercase) that are handled by specific import logic and must NOT
 * be treated as dynamic context item categories.
 *
 * Underscore-prefixed: structural/metadata folders.
 * Non-prefixed: system-generated content folders.
 */
export const RESERVED_FOLDERS = new Set([
	'00 index',
	'scenes',
	'chapters',
	'tasks',
	'boards',
	'_templates',
	'_changelog',
	'_ai',
	'_exports',
	'codex', // handled separately by Codex/ subfolder scan
]);

export function isReserved(name: string): boolean {
	return RESERVED_FOLDERS.has(name.toLowerCase());
}

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ObsidianCodexNote {
	handle: FileSystemFileHandle;
	name: string;
	/** Lowercase type derived from the containing folder name. */
	type: string | undefined;
}

export interface ObsidianSceneNote {
	handle: FileSystemFileHandle;
	name: string;
}

export interface ObsidianScanResult {
	isVault: boolean;
	codexNotes: ObsidianCodexNote[];
	sceneNotes: ObsidianSceneNote[];
	templateFiles: FileSystemFileHandle[];
	changelogFiles: FileSystemFileHandle[];
	/** Folder names that were not recognised as reserved or Codex subfolders. */
	unknownFolders: string[];
	/** Count of codex notes grouped by type. */
	codexCountByType: Record<string, number>;
}

// ─── Scanner ──────────────────────────────────────────────────────────────────

async function listMdFiles(
	dir: FileSystemDirectoryHandle
): Promise<FileSystemFileHandle[]> {
	const files: FileSystemFileHandle[] = [];
	for await (const [name, entry] of (dir as any).entries()) {
		if (entry.kind === 'file' && name.endsWith('.md')) {
			files.push(entry as FileSystemFileHandle);
		}
	}
	return files;
}

/**
 * Scans a directory to detect and inventory an Obsidian-compatible vault.
 *
 * Detection heuristic: the folder is considered a vault when it contains
 * `Codex/`, `_templates/`, or both `00 Index/` and `Scenes/`.
 */
export async function scanObsidianVault(
	root: FileSystemDirectoryHandle
): Promise<ObsidianScanResult> {
	const result: ObsidianScanResult = {
		isVault: false,
		codexNotes: [],
		sceneNotes: [],
		templateFiles: [],
		changelogFiles: [],
		unknownFolders: [],
		codexCountByType: {},
	};

	// Collect top-level entry names for vault detection
	const topLevel = new Map<string, FileSystemHandle>();
	for await (const [name, entry] of (root as any).entries()) {
		topLevel.set(name.toLowerCase(), entry as FileSystemHandle);
		topLevel.set(name, entry as FileSystemHandle); // preserve original case too
	}

	const hasCodex = topLevel.has('codex') || topLevel.has('Codex');
	const hasTemplates = topLevel.has('_templates');
	const hasIndex = topLevel.has('00 index') || topLevel.has('00 Index');
	const hasScenes = topLevel.has('scenes') || topLevel.has('Scenes');

	result.isVault = hasCodex || hasTemplates || (hasIndex && hasScenes);
	if (!result.isVault) return result;

	// ── Codex/ subfolders ────────────────────────────────────────────────────
	const codexHandle = (topLevel.get('Codex') ?? topLevel.get('codex')) as
		| FileSystemDirectoryHandle
		| undefined;

	if (codexHandle) {
		for await (const [typeFolderName, typeEntry] of (codexHandle as any).entries()) {
			if ((typeEntry as FileSystemHandle).kind === 'directory') {
				const typeDir = await codexHandle.getDirectoryHandle(typeFolderName);
				const type = typeFolderName.toLowerCase();
				for await (const [fileName, fileEntry] of (typeDir as any).entries()) {
					if ((fileEntry as FileSystemHandle).kind === 'file' && fileName.endsWith('.md')) {
						result.codexNotes.push({
							handle: fileEntry as FileSystemFileHandle,
							name: fileName,
							type,
						});
						result.codexCountByType[type] = (result.codexCountByType[type] ?? 0) + 1;
					}
				}
			} else if (
				(typeEntry as FileSystemHandle).kind === 'file' &&
				typeFolderName.endsWith('.md')
			) {
				// Flat file directly in Codex/ — no type
				result.codexNotes.push({
					handle: typeEntry as FileSystemFileHandle,
					name: typeFolderName,
					type: undefined,
				});
				const key = '(flat)';
				result.codexCountByType[key] = (result.codexCountByType[key] ?? 0) + 1;
			}
		}
	}

	// ── Scenes/ ──────────────────────────────────────────────────────────────
	const scenesHandle = (topLevel.get('Scenes') ?? topLevel.get('scenes')) as
		| FileSystemDirectoryHandle
		| undefined;

	if (scenesHandle) {
		for (const fh of await listMdFiles(scenesHandle)) {
			result.sceneNotes.push({ handle: fh, name: (await fh.getFile()).name });
		}
	}

	// ── _templates/ ──────────────────────────────────────────────────────────
	const tmplHandle = topLevel.get('_templates') as FileSystemDirectoryHandle | undefined;
	if (tmplHandle) {
		result.templateFiles = await listMdFiles(tmplHandle);
	}

	// ── _changelog/ ──────────────────────────────────────────────────────────
	const changelogHandle = topLevel.get('_changelog') as FileSystemDirectoryHandle | undefined;
	if (changelogHandle) {
		result.changelogFiles = await listMdFiles(changelogHandle);
	}

	// ── Unknown non-reserved top-level folders → dynamic context types ───────
	for await (const [name, entry] of (root as any).entries()) {
		if ((entry as FileSystemHandle).kind !== 'directory') continue;
		if (isReserved(name)) continue;
		if (name.toLowerCase() === 'codex') continue;

		result.unknownFolders.push(name);

		const subDir = await root.getDirectoryHandle(name);
		const type = name.toLowerCase();
		for await (const [fileName, fileEntry] of (subDir as any).entries()) {
			if ((fileEntry as FileSystemHandle).kind === 'file' && fileName.endsWith('.md')) {
				result.codexNotes.push({
					handle: fileEntry as FileSystemFileHandle,
					name: fileName,
					type,
				});
				result.codexCountByType[type] = (result.codexCountByType[type] ?? 0) + 1;
			}
		}
	}

	return result;
}
