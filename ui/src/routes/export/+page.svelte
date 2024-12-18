<script lang="ts">
    import { onMount } from 'svelte';
    import Header from '$lib/Header.svelte';

    onMount(async () => {
    })
</script>

<Header title="Export/Import" description="Export and import data." />
<!-- checklist of all data types that one might want to export. "What data would you like to include in your export?" -->
<div>
    <h2>What data would you like to include in your export?</h2>
    <form>
        <label>
            <input type="checkbox" name="data" value="users" />
            <span>Users</span>
        </label>
        <br />
        <label>
            <input type="checkbox" name="data" value="transactions" />
            <span>Transactions</span>
        </label>
        <br />
        <label>
            <input type="checkbox" name="data" value="products" />
            <span>Products</span>
        </label>
        <br />
        <label>
            <input type="checkbox" name="data" value="settings" />
            <span>Settings</span>
        </label>
    </form>
</div>

<style>
    h2 {
        font-size: 1.5em;
    }
    label {
        cursor: pointer;
    }
    input[type="checkbox"] {
        outline: none;
        box-shadow: none;
    }
</style>