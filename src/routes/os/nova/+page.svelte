<script lang="ts">
	import { Plus, Trash2, Save, Printer, Calculator } from "lucide-svelte";
	import { onMount } from "svelte";

	let clients = $state<any[]>([]);
	let parts = $state<any[]>([]);
	let services = $state<any[]>([]);

	let clientId = $state<number | null>(null);
	let items = $state<
		Array<{
			id: string;
			item_id: number | null;
			description: string;
			searchQuery?: string;
			type: "part" | "service";
			quantity: number;
			price: number;
		}>
	>([]);
	let discount = $state(0);
	let notes = $state("");

	function getAuthHeader(): Record<string, string> {
		const userStr = localStorage.getItem("user");
		if (userStr) {
			const user = JSON.parse(userStr);
			return { "x-user-id": user.username };
		}
		return {};
	}

	onMount(async () => {
		const headers = getAuthHeader();
		const [cRes, pRes, sRes] = await Promise.all([
			fetch("/api/clientes", { headers }),
			fetch("/api/estoque", { headers }),
			fetch("/api/servicos", { headers }),
		]);

		if (cRes.ok) {
			const data = await cRes.json();
			clients = data.clients;
		}
		if (pRes.ok) {
			const data = await pRes.json();
			parts = data.parts;
		}
		if (sRes.ok) {
			const data = await sRes.json();
			services = data.services;
		}
	});

	let subtotal = $derived(
		items.reduce((acc, item) => acc + item.quantity * item.price, 0),
	);
	let total = $derived(Math.max(0, subtotal - discount));
	let selectedClientName = $state("");

	$effect(() => {
		const found = clients.find((c) => c.name === selectedClientName);
		if (found) {
			clientId = found.id;
		} else {
			clientId = null;
		}
	});

	function addItem() {
		items.push({
			id: Math.random().toString(36).substr(2, 9),
			item_id: null,
			description: "",
			searchQuery: "",
			type: "part",
			quantity: 1,
			price: 0,
		});
	}

	function handleItemSelection(item: any) {
		const sourceList = item.type === "part" ? parts : services;

		const found = sourceList.find(
			(i) =>
				(item.type === "part" ? i.name : i.description) ===
				item.searchQuery,
		);

		if (found) {
			item.item_id = found.id;
			item.description =
				item.type === "part" ? found.name : found.description;
			item.price = found.price;
		} else {
			item.item_id = null;
			item.description = "";
			item.price = 0;
		}
	}

	function removeItem(id: string) {
		items = items.filter((i) => i.id !== id);
	}

	async function saveOrder() {
		if (!clientId) {
			alert("Selecione um cliente!");
			return;
		}

		if (items.length === 0 || items.some((i) => !i.item_id)) {
			alert("Adicione itens válidos ao orçamento!");
			return;
		}

		try {
			const payload = {
				client_id: clientId,
				status: "budget",
				discount: discount,
				total: total,
				notes: notes,
				items: items,
			};

			const res = await fetch("/api/os", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...getAuthHeader(),
				},
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				window.location.href = "/os";
			} else {
				alert("Erro ao salvar orçamento.");
			}
		} catch (err) {
			console.error(err);
			alert("Erro de conexão ao salvar.");
		}
	}
</script>

<div class="max-w-5xl mx-auto">
	<div
		class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
	>
		<div>
			<h1 class="text-3xl font-bold text-slate-900 tracking-tight">
				Novo Orçamento
			</h1>
			<p class="text-slate-500">
				Preencha os dados abaixo para gerar o orçamento
			</p>
		</div>
		<div class="flex gap-3">
			<button
				onclick={saveOrder}
				disabled={!clientId || items.length === 0}
				class="flex items-center gap-2 px-6 py-2 bg-emerald-primary text-white rounded-xl hover:bg-emerald-hover transition-all font-bold shadow-lg shadow-emerald-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<Save size={18} />
				<span>Salvar OS</span>
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Form -->
		<div class="lg:col-span-2 space-y-6">
			<div
				class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
			>
				<h2 class="text-lg font-bold text-slate-800 mb-4">
					Dados do Cliente
				</h2>
				<input
					list="clients-list"
					bind:value={selectedClientName}
					placeholder="Digite para buscar um cliente..."
					class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-primary outline-none transition-all"
				/>
				<datalist id="clients-list">
					{#each clients as client}
						<option value={client.name}>{client.document}</option>
					{/each}
				</datalist>
			</div>

			<div
				class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
			>
				<div class="flex justify-between items-center mb-6">
					<h2 class="text-lg font-bold text-slate-800">
						Itens do Orçamento
					</h2>
					<button
						onclick={addItem}
						class="flex items-center gap-1 text-sm font-bold text-emerald-primary hover:text-emerald-hover transition-colors"
					>
						<Plus size={16} />
						<span>Adicionar Item</span>
					</button>
				</div>

				<div class="space-y-4">
					{#if items.length === 0}
						<div
							class="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl"
						>
							<Calculator
								size={48}
								class="mx-auto text-slate-200 mb-3"
							/>
							<p class="text-slate-400">
								Nenhum item adicionado ainda.
							</p>
						</div>
					{/if}

					{#each items as item (item.id)}
						<div
							class="flex flex-col md:flex-row gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 group"
						>
							<div class="w-full md:w-32">
								<select
									bind:value={item.type}
									onchange={() => {
										item.item_id = null;
										handleItemSelection(item);
									}}
									class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-primary outline-none"
								>
									<option value="part">Peça</option>
									<option value="service">Serviço</option>
								</select>
							</div>
							<div class="flex-1">
								<input
									list={"items-list-" + item.id}
									bind:value={item.searchQuery}
									onchange={() => handleItemSelection(item)}
									placeholder="Pesquisar por nome do item..."
									class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-primary outline-none"
								/>
								<datalist id={"items-list-" + item.id}>
									{#if item.type === "part"}
										{#each parts as p}
											<option value={p.name}
												>Estoque: {p.stock} | R$ {p.price.toFixed(
													2,
												)}</option
											>
										{/each}
									{:else}
										{#each services as s}
											<option value={s.description}
												>R$ {s.price.toFixed(2)}</option
											>
										{/each}
									{/if}
								</datalist>
							</div>
							<div class="w-full md:w-24">
								<input
									type="number"
									bind:value={item.quantity}
									min="1"
									class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-primary outline-none"
								/>
							</div>
							<div class="w-full md:w-32">
								<input
									type="number"
									bind:value={item.price}
									placeholder="R$ 0,00"
									class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-primary outline-none"
								/>
							</div>
							<button
								onclick={() => removeItem(item.id)}
								class="p-2 text-slate-400 hover:text-red-500 transition-colors"
							>
								<Trash2 size={20} />
							</button>
						</div>
					{/each}
				</div>
			</div>

			<div
				class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
			>
				<h2 class="text-lg font-bold text-slate-800 mb-4">
					Observações
				</h2>
				<textarea
					bind:value={notes}
					rows="3"
					placeholder="Informações adicionais, defeitos relatados, etc."
					class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-primary outline-none transition-all"
				></textarea>
			</div>
		</div>

		<!-- Summary Sidebar -->
		<div class="space-y-6">
			<div
				class="bg-forest text-white p-8 rounded-3xl shadow-xl sticky top-8"
			>
				<h2 class="text-xl font-bold mb-8 flex items-center gap-2">
					<Calculator size={24} class="text-emerald-primary" />
					Resumo do Total
				</h2>

				<div class="space-y-4 mb-8">
					<div class="flex justify-between text-emerald-primary/80">
						<span>Subtotal</span>
						<span class="font-mono">R$ {subtotal.toFixed(2)}</span>
					</div>

					<div class="space-y-2">
						<div
							class="flex justify-between text-emerald-primary/80"
						>
							<label for="discount">Desconto (R$)</label>
						</div>
						<input
							type="number"
							id="discount"
							bind:value={discount}
							class="w-full bg-emerald-primary/10 border border-emerald-primary/20 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-primary"
						/>
					</div>
				</div>

				<div class="pt-6 border-t border-white/10">
					<p
						class="text-sm text-emerald-primary/60 uppercase tracking-widest font-bold mb-1"
					>
						Total a Pagar
					</p>
					<p class="text-5xl font-bold tracking-tighter">
						R$ {total.toFixed(2)}
					</p>
				</div>

				<div
					class="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-emerald-primary/60 leading-relaxed"
				>
					O cálculo é realizado em tempo real conforme você adiciona
					itens ou altera valores.
				</div>
			</div>
		</div>
	</div>
</div>
