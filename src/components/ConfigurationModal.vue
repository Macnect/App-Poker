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
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  padding: 2rem;
  border-radius: 14px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  width: 100%;
  max-width: 500px;
  text-align: center;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h3 {
  margin-top: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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
  font-weight: 600;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 2px solid rgba(212, 175, 55, 0.2);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.positions-grid button:hover {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
}

.positions-grid button.selected {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
}

.positions-grid button.selected:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}

.confirm-btn {
  width: 100%;
  padding: 15px;
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  box-shadow: none;
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