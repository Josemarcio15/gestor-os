<script lang="ts">
	import { page } from "$app/stores";
	import {
		Plus,
		Trash2,
		Save,
		Printer,
		Calculator,
		Clock,
		CheckCircle2,
		AlertCircle,
		XCircle,
	} from "lucide-svelte";
	import { onMount } from "svelte";

	let clients = $state<any[]>([]);
	let parts = $state<any[]>([]);
	let services = $state<any[]>([]);

	let orderId = $derived($page.params.id);
	let clientId = $state(null);
	let currentStatus = $state("budget");
	let items: any[] = $state([]);
	let discount = $state(0);
	let notes = $state("");

	let isLoading = $state(true);

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

		try {
			const oRes = await fetch(`/api/os/${orderId}`, { headers });
			if (oRes.ok) {
				const data = await oRes.json();
				const { order, items: orderItems } = data;

				clientId = order.client_id;
				selectedClientName = order.client_name;
				currentStatus = order.status;
				discount = order.discount;
				notes = order.notes;

				items = orderItems.map((i: any) => ({
					id: Math.random().toString(36).substr(2, 9),
					item_id: i.item_id,
					description: i.description,
					searchQuery: i.description,
					type: i.item_type,
					quantity: i.quantity,
					price: i.unit_price,
				}));
			} else {
				alert("OS não encontrada.");
			}
		} catch (e) {
			console.error(e);
		} finally {
			isLoading = false;
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
				id: orderId,
				client_id: clientId,
				status: currentStatus,
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

	async function generatePDF() {
		const { jsPDF } = await import("jspdf");
		const doc = new jsPDF();
		const primaryDark = [6, 78, 59];
		const textDark = [15, 23, 42];
		const textMuted = [100, 116, 139];

		doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
		doc.rect(0, 0, 210, 40, "F");

		doc.setFontSize(22);
		doc.setTextColor(255, 255, 255);
		doc.setFont("helvetica", "bold");
		doc.text("GESTOR OS PRO", 20, 25);

		doc.setFontSize(12);
		doc.setFont("helvetica", "normal");
		doc.text(`ORDEM DE SERVIÇO #${orderId}`, 190, 25, { align: "right" });

		doc.setTextColor(textDark[0], textDark[1], textDark[2]);
		doc.setFontSize(10);
		doc.setFont("helvetica", "bold");
		doc.text("DADOS DO CLIENTE:", 20, 55);
		doc.setFont("helvetica", "normal");

		const clientStr = selectedClientName || "Não selecionado";
		doc.text(`Cliente: ${clientStr}`, 20, 62);
		doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 190, 62, {
			align: "right",
		});

		let y = 75;
		doc.setFillColor(248, 250, 252);
		doc.setDrawColor(226, 232, 240);
		doc.rect(15, y - 6, 180, 10, "FD");

		doc.setFont("helvetica", "bold");
		doc.setFontSize(9);
		doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
		doc.text("DESCRIÇÃO", 20, y);
		doc.text("QTD", 130, y, { align: "center" });
		doc.text("PREÇO", 155, y, { align: "right" });
		doc.text("TOTAL", 185, y, { align: "right" });

		y += 10;
		doc.setFont("helvetica", "normal");
		doc.setTextColor(textDark[0], textDark[1], textDark[2]);

		items.forEach((item) => {
			if (y > 250) {
				doc.addPage();
				y = 20;
			}
			doc.text(item.description || "Sem descrição", 20, y);
			doc.text(item.quantity.toString(), 130, y, { align: "center" });
			doc.text(`R$ ${item.price.toFixed(2)}`, 155, y, { align: "right" });
			doc.text(`R$ ${(item.quantity * item.price).toFixed(2)}`, 185, y, {
				align: "right",
			});

			doc.setDrawColor(241, 245, 249);
			doc.line(15, y + 3, 195, y + 3);

			y += 8;
		});

		y += 10;
		if (y > 220) {
			doc.addPage();
			y = 20;
		}

		doc.setFillColor(248, 250, 252);
		doc.rect(120, y - 5, 75, 35, "F");

		doc.setFontSize(10);
		doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
		doc.text("Subtotal:", 125, y + 3);
		doc.text(`R$ ${subtotal.toFixed(2)}`, 185, y + 3, { align: "right" });

		doc.text("Desconto:", 125, y + 11);
		doc.text(`R$ ${discount.toFixed(2)}`, 185, y + 11, { align: "right" });

		doc.setFontSize(14);
		doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
		doc.setFont("helvetica", "bold");
		doc.text("TOTAL:", 125, y + 22);
		doc.text(`R$ ${total.toFixed(2)}`, 185, y + 22, { align: "right" });

		if (notes && notes.trim().length > 0) {
			y += 45;
			if (y > 260) {
				doc.addPage();
				y = 20;
			}

			doc.setFontSize(10);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
			doc.text("OBSERVAÇÕES:", 20, y);

			doc.setFont("helvetica", "normal");
			doc.setTextColor(textDark[0], textDark[1], textDark[2]);

			const splitNotes = doc.splitTextToSize(notes, 170);
			doc.text(splitNotes, 20, y + 6);
		}

		doc.setFontSize(8);
		doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
		doc.text("Documento gerado pelo sistema Gestor OS Pro", 105, 285, {
			align: "center",
		});

		doc.save(
			`OS_${(selectedClientName || "orcamento").replace(/\s+/g, "_")}.pdf`,
		);
	}
</script>

<div class="max-w-5xl mx-auto">
	{#if isLoading}
		<div class="p-12 text-center text-slate-400">
			Carregando detalhes...
		</div>
	{:else}
		<div
			class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
		>
			<div>
				<h1
					class="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3"
				>
					Editar OS #{orderId}
					{#if currentStatus === "budget"}
						<span
							class="text-sm px-3 py-1 rounded-full bg-amber-100 text-amber-600 uppercase tracking-wider items-center gap-1.5 inline-flex"
							><Clock size={14} /> Orçamento</span
						>
					{:else if currentStatus === "os"}
						<span
							class="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-600 uppercase tracking-wider items-center gap-1.5 inline-flex"
							><AlertCircle size={14} /> Em Execução</span
						>
					{:else if currentStatus === "completed"}
						<span
							class="text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 uppercase tracking-wider items-center gap-1.5 inline-flex"
							><CheckCircle2 size={14} /> Finalizada</span
						>
					{:else}
						<span
							class="text-sm px-3 py-1 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider items-center gap-1.5 inline-flex"
							><XCircle size={14} /> Cancelada</span
						>
					{/if}
				</h1>
				<p class="text-slate-500 mt-1">
					Você está editando uma Ordem de Serviço existente
				</p>
			</div>
			<div class="flex gap-3">
				<button
					onclick={generatePDF}
					class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
				>
					<Printer size={18} />
					<span>Imprimir</span>
				</button>
				<button
					onclick={saveOrder}
					disabled={!clientId || items.length === 0}
					class="flex items-center gap-2 px-6 py-2 bg-emerald-primary text-white rounded-xl hover:bg-emerald-hover transition-all font-bold shadow-lg shadow-emerald-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Save size={18} />
					<span>Atualizar OS</span>
				</button>
			</div>
		</div>

		<!-- Status Controller -->
		<div
			class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 mt-2"
		>
			<h2 class="text-lg font-bold text-slate-800 mb-4">
				Status da Ordem
			</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<button
					onclick={() => (currentStatus = "budget")}
					class="flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all {currentStatus ===
					'budget'
						? 'border-amber-500 bg-amber-50 text-amber-700'
						: 'border-slate-100 hover:border-amber-200'}"
				>
					<Clock
						size={24}
						class="mb-2 {currentStatus === 'budget'
							? 'text-amber-500'
							: 'text-slate-400'}"
					/>
					<span class="font-bold text-sm">Em Análise</span>
				</button>
				<button
					onclick={() => (currentStatus = "os")}
					class="flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all {currentStatus ===
					'os'
						? 'border-blue-500 bg-blue-50 text-blue-700'
						: 'border-slate-100 hover:border-blue-200'}"
				>
					<AlertCircle
						size={24}
						class="mb-2 {currentStatus === 'os'
							? 'text-blue-500'
							: 'text-slate-400'}"
					/>
					<span class="font-bold text-sm">Aprovado / Execução</span>
				</button>
				<button
					onclick={() => (currentStatus = "completed")}
					class="flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all {currentStatus ===
					'completed'
						? 'border-emerald-500 bg-emerald-50 text-emerald-700'
						: 'border-slate-100 hover:border-emerald-200'}"
				>
					<CheckCircle2
						size={24}
						class="mb-2 {currentStatus === 'completed'
							? 'text-emerald-500'
							: 'text-slate-400'}"
					/>
					<span class="font-bold text-sm">Finalizado</span>
				</button>
				<button
					onclick={() => (currentStatus = "cancelled")}
					class="flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all {currentStatus ===
					'cancelled'
						? 'border-slate-500 bg-slate-50 text-slate-700'
						: 'border-slate-100 hover:border-slate-300'}"
				>
					<XCircle
						size={24}
						class="mb-2 {currentStatus === 'cancelled'
							? 'text-slate-500'
							: 'text-slate-400'}"
					/>
					<span class="font-bold text-sm">Recusado / Cancel</span>
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
							<option value={client.name}
								>{client.document}</option
							>
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
										onchange={() =>
											handleItemSelection(item)}
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
													>R$ {s.price.toFixed(
														2,
													)}</option
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
						<div
							class="flex justify-between text-emerald-primary/80"
						>
							<span>Subtotal</span>
							<span class="font-mono"
								>R$ {subtotal.toFixed(2)}</span
							>
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
						O cálculo é realizado em tempo real conforme você
						adiciona itens ou altera valores. Modificações só são
						efetivadas após Clicar em Atualizar OS.
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
