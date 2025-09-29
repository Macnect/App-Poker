<template>
  <!-- Se ha eliminado la lógica de arrastre y el posicionamiento absoluto -->
  <div class="display-options-wrapper">
    <h3>Opciones Replay</h3>
    <div class="options-row">
      <label for="table-color-select">Color Mesa:</label>
      <select id="table-color-select" class="option-item" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)">
        <option value="#28563a">Verde</option>
        <option value="#3a4c8a">Azul</option>
        <option value="#8a3a3a">Rojo</option>
        <option value="#553c9a">Morado</option>
        <option value="#b7791f">Oro</option>
        <option value="#1A202C">Negro</option>
        <option value="#4A5568">Gris</option>
      </select>
    </div>
     <div class="options-row">
       <label>Modo Display:</label>
      <button class="option-item" @click="gameStore.toggleDisplayMode()">
        {{ gameStore.displayInBBs ? gameStore.currency : 'BBs' }}
      </button>
    </div>
    <div class="options-row">
       <label>Controles:</label>
      <button class="option-item" @click="gameStore.navigateHistory(-1)">◀</button>
      <button class="option-item" @click="gameStore.toggleReplay()">
        {{ gameStore.isReplaying ? '⏸️' : '▶️' }}
      </button>
      <button class="option-item" @click="gameStore.navigateHistory(1)">▶</button>
    </div>
     <div class="options-row">
       <label for="replay-speed-select">Velocidad:</label>
       <select id="replay-speed-select" class="option-item" @change="gameStore.setReplaySpeed($event.target.value)">
        <option value="2000">1x</option>
        <option value="1000">2x</option>
        <option value="500">4x</option>
      </select>
    </div>
  </div>
</template>

<script setup>
// Se eliminan los imports que ya no son necesarios (ref, onMounted, onUnmounted)
import { useGameStore } from '../store/game';

// Las props y emits se mantienen igual
defineProps({
  modelValue: String
});
defineEmits(['update:modelValue']);

const gameStore = useGameStore();

// Se ha eliminado toda la lógica de JavaScript relacionada con el arrastre del panel.
</script>

<style scoped>
/* Estilos completamente nuevos para que el componente se comporte como un panel fijo */
.display-options-wrapper {
  background-color: #2d3748;
  border-radius: 12px;
  padding: clamp(10px, 1.5vw, 20px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: clamp(2px, 0.4vw, 3px) solid var(--border-color);
  color: white;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 1.5vh, 20px);
  align-items: center;
  justify-content: center; /* Centra el contenido verticalmente */
  width: 100%; /* Ocupa todo el ancho de su celda en el grid */
  height: 100%; /* Ocupa toda la altura de su celda en el grid */
}

h3 {
  margin: 0 0 1rem 0;
  font-size: clamp(1.2rem, 3vmin, 1.6rem);
  font-weight: bold;
  color: white;
  text-align: center;
}

.options-row {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.options-row label {
  font-weight: bold;
  color: #a0aec0;
  flex-shrink: 0;
}

.option-item {
  height: clamp(35px, 6vmin, 50px);
  padding: 0 10px;
  font-size: clamp(0.9rem, 2.5vmin, 1.2rem);
  font-weight: bold;
  border: 1px solid #000;
  border-radius: 8px;
  background-color: #718096;
  color: white;
  cursor: pointer;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

select.option-item {
  flex-grow: 1;
}

button.option-item {
  min-width: 50px;
}
</style>