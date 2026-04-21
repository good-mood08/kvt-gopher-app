

<template>


  <div class="app-container">
    <div class="container">

      <WelcomeScreen />
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  display: flex;
  justify-content: center;
}
.app-container {
  background: #f7fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
}

@media (max-width: 480px) {
  .app-container {
    padding: 12px;
  }
}
</style>