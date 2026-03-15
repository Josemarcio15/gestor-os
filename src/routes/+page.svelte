<script lang="ts">
	import { User, Lock, ArrowRight } from "lucide-svelte";
	import { onMount } from "svelte";

	let isLogin = $state(true);
	let username = $state("");
	let password = $state("");
	let error = $state("");
	let loading = $state(false);

	let regData = $state<Record<string, string>>({
		q1: "",
		a1: "",
		q2: "",
		a2: "",
		q3: "",
		a3: "",
	});

	let isResetting = $state(false);
	let resetStep = $state(1);
	let resetQuestions = $state<string[]>([]);
	let resetAnswers = $state(["", "", ""]);
	let newPassword = $state("");

	const questions = [
		"Qual o nome do seu primeiro animal de estimação?",
		"Qual o nome da sua mãe?",
		"Qual a sua cidade natal?",
		"Qual o nome da sua primeira escola?",
		"Qual a marca do seu primeiro carro?",
		"Qual sua cor favorita?",
		"Qual o nome do seu melhor amigo de infância?",
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = "";

		const payload: any = {
			username,
			password,
			action: isLogin ? "login" : "register",
		};
		if (!isLogin) {
			Object.assign(payload, regData);
		}

		try {
			const res = await fetch("/api/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await res.json();

			if (res.ok) {
				localStorage.setItem("user", JSON.stringify(data.user));
				window.location.href = "/dashboard";
			} else {
				error = data.message || "Erro ao processar solicitação";
			}
		} catch (err) {
			error = "Erro de conexão com o servidor";
		} finally {
			loading = false;
		}
	}

	async function getResetQuestions() {
		error = "";
		if (!username) {
			error = "Digite seu usuário";
			return;
		}
		loading = true;
		try {
			const res = await fetch("/api/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, action: "get_questions" }),
			});
			const data = await res.json();
			if (res.ok) {
				resetQuestions = data.questions;
				resetStep = 2;
			} else {
				error = data.message;
			}
		} catch (err) {
			error = "Erro ao buscar perguntas";
		} finally {
			loading = false;
		}
	}

	async function handleReset() {
		error = "";
		loading = true;
		try {
			const res = await fetch("/api/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username,
					action: "reset",
					a1: resetAnswers[0],
					a2: resetAnswers[1],
					a3: resetAnswers[2],
					newPassword,
				}),
			});
			const data = await res.json();
			if (res.ok) {
				alert("Senha redefinida com sucesso!");
				isResetting = false;
				resetStep = 1;
				isLogin = true;
			} else {
				error = data.message;
			}
		} catch (err) {
			error = "Erro ao redefinir senha";
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-[100]"
>
	<div
		class="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
	>
		<div class="bg-forest p-8 text-center">
			<h1 class="text-3xl font-bold text-white tracking-tight">
				Gestor OS <span class="text-emerald-primary">Pro</span>
			</h1>
			<p class="text-emerald-primary/80 mt-2">Sua oficina em boas mãos</p>
		</div>

		<div class="p-8">
			<div class="flex mb-8 bg-slate-100 p-1 rounded-xl">
				<button
					class="flex-1 py-2 rounded-lg font-medium transition-all {isLogin
						? 'bg-white shadow-sm text-emerald-primary'
						: 'text-slate-500'}"
					onclick={() => (isLogin = true)}
				>
					Entrar
				</button>
				<button
					class="flex-1 py-2 rounded-lg font-medium transition-all {!isLogin
						? 'bg-white shadow-sm text-emerald-primary'
						: 'text-slate-500'}"
					onclick={() => (isLogin = false)}
				>
					Criar Conta
				</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-6">
				{#if error}
					<div
						class="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100"
					>
						{error}
					</div>
				{/if}

				<div>
					<label
						for="username"
						class="block text-sm font-semibold text-slate-700 mb-2"
						>Usuário</label
					>
					<div class="relative">
						<User
							class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
							size={18}
						/>
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
					<label
						for="password"
						class="block text-sm font-semibold text-slate-700 mb-2"
						>Senha</label
					>
					<div class="relative">
						<Lock
							class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
							size={18}
						/>
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

				{#if isLogin}
					<div class="flex justify-end mt-1">
						<button
							type="button"
							class="text-xs text-emerald-primary hover:underline"
							onclick={() => (isResetting = true)}
						>
							Esqueci minha senha
						</button>
					</div>
				{/if}

				{#if !isLogin}
					<div class="space-y-4 pt-4 border-t border-slate-100">
						<p
							class="text-xs font-bold text-slate-400 uppercase tracking-wider"
						>
							Perguntas de Segurança
						</p>

						{#each [1, 2, 3] as i}
							<div class="space-y-2">
								<select
									bind:value={regData[`q${i}`]}
									class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
									required
								>
									<option value=""
										>Selecione a pergunta {i}</option
									>
									{#each questions as q}
										<option value={q}>{q}</option>
									{/each}
								</select>
								<input
									type="text"
									placeholder="Sua resposta {i}"
									bind:value={regData[`a${i}`]}
									class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
									required
								/>
							</div>
						{/each}
					</div>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-emerald-primary hover:bg-emerald-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
				>
					{#if loading}
						<span>Processando...</span>
					{:else}
						<span
							>{isLogin
								? "Entrar no Sistema"
								: "Finalizar Cadastro"}</span
						>
						<ArrowRight
							size={18}
							class="group-hover:translate-x-1 transition-transform"
						/>
					{/if}
				</button>
			</form>

			{#if isResetting}
				<div
					class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[110]"
				>
					<div
						class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6"
					>
						<div class="text-center">
							<h2 class="text-xl font-bold text-slate-800">
								Recuperar Senha
							</h2>
							<p class="text-slate-500 text-sm mt-1">
								Siga os passos para redefinir sua senha
							</p>
						</div>

						{#if error}
							<div
								class="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100"
							>
								{error}
							</div>
						{/if}

						{#if resetStep === 1}
							<div class="space-y-4">
								<div>
									<label
										for="reset-username"
										class="block text-sm font-semibold text-slate-700 mb-2"
										>Seu Usuário</label
									>
									<input
										type="text"
										id="reset-username"
										bind:value={username}
										class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
									/>
								</div>
								<button
									onclick={getResetQuestions}
									disabled={loading}
									class="w-full bg-emerald-primary text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
								>
									Buscar Perguntas
								</button>
							</div>
						{:else}
							<div
								class="space-y-4 max-h-[60vh] overflow-y-auto pr-2"
							>
								{#each resetQuestions as q, i}
									<div class="space-y-1">
										<p
											class="text-xs font-bold text-slate-400"
										>
											{q}
										</p>
										<input
											type="text"
											bind:value={resetAnswers[i]}
											class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
											placeholder="Resposta {i + 1}"
										/>
									</div>
								{/each}
								<div class="pt-2">
									<label
										for="new-password"
										class="block text-sm font-semibold text-slate-700 mb-1"
										>Nova Senha</label
									>
									<input
										type="password"
										id="new-password"
										bind:value={newPassword}
										class="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
									/>
								</div>
								<button
									onclick={handleReset}
									disabled={loading}
									class="w-full bg-emerald-primary text-white font-bold py-3 rounded-xl transition-all mt-4"
								>
									Redefinir Senha
								</button>
							</div>
						{/if}

						<button
							type="button"
							class="w-full text-slate-400 text-sm hover:text-slate-600 transition-colors"
							onclick={() => {
								isResetting = false;
								resetStep = 1;
								error = "";
							}}
						>
							Cancelar e Voltar
						</button>
					</div>
				</div>
			{/if}

			<p class="mt-8 text-center text-slate-400 text-xs">
				© 2026 Gestor OS Pro - Todos os direitos reservados
			</p>
		</div>
	</div>
</div>
