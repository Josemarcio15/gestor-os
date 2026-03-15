<script lang="ts">
	import "../index.css";
	import { page } from "$app/state";
	import {
		LayoutDashboard,
		Users,
		Package,
		Wrench,
		FileText,
		LogOut,
		Menu,
		X,
	} from "lucide-svelte";
	import { onMount } from "svelte";

	let { children } = $props();
	let isSidebarOpen = $state(false);
	let user = $state<{ username: string } | null>(null);

	const navItems = [
		{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/clientes", label: "Clientes", icon: Users },
		{ href: "/estoque", label: "Estoque (Peças)", icon: Package },
		{ href: "/servicos", label: "Serviços", icon: Wrench },
		{ href: "/os", label: "Ordens de Serviço", icon: FileText },
	];

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	// Simulação de auth para o protótipo
	onMount(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			user = JSON.parse(storedUser);
		} else if (page.url.pathname !== "/") {
			// window.location.href = '/';
		}
	});

	function logout() {
		localStorage.removeItem("user");
		window.location.href = "/";
	}
</script>

<div class="min-h-screen flex flex-col md:flex-row">
	<!-- Mobile Header -->
	<header
		class="md:hidden bg-forest text-white flex justify-between items-center shadow-md z-40 relative"
	>
		<div class="p-4 flex-1">
			<h1 class="font-bold text-xl tracking-tight">
				Gestor OS <span class="text-emerald-primary">Pro</span>
			</h1>
		</div>
		<button
			type="button"
			onclick={toggleSidebar}
			class="p-4 hover:bg-white/10 transition-colors"
			aria-label="Menu principal"
		>
			{#if isSidebarOpen}
				<X size={24} />
			{:else}
				<Menu size={24} />
			{/if}
		</button>
	</header>

	<!-- Sidebar -->
	<aside
		class="fixed inset-y-0 left-0 z-[60] w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 {isSidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
	>
		<div class="h-full flex flex-col p-6">
			<div class="hidden md:block mb-10">
				<h1 class="font-bold text-2xl text-white tracking-tight">
					Gestor de <span class="text-emerald-primary">OS</span>
				</h1>
				<p
					class="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold"
				>
					Free Edition
				</p>
			</div>

			<nav class="flex-1 space-y-2">
				{#each navItems as item}
					<a
						href={item.href}
						class="sidebar-link {page.url.pathname.startsWith(
							item.href,
						)
							? 'active'
							: ''}"
						onclick={() => (isSidebarOpen = false)}
					>
						<item.icon size={20} />
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>

			<div class="mt-auto pt-6 border-t border-slate-800">
				{#if user}
					<div class="flex items-center gap-3 mb-6 px-2">
						<div
							class="w-10 h-10 rounded-full bg-emerald-primary flex items-center justify-center text-white font-bold"
						>
							{user.username[0].toUpperCase()}
						</div>
						<div class="overflow-hidden">
							<p class="text-sm font-medium text-white truncate">
								{user.username}
							</p>
							<p class="text-xs text-slate-500">Administrador</p>
						</div>
					</div>
				{/if}
				<button
					onclick={logout}
					class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
				>
					<LogOut size={20} />
					<span>Sair do Sistema</span>
				</button>
			</div>
		</div>
	</aside>

	<!-- Overlay for mobile -->
	{#if isSidebarOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="fixed inset-0 bg-black/50 z-[50] md:hidden backdrop-blur-sm transition-opacity"
			onclick={toggleSidebar}
			role="button"
			tabindex="0"
			aria-label="Fechar menu"
		></div>
	{/if}

	<!-- Main Content -->
	<main class="flex-1 p-4 md:p-8 overflow-y-auto">
		{@render children()}
	</main>
</div>
