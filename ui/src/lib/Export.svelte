<script lang="ts">
  export let dataName: string;
  export let fileName: string;
  export let data: any;
  let open = false;

  // import { writeFile } from 'fs'

// const download = async (filename: string, text: string) => {
//   try {
//     await writeFile(
//       fileName,
//       text,
//       null,
//       (err) => {
//         if (err) {
//           console.error('Failed to save file:', err);
//         } else {
//           console.log('File saved successfully');
//         }
//       }
//       // {
//       //   create: true,
//       //   overwrite: true
//       // }
//       // callback: NoParamCallback,
//       // path: filename,
//       // contents: text,
//       // options: {
//       //   create: true,
//       //   overwrite: true
//       // }
//     );
//     console.log('File saved successfully');
//   } catch (error) {
//     console.error('Failed to save file:', error);
//   }
// }

  const download = (filename: string, text: string) => {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
</script>

<div class="mt-4 sm:ml-1 sm:mt-0 sm:flex-none">
  <button
    type="button"
    on:click={() => {open = true; console.log("opened export modal")}}
    >
    <svg class="inline-block w-10 h-10 ml-2" fill="rgb(75 85 99 / var(--tw-bg-opacity))" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V288H216c-13.3 0-24 10.7-24 24s10.7 24 24 24H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zM384 336V288H494.1l-39-39c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l80 80c9.4 9.4 9.4 24.6 0 33.9l-80 80c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l39-39H384zm0-208H256V0L384 128z"/></svg>
  </button>
</div>

<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" class:hidden={!open}/>

  <div class="fixed inset-0 z-10 overflow-y-auto" class:hidden={!open}>
    <div
      class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
    >
      <div
        class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
        class:hidden={!open}
      >
        <button
          type="button"
          class="absolute top-0 right-0 inline-flex items-center p-2 text-gray-400 hover:text-gray-500"
          on:click={() => {open = false}}
        >
          <span class="sr-only">Close</span>
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div class="mt-3 text-center sm:mt-5">
          <h3
            class="text-lg leading-6 font-medium text-gray-900"
            id="modal-title"
          >
            Export
          </h3>
          <div class="mt-2">
            <p class="text-sm text-gray-500">
              Export the current {dataName}?
            </p>
          </div>
        </div>
        <div class="mt-5 sm:mt-6">
          <button
            type="button"
            class="inline-flex justify-center w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            on:click={() => {
              console.log("exporting data")
              console.log(data)
              let currentTime = new Date().toISOString().replace(/:/g, '-')
              console.log(currentTime)
              download(`${fileName}-${currentTime}.json`, JSON.stringify(data))
            }}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
