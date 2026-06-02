import { describe, it, expect } from 'vitest';
import { sanitizeFilename, sceneFilename, sceneSuffix, capitalize } from './filenames';

describe('sanitizeFilename', () => {
	it('passes through clean filenames', () => {
		expect(sanitizeFilename('My Chapter')).toBe('My Chapter');
	});

	it('strips invalid filesystem characters', () => {
		expect(sanitizeFilename('title: "sub"')).not.toMatch(/[:"]/);
	});

	it('trims leading and trailing whitespace', () => {
		const r = sanitizeFilename('  hello world  ');
		expect(r).toBe('hello world');
	});

	it('returns "Untitled" for empty result', () => {
		expect(sanitizeFilename('   ')).toBe('Untitled');
		expect(sanitizeFilename(':::')).toBe('Untitled');
	});
});

describe('sceneFilename', () => {
	it('formats chapter and scene with two-digit padding', () => {
		expect(sceneFilename(1, 3)).toBe('Chapter 01 Scene 03');
		expect(sceneFilename(10, 12)).toBe('Chapter 10 Scene 12');
	});
});

describe('sceneSuffix', () => {
	it('returns parenthesised short suffix', () => {
		expect(sceneSuffix(1, 3)).toBe('(ch01sc03)');
		expect(sceneSuffix(10, 12)).toBe('(ch10sc12)');
	});
});

describe('capitalize', () => {
	it('uppercases first letter', () => {
		expect(capitalize('character')).toBe('Character');
		expect(capitalize('open loop')).toBe('Open loop');
	});

	it('handles empty string', () => {
		expect(capitalize('')).toBe('');
	});
});
