/**
 * Serialises a record to Obsidian-compatible YAML frontmatter.
 * Produces human-readable YAML (not JSON.stringify'd values).
 */
export function toFrontmatter(fields: Record<string, unknown>): string {
	const lines = ['---'];
	for (const [k, v] of Object.entries(fields)) {
		if (v === undefined || v === null) continue;
		lines.push(serializeField(k, v));
	}
	lines.push('---', '');
	return lines.join('\n');
}

function serializeField(key: string, value: unknown): string {
	if (Array.isArray(value)) {
		if (value.length === 0) return `${key}: []`;
		return `${key}:\n${value.map((v) => `  - ${yamlScalar(v)}`).join('\n')}`;
	}
	return `${key}: ${yamlScalar(value)}`;
}

/**
 * Serialises a scalar to a YAML-safe string.
 * Adds double-quotes when the value is ambiguous or contains special characters.
 */
export function yamlScalar(v: unknown): string {
	if (v === null || v === undefined) return 'null';
	if (typeof v === 'boolean') return String(v);
	if (typeof v === 'number') return String(v);
	const s = String(v);
	const needsQuote =
		s === '' ||
		/^(true|false|null|~|yes|no|on|off)$/i.test(s) ||
		/^\s|\s$/.test(s) ||
		s.startsWith('-') ||
		s.startsWith('#') ||
		/[:#\[\]{},|>&*?!%@`'"\\]/.test(s);
	if (needsQuote) {
		return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
	}
	return s;
}
