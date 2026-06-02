import { browser } from '$app/environment';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface Annotation {
	id: string;
	recipeId: string;
	originalText: string;
	suggestion?: string;
	commentary: string;
	reasoning?: string;
	isIgnored?: boolean;
}

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}

export interface ReviewRecipe {
	id: string;
	title: string;
	prompt: string;
	isActive: boolean;
	tier: 'fast' | 'balanced' | 'deep';
	outputFormat: 'chat' | 'lints' | 'todos';
	color?: string;
	temperature?: number;
	maxTokens?: number;
	feedback?: string;
	isGenerating?: boolean;
	chatHistory?: ChatMessage[];
}

export interface ContextItem {
	id: string;
	title: string;
	content: string;
	/** Optional grouping type used for Obsidian vault export (e.g. 'character', 'location'). */
	type?: string;
}

export interface TodoItem {
	id: string;
	text: string;
	status: 'open' | 'completed' | 'ignored';
	source: 'user' | 'recipe' | 'lint';
	createdAt: number;
	color?: string;
	editorId?: string;
}

export interface SceneVersion {
	id: string;
	name: string;
	isFinalOutput: boolean;
	createdAt: number;
	objectivesText: string;
	todoList: TodoItem[];
	reviewRecipes: ReviewRecipe[];
	contextItems: ContextItem[];
	annotations: Annotation[];
}

export interface Scene {
	id: string;
	chapterNumber: number;
	sceneNumber: number;
	title: string;
	wordCount: number;
	versions: SceneVersion[];
	activeVersionId: string;
}

export interface Project {
	id: string;
	title: string;
	scenes: Scene[];
}

function makeFirstVersion(sceneId: string, data?: Partial<SceneVersion>): SceneVersion {
	return {
		id: sceneId, // version ID = scene ID preserves Yjs field 'scene-{id}'
		name: 'Version 1',
		isFinalOutput: false,
		createdAt: Date.now(),
		objectivesText: data?.objectivesText ?? '',
		todoList: data?.todoList ?? [],
		reviewRecipes: data?.reviewRecipes ?? [],
		contextItems: data?.contextItems ?? [],
		annotations: data?.annotations ?? []
	};
}

function migrateScene(raw: any): Scene {
	if (!raw.versions) {
		return {
			id: raw.id,
			chapterNumber: raw.chapterNumber,
			sceneNumber: raw.sceneNumber,
			title: raw.title,
			wordCount: raw.wordCount || 0,
			versions: [
				makeFirstVersion(raw.id, {
					objectivesText: raw.objectivesText,
					todoList: raw.todoList,
					reviewRecipes: raw.reviewRecipes,
					contextItems: raw.contextItems,
					annotations: raw.annotations
				})
			],
			activeVersionId: raw.id
		};
	}
	return raw as Scene;
}

const defaultSceneId = crypto.randomUUID();

export class DocumentState {
	project = $state<Project>({
		id: crypto.randomUUID(),
		title: 'Untitled Project',
		scenes: [
			{
				id: defaultSceneId,
				chapterNumber: 1,
				sceneNumber: 1,
				title: 'Scene 1',
				wordCount: 0,
				versions: [makeFirstVersion(defaultSceneId)],
				activeVersionId: defaultSceneId
			}
		]
	});

	activeSceneId = $state<string>(defaultSceneId);

	ydoc = new Y.Doc();
	provider: IndexeddbPersistence | null = null;
	isLoaded = $state(!browser);

	constructor() {
		if (browser) {
			this.provider = new IndexeddbPersistence('offline-ai-reviewer-doc', this.ydoc);
			this.provider.on('synced', () => {
				this.loadFromYjs();
				this.isLoaded = true;
				this.setupSync();
			});
		}
	}

	get activeScene(): Scene | undefined {
		return this.project.scenes.find((s) => s.id === this.activeSceneId);
	}

	get activeVersion(): SceneVersion | undefined {
		const scene = this.activeScene;
		if (!scene) return undefined;
		return scene.versions.find((v) => v.id === scene.activeVersionId);
	}

	private loadFromYjs() {
		const projectMap = this.ydoc.getMap('metadata');
		const savedProject = projectMap.get('project') as Project;
		if (savedProject) {
			savedProject.scenes = savedProject.scenes.map(migrateScene);
			this.project = savedProject;
			if (!this.project.scenes.find((s) => s.id === this.activeSceneId)) {
				this.activeSceneId = this.project.scenes[0]?.id ?? '';
			}
		} else {
			try {
				projectMap.set('project', $state.snapshot(this.project));
			} catch (e) {}
		}
	}

	async resetAll() {
		if (this.provider) {
			await this.provider.clearData();
		}
		localStorage.removeItem('ai-reviewer-profiles');
		localStorage.removeItem('ai-reviewer-debug');
		localStorage.removeItem('ai-reviewer-tiers');
		window.location.reload();
	}

	private setupSync() {
		let isSyncing = false;

		$effect.root(() => {
			$effect(() => {
				const snapshot = $state.snapshot(this.project);
				if (isSyncing) return;
				isSyncing = true;
				const projectMap = this.ydoc.getMap('metadata');
				try {
					projectMap.set('project', snapshot);
				} catch (e) {
					console.error('Yjs set error', e);
				}
				isSyncing = false;
			});
		});
	}
}

export const documentState = new DocumentState();
