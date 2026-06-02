/**
 * Sanitise a string for use as an Obsidian-compatible filename.
 * Removes characters forbidden on major file systems, collapses whitespace,
 * and truncates to 100 characters.
 */
export function sanitizeFilename(name: string): string {
	return (
		name
			.replace(/[/\\:*?"<>|#^[\]]/g, '')
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 100) || 'Untitled'
	);
}

/**
 * Canonical scene filename, e.g. "Chapter 01 Scene 03".
 */
export function sceneFilename(chapterNumber: number, sceneNumber: number): string {
	const ch = String(chapterNumber).padStart(2, '0');
	const sc = String(sceneNumber).padStart(2, '0');
	return `Chapter ${ch} Scene ${sc}`;
}

/**
 * Short scene suffix for collision disambiguation, e.g. "(ch01sc03)".
 */
export function sceneSuffix(chapterNumber: number, sceneNumber: number): string {
	const ch = String(chapterNumber).padStart(2, '0');
	const sc = String(sceneNumber).padStart(2, '0');
	return `(ch${ch}sc${sc})`;
}

/**
 * Capitalise the first letter of a string (used for folder names).
 */
export function capitalize(s: string): string {
	return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
