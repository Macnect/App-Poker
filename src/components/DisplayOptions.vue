<template>
  <div class="display-options-wrapper" ref="panelRef" @mousedown="startDrag" :style="{ position: 'absolute', left: panelPosition.x + 'px', top: panelPosition.y + 'px', cursor: (isDragging ? 'grabbing' : 'grab') }">
    <h3>Opciones mesa</h3>
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
    <div class="options-row">
      <button class="option-item" @click="gameStore.toggleReplay()">
        {{ gameStore.isReplaying ? '⏸️' : '▶️' }}
      </button>
      <button class="option-item" @click="gameStore.navigateHistory(-1)">◀</button>
      <button class="option-item" @click="gameStore.navigateHistory(1)">▶</button>
      <select class="option-item" @change="gameStore.setReplaySpeed($event.target.value)">
        <option value="2000">1x</option>
        <option value="1000">2x</option>
        <option value="500">4x</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../store/game';

// Definimos las propiedades y eventos para comunicarnos con el componente padre
defineProps({
  modelValue: String
});
defineEmits(['update:modelValue']);

const gameStore = useGameStore();

const panelRef = ref(null);
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const panelPosition = ref({ x: 0, y: 0 });

function startDrag(event) {
  isDragging.value = true;
  const rect = panelRef.value.getBoundingClientRect();
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
}

function drag(event) {
  if (!isDragging.value) return;
  panelPosition.value = {
    x: event.clientX - dragOffset.value.x,
    y: event.clientY - dragOffset.value.y
  };
}

function stopDrag() {
  isDragging.value = false;
  localStorage.setItem('displayOptionsPosition', JSON.stringify(panelPosition.value));
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
}

onMounted(() => {
  const savedPosition = localStorage.getItem('displayOptionsPosition');
  if (savedPosition) {
    panelPosition.value = JSON.parse(savedPosition);
    // Set initial position
    const rect = panelRef.value.getBoundingClientRect();
    panelPosition.value = {
      x: window.innerWidth / 1.25 - rect.width / 2,
      y: window.innerHeight - 350
    };
  }
});

onUnmounted(() => {
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
});
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
  width: 80px;
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