

<template>
  <div class="app-container">
    <div class="container">
      <WelcomeScreen />
    </div>
  </div>
</template>

<style scoped>
.container {
  width: min(100%, 420px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-container {
  background: #f7fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  padding: clamp(12px, 3vw, 24px);
  box-sizing: border-box;
}

@media (max-width: 480px) {
  .app-container {
    min-height: 100svh;
  }
}
</style>