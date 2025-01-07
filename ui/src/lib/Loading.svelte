<script lang="ts">
  export let status: string = '';
  export let error: string = '';
</script>

<div id="plan-loading-animation">
  <div id="status">
    {status}
  </div>
  <div id="error">
    {error}
  </div>
  <div class="loader"></div>
</div>

<style>
  #error {
    color: red;
    margin-bottom: 1rem;
  }
  #status {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  #plan-loading-animation {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 80vh;
  }
  #plan-loading-animation .loader {
    border: 9px solid #f3f3f3;
    border-top: 9px solid black;
    /* border-top: 16px solid #3498db; */
    border-radius: 50%;
    width: 120px;
    height: 120px;
    animation: spin 2s linear infinite;
  }
</style>