import { describe, it, expect } from 'vitest';
import { parseFrontmatter, extractSection } from './frontmatterParse';

describe('parseFrontmatter', () => {
	it('parses simple key-value frontmatter', () => {
		const text = `---\ntype: character\nstatus: active\n---\nBody text here.`;
		const { meta, body } = parseFrontmatter(text);
		expect(meta.type).toBe('character');
		expect(meta.status).toBe('active');
		expect(body.trim()).toBe('Body text here.');
	});

	it('returns empty meta and full text when no frontmatter block present', () => {
		const text = 'No frontmatter at all.';
		const { meta, body } = parseFrontmatter(text);
		expect(meta).toEqual({});
		expect(body).toBe(text);
	});

	it('parses YAML list values as arrays', () => {
		const text = `---\naliases:\n  - Alias One\n  - Alias Two\n---\nBody.`;
		const { meta } = parseFrontmatter(text);
		expect(meta.aliases).toEqual(['Alias One', 'Alias Two']);
	});

	it('parses inline YAML arrays', () => {
		const text = `---\ntags: [fiction, draft]\n---\nBody.`;
		const { meta } = parseFrontmatter(text);
		expect(Array.isArray(meta.tags)).toBe(true);
	});

	it('handles quoted string values', () => {
		const text = `---\ntitle: "My: Title"\n---\nBody.`;
		const { meta } = parseFrontmatter(text);
		expect(meta.title).toBe('My: Title');
	});
});

describe('extractSection', () => {
	it('returns content under a heading', () => {
		const body = `## Writing Objectives\nWrite a gripping opening.\n\n## Scene Text\nShe ran.`;
		expect(extractSection(body, 'Writing Objectives').trim()).toBe('Write a gripping opening.');
	});

	it('returns empty string when heading is missing', () => {
		const body = `## Other Section\nContent.`;
		expect(extractSection(body, 'Writing Objectives')).toBe('');
	});

	it('strips placeholder text', () => {
		const body = `## Writing Objectives\n_No writing objectives set._\n\n## Scene Text\n_No content yet._`;
		expect(extractSection(body, 'Writing Objectives').trim()).toBe('');
		expect(extractSection(body, 'Scene Text').trim()).toBe('');
	});

	it('stops at the next heading', () => {
		const body = `## Writing Objectives\nParagraph one.\n\nParagraph two.\n\n## Scene Text\nExtra.`;
		const result = extractSection(body, 'Writing Objectives').trim();
		expect(result).toContain('Paragraph one.');
		expect(result).not.toContain('Extra.');
	});
});
