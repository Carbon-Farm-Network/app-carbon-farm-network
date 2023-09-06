<script lang="ts">
  import type { Proposal } from '@valueflows/vf-graphql'

  let dropdownOpen = false
  export let allData: any[]
  export let matchedData: any[] = []
  export let panelInfo: any | undefined;

  let searchInput = ""
  function filter() {
    matchedData = allData.filter(datum => matchAgent(searchInput.toLowerCase().split(' '), datum))
  }
  function matchAgent(terms: string[], datum: any): boolean {
    return terms.every((term) => {
      return datum['name'].includes(term)
        || datum['offers'].some((o: Proposal) => o.name?.includes(term) || o.note?.includes(term))
    })
  }

  $: {
    console.log('SEARCH', allData, matchedData)
  }
</script>

<div style="z-index: 10000" class="absolute inset-0 h-16 sm:max-w-3xl mx-auto">
  <div class="mt-6 relative">
    <label for="search" class="sr-only">Search</label>
    <input
      type="text"
      name="search"
      id="search"
      class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
      placeholder="Type keywords here to search or filter"
      autocomplete="off"
      bind:value={searchInput}
      on:input={filter}
    />

    <!--
      Select popover, show/hide based on select state.

      Entering: ""
        From: ""
        To: ""
      Leaving: "transition ease-in duration-100"
        From: "opacity-100"
        To: "opacity-0"
    -->
    {#if searchInput !== "" }
      <ul
        class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
        tabindex="-1"
        role="listbox"
        aria-labelledby="listbox-label"
        aria-activedescendant="listbox-option-3"
      >
        <!--
        Select option, manage highlight styles based on mouseenter/mouseleave and keyboard navigation.

        Highlighted: "text-white bg-indigo-600", Not Highlighted: "text-gray-900"
      -->
        {#each matchedData as agent}
        <li
        on:click={() => {panelInfo = agent}}
        on:keypress={() => {panelInfo = agent}}
          class="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9"
          id="listbox-option-0"
          role="option"
          aria-selected="false"
        >
          <div class="flex items-center">
            <!-- Online: "bg-green-400", Not Online: "bg-gray-200" -->
            <span
              class="bg-green-400 flex-shrink-0 inline-block h-2 w-2 rounded-full"
              aria-hidden="true"
            />
            <!-- Selected: "font-semibold", Not Selected: "font-normal" -->
            <span class="font-normal ml-3 block truncate">
              {agent.name}
              <span class="sr-only"> is online</span>
            </span>
          </div>

          <!--
          Checkmark, only display for selected option.

          Highlighted: "text-white", Not Highlighted: "text-indigo-600"
        -->
          <span class="text-indigo-600 absolute inset-y-0 right-0 flex items-center pr-4">
            <!-- Heroicon name: solid/check -->
            <svg
              class="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
        </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
