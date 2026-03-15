<script lang="ts">
	import { Plus, Search, Wrench, Edit, Trash2 } from "lucide-svelte";

	interface Service {
		id: number;
		description: string;
		price: number;
	}

	let searchQuery = $state("");
	let isModalOpen = $state(false);

	let services = $state<Service[]>([]);
	let isLoading = $state(true);

	import { onMount } from "svelte";

	onMount(() => {
		loadServices();
	});

	function getAuthHeader(): Record<string, string> {
		const userStr = localStorage.getItem("user");
		if (userStr) {
			const user = JSON.parse(userStr);
			return { "x-user-id": user.username };
		}
		return {};
	}

	async function loadServices() {
		try {
			isLoading = true;
			const res = await fetch("/api/servicos", {
				headers: getAuthHeader(),
			});
			if (res.ok) {
				const data = await res.json();
				services = data.services;
			}
		} catch (e) {
			console.error("Erro ao carregar serviços", e);
		} finally {
			isLoading = false;
		}
	}

	let filteredServices = $derived(
		services.filter((s) =>
			s.description.toLowerCase().includes(searchQuery.toLowerCase()),
		),
	);

	let editingId = $state<number | null>(null);
	let formData = $state<Omit<Service, "id">>({
		description: "",
		price: 0,
	});

	function openModal(service: Service | null = null) {
		if (service) {
			editingId = service.id;
			formData = { ...service };
		} else {
			editingId = null;
			formData = { description: "", price: 0 };
		}
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
	}

	async function saveService(e: Event) {
		e.preventDefault();
		try {
			const payload = editingId
				? { ...formData, id: editingId }
				: formData;
			const res = await fetch("/api/servicos", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...getAuthHeader(),
				},
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				await loadServices();
				closeModal();
			} else {
				const errorData = await res.json();
				alert(errorData.error || "Erro ao salvar serviço.");
			}
		} catch (err) {
			console.error(err);
		}
	}

	async function deleteService(id: number) {
		if (confirm("Tem certeza que deseja excluir este serviço?")) {
			try {
				const res = await fetch(`/api/servicos?id=${id}`, {
					method: "DELETE",
					headers: getAuthHeader(),
				});
				if (res.ok) {
					await loadServices();
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
				Catálogo de Serviços
			</h1>
			<p class="text-slate-500">Gestão de serviços e tabelas de preços</p>
		</div>
		<button
			onclick={() => openModal()}
			class="flex items-center gap-2 px-6 py-3 bg-emerald-primary text-white rounded-2xl hover:bg-emerald-hover transition-all font-bold shadow-xl shadow-emerald-primary/20"
		>
			<Plus size={20} />
			<span>Novo Serviço</span>
		</button>
	</div>

	<!-- Search -->
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
				placeholder="Buscar por descrição..."
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
							>Descrição do Serviço</th
						>
						<th
							class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"
							>Preço Base</th
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
								colspan="3"
								class="px-6 py-8 text-center text-slate-400"
							>
								Carregando serviços...
							</td>
						</tr>
					{:else if filteredServices.length === 0}
						<tr>
							<td
								colspan="3"
								class="px-6 py-8 text-center text-slate-400"
							>
								Nenhum serviço cadastrado.
							</td>
						</tr>
					{:else}
						{#each filteredServices as service}
							<tr
								class="hover:bg-slate-50/50 transition-colors group"
							>
								<td class="px-6 py-4 font-bold text-slate-800">
									{service.description}
								</td>
								<td class="px-6 py-4 font-bold text-slate-700">
									R$ {service.price.toFixed(2)}
								</td>
								<td class="px-6 py-4 text-right">
									<div
										class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100"
									>
										<button
											onclick={() => openModal(service)}
											class="p-2 text-slate-400 hover:text-emerald-primary transition-colors"
											aria-label="Editar serviço"
											title="Editar serviço"
										>
											<Edit size={18} />
										</button>
										<button
											onclick={() =>
												deleteService(service.id)}
											class="p-2 text-slate-400 hover:text-red-500 transition-colors"
											aria-label="Excluir serviço"
											title="Excluir serviço"
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
					<Wrench size={24} />
					{editingId ? "Editar Serviço" : "Cadastrar Serviço"}
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
			<form onsubmit={saveService} class="p-8 space-y-4">
				<div>
					<label
						for="service-desc"
						class="block text-sm font-bold text-slate-700 mb-1"
						>Descrição</label
					>
					<input
						id="service-desc"
						type="text"
						bind:value={formData.description}
						required
						class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-primary"
					/>
				</div>
				<div>
					<label
						for="service-price"
						class="block text-sm font-bold text-slate-700 mb-1"
						>Preço Base (R$)</label
					>
					<input
						id="service-price"
						type="number"
						step="0.01"
						min="0"
						bind:value={formData.price}
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
						{editingId ? "Salvar Alterações" : "Salvar Serviço"}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
