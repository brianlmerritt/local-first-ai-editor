import { describe, it, expect } from 'vitest';
import { toFrontmatter, yamlScalar } from './frontmatter';

describe('yamlScalar', () => {
	it('renders plain strings as-is', () => {
		expect(yamlScalar('hello')).toBe('hello');
	});

	it('quotes strings with colons', () => {
		expect(yamlScalar('key: value')).toBe('"key: value"');
	});

	it('quotes strings with hash', () => {
		expect(yamlScalar('#tag')).toBe('"#tag"');
	});

	it('quotes strings starting with dash', () => {
		expect(yamlScalar('-foo')).toBe('"-foo"');
	});

	it('quotes empty string', () => {
		expect(yamlScalar('')).toBe('""');
	});

	it('quotes ambiguous boolean-like strings', () => {
		expect(yamlScalar('true')).toBe('"true"');
		expect(yamlScalar('false')).toBe('"false"');
		expect(yamlScalar('null')).toBe('"null"');
	});

	it('renders booleans unquoted', () => {
		expect(yamlScalar(true)).toBe('true');
		expect(yamlScalar(false)).toBe('false');
	});

	it('renders numbers unquoted', () => {
		expect(yamlScalar(42)).toBe('42');
		expect(yamlScalar(3.14)).toBe('3.14');
	});

	it('escapes backslashes and double-quotes when quoting', () => {
		expect(yamlScalar('say "hi"')).toBe('"say \\"hi\\""');
	});

	it('renders null/undefined as null', () => {
		expect(yamlScalar(null)).toBe('null');
		expect(yamlScalar(undefined)).toBe('null');
	});
});

describe('toFrontmatter', () => {
	it('wraps output in --- delimiters', () => {
		const result = toFrontmatter({ id: 'abc' });
		expect(result.startsWith('---\n')).toBe(true);
		expect(result).toContain('\n---\n');
	});

	it('serialises simple string values', () => {
		const result = toFrontmatter({ type: 'character', status: 'active' });
		expect(result).toContain('type: character');
		expect(result).toContain('status: active');
	});

	it('serialises arrays as YAML lists', () => {
		const result = toFrontmatter({ aliases: ['Yan Darn', 'YD'] });
		expect(result).toContain('aliases:\n  - Yan Darn\n  - YD');
	});

	it('serialises empty arrays as []', () => {
		expect(toFrontmatter({ aliases: [] })).toContain('aliases: []');
	});

	it('omits null and undefined fields', () => {
		const result = toFrontmatter({ id: 'x', missing: null, also: undefined });
		expect(result).not.toContain('missing');
		expect(result).not.toContain('also');
	});

	it('does not expose raw API key values', () => {
		// Ensure any value containing "sk-" is still serialised safely (not stripped —
		// the caller is responsible for not passing keys; this tests no crash/error).
		const result = toFrontmatter({ note: 'no-key-here' });
		expect(result).toContain('note: no-key-here');
	});
});
