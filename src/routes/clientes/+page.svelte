<script lang="ts">
	import {
		Plus,
		Search,
		MoreVertical,
		Edit,
		Trash2,
		UserPlus,
	} from "lucide-svelte";

	interface Client {
		id: number;
		name: string;
		email: string;
		phone: string;
		document: string;
	}

	let searchQuery = $state("");
	let isModalOpen = $state(false);

	let clients = $state<Client[]>([]);
	let isLoading = $state(true);

	import { onMount } from "svelte";

	onMount(() => {
		loadClients();
	});

	function getAuthHeader(): Record<string, string> {
		const userStr = localStorage.getItem("user");
		if (userStr) {
			const user = JSON.parse(userStr);
			return { "x-user-id": user.username };
		}
		return {};
	}

	async function loadClients() {
		try {
			isLoading = true;
			const res = await fetch("/api/clientes", {
				headers: getAuthHeader(),
			});
			if (res.ok) {
				const data = await res.json();
				clients = data.clients;
			}
		} catch (e) {
			console.error("Erro ao carregar clientes", e);
		} finally {
			isLoading = false;
		}
	}

	let filteredClients = $derived(
		clients.filter(
			(c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.document.includes(searchQuery),
		),
	);

	let editingId = $state<number | null>(null);
	let formData = $state<Omit<Client, "id">>({
		name: "",
		email: "",
		phone: "",
		document: "",
	});

	function openModal(client: Client | null = null) {
		if (client) {
			editingId = client.id;
			formData = { ...client };
		} else {
			editingId = null;
			formData = { name: "", email: "", phone: "", document: "" };
		}
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
	}

	async function saveClient(e: Event) {
		e.preventDefault();
		try {
			const payload = editingId
				? { ...formData, id: editingId }
				: formData;
			const res = await fetch("/api/clientes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...getAuthHeader(),
				},
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				await loadClients();
				closeModal();
			} else {
				alert("Erro ao salvar cliente.");
			}
		} catch (err) {
			console.error(err);
		}
	}

	async function deleteClient(id: number) {
		if (confirm("Tem certeza que deseja excluir este cliente?")) {
			try {
				const res = await fetch(`/api/clientes?id=${id}`, {
					method: "DELETE",
					headers: getAuthHeader(),
				});
				if (res.ok) {
					await loadClients();
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
				Clientes
			</h1>
			<p class="text-slate-500">
				Gerencie sua base de contatos e empresas
			</p>
		</div>
		<button
			onclick={() => openModal()}
			class="flex items-center gap-2 px-6 py-3 bg-emerald-primary text-white rounded-2xl hover:bg-emerald-hover transition-all font-bold shadow-xl shadow-emerald-primary/20"
		>
			<Plus size={20} />
			<span>Novo Cliente</span>
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
				placeholder="Buscar por nome ou CPF/CNPJ..."
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
							>Nome / Empresa</th
						>
						<th
							class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"
							>Contato</th
						>
						<th
							class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"
							>Documento</th
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
								Carregando clientes...
							</td>
						</tr>
					{:else if filteredClients.length === 0}
						<tr>
							<td
								colspan="4"
								class="px-6 py-8 text-center text-slate-400"
							>
								Nenhum cliente encontrado.
							</td>
						</tr>
					{:else}
						{#each filteredClients as client}
							<tr
								class="hover:bg-slate-50/50 transition-colors group"
							>
								<td class="px-6 py-4">
									<p class="font-bold text-slate-800">
										{client.name}
									</p>
									<p class="text-xs text-slate-400">
										{client.email}
									</p>
								</td>
								<td class="px-6 py-4 text-sm text-slate-600">
									{client.phone}
								</td>
								<td
									class="px-6 py-4 text-sm font-mono text-slate-500"
								>
									{client.document}
								</td>
								<td class="px-6 py-4 text-right">
									<div
										class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100"
									>
										<button
											onclick={() => openModal(client)}
											class="p-2 text-slate-400 hover:text-emerald-primary transition-colors"
											aria-label="Editar cliente"
											title="Editar cliente"
										>
											<Edit size={18} />
										</button>
										<button
											onclick={() =>
												deleteClient(client.id)}
											class="p-2 text-slate-400 hover:text-red-500 transition-colors"
											aria-label="Excluir cliente"
											title="Excluir cliente"
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
					<UserPlus size={24} />
					{editingId ? "Editar Cliente" : "Cadastrar Cliente"}
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
			<form onsubmit={saveClient} class="p-8 space-y-4">
				<div>
					<label
						for="client-name"
						class="block text-sm font-bold text-slate-700 mb-1"
						>Nome Completo / Razão Social</label
					>
					<input
						id="client-name"
						type="text"
						bind:value={formData.name}
						required
						class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-primary"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label
							for="client-doc"
							class="block text-sm font-bold text-slate-700 mb-1"
							>CPF / CNPJ</label
						>
						<input
							id="client-doc"
							type="text"
							bind:value={formData.document}
							required
							class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-primary"
						/>
					</div>
					<div>
						<label
							for="client-phone"
							class="block text-sm font-bold text-slate-700 mb-1"
							>Telefone</label
						>
						<input
							id="client-phone"
							type="text"
							bind:value={formData.phone}
							required
							class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-primary"
						/>
					</div>
				</div>
				<div>
					<label
						for="client-email"
						class="block text-sm font-bold text-slate-700 mb-1"
						>E-mail</label
					>
					<input
						id="client-email"
						type="email"
						bind:value={formData.email}
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
						{editingId ? "Salvar Alterações" : "Salvar Cliente"}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
