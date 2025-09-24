<template>
  <div class="display-options-wrapper">
    <h3>Color de Mesa</h3>
    <div class="options-row">
      <select class="option-item" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)">
        <option value="#28563a">Verde</option>
        <option value="#3a4c8a">Azul</option>
        <option value="#8a3a3a">Rojo</option>
        <option value="#553c9a">Morado</option>
        <option value="#b7791f">Oro</option>
        <option value="#1A202C">Negro</option>
        <option value="#4A5568">Gris</option>
      </select>

      <button class="option-item" @click="gameStore.toggleDisplayMode()">
        {{ gameStore.displayInBBs ? gameStore.currency : 'BBs' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../store/game';

// Definimos las propiedades y eventos para comunicarnos con el componente padre
defineProps({
  modelValue: String
});
defineEmits(['update:modelValue']);

const gameStore = useGameStore();
</script>

<style scoped>
.display-options-wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
  padding: 15px;
  background-color: #2d3748;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
}

.options-row {
  display: flex;
  gap: 15px;
  align-items: center;
}

.option-item {
  height: 50px;
  width: 120px;
  padding: 0 15px;
  font-size: 1.2rem;
  font-weight: bold;
  border: 1px solid #000;
  border-radius: 8px;
  background-color: #718096;
  color: white;
  cursor: pointer;
  text-align: center;
}
</style>