<template>
    <div class="game-wrapper">
      <div class="setup-container" v-if="gameStarted">
    
        <button v-if="gameStarted"
          @click="emit('gameOver')" 
          class="start-button"
        >
          Дальше
        </button>
      </div>
      <WordleGame :word="word" @game-over="gameStarted = true" />
    </div>
  </template>
  
<script setup lang="ts">
const emit = defineEmits(['gameOver'])
const props = defineProps<{
  /**
   * загадоное слово
   */
    word: string
  }>()

  const word = ref(props.word)
  const gameStarted = ref(false)

  </script>
  
  <style>
  .game-wrapper {
    min-height: 100vh;
    background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
  }
  
  .setup-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
  }
  
  .word-input {
    padding: 0.5rem 1rem;
    font-size: 1.125rem;
    border: 2px solid #d1d5db;
    border-radius: 0.5rem;
    width: 16rem;
    outline: none;
    transition: all 0.2s ease;
  }
  
  .word-input:focus {
  border-color: #4f7dff;
  box-shadow: 0 0 0 2px rgba(79, 125, 255, 0.2);
  }
  
  .start-button {
    padding: 0.5rem 1.5rem;
  background-color: #4f7dff;
    color: white;
    border-radius: 0.5rem;
    font-weight: 600;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }
  
  .start-button:hover:not(:disabled) {
  background-color: #3f6df0;
  }
  
  .start-button:focus {
  box-shadow: 0 0 0 4px rgba(79, 125, 255, 0.2);
  }
  
  .start-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  </style>