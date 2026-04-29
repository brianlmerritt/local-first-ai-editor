<script lang="ts">
	import { uiState } from '$lib/state/ui.svelte';
	import { documentState } from '$lib/state/document.svelte';

	import Header from '$lib/components/Header.svelte';
	import ExplorerPanel from '$lib/components/ExplorerPanel.svelte';
	import ReviewPanel from '$lib/components/ReviewPanel.svelte';
	import ChatPanel from '$lib/components/ChatPanel.svelte';
	import ContextPanel from '$lib/components/ContextPanel.svelte';
	import VersionsPanel from '$lib/components/VersionsPanel.svelte';
	import Tiptap from '$lib/components/Tiptap.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import ExportModal from '$lib/components/ExportModal.svelte';
	import ImportModal from '$lib/components/ImportModal.svelte';
</script>

<main class="flex h-screen w-full flex-col overflow-hidden bg-zinc-50 font-sans text-zinc-900">
	<div class="grid shrink-0 grid-cols-3 items-center border-b border-zinc-200 bg-white px-4 py-2 shadow-sm">
		<div></div>
		<span class="text-center text-2xl font-semibold tracking-wide text-blue-800">Local First AI Editor</span>
		<div class="flex justify-end">
		<a
			href="https://github.com/brianlmerritt/local-first-ai-editor/blob/main/DOCUMENTATION.md"
			target="_blank"
			rel="noopener noreferrer"
			class="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
		>
			Documentation
		</a>
		</div>
	</div>

	<div class="flex min-h-0 flex-1 overflow-hidden">
	{#if documentState.isLoaded}
		{#if uiState.showExplorer}
			<ExplorerPanel />
		{/if}

		<section
			class="relative z-10 flex min-w-[400px] flex-1 flex-col overflow-hidden bg-white shadow-sm"
		>
			<Header />

			{#if uiState.showVersionsPanel}
				<VersionsPanel />
			{/if}

			<div class="w-full flex-1 overflow-y-auto">
				<div class="w-full px-8 py-16 sm:px-12 md:px-16">
					<Tiptap />
				</div>
			</div>
		</section>

		{#if uiState.showReviewPanel}
			<ReviewPanel />
		{/if}

		{#if uiState.activeChatRecipeId}
			<ChatPanel />
		{/if}

		{#if uiState.showContextBoard}
			<ContextPanel />
		{/if}
	{:else}
		<div class="flex h-full w-full items-center justify-center">
			<p class="pb-20 font-medium text-zinc-500">Loading Project...</p>
		</div>
	{/if}

	{#if uiState.showSettings}
		<SettingsModal />
	{/if}

	{#if uiState.showExportModal}
		<ExportModal />
	{/if}

	{#if uiState.showImportModal}
		<ImportModal />
	{/if}
	</div>
</main>
