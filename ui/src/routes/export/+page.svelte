<script lang="ts">
    import { onMount } from 'svelte';
    import Header from '$lib/Header.svelte';
    import Loading from '$lib/Loading.svelte';
    import { allFacets, allFacetValues, allFacetGroups, allActions, allUnits, allAgents, allProcessSpecifications, allProposals, allResourceSpecifications, allRecipes, allRecipeExchanges, fullPlans, allHashChanges } from '../../crud/store';
    import { getAllActions, getAllAgents, getAllAgreements, getAllFacetGroups, getAllProcessSpecifications, getAllProposals, getAllRecipes, getAllRecipeExchanges, getAllResourceSpecifications, getAllUnits, getAllFullPlans, getAllHashChanges } from '../../crud/fetch';
    import { importUnits, importFacets, importAgents, importProcessSpecifications, importPlan, importResourceSpecifications, importProposals, importRecipes, importRecipeExchanges } from '../../crud/import';
    import { goto } from '$app/navigation';
    import { get } from 'svelte/store';
    import JSZip from 'jszip';
    import { saveAs } from 'file-saver';
    
    let importing = false;
    let exporting = false;
    let status = '';
    let error = '';
    let uploadButton: HTMLInputElement;

    let currentZip: JSZip;
    let importFiles: string[] = [];
    $: importFiles;

    let exportTypes = [
        {name: 'Facets', store: allFacetGroups},
        {name: 'Units', store: allUnits},
        {name: 'Agents', store: allAgents},
        {name: 'Process Specifications', store: allProcessSpecifications},
        {name: 'Resource Specifications', store: allResourceSpecifications},
        {name: 'Offers & Requests', store: allProposals},
        {name: 'Recipes', store: allRecipes},
        {name: 'Recipe Exchanges', store: allRecipeExchanges},
        {name: 'Plans', store: fullPlans},
    ]

    let selectedExportTypes = exportTypes.map(exportType => exportType.name);

    async function exportAll() {
        exporting = true;

        status = 'Generating export file...';
        // create and download a zip file with different json files
        let zip = new JSZip();
        // add facets file

        if (selectedExportTypes.includes('Facets')) {
            status = 'Retrieving facets...';
            try {
                await getAllFacetGroups();
                zip.file('facets.json', JSON.stringify(get(allFacetGroups)));
            } catch (e) {
                console.error(e);
                error = JSON.stringify(e);
            }
        }

        if (selectedExportTypes.includes('Units')) {
            status = 'Retrieving units...';
            try {
                await getAllUnits();
                zip.file('units.json', JSON.stringify(get(allUnits)));
            } catch (e) {
                console.error(e);
                error = JSON.stringify(e);
            }
        }

        if (selectedExportTypes.includes('Agents')) {
            status = 'Retrieving agents...';
            try {
                await getAllAgents();
                zip.file('agents.json', JSON.stringify(get(allAgents)));
            } catch (e) {
                console.error(e);
                error = JSON.stringify(e);
            }
        }

        if (selectedExportTypes.includes('Process Specifications')) {
            status = 'Retrieving process specifications...';
            try {
                await getAllProcessSpecifications();
                zip.file('processSpecifications.json', JSON.stringify(get(allProcessSpecifications)));
            } catch (e) {
                console.error(e);
                error = JSON.stringify(e);
            }
        }
        
        if (selectedExportTypes.includes('Resource Specifications')) {
            status = 'Retrieving resource specifications...';
            try {
                await getAllResourceSpecifications();
                zip.file('resourceSpecifications.json', JSON.stringify(get(allResourceSpecifications)));
            } catch (e) {
                console.error(e);
                error = JSON.stringify(e);
            }
        }

        if (selectedExportTypes.includes('Offers & Requests')) {
            status = 'Retrieving proposals...';
            try {
                await getAllProposals();
                zip.file('proposals.json', JSON.stringify(get(allProposals)));
            } catch (e) {
                console.error(e);
                error = JSON.stringify(e);
            }
        }

        if (selectedExportTypes.includes('Recipes')) {
            status = 'Retrieving recipes...';
            try {
                await getAllRecipes();
                zip.file('recipes.json', JSON.stringify(get(allRecipes)));
            } catch (e) {
                console.error(e);
                error = JSON.stringify(e);
            }
        }

        if (selectedExportTypes.includes('Recipe Exchanges')) {
            status = 'Retrieving recipe exchanges...';
            try {
                await getAllRecipeExchanges();
                zip.file('recipeExchanges.json', JSON.stringify(get(allRecipeExchanges)));
            } catch (e) {
                console.error(e);
                error = JSON.stringify(e);
            }
        }

        if (selectedExportTypes.includes('Plans')) {
            status = 'Retrieving plans...';
            try {
                await getAllFullPlans();
                zip.file('plans.json', JSON.stringify(get(fullPlans)));
            } catch (e) {
                console.error(e);
                error = JSON.stringify(e);
            }
        }

        zip.generateAsync({type:"blob"})
        .then(function(content: string) 
        {
            let currentTime = new Date().toLocaleString().replace(/[:\/]/g, '-').replace(/, /g, '_').replace(/ /g, '_');
            saveAs(content, `VF_Export_${currentTime}.zip`);
        });
        exporting = false;
    }

    async function openImportFile(file: File) {
        let zip = new JSZip();
        currentZip = zip;
        console.log(file);
        const reader = new FileReader();
        console.log(reader);
        reader.onload = async () => {
            console.log(reader.result);
            const result = reader.result as ArrayBuffer;
            console.log(result);
            zip.loadAsync(result)
            .then(async function(zip) {
                for (const relativePath in zip.files) {
                    importFiles.push(relativePath);
                    importFiles = [...importFiles];
                }
            });
        }
        reader.readAsArrayBuffer(file);
    }

    async function importZip(zip: JSZip) {
        // handle uploaded zip of json files
        importing = true;
        // console.log(zip);
        // read each file in the zip
        for (const relativePath in zip.files) {
            const fileData = await zip.files[relativePath].async("string");
            const parsedData = JSON.parse(fileData);
            console.log("+++", parsedData);
            switch (relativePath) {
            case 'facets.json':
                if (importFiles.includes('facets.json')) {
                    status = 'Importing facets...';
                    await importFacets(parsedData);
                }
                break;
            case 'units.json':
                if (importFiles.includes('units.json')) {
                    status = 'Importing units...';
                    await importUnits(parsedData);
                }
                break;
            case 'agents.json':
                if (importFiles.includes('agents.json')) {
                    status = 'Importing agents...';
                    await importAgents(parsedData);
                }
                break;
            case 'processSpecifications.json':
                if (importFiles.includes('processSpecifications.json')) {
                    status = 'Importing process specifications...';
                    await importProcessSpecifications(parsedData);
                }
                break;
            case 'resourceSpecifications.json':
                if (importFiles.includes('resourceSpecifications.json')) {
                    status = 'Importing resource specifications...';
                    await importResourceSpecifications(parsedData);
                }
                break;
            case 'proposals.json':
                if (importFiles.includes('proposals.json')) {
                    status = 'Importing proposals...';
                    await importProposals(parsedData);
                }
                break;
            case 'recipes.json':
                if (importFiles.includes('recipes.json')) {
                    status = 'Importing recipes...';
                    await importRecipes(parsedData);
                }
                break;
            case 'recipeExchanges.json':
                if (importFiles.includes('recipeExchanges.json')) {
                    status = 'Importing recipe exchanges...';
                    await importRecipeExchanges(parsedData);
                }
                break;
            case 'plans.json':
                if (importFiles.includes('plans.json')) {
                    status = 'Importing plans...';
                    for (const plan of parsedData) {
                        await importPlan(plan);
                    }
                }
                break;
            default:
                console.error('Unknown file in zip:', relativePath);
            }
        }
        importing = false;
        goto("/")
    }

    onMount(async () => {
        await getAllHashChanges();
    })
</script>

<Header title="Export/Import" description="Export and import data." />
{#if importing || exporting}
    <Loading {status} {error} />
{/if}
<div class="p-12 grid grid-cols-2 gap-8">
    <div>
        <h2 class="text-xl font-bold mb-4">Export</h2>
        <!-- select the data you would like to export as checkboxes -->
        {#each exportTypes as {name, store}}
            <label class="flex items-center">
                <input
                    on:change={() => {
                        if (selectedExportTypes.includes(name)) {
                            selectedExportTypes = selectedExportTypes.filter(exportType => exportType !== name);
                        } else {
                            selectedExportTypes = [...selectedExportTypes, name];
                        }
                    }}
                    type="checkbox"
                    checked = {selectedExportTypes.includes(name)}
                >
                <span class="ml-2">{name}</span>
            </label>
        {/each}
        <button
            type="button"
            style="margin-top: 1rem;"
            on:click={async () => {
                exportAll()
            }}
            disabled={exporting || importing || selectedExportTypes.length === 0}
            class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >Export selected data
        </button>
    </div>
    <div>
        <h2 class="text-xl font-bold mb-4">Import</h2>
        <input
            bind:this={uploadButton}
            type="file"
            class="mt-3 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            on:click={() => {
                uploadButton.value = '';
                importFiles = [];
            }}
            on:change={async (event) => {
            let file = (event.target)?.files[0];
            if (file) {
                openImportFile(file);
            }
            }}
        />

        <div
            class="mt-3"
        >
        {#each importFiles as fileName}
            <div class="flex items-center justify-between bg-gray-100 p-2 rounded-md" style="margin-bottom: 0.5rem;">
                <span>{fileName}</span>
                <button
                    type="button"
                    on:click={() => {
                        importFiles = importFiles.filter(f => f !== fileName);
                    }}
                    class="rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >Remove
                </button>
            </div>
        {/each}
        </div>
        <button
            type="button"
            on:click={() => {
                importZip(currentZip);
            }}
            disabled={importing || exporting || importFiles.length === 0}
            class="block rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >Import data
        </button>
    </div>
</div>