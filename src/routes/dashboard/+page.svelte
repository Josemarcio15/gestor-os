<script lang="ts">
	import {
		Users,
		Package,
		FileText,
		TrendingUp,
		Clock,
		CheckCircle2,
		Download,
	} from "lucide-svelte";
	import { onMount } from "svelte";

	let user = $state<{ username: string } | null>(null);

	let dashboardData = $state<{
		stats: {
			clients: number;
			parts: number;
			pendingOs: number;
			completedOs: number;
		};
		recentActivity: any[];
	}>({
		stats: { clients: 0, parts: 0, pendingOs: 0, completedOs: 0 },
		recentActivity: [],
	});

	let isLoading = $state(true);

	onMount(async () => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			user = JSON.parse(storedUser);
			await loadDashboard();
		}
	});

	function getAuthHeader(): Record<string, string> {
		if (user) return { "x-user-id": user.username };
		return {};
	}

	async function loadDashboard() {
		try {
			const res = await fetch("/api/dashboard", {
				headers: getAuthHeader(),
			});
			if (res.ok) {
				const data = await res.json();
				dashboardData = data;
			}
		} catch (e) {
			console.error("Erro ao carregar dashboard", e);
		} finally {
			isLoading = false;
		}
	}

	let displayStats = $derived([
		{
			label: "Clientes",
			value: dashboardData.stats.clients,
			icon: Users,
			color: "text-blue-500",
			bg: "bg-blue-50",
		},
		{
			label: "Peças em Estoque",
			value: dashboardData.stats.parts,
			icon: Package,
			color: "text-emerald-500",
			bg: "bg-emerald-50",
		},
		{
			label: "OS Pendentes",
			value: dashboardData.stats.pendingOs,
			icon: Clock,
			color: "text-amber-500",
			bg: "bg-amber-50",
		},
		{
			label: "OS Finalizadas",
			value: dashboardData.stats.completedOs,
			icon: CheckCircle2,
			color: "text-purple-500",
			bg: "bg-purple-50",
		},
	]);

	function downloadBackup() {
		if (!user) return;
		// Rota para download do banco de dados
		window.location.href = `/api/backup?username=${user.username}`;
	}
</script>

<div class="max-w-7xl mx-auto">
	<div
		class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10"
	>
		<div>
			<h1 class="text-3xl font-bold text-slate-900 tracking-tight">
				Olá, <span class="text-emerald-primary"
					>{user?.username || "Usuário"}</span
				>!
			</h1>
			<p class="text-slate-500">Bem-vindo ao seu painel de controle.</p>
		</div>
		<button
			onclick={downloadBackup}
			class="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-xl shadow-slate-900/20"
		>
			<Download size={20} />
			<span>Baixar Backup (.db)</span>
		</button>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
		{#each displayStats as stat}
			<div
				class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5"
			>
				<div
					class="w-14 h-14 {stat.bg} rounded-2xl flex items-center justify-center {stat.color}"
				>
					<stat.icon size={28} />
				</div>
				<div>
					<p
						class="text-sm font-medium text-slate-500 uppercase tracking-wider"
					>
						{stat.label}
					</p>
					<p class="text-2xl font-bold text-slate-900">
						{isLoading ? "..." : stat.value}
					</p>
				</div>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Recent Activity -->
		<div
			class="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
		>
			<div
				class="p-6 border-b border-slate-50 flex justify-between items-center"
			>
				<h2 class="text-lg font-bold text-slate-800">
					Atividades Recentes
				</h2>
				<a
					href="/os"
					class="text-sm font-bold text-emerald-primary hover:underline"
					>Ver tudo</a
				>
			</div>
			<div class="divide-y divide-slate-50">
				{#if isLoading}
					<div class="p-6 text-center text-slate-400">
						Carregando atividades...
					</div>
				{:else if dashboardData.recentActivity.length === 0}
					<div class="p-6 text-center text-slate-400">
						Nenhuma atividade recente.
					</div>
				{:else}
					{#each dashboardData.recentActivity as order}
						<div
							class="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
						>
							<div class="flex items-center gap-4">
								<div
									class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
								>
									<FileText size={20} />
								</div>
								<div>
									<p class="font-bold text-slate-800">
										OS #{order.id} - {order.client}
									</p>
									<p class="text-xs text-slate-400">
										{#if order.status === "budget"}
											Orçamento gerado
										{:else if order.status === "os"}
											Em andamento
										{:else if order.status === "completed"}
											Finalizada
										{:else}
											Cancelada
										{/if}
									</p>
								</div>
							</div>
							<div class="text-right">
								<p class="font-bold text-slate-900">
									R$ {Number(order.total).toFixed(2)}
								</p>
								<span
									class="text-[10px] font-bold uppercase px-2 py-1 rounded-full
									{order.status === 'budget' ? 'bg-amber-100 text-amber-600' : ''}
									{order.status === 'os' ? 'bg-blue-100 text-blue-600' : ''}
									{order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : ''}
									{order.status === 'cancelled' ? 'bg-slate-100 text-slate-500' : ''}
								"
								>
									{#if order.status === "budget"}
										Orçamento
									{:else if order.status === "os"}
										Em Execução
									{:else if order.status === "completed"}
										Finalizada
									{:else if order.status === "cancelled"}
										Cancelada
									{/if}
								</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="space-y-6">
			<div
				class="bg-emerald-primary p-8 rounded-3xl shadow-xl shadow-emerald-primary/20 text-white"
			>
				<h2 class="text-xl font-bold mb-4">Novo Orçamento?</h2>
				<p class="text-emerald-50/80 text-sm mb-6 leading-relaxed">
					Crie um novo orçamento em segundos e envie o PDF
					profissional para o seu cliente.
				</p>
				<a
					href="/os/nova"
					class="block w-full text-center bg-white text-emerald-primary font-bold py-4 rounded-2xl hover:bg-emerald-50 transition-all"
				>
					Começar Agora
				</a>
			</div>

			<div
				class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
			>
				<h2 class="text-lg font-bold text-slate-800 mb-4">
					Dica do Dia
				</h2>
				<div class="flex gap-4">
					<div
						class="w-10 h-10 shrink-0 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center"
					>
						<TrendingUp size={20} />
					</div>
					<p class="text-sm text-slate-500 leading-relaxed">
						Mantenha seu estoque atualizado para evitar atrasos nas
						ordens de serviço. O sistema avisa quando uma peça está
						acabando!
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
