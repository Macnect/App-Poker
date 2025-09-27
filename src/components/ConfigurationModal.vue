<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h3>Selecciona tu Posición (Hero)</h3>
      <div class="positions-grid">
        <button
          v-for="pos in positions"
          :key="pos"
          @click="selectedPosition = pos"
          :class="{ selected: selectedPosition === pos }"
        >
          {{ pos }}
        </button>
      </div>
      <button class="confirm-btn" @click="$emit('confirm', selectedPosition)" :disabled="!selectedPosition">
        Confirmar e Iniciar Mano
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  positions: Array,
});
defineEmits(['confirm']);

const selectedPosition = ref(null);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-content {
  background-color: #2d3748;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  width: 100%;
  max-width: 500px;
  text-align: center;
}
h3 {
  margin-top: 0;
  font-size: 1.5rem;
}
.positions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 10px;
  margin: 2rem 0;
}
.positions-grid button {
  padding: 15px;
  font-size: 1rem;
  font-weight: bold;
  background-color: var(--btn-grey, #4A5568);
  border: 2px solid transparent;
}
.positions-grid button.selected {
  background-color: var(--primary-color);
  border-color: #f6e05e;
}
.confirm-btn {
  width: 100%;
  padding: 15px;
  font-size: 1.2rem;
  font-weight: bold;
}

@media (max-width: 480px) {
  .modal-content {
    padding: 1.5rem;
  }
  .positions-grid button {
    padding: 12px;
    font-size: 0.9rem;
  }
  .confirm-btn {
    padding: 12px;
    font-size: 1.1rem;
  }
}
</style>