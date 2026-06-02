export interface ConflictReport {
	/** Notes whose `id` field already exists in the project under a different title. */
	duplicateIds: string[];
	/** Notes missing an `id` field in frontmatter (matched by title+type instead). */
	missingIds: string[];
	/** Notes with a `type` field not matching any known or registered type. */
	unknownTypes: string[];
	/** Files that could not be parsed as valid YAML frontmatter. */
	invalidFrontmatter: string[];
	/** Wikilink targets in the imported notes that do not resolve to any known note. */
	unresolvedWikilinks: string[];
}

export function emptyConflictReport(): ConflictReport {
	return {
		duplicateIds: [],
		missingIds: [],
		unknownTypes: [],
		invalidFrontmatter: [],
		unresolvedWikilinks: [],
	};
}

export function hasConflicts(report: ConflictReport): boolean {
	return Object.values(report).some((arr) => arr.length > 0);
}
