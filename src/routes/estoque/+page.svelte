<script lang="ts">
	import {
		Plus,
		Search,
		Package,
		AlertTriangle,
		Edit,
		Trash2,
	} from "lucide-svelte";

	interface Part {
		id: number;
		name: string;
		sku: string;
		price: number;
		stock: number;
	}

	let searchQuery = $state("");
	let isModalOpen = $state(false);

	let parts = $state<Part[]>([]);
	let isLoading = $state(true);

	import { onMount } from "svelte";

	onMount(() => {
		loadParts();
	});

	function getAuthHeader(): Record<string, string> {
		const userStr = localStorage.getItem("user");
		if (userStr) {
			const user = JSON.parse(userStr);
			return { "x-user-id": user.username };
		}
		return {};
	}

	async function loadParts() {
		try {
			isLoading = true;
			const res = await fetch("/api/estoque", {
				headers: getAuthHeader(),
			});
			if (res.ok) {
				const data = await res.json();
				parts = data.parts;
			}
		} catch (e) {
			console.error("Erro ao carregar peças", e);
		} finally {
			isLoading = false;
		}
	}

	let filteredParts = $derived(
		parts.filter(
			(p) =>
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
		),
	);

	let editingId = $state<number | null>(null);
	let formData = $state<Omit<Part, "id">>({
		name: "",
		sku: "",
		price: 0,
		stock: 0,
	});

	function openModal(part: Part | null = null) {
		if (part) {
			editingId = part.id;
			formData = { ...part };
		} else {
			editingId = null;
			formData = { name: "", sku: "", price: 0, stock: 0 };
		}
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
	}

	async function savePart(e: Event) {
		e.preventDefault();
		try {
			const payload = editingId
				? { ...formData, id: editingId }
				: formData;
			const res = await fetch("/api/estoque", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...getAuthHeader(),
				},
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				await loadParts();
				closeModal();
			} else {
				const errorData = await res.json();
				alert(errorData.error || "Erro ao salvar peça.");
			}
		} catch (err) {
			console.error(err);
		}
	}

	async function deletePart(id: number) {
		if (confirm("Tem certeza que deseja excluir esta peça?")) {
			try {
				const res = await fetch(`/api/estoque?id=${id}`, {
					method: "DELETE",
					headers: getAuthHeader(),
				});
				if (res.ok) {
					await loadParts();
				}
			} catch (err) {
				console.error(err);
			}
		}
	}
</script>

<div class="max-w-7xl mx-auto">
	<div
		class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
	>
		<div>
			<h1 class="text-3xl font-bold text-slate-900 tracking-tight">
				Estoque de Peças
			</h1>
			<p class="text-slate-500">
				Controle de inventário e preços de venda
			</p>
		</div>
		<button
			onclick={() => openModal()}
			class="flex items-center gap-2 px-6 py-3 bg-emerald-primary text-white rounded-2xl hover:bg-emerald-hover transition-all font-bold shadow-xl shadow-emerald-primary/20"
		>
			<Plus size={20} />
			<span>Nova Peça</span>
		</button>
	</div>

	<!-- Search and Filter -->
	<div
		class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center gap-4"
	>
		<div class="relative flex-1">
			<Search
				class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
				size={18}
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Buscar por nome ou SKU..."
				class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-primary outline-none transition-all"
			/>
		</div>
	</div>

	<!-- Table -->
	<div
		class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
	>
		<div class="overflow-x-auto">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr class="bg-slate-50 border-b border-slate-100">
						<th
							class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"
							>Peça / SKU</th
						>
						<th
							class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"
							>Preço Unitário</th
						>
						<th
							class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"
							>Estoque</th
						>
						<th
							class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right"
							>Ações</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-50">
					{#if isLoading}
						<tr>
							<td
								colspan="4"
								class="px-6 py-8 text-center text-slate-400"
							>
								Carregando peças...
							</td>
						</tr>
					{:else if filteredParts.length === 0}
						<tr>
							<td
								colspan="4"
								class="px-6 py-8 text-center text-slate-400"
							>
								Nenhuma peça cadastrada.
							</td>
						</tr>
					{:else}
						{#each filteredParts as part}
							<tr
								class="hover:bg-slate-50/50 transition-colors group"
							>
								<td class="px-6 py-4">
									<p class="font-bold text-slate-800">
										{part.name}
									</p>
									<p
										class="text-xs font-mono text-slate-400 uppercase"
									>
										{part.sku}
									</p>
								</td>
								<td class="px-6 py-4 font-bold text-slate-700">
									R$ {part.price.toFixed(2)}
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center gap-2">
										<span
											class="font-bold {part.stock <= 5
												? 'text-red-500'
												: 'text-slate-700'}"
										>
											{part.stock} un
										</span>
										{#if part.stock <= 5}
											<div class="group/tip relative">
												<AlertTriangle
													size={14}
													class="text-red-500"
												/>
												<span
													class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tip:opacity-100 transition-opacity whitespace-nowrap"
												>
													Estoque Baixo!
												</span>
											</div>
										{/if}
									</div>
								</td>
								<td class="px-6 py-4 text-right">
									<div
										class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100"
									>
										<button
											onclick={() => openModal(part)}
											class="p-2 text-slate-400 hover:text-emerald-primary transition-colors"
											aria-label="Editar peça"
											title="Editar peça"
										>
											<Edit size={18} />
										</button>
										<button
											onclick={() => deletePart(part.id)}
											class="p-2 text-slate-400 hover:text-red-500 transition-colors"
											aria-label="Excluir peça"
											title="Excluir peça"
										>
											<Trash2 size={18} />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Modal -->
{#if isModalOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
		role="dialog"
		aria-modal="true"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeModal();
		}}
	>
		<div
			class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
		>
			<div
				class="bg-forest p-6 text-white flex justify-between items-center"
			>
				<h2 class="text-xl font-bold flex items-center gap-2">
					<Package size={24} />
					{editingId ? "Editar Peça" : "Cadastrar Peça"}
				</h2>
				<button
					type="button"
					onclick={closeModal}
					class="text-white/60 hover:text-white"
					aria-label="Fechar modal"
				>
					<Plus size={24} class="rotate-45" />
				</button>
			</div>
			<form onsubmit={savePart} class="p-8 space-y-4">
				<div>
					<label
						for="name"
						class="block text-sm font-bold text-slate-700 mb-1"
						>Nome da Peça</label
					>
					<input
						id="name"
						type="text"
						bind:value={formData.name}
						required
						class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-primary"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label
							for="sku"
							class="block text-sm font-bold text-slate-700 mb-1"
							>SKU / Código</label
						>
						<input
							id="sku"
							type="text"
							bind:value={formData.sku}
							required
							class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-primary"
						/>
					</div>
					<div>
						<label
							for="price"
							class="block text-sm font-bold text-slate-700 mb-1"
							>Preço de Venda</label
						>
						<input
							id="price"
							type="number"
							step="0.01"
							min="0"
							bind:value={formData.price}
							required
							class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-primary"
						/>
					</div>
				</div>
				<div>
					<label
						for="stock"
						class="block text-sm font-bold text-slate-700 mb-1"
						>{editingId ? "Estoque" : "Estoque Inicial"}</label
					>
					<input
						id="stock"
						type="number"
						min="0"
						bind:value={formData.stock}
						required
						class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-primary"
					/>
				</div>
				<div class="pt-4 flex gap-3">
					<button
						type="button"
						onclick={closeModal}
						class="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
						>Cancelar</button
					>
					<button
						type="submit"
						class="flex-1 py-3 bg-emerald-primary text-white font-bold rounded-xl hover:bg-emerald-hover transition-all shadow-lg shadow-emerald-primary/20"
					>
						{editingId ? "Salvar Alterações" : "Salvar Peça"}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
