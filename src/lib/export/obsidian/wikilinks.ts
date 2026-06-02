/**
 * Wraps a display name in Obsidian [[wikilink]] syntax.
 */
export function wikilink(displayName: string): string {
	return `[[${displayName}]]`;
}

/**
 * Converts an array of display names to wikilinks.
 */
export function wikilinkList(names: string[]): string {
	return names.map(wikilink).join(', ');
}

/**
 * Extracts all wikilink targets from a string.
 * e.g. "Trusts: [[Brin Flip]] and [[Marcus Vale]]" → ["Brin Flip", "Marcus Vale"]
 */
export function extractWikilinks(text: string): string[] {
	return [...text.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map((m) => m[1]);
}
