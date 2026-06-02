import { describe, it, expect } from 'vitest';
import { resolveWikilink, resolveWikilinkList } from './wikilinkParse';

describe('resolveWikilink', () => {
	it('strips brackets from a wikilink string', () => {
		expect(resolveWikilink('[[Elara]]')).toBe('Elara');
	});

	it('returns plain string unchanged', () => {
		expect(resolveWikilink('Elara')).toBe('Elara');
	});

	it('strips display text after pipe', () => {
		expect(resolveWikilink('[[Elara|the protagonist]]')).toBe('Elara');
	});

	it('returns empty string for null/undefined', () => {
		expect(resolveWikilink(null)).toBe('');
		expect(resolveWikilink(undefined)).toBe('');
	});

	it('returns empty string for empty input', () => {
		expect(resolveWikilink('')).toBe('');
	});
});

describe('resolveWikilinkList', () => {
	it('handles an array of wikilinks', () => {
		expect(resolveWikilinkList(['[[Elara]]', '[[Kael]]'])).toEqual(['Elara', 'Kael']);
	});

	it('handles a single string (comma-separated)', () => {
		expect(resolveWikilinkList('[[Elara]], [[Kael]]')).toEqual(['Elara', 'Kael']);
	});

	it('handles plain strings without brackets', () => {
		expect(resolveWikilinkList(['Elara', 'Kael'])).toEqual(['Elara', 'Kael']);
	});

	it('returns empty array for falsy input', () => {
		expect(resolveWikilinkList(null)).toEqual([]);
		expect(resolveWikilinkList(undefined)).toEqual([]);
		expect(resolveWikilinkList([])).toEqual([]);
	});
});
