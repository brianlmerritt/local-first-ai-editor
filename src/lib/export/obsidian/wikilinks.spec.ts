import { describe, it, expect } from 'vitest';
import { wikilink, wikilinkList, extractWikilinks } from './wikilinks';

describe('wikilink', () => {
	it('wraps name in double brackets', () => {
		expect(wikilink('Elara')).toBe('[[Elara]]');
	});

	it('handles names with spaces', () => {
		expect(wikilink('The Iron Keep')).toBe('[[The Iron Keep]]');
	});
});

describe('wikilinkList', () => {
	it('returns empty string for empty array', () => {
		expect(wikilinkList([])).toBe('');
	});

	it('joins multiple links with comma-space', () => {
		expect(wikilinkList(['Elara', 'Kael'])).toBe('[[Elara]], [[Kael]]');
	});

	it('returns single link without trailing comma', () => {
		expect(wikilinkList(['Solo'])).toBe('[[Solo]]');
	});
});

describe('extractWikilinks', () => {
	it('returns empty array for text without wikilinks', () => {
		expect(extractWikilinks('plain text')).toEqual([]);
	});

	it('extracts single wikilink', () => {
		expect(extractWikilinks('see [[Elara]] for details')).toEqual(['Elara']);
	});

	it('extracts multiple wikilinks', () => {
		expect(extractWikilinks('[[Elara]] and [[Kael]] met at [[The Keep]]')).toEqual([
			'Elara',
			'Kael',
			'The Keep'
		]);
	});

	it('strips display text after pipe', () => {
		expect(extractWikilinks('[[Elara|the protagonist]]')).toEqual(['Elara']);
	});
});
