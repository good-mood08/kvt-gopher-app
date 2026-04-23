<script setup lang="ts">
const props = defineProps({
  /**
   * выключена ли кнопка
   * @default false
   */
    disabled: {
    default: false
  },
})

</script>

<template>
    <button class="button" :disabled="props.disabled">
      <TwentyText class="button-action-text"><slot>вперёд!</slot></TwentyText>
    </button>
  
</template>

<style scoped>


.button {
  padding: 12px 48px;
  border-radius: 8px;
  background-color: rgba(79, 125, 255, 1);
  display: inline-flex;
  justify-content: center;
  border: none;
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}



.button-action-text {
  color: #FFFFFF;
  font-size: 1.1rem;
  font-weight: 500;
}
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>