<script lang="ts">
  export let error: any;
</script>
{#if error}
  <div class="bg-red-100
    border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
    <strong class="font-bold">Error: </strong>
    <span class="block sm:inline">{JSON.stringify(error)}</span>
    <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
      <svg
        class="fill-current h-6 w-6 text-red-500"
        role="button"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        on:click={() => {error = null}}
      >
        <title>Close</title>
        <path
          fill-rule="evenodd"
          d="M14.348 5.652a.5.5 0 01.708.708L11.707 10l3.349 3.349a.5.5 0 11-.708.708L11 10.707l-3.349 3.349a.5.5 0 01-.708-.708L10.293 10 6.944 6.651a.5.5 0 01.708-.708L11 9.293l3.349-3.349z"
          clip-rule="evenodd"
        />
      </svg>
    </span>
  </div>
{/if}