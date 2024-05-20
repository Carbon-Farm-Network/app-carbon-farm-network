<div id="plan-loading-animation">
  <div class="loader"></div>
</div>

<style>
  #plan-loading-animation {
    display: flex;
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