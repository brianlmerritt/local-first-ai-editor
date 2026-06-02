<script lang="ts">
	import { documentState } from '$lib/state/document.svelte';
	import { settingsState } from '$lib/state/settings.svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import {
		scanImportFolder,
		importFromFolder,
		type ScanResult,
		type ImportOptions
	} from '$lib/utils/importer';
	import { scanObsidianVault, type ObsidianScanResult } from '$lib/import/obsidian/vaultScan';
	import {
		importObsidianVault,
		type ObsidianImportMode,
		type ObsidianImportOptions
	} from '$lib/import/obsidian/vaultImport';
	import { X, Upload, FolderOpen, AlertTriangle, CheckCircle, BookOpen } from 'lucide-svelte';

	type Step = 'mode' | 'scan' | 'done' | 'error';

	let step = $state<Step>('mode');
	let mode = $state<'fresh' | 'overwrite' | 'codex-only'>('overwrite');
	let scan = $state<ScanResult | null>(null);
	let vaultScan = $state<ObsidianScanResult | null>(null);
	let isScanning = $state(false);
	let isImporting = $state(false);
	let errorMsg = $state('');

	let options = $state<ImportOptions>({
		mode: 'overwrite',
		story: true,
		versions: true,
		recipes: true,
		todos: true,
		context: true,
		historyChat: true,
		historyTodo: true,
		settings: false
	});

	let vaultOptions = $state<ObsidianImportOptions>({
		mode: 'overwrite',
		codexNotes: true,
		sceneNotes: true
	});

	// Keep vaultOptions.mode in sync with the selected mode
	$effect(() => {
		vaultOptions.mode = mode as ObsidianImportMode;
	});

	function close() {
		uiState.showImportModal = false;
		step = 'mode';
		scan = null;
		vaultScan = null;
		errorMsg = '';
	}

	async function pickFolder() {
		isScanning = true;
		errorMsg = '';
		try {
			const root: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({ mode: 'read' });

			// Run both scans concurrently
			const [regularResult, obsidianResult] = await Promise.all([
				scanImportFolder(root),
				scanObsidianVault(root)
			]);

			vaultScan = obsidianResult;

			if (obsidianResult.isVault) {
				// Obsidian vault detected — use vault import path
				if (!Object.keys(obsidianResult.codexCountByType).length) vaultOptions.codexNotes = false;
				if (!obsidianResult.sceneNotes.length) vaultOptions.sceneNotes = false;
			} else {
				// Regular export folder
				scan = regularResult;
				options.mode = mode as 'fresh' | 'overwrite';
				if (!regularResult.storyFiles.length) options.story = false;
				if (!regularResult.versionFiles.length) options.versions = false;
				if (!regularResult.recipeFiles.length) options.recipes = false;
				if (!regularResult.todoFiles.length) options.todos = false;
				if (!regularResult.contextFiles.length) options.context = false;
				if (!regularResult.chatHistoryFiles.length) options.historyChat = false;
				if (!regularResult.todoHistoryFiles.length) options.historyTodo = false;
				if (!regularResult.settingsFile) options.settings = false;
			}

			step = 'scan';
			rootHandle = root;
		} catch (e: any) {
			if (e.name !== 'AbortError') errorMsg = e.message || 'Failed to read folder.';
		} finally {
			isScanning = false;
		}
	}

	let rootHandle: FileSystemDirectoryHandle | null = null;

	async function doImport() {
		if (!rootHandle) return;
		isImporting = true;
		errorMsg = '';
		try {
			if (vaultScan?.isVault) {
				await importObsidianVault(
					rootHandle,
					vaultScan,
					vaultOptions,
					documentState.project,
					documentState.ydoc
				);
			} else if (scan) {
				await importFromFolder(
					rootHandle,
					scan,
					{ ...options, mode: mode as 'fresh' | 'overwrite' },
					documentState.project,
					documentState.ydoc,
					settingsState
				);
			}
			// Point activeSceneId at first scene if the current one is gone
			const ids = documentState.project.scenes.map((s) => s.id);
			if (!ids.includes(documentState.activeSceneId)) {
				documentState.activeSceneId = ids[0] ?? '';
			}
			step = 'done';
		} catch (e: any) {
			errorMsg = e.message || 'Import failed.';
		} finally {
			isImporting = false;
		}
	}

	const count = (arr: any[]) => arr.length;

	const findings = $derived(
		scan && !vaultScan?.isVault
			? [
					{ key: 'story', label: 'Story files', n: count(scan.storyFiles) },
					{ key: 'versions', label: 'Version files', n: count(scan.versionFiles) },
					{ key: 'recipes', label: 'Recipe files', n: count(scan.recipeFiles) },
					{ key: 'todos', label: 'Todo files', n: count(scan.todoFiles) },
					{ key: 'context', label: 'Context board files', n: count(scan.contextFiles) },
					{ key: 'historyChat', label: 'Chat history files', n: count(scan.chatHistoryFiles) },
					{ key: 'historyTodo', label: 'Completed todo files', n: count(scan.todoHistoryFiles) },
					{ key: 'settings', label: 'Settings', n: scan.settingsFile ? 1 : 0 }
				]
			: []
	);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm"
	onclick={(e) => { if (e.target === e.currentTarget) close(); }}
>
	<div
		class="animate-in fade-in zoom-in-95 flex max-h-[85vh] w-[520px] max-w-[90vw] flex-col overflow-hidden rounded-xl bg-white shadow-2xl duration-200"
	>
		<!-- Header -->
		<header class="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4">
			<div class="flex items-center gap-2">
				<Upload size={18} class="text-indigo-600" />
				<h2 class="text-lg font-bold tracking-tight text-zinc-800">Import Project</h2>
			</div>
			<button
				onclick={close}
				class="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
			>
				<X size={20} />
			</button>
		</header>

		<div class="flex-1 overflow-y-auto p-6">

			{#if step === 'mode'}
				<!-- Step 1: choose mode -->
				<p class="mb-5 text-sm text-zinc-500">
					Choose how to import. You'll then pick a folder — either a regular project export or an Obsidian-compatible vault.
				</p>

				<div class="space-y-3">
					<label class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors {mode === 'overwrite' ? 'border-indigo-300 bg-indigo-50' : 'border-zinc-200 hover:border-zinc-300'}">
						<input type="radio" bind:group={mode} value="overwrite" class="mt-0.5 text-indigo-600" />
						<div>
							<div class="text-sm font-semibold text-zinc-800">Overwrite</div>
							<div class="text-xs text-zinc-500">
								Match scenes by chapter/scene number. Existing scenes are overwritten; new ones are added. Best for restoring a backup into the same project.
							</div>
						</div>
					</label>

					<label class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors {mode === 'fresh' ? 'border-indigo-300 bg-indigo-50' : 'border-zinc-200 hover:border-zinc-300'}">
						<input type="radio" bind:group={mode} value="fresh" class="mt-0.5 text-indigo-600" />
						<div>
							<div class="text-sm font-semibold text-zinc-800">Start Fresh</div>
							<div class="text-xs text-zinc-500">
								Clears all existing scenes before importing. Use this to load a completely different project.
							</div>
						</div>
					</label>

					<label class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors {mode === 'codex-only' ? 'border-indigo-300 bg-indigo-50' : 'border-zinc-200 hover:border-zinc-300'}">
						<input type="radio" bind:group={mode} value="codex-only" class="mt-0.5 text-indigo-600" />
						<div>
							<div class="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
								<BookOpen size={13} class="text-indigo-500" /> Codex Only
							</div>
							<div class="text-xs text-zinc-500">
								Import context items from an Obsidian vault without replacing manuscript text. Useful for syncing codex notes back into the editor.
							</div>
						</div>
					</label>
				</div>

				{#if mode === 'fresh'}
					<div class="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
						<AlertTriangle size={14} class="mt-0.5 shrink-0" />
						<span>All current scenes will be permanently removed. Consider exporting first.</span>
					</div>
				{/if}

				{#if errorMsg}
					<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">{errorMsg}</div>
				{/if}

			{:else if step === 'scan'}
				{#if vaultScan?.isVault}
					<!-- Obsidian vault findings -->
					<div class="mb-4 flex items-center gap-2">
						<BookOpen size={15} class="text-indigo-500" />
						<p class="text-sm font-semibold text-zinc-700">Obsidian vault detected</p>
					</div>
					<p class="mb-4 text-sm text-zinc-500">Choose what to import from the vault.</p>

					{@const totalCodex = Object.values(vaultScan.codexCountByType).reduce((a, b) => a + b, 0)}
					<div class="space-y-1.5">
						<label class="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors {totalCodex === 0 ? 'opacity-40' : 'hover:border-indigo-200 hover:bg-indigo-50/30'} {vaultOptions.codexNotes && totalCodex > 0 ? 'border-indigo-200 bg-indigo-50/50' : ''}">
							<input
								type="checkbox"
								bind:checked={vaultOptions.codexNotes}
								disabled={totalCodex === 0}
								class="h-4 w-4 rounded border-zinc-300 text-indigo-600"
							/>
							<span class="flex-1 text-sm font-medium text-zinc-800">Codex notes</span>
							<span class="text-xs text-zinc-400">{totalCodex} note{totalCodex !== 1 ? 's' : ''}</span>
						</label>

						<label class="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors {vaultScan.sceneNotes.length === 0 || mode === 'codex-only' ? 'opacity-40' : 'hover:border-indigo-200 hover:bg-indigo-50/30'} {vaultOptions.sceneNotes && vaultScan.sceneNotes.length > 0 && mode !== 'codex-only' ? 'border-indigo-200 bg-indigo-50/50' : ''}">
							<input
								type="checkbox"
								bind:checked={vaultOptions.sceneNotes}
								disabled={vaultScan.sceneNotes.length === 0 || mode === 'codex-only'}
								class="h-4 w-4 rounded border-zinc-300 text-indigo-600"
							/>
							<span class="flex-1 text-sm font-medium text-zinc-800">
								Scene notes
								{#if mode === 'codex-only'}<span class="ml-1 text-xs text-zinc-400">(skipped in Codex Only mode)</span>{/if}
							</span>
							<span class="text-xs text-zinc-400">{vaultScan.sceneNotes.length} file{vaultScan.sceneNotes.length !== 1 ? 's' : ''}</span>
						</label>
					</div>

					{#if Object.keys(vaultScan.codexCountByType).length > 0}
						<div class="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
							<p class="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Codex notes by type</p>
							<div class="space-y-0.5">
								{#each Object.entries(vaultScan.codexCountByType) as [type, n]}
									<div class="flex justify-between text-xs text-zinc-600">
										<span class="capitalize">{type}</span>
										<span class="text-zinc-400">{n}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if vaultScan.unknownFolders.length > 0}
						<div class="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
							<span class="font-semibold">Dynamic context folders detected:</span>
							{vaultScan.unknownFolders.join(', ')}
						</div>
					{/if}
				{:else}
					<!-- Regular export findings -->
					<p class="mb-4 text-sm text-zinc-500">Found the following in the selected folder. Choose what to import.</p>

					<div class="space-y-1.5">
						{#each findings as item}
							{@const disabled = item.n === 0}
							<label class="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors {disabled ? 'opacity-40' : 'hover:border-indigo-200 hover:bg-indigo-50/30'} {!disabled && (options as any)[item.key] ? 'border-indigo-200 bg-indigo-50/50' : ''}">
								<input
									type="checkbox"
									bind:checked={(options as any)[item.key]}
									disabled={disabled}
									class="h-4 w-4 rounded border-zinc-300 text-indigo-600"
								/>
								<span class="flex-1 text-sm font-medium text-zinc-800">{item.label}</span>
								<span class="text-xs text-zinc-400">{item.n} file{item.n !== 1 ? 's' : ''}</span>
							</label>
						{/each}
					</div>

					{#if options.settings}
						<div class="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
							<AlertTriangle size={14} class="mt-0.5 shrink-0" />
							<span>API keys in imported settings are obfuscated — you will need to re-enter them after import.</span>
						</div>
					{/if}
				{/if}

				{#if errorMsg}
					<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">{errorMsg}</div>
				{/if}

			{:else if step === 'done'}
				<div class="flex flex-col items-center gap-3 py-6 text-center">
					<CheckCircle size={40} class="text-green-500" />
					<p class="text-sm font-semibold text-zinc-800">Import complete.</p>
					<p class="text-xs text-zinc-500">Your project has been updated. The page will reflect the changes immediately.</p>
				</div>

			{:else if step === 'error'}
				<div class="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">{errorMsg}</div>
			{/if}

		</div>

		<!-- Footer -->
		<footer class="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4">
			{#if step === 'mode'}
				<span class="text-xs text-zinc-400">Step 1 of 2</span>
				<button
					onclick={pickFolder}
					disabled={isScanning}
					class="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-40"
				>
					<FolderOpen size={15} />
					{isScanning ? 'Scanning…' : 'Choose Folder'}
				</button>

			{:else if step === 'scan'}
				<button
					onclick={() => { step = 'mode'; scan = null; vaultScan = null; }}
					class="text-xs text-zinc-500 hover:text-zinc-800"
				>
					Back
				</button>
				<button
					onclick={doImport}
					disabled={isImporting || (vaultScan?.isVault ? !vaultOptions.codexNotes && !vaultOptions.sceneNotes : !Object.entries(options).some(([k, v]) => k !== 'mode' && v))}
					class="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-40"
				>
					<Upload size={15} />
					{isImporting ? 'Importing…' : 'Import'}
				</button>

			{:else}
				<span></span>
				<button
					onclick={close}
					class="rounded-md bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
				>
					Close
				</button>
			{/if}
		</footer>
	</div>
</div>
