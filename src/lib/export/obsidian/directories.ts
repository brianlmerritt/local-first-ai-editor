import { capitalize } from './filenames';

/**
 * Generates a `00 Index/<Type> Directory.md` with a Dataview code block
 * and a plain-Markdown fallback list for use without the Dataview plugin.
 */
export function generateDirectoryPage(type: string, folderName: string, titles: string[]): string {
	const label = capitalize(type);
	const plain = titles.length
		? titles.map((t) => `- [[${t}]]`).join('\n')
		: '_No entries yet._';

	return [
		`# ${label} Directory`,
		'',
		'```dataview',
		`TABLE canonical_name AS "Name", status, aliases`,
		`FROM "${folderName}"`,
		`WHERE type = "${type}"`,
		'SORT canonical_name ASC',
		'```',
		'',
		'---',
		'',
		'*Plain list (visible without Dataview):*',
		'',
		plain,
		'',
	].join('\n');
}

/**
 * Generates `00 Index/Scene Directory.md`.
 */
export function generateSceneDirectoryPage(titles: string[]): string {
	const plain = titles.length
		? titles.map((t) => `- [[${t}]]`).join('\n')
		: '_No scenes exported._';

	return [
		'# Scene Directory',
		'',
		'```dataview',
		'TABLE chapter, scene, title, status',
		'FROM "Scenes"',
		'WHERE type = "scene"',
		'SORT story_order ASC',
		'```',
		'',
		'---',
		'',
		'*Plain list (visible without Dataview):*',
		'',
		plain,
		'',
	].join('\n');
}

/**
 * Generates `00 Index/Home.md`.
 */
export function generateHomePage(
	typeEntries: { type: string; folderName: string }[],
	sceneCount: number
): string {
	const codexLinks = typeEntries.length
		? typeEntries.map(({ type }) => `- [[${capitalize(type)} Directory]]`).join('\n')
		: '_No codex entries yet._';

	return [
		'# Project Index',
		'',
		'## Codex',
		'',
		codexLinks,
		'',
		'## Scenes',
		'',
		`${sceneCount} scene${sceneCount !== 1 ? 's' : ''} exported. See [[Scene Directory]].`,
		'',
	].join('\n');
}
