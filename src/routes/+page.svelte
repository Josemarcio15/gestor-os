<script lang="ts">
	import { User, Lock, ArrowRight } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let isLogin = $state(true);
	let username = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			// Simulação de chamada de API para o protótipo
			// Em um app real, usaríamos form actions do SvelteKit
			const res = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password, action: isLogin ? 'login' : 'register' })
			});

			const data = await res.json();

			if (res.ok) {
				localStorage.setItem('user', JSON.stringify(data.user));
				window.location.href = '/dashboard';
			} else {
				error = data.message || 'Erro ao processar solicitação';
			}
		} catch (err) {
			error = 'Erro de conexão com o servidor';
		} finally {
			loading = false;
		}
	}
</script>

<div class="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-[100]">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
		<div class="bg-forest p-8 text-center">
			<h1 class="text-3xl font-bold text-white tracking-tight">Gestor OS <span class="text-emerald-primary">Pro</span></h1>
			<p class="text-emerald-primary/80 mt-2">Sua oficina em boas mãos</p>
		</div>

		<div class="p-8">
			<div class="flex mb-8 bg-slate-100 p-1 rounded-xl">
				<button 
					class="flex-1 py-2 rounded-lg font-medium transition-all {isLogin ? 'bg-white shadow-sm text-emerald-primary' : 'text-slate-500'}"
					onclick={() => isLogin = true}
				>
					Entrar
				</button>
				<button 
					class="flex-1 py-2 rounded-lg font-medium transition-all {!isLogin ? 'bg-white shadow-sm text-emerald-primary' : 'text-slate-500'}"
					onclick={() => isLogin = false}
				>
					Criar Conta
				</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-6">
				{#if error}
					<div class="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
						{error}
					</div>
				{/if}

				<div>
					<label for="username" class="block text-sm font-semibold text-slate-700 mb-2">Usuário</label>
					<div class="relative">
						<User class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
						<input 
							type="text" 
							id="username"
							bind:value={username}
							required
							class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-primary focus:border-transparent outline-none transition-all"
							placeholder="Seu nome de usuário"
						/>
					</div>
				</div>

				<div>
					<label for="password" class="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
					<div class="relative">
						<Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
						<input 
							type="password" 
							id="password"
							bind:value={password}
							required
							class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-primary focus:border-transparent outline-none transition-all"
							placeholder="••••••••"
						/>
					</div>
				</div>

				<button 
					type="submit" 
					disabled={loading}
					class="w-full bg-emerald-primary hover:bg-emerald-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
				>
					{#if loading}
						<span>Processando...</span>
					{:else}
						<span>{isLogin ? 'Entrar no Sistema' : 'Finalizar Cadastro'}</span>
						<ArrowRight size={18} class="group-hover:translate-x-1 transition-transform" />
					{/if}
				</button>
			</form>

			<p class="mt-8 text-center text-slate-400 text-xs">
				© 2026 Gestor OS Pro - Todos os direitos reservados
			</p>
		</div>
	</div>
</div>
