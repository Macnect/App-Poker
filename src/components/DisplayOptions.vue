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
/* Tipografía premium */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.display-options-wrapper {
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  border-radius: 14px;
  padding: clamp(12px, 1.5vw, 24px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.15);
  color: white;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 1.5vh, 20px);
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.display-options-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
}

h3 {
  margin: 0 0 1rem 0;
  font-size: clamp(1.2rem, 3vmin, 1.6rem);
  font-weight: 700;
  color: #fff;
  text-align: center;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.options-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.options-row label {
  font-weight: 600;
  color: rgba(212, 175, 55, 0.9);
  flex-shrink: 0;
  font-size: clamp(0.85rem, 2vmin, 1rem);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.option-item {
  height: clamp(38px, 6vmin, 52px);
  padding: 0 14px;
  font-size: clamp(0.9rem, 2.5vmin, 1.2rem);
  font-weight: 600;
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 10px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  cursor: pointer;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.option-item:hover {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

select.option-item {
  flex-grow: 1;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23fff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  padding-right: 35px;
}

select.option-item option {
  background-color: #1f2937;
  color: white;
  padding: 8px;
}

button.option-item {
  min-width: 52px;
  font-weight: 700;
}

button.option-item:active {
  transform: translateY(0);
}
</style>