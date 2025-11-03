<script>
    import { onMount } from "svelte";
    import { doRequest, parseHeaders } from "../lib/fetcher.js";

    let url = "https://jsonplaceholder.typicode.com/posts/1";
    let method = "GET";
    let headersText = "Accept: application/json";
    let bodyText = "";

    let loading = false;
    let result = null;
    let error = null;
    let history = [];

    const STORAGE_KEY = "apiVisHistoryV1";

    onMount(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) history = JSON.parse(raw);
        } catch (e) {
            history = [];
        }
    });

    function saveHistoryEntry(entry) {
        history = [entry, ...history.filter((h) => h.id !== entry.id)].slice(
            0,
            30,
        );
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (e) {}
    }

    function loadFromHistory(item) {
        url = item.url;
        method = item.method;
        headersText = item.headersText || "";
        bodyText = item.bodyText || "";
        result = item.result || null;
        error = null;
    }

    function clearHistory() {
        history = [];
        localStorage.removeItem(STORAGE_KEY);
    }

    async function sendRequest() {
        error = null;
        result = null;
        loading = true;
        const headers = parseHeaders(headersText);
        let body = bodyText ? bodyText : null;

        try {
            const res = await doRequest({ url, method, headers, body });
            result = res;

            const entry = {
                id: Date.now() + Math.random().toString(36).slice(2, 8),
                url,
                method,
                time: new Date().toISOString(),
                status: res.status,
                duration: res.duration,
                headersText,
                bodyText,
                result: { status: res.status, duration: res.duration },
            };
            saveHistoryEntry(entry);
        } catch (err) {
            error = err.message || String(err);
        } finally {
            loading = false;
        }
    }

    function prettyJSON(obj) {
        if (!obj && obj !== 0) return null;
        try {
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return String(obj);
        }
    }

    // Small client-side JSON syntax highlighter (no external deps)
    function syntaxHighlight(json) {
        if (json === null || json === undefined) return "";
        let str =
            typeof json !== "string" ? JSON.stringify(json, null, 2) : json;
        str = str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        return str.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function (match) {
                let cls = "number";
                if (/^"/.test(match)) {
                    cls = /:\s*$/.test(match) ? "key" : "string";
                } else if (/true|false/.test(match)) {
                    cls = "boolean";
                } else if (/null/.test(match)) {
                    cls = "null";
                }
                return `<span class="${cls}">${match}</span>`;
            },
        );
    }
    function copyToClipboard(text) {
        if (!text) return;
        navigator.clipboard
            .writeText(text)
            .then(() => {
                console.log("Copied!");
            })
            .catch((err) => {
                console.error("Failed to copy:", err);
            });
    }

</script>

<section class="vis-root">
    <aside class="sidebar">
        <div class="sidebar-head">
            <strong>History</strong>
            <button
                class="btn-link"
                on:click={clearHistory}
                title="Clear history">Clear</button
            >
        </div>
        {#if history.length === 0}
            <div class="muted">
                No history yet — send a request to get started.
            </div>
        {:else}
            <div class="history-list">
                <div class="list">
                    {#each history as h}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div
                            class="history-item"
                            on:click={() => loadFromHistory(h)}
                        >
                            <div class="meta">
                                <span class="method">{h.method}</span>
                                <span class="url"
                                    >{h.url.length > 23
                                        ? h.url.slice(0, 22) + "…"
                                        : h.url}</span
                                >
                            </div>
                            <div class="meta2">
                                {h.status ?? "—"} · {h.duration}ms
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </aside>

    <main class="panel">
        <form class="form" on:submit|preventDefault={sendRequest}>
            <div class="row top-row">
                <select bind:value={method} class="method-select">
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>PATCH</option>
                    <option>DELETE</option>
                </select>
                <input
                    class="url-input"
                    bind:value={url}
                    placeholder="https://api.example.com/endpoint"
                />
                <button class="btn primary" type="submit" disabled={loading}
                    >{loading ? "Sending…" : "Send"}</button
                >
            </div>

            <div class="row">
                <div class="col">
                    <label for="headersInput"
                        >Headers (Key: Value per line)</label
                    >
                    <textarea
                        id="headersInput"
                        class="textarea"
                        bind:value={headersText}
                        rows="5"
                    ></textarea>
                </div>
                <div class="col">
                    <label for="bodyInput">Body (raw JSON or text)</label>
                    <textarea
                        id="bodyInput"
                        class="textarea"
                        bind:value={bodyText}
                        rows="5"
                    ></textarea>
                </div>
            </div>
        </form>

        <section class="response">
            <div class="response-meta">
                <div>
                    Status: <strong class="status"
                        >{result ? (result.status ?? "—") : "—"}</strong
                    >
                </div>
                <div>
                    Time: <strong
                        >{result ? result.duration + " ms" : "—"}</strong
                    >
                </div>
                <div>
                    Size: <strong
                        >{result ? result.size + " bytes" : "—"}</strong
                    >
                </div>
            </div>

            {#if error}
                <div class="error">{error}</div>
            {/if}

            {#if result}
                <!-- <div class="response-body">
                    <div class="pane">
                        <h3>Raw</h3>
                        <pre class="mono">{result.text}</pre>
                    </div>

                    <div class="pane">
                        <h3>JSON</h3>
                        {#if result.json}
                            <pre
                                class="mono code"
                                aria-live="polite">{@html syntaxHighlight(
                                    result.json,
                                )}</pre>
                        {:else}
                            <div class="muted">Not valid JSON</div>
                        {/if}
                    </div>
                </div> -->
                <div class="response-body">
                    <div class="pane">
                        <div class="pane-header">
                            <h3>Raw</h3>
                            <button
                                class="copy-btn"
                                on:click={() => copyToClipboard(result.text)}
                                title="Copy raw response"
                            >
                                Copy
                            </button>
                        </div>
                        <pre class="pre-scrollable">{result.text}</pre>
                    </div>

                    <div class="pane">
                        <div class="pane-header">
                            <h3>JSON</h3>
                            {#if result.json}
                                <button
                                    class="copy-btn"
                                    on:click={() =>
                                        copyToClipboard(
                                            typeof result.json === "string"
                                                ? result.json
                                                : JSON.stringify(result.json, null, 2)
                                        )
                                    }
                                    title="Copy JSON response"
                                >
                                    Copy
                                </button>
                            {/if}
                        </div>

                        {#if result.json}
                            <pre class="pre-scrollable mono code" aria-live="polite">
                                {@html syntaxHighlight(result.json)}
                            </pre>
                        {:else}
                            <div class="muted">Not valid JSON</div>
                        {/if}
                    </div>
                </div>

            {:else}
                <div class="muted">Response will appear here.</div>
            {/if}
        </section>
    </main>
</section>

<style>
    .vis-root {
        display: grid;
        grid-template-columns: 260px 1fr; /* Sidebar + Main */
        gap: 10px;
        height: 100vh; /* Full viewport height */
        background-color: var(--bg);
        padding-block: 10px;
        overflow: hidden; /* Prevent whole page overflow */
    }

    .sidebar {
        display: flex;
        flex-direction: column;
        /* background-color: #; */
        border-radius: 8px;
        width: 260px;
        min-height: 0; /* ✅ important when inside grid/flex parent */
        overflow: hidden; /* prevent overall sidebar scroll */
        border: 1px solid #2e2e10;
    }

    .sidebar-head {
        flex-shrink: 0; /* ✅ header stays visible */
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #2e2e10;
    }
    .btn-link {
        background: none;
        border: none;
        color: var(--banana);
        cursor: pointer;
        font-size: 12px;
    }

    .history-list {
        flex: 1; /* ✅ fill remaining height */
        overflow-y: auto; /* ✅ scroll only this area */
        display: flex;
        flex-direction: column;
    }
    .list {
        display: flex;
        flex-grow: 1;
        flex-direction: column;
        overflow: hidden;
        overflow-y: auto;
        padding: 5px;
        gap: 4px;
    }

    .history-item {
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.02);
    }

    .history-item:hover {
        background: rgba(255, 230, 0, 0.041);
    }
    .meta {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .method {
        font-weight: 700;
        color: var(--pi);
        background: rgba(139, 92, 246, 0.06);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
    }
    .url {
        color: #cbd5e1;
        font-size: 13px;
    }
    .meta2 {
        font-size: 12px;
        color: #94a3b8;
    }

    .panel {
        display: flex;
        flex-direction: column; /* stack form + response vertically */
        height: 100%; /* fill available height from parent */
        min-height: 0; /* allow children to shrink */
        overflow: hidden; /* prevent panel overflow */
        border: 1px solid #2e2e10;
        border-radius: 8px;
    }

    .form .row {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 12px;
        padding: 10px;
    }
    .top-row {
        align-items: stretch;
        border-bottom: 1px solid #2e2e10;
        padding: 10px 10px 5px 10px;
    }
    .method-select {
        width: 110px;
        padding: 8px;
        border-radius: 6px;
        background: #2e2e10;
        color: var(--text);
        border: 1px solid rgba(255, 255, 255, 0.03);
    }
    .url-input {
        flex: 1;
        padding: 8px 10px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.02);
        color: var(--text);
        border: 1px solid rgba(255, 255, 255, 0.03);
    }
    .btn {
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        border: 0;
    }
    .btn.primary {
        background: var(--banana);
        color: #06121a;
        font-weight: 700;
    }

    .row .col {
        flex: 1;
    }
    label {
        font-size: 12px;
        color: var(--muted);
        margin-bottom: 6px;
        display: block;
    }
    .textarea {
        width: 100%;
        padding: 8px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 6px;
        color: var(--text);
        resize: none;
        border: 1px solid rgba(255, 255, 255, 0.03);
    }

    .response {
        flex: 1; /* take remaining space in panel */
        display: flex;
        flex-direction: column;
        min-height: 0; /* allow .response-body to shrink */
        overflow: hidden;
    }
    .response-meta {
        display: flex;
        gap: 18px;
        color: #9fb7d7;
        margin-bottom: 10px;
        padding-inline: 10px;
        border-bottom: 1px solid #2e2e10;
        padding-bottom: 10px;
        font-size: 13px;
    }
    .status {
        color: var(--pi);
    }

    .response-body {
        display: grid;
        grid-template-columns: 1fr 1fr; /* two panes */
        gap: 10px;
        flex: 1; /* fill response height */
        min-height: 0; /* necessary for scrollable children */
        overflow: hidden;
        padding: 10px;
    }

   

    .pane {
        display: grid;
        grid-template-rows: auto 1fr;
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid #2e2e10;
        min-height: 0;
    }

    .pane-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: #ffffff10;
        border-bottom: 1px solid #2e2e10;
        padding: 5px 10px 0 10px;
    }

    .pane-header h3 {
        margin: 0;
        font-size: 13px;
        color: var(--text);
    }

    .copy-btn {
        background: none;
        border: none;
        color: var(--banana);
        font-size: 12px;
        cursor: pointer;
        transition: opacity 0.2s ease;
    }

    .copy-btn:hover {
        opacity: 0.7;
    }
    .pre-scrollable {
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono",
            monospace;
        font-size: 12px;
        color: var(--text);
        background-color: rgb(0, 0, 0);
        padding-inline: 10px;
    }
    pre.mono {
        white-space: pre-wrap;
        word-break: break-word;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono",
            monospace;
        font-size: 12px;
        color: var(--text);
    }

    .muted {
        color: var(--muted);
        font-size: 13px;
        padding: 10px;
    }
    .error {
        color: #ffd7d7;
        background: #3b0a0a;
        padding: 8px;
        border-radius: 6px;
    }
</style>
