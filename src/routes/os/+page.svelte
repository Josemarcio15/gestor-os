<script lang="ts">
	import {
		Plus,
		Search,
		FileText,
		Clock,
		CheckCircle2,
		AlertCircle,
	} from "lucide-svelte";

	let searchQuery = $state("");

	interface Order {
		id: number;
		client: string;
		date: string;
		status: string;
		total: number;
	}

	let orders = $state<Order[]>([]);
	let isLoading = $state(true);

	import { onMount } from "svelte";

	onMount(() => {
		loadOrders();
	});

	function getAuthHeader(): Record<string, string> {
		const userStr = localStorage.getItem("user");
		if (userStr) {
			const user = JSON.parse(userStr);
			return { "x-user-id": user.username };
		}
		return {};
	}

	async function loadOrders() {
		try {
			isLoading = true;
			const res = await fetch("/api/os", {
				headers: getAuthHeader(),
			});
			if (res.ok) {
				const data = await res.json();
				orders = data.orders;
			}
		} catch (e) {
			console.error("Erro ao carregar ordens de serviço", e);
		} finally {
			isLoading = false;
		}
	}

	const statusConfig = {
		budget: {
			label: "Orçamento",
			class: "bg-amber-100 text-amber-600",
			icon: Clock,
		},
		os: {
			label: "Em Execução",
			class: "bg-blue-100 text-blue-600",
			icon: AlertCircle,
		},
		completed: {
			label: "Finalizada",
			class: "bg-emerald-100 text-emerald-600",
			icon: CheckCircle2,
		},
		cancelled: {
			label: "Cancelada",
			class: "bg-slate-100 text-slate-500",
			icon: Clock,
		},
	};

	let filteredOrders = $derived(
		orders.filter(
			(o) =>
				o.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
				o.id.toString().includes(searchQuery),
		),
	);
</script>

<div class="max-w-7xl mx-auto">
	<div
		class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
	>
		<div>
			<h1 class="text-3xl font-bold text-slate-900 tracking-tight">
				Ordens de Serviço
			</h1>
			<p class="text-slate-500">Controle de atendimentos e orçamentos</p>
		</div>
		<a
			href="/os/nova"
			class="flex items-center gap-2 px-6 py-3 bg-emerald-primary text-white rounded-2xl hover:bg-emerald-hover transition-all font-bold shadow-xl shadow-emerald-primary/20"
		>
			<Plus size={20} />
			<span>Novo Orçamento</span>
		</a>
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
				placeholder="Buscar por cliente ou número..."
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
							>OS #</th
						>
						<th
							class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"
							>Cliente</th
						>
						<th
							class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"
							>Status</th
						>
						<th
							class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"
							>Total</th
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
								colspan="5"
								class="px-6 py-8 text-center text-slate-400"
							>
								Carregando ordens de serviço...
							</td>
						</tr>
					{:else if filteredOrders.length === 0}
						<tr>
							<td
								colspan="5"
								class="px-6 py-8 text-center text-slate-400"
							>
								Nenhuma ordem de serviço cadastrada.
							</td>
						</tr>
					{:else}
						{#each filteredOrders as order}
							<tr
								class="hover:bg-slate-50/50 transition-colors group"
							>
								<td
									class="px-6 py-4 font-mono font-bold text-slate-400"
								>
									#{order.id}
								</td>
								<td class="px-6 py-4 font-bold text-slate-800">
									{order.client}
								</td>
								<td class="px-6 py-4">
									{#if statusConfig[order.status as keyof typeof statusConfig]}
										{@const config =
											statusConfig[
												order.status as keyof typeof statusConfig
											]}
										{@const Icon = config.icon}
										<span
											class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase {config.class}"
										>
											<Icon size={12} />
											{config.label}
										</span>
									{/if}
								</td>
								<td class="px-6 py-4 font-bold text-slate-700">
									R$ {order.total.toFixed(2)}
								</td>
								<td class="px-6 py-4 text-right">
									<a
										href="/os/{order.id}"
										class="text-sm font-bold text-emerald-primary hover:underline"
										>Ver Detalhes</a
									>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
