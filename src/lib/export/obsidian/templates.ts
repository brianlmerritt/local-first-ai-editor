import { toFrontmatter } from './frontmatter';

// Body section templates for known codex entry types.
// Unknown types fall back to a generic ## Notes body.
const BODIES: Record<string, string> = {
	character: `## One-line summary\n\n## Current state\n\n## What the reader knows\n\n## What the author knows\n\n## Relationships\n\n## Change log\n`,
	location: `## Description\n\n## Significance\n\n## Scenes set here\n\n## Notes\n`,
	faction: `## Description\n\n## Goals\n\n## Key members\n\n## Notes\n`,
	object: `## Description\n\n## Significance\n\n## Last known location\n\n## Notes\n`,
	thread: `## Summary\n\n## Status\n\n## Scenes\n\n## Open loops\n\n## Notes\n`,
	motif: `## Description\n\n## First appearance\n\n## Occurrences\n\n## Notes\n`,
	mystery: `## What is the mystery?\n\n## Clues planted\n\n## Resolution\n\n## Notes\n`,
	'open loop': `## Description\n\n## Planted in\n\n## Resolved in\n\n## Notes\n`,
	concept: `## Definition\n\n## Evidence\n\n## Related concepts\n\n## Notes\n`,
	claim: `## Claim\n\n## Evidence\n\n## Counter-evidence\n\n## Notes\n`,
	source: `## Citation\n\n## Key points\n\n## Relevance\n\n## Notes\n`,
	evidence: `## Description\n\n## Supports\n\n## Contradicts\n\n## Notes\n`,
	relationship: `## Description\n\n## Participants\n\n## Evolution\n\n## Notes\n`,
	symbol: `## Description\n\n## Occurrences\n\n## Interpretation\n\n## Notes\n`,
	scene: `## Writing Objectives\n\n## Scene Text\n\n## Scene Beats\n\n## Reader Knows\n\n## Author Knows\n\n## Tasks\n\n## Notes\n`,
};

/**
 * Generates a `_templates/<type>.md` file for a given codex entry type.
 * The template includes YAML frontmatter and body section headings.
 */
export function generateTemplate(type: string): string {
	const today = new Date().toISOString().slice(0, 10);
	const fm = toFrontmatter({
		id: `${type}-`,
		type,
		canonical_name: '',
		aliases: [],
		status: 'active',
		tags: [`codex/${type}`],
		created: today,
		updated: today,
	});
	const body = BODIES[type] ?? `## Notes\n`;
	return `${fm}\n# {{title}}\n\n${body}`;
}
