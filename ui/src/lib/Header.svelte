<script lang="ts">
  export let title = 'test'
  export let description = 'this is the description'
</script>

<!-- <div class="h-full custom-background">
  <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
    <h2 class="pt-1 text-white text-2xl">
      {title}
    </h2>
    <p class="text-white text-xs">{description}</p>
  </div>
</div> -->

<div class="custom-background" style="height: 15vh; margin-bottom: 6px">
  <div class="mx-auto px-2 sm:px-6 lg:px-8">
    <h2 class="pt-1 text-white text-3xl">
      {title}
    </h2>
    <p class="text-white text-xs">
      {description}
    </p>
  </div>
</div>

<style>
  /* Custom CSS */
  .custom-background {
    background-image: url('/dsf.jpg');
    background-size: cover;
    background-position: center;
  }
</style>
