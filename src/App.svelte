<script>
	import APIVisualiser from "./components/APIVisualiser.svelte";
	import pkg from "../package.json";

	console.log("Banana-π version:", pkg.version);
</script>

<main class="app">
	<header class="app-header">
		<h1 class="brand">
			<img src="../favicon.png" class="banana-icon" alt="Banana-π Logo" />
			<span class="banana">Banana</span><span class="dash"></span><span
				class="pi">&pi;</span
			>
			<span class="version">v{pkg.version}</span>
		</h1>
		<p class="subtitle">
			A clean tool to explore HTTP APIs with live requests and JSON formatting.
		</p>
		<a href="https://gitub.com/cosmic-fi/banana-pi" class="githublink">
			<i class="fa-brands fa-github"></i> View on GitHub
		</a>
	</header>

	<APIVisualiser />
</main>

<style>
	.app {
		max-width: 1100px;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		margin: 0 auto;
	}

	.app-header {
		padding-block: 13px;
		position: relative;
		align-items: start;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.banana-icon{
		width: 40px;
		height: 40px;
		/* margin-right: 8px; */
		vertical-align: middle;
	}
	.brand {
		margin: 0;
		font-size: 30px;
		letter-spacing: -0.02em;
	}
	.brand .banana {
		color: var(--banana);
		font-weight: 800;
	}
	.brand .dash {
		color: rgba(255, 255, 255, 0.08);
		margin: 0 6px;
	}
	.brand .pi {
		color: var(--pi);
		font-size: 2.2rem;
		font-weight: 800;
	}

	.version{
		font-size: 12px;
		opacity: var(--muted);
	}
	.subtitle {
		margin: 6px 0 0 0;
		color: var(--muted);
		font-size: 13px;
	}
	.githublink{
		position: absolute;
		right: 0;
	}
</style>
