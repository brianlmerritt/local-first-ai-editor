/**
 * Resolves a single wikilink field value to its plain display name.
 * Input may be "[[Brin Flip]]" or just "Brin Flip" — both return "Brin Flip".
 */
export function resolveWikilink(value: unknown): string {
	if (typeof value !== 'string') return '';
	const m = value.match(/^\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/);
	return m ? m[1] : value;
}

/**
 * Resolves an array of wikilink values to plain display names, filtering empties.
 */
export function resolveWikilinkList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map(resolveWikilink).filter(Boolean) as string[];
	}
	if (typeof value === 'string' && value.trim()) {
		// Handle comma-separated string like "[[Elara]], [[Kael]]"
		return value
			.split(',')
			.map((s) => resolveWikilink(s.trim()))
			.filter(Boolean) as string[];
	}
	return [];
}

/**
 * Extracts all wikilink targets from arbitrary text.
 * e.g. "See [[Brin Flip]] and [[Meridian Archive]]" → ["Brin Flip", "Meridian Archive"]
 */
export function extractWikilinksFromText(text: string): string[] {
	return [...text.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1]);
}
