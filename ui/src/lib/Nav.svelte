<script lang="ts">
  import { goto } from '$app/navigation'
  import Logo from '$lib/Logo.svelte'

  function navigate(location: string) {
    dropdownMenuOpen = false
    mobileMenuOpen = false
    goto(location)
  }

  export let path: string
  let mobileMenuOpen = false
  let dropdownMenuOpen = false
  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen
  }
  function toggleDropdownMenu() {
    dropdownMenuOpen = !dropdownMenuOpen
  }
</script>

<!-- This example requires Tailwind CSS v2.0+ -->
<nav class="h-full">
  <div class="px-2 sm:px-6 lg:px-8 h-full">
    <div class="relative flex items-center justify-between h-full">
      <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
        <!-- Mobile menu button-->
        <button
          type="button"
          class="inline-flex items-center justify-center p-2 rounded-md hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          aria-controls="mobile-menu"
          aria-expanded="false"
          on:click={toggleMobileMenu}
        >
          <span class="sr-only">Open main menu</span>
          <!--
            Icon when menu is closed.

            Heroicon name: outline/menu

            Menu open: "hidden", Menu closed: "block"
          -->
          <svg
            class="{mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <!--
            Icon when menu is open.

            Heroicon name: outline/x

            Menu open: "block", Menu closed: "hidden"
          -->
          <svg
            class="{mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div
        class="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start"
      >
        <div class="flex-shrink-0 flex items-center">
          <Logo />
          <!-- <img
            class="block lg:hidden h-8 w-auto"
            src="https://tailwindui.com/img/logos/workflow-mark-indigo-500.svg"
            alt="Workflow"
          />
          <img
            class="hidden lg:block h-8 w-auto"
            src="https://tailwindui.com/img/logos/workflow-logo-indigo-500-mark-white-text.svg"
            alt="Workflow"
          /> -->
        </div>
        <div class="hidden sm:block sm:ml-6 w-full sm:mt-3">
          <div class="flex justify-end space-x-4">
            <!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -->

            <button
              style="cursor: pointer;"
              on:click={() => navigate('/')}
              class="{path === '/' ? 'nav-active' : 'nav-inactive'} nav-default"
            >
              Map
            </button>

            <button
              style="cursor: pointer;"
              on:click={() => navigate('/offers')}
              class="{path === '/offers' ? 'nav-active' : 'nav-inactive'} nav-default"
            >
              Offers
            </button>

            <button
              style="cursor: pointer;"
              on:click={() => navigate('/requests')}
              class="{path === '/requests' ? 'nav-active' : 'nav-inactive'} nav-default"
            >
              Requests
            </button>

            <!-- <a
              href="/offers"
              class="{path === '/offers' ? 'nav-active' : 'nav-inactive'} nav-default">
              Offers
            </a> -->

            <button
              style="cursor: pointer;"
              on:click={() => navigate('/plans')}
              class="{path === '/plans' ? 'nav-active' : 'nav-inactive'} nav-default"
            >
              Plans
            </button>


            <button
              style="cursor: pointer;"
              class="{path === '/commitments' ? 'nav-active' : 'nav-inactive'} nav-default"
              on:click={() => navigate('/commitments')}
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-1">Exchanges</button
            >


            <button
              style="cursor: pointer;"
              class="{path === '/economic_events' ? 'nav-active' : 'nav-inactive'} nav-default"
              on:click={() => navigate('/economic_events')}
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-1">Activity</button
            >


            <button
              style="cursor: pointer;"
              class="{path === '/economic_resources' ? 'nav-active' : 'nav-inactive'} nav-default"
              on:click={() => navigate('/economic_resources')}
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-1">Inventory</button
            >
          </div>
        </div>
      </div>
      <div
        class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
      >
        <!-- <button
          type="button"
          class="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
          <span class="sr-only">View notifications</span>
          <svg
            class="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button> -->

        <!-- Profile dropdown -->
        <div class="ml-3 relative">
          <div>
            <button
              type="button"
              class="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              id="user-menu-button"
              aria-expanded="false"
              aria-haspopup="true"
              on:click={toggleDropdownMenu}
            >
              <span class="sr-only">Open user menu</span>
              <img class="h-8 w-8 rounded-full" src="/profile.png" alt="" />
              <!-- <img
                class="h-8 w-8 rounded-full"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
              /> -->
            </button>
          </div>

          <!--
            Dropdown menu, show/hide based on menu state.

            Entering: "transition ease-out duration-100"
              From: "transform opacity-0 scale-95"
              To: "transform opacity-100 scale-100"
            Leaving: "transition ease-in duration-75"
              From: "transform opacity-100 scale-100"
              To: "transform opacity-0 scale-95"
          -->
          <div
            class="{dropdownMenuOpen
              ? ''
              : 'hidden'} origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
            tabindex="-1"
            style="z-index: 99999;"
          >
            <!-- Active: "bg-gray-100", Not Active: "" -->
            <button
              type="button"
                class="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
              on:click={() => navigate('/agents')}
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-1">Agents</button
            >
            <button
              type="button"
              class="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
              style="text-align: left;"
              on:click={() => navigate('/resource_specifications')}
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-1">Resource specifications</button
            >
            <button
              type="button"
              class="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
              on:click={() => navigate('/process_specifications')}
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-1">Process specifications</button
            >
            <button
              type="button"
              class="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
              on:click={() => navigate('/units')}
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-1">Units</button
            >
            <button
              type="button"
              class="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
              on:click={() => navigate('/facets')}
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-1">Facets</button
            >
            <button
              type="button"
              class="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
              on:click={() => navigate('/recipes')}
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-1">Recipes</button
            >
            <button
              type="button"
              class="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
              on:click={() => navigate('/recipe_exchanges')}
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-1">Recipe Exchanges</button
            >
            <button
              type="button"
              class="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
              on:click={() => navigate('/export')}
              role="menuitem"
              tabindex="-1"
              id="user-menu-item-1">Export/Import</button
            >
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile menu, show/hide based on menu state. -->
  <div class="{mobileMenuOpen ? '' : 'hidden'} sm:hidden" id="mobile-menu" style="z-index: 99999999; position: relative; background: white;">
    <div class="px-2 pt-2 pb-3 space-y-1">
      <button
        style="cursor: pointer;"
        on:click={() => navigate('/')}
        class="{path === '/' ? 'nav-active' : 'nav-inactive'} nav-default block"
      >
        Map
      </button>

      <button
        style="cursor: pointer;"
        on:click={() => navigate('/offers')}
        class="{path === '/offers' ? 'nav-active' : 'nav-inactive'} nav-default block"
      >
        Offers
      </button>

      <button
        style="cursor: pointer;"
        on:click={() => navigate('/requests')}
        class="{path === '/requests' ? 'nav-active' : 'nav-inactive'} nav-default block"
      >
        Requests
      </button>

      <button
        style="cursor: pointer;"
        on:click={() => navigate('/plans')}
        class="{path === '/plans' ? 'nav-active' : 'nav-inactive'} nav-default block"
      >
        Plans
      </button>
    </div>
  </div>
</nav>

<style>
  .nav-default {
    @apply text-gray-300 px-3 py-2 rounded-md text-base font-medium;
  }

  .nav-default:hover {
    @apply bg-gray-700 text-white;
  }

  .nav-active {
    @apply bg-gray-900 text-white;
  }

  .nav-inactive {
    @apply text-gray-900;
  }

  .nav-inactive:hover {
    @apply bg-gray-700 text-white;
  }
</style>