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

      <div class="modal-actions">
        <button class="confirm-btn" @click="confirmAndStart" :disabled="!selectedPosition">
          Confirmar e Iniciar Mano
        </button>
        <button class="back-btn" @click="$emit('cancel')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="back-icon">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          <span>Volver</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  positions: Array,
  currency: String,
  initialBuyIn: Number,
  initialTournamentType: String,
  initialIsITM: Boolean,
  initialRemainingPlayers: Number,
});

const emit = defineEmits(['confirm', 'cancel']);

const selectedPosition = ref(null);
const buyIn = ref(props.initialBuyIn || 100);
const tournamentType = ref(props.initialTournamentType || 'Normal');
const isITM = ref(props.initialIsITM || false);
const remainingPlayers = ref(props.initialRemainingPlayers || 50);

function confirmAndStart() {
  if (!selectedPosition.value) return;

  emit('confirm', {
    heroPosition: selectedPosition.value,
    buyIn: buyIn.value,
    tournamentType: tournamentType.value,
    isITM: isITM.value,
    remainingPlayers: remainingPlayers.value,
  });
}
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
  overflow-y: auto;
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
  padding: 1.75rem;
  border-radius: 14px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  width: 100%;
  max-width: 480px;
  text-align: center;
  box-sizing: border-box;
  margin: 0 auto;
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
  margin-bottom: 1.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.3;
}

.positions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin: 2rem 0;
  width: 100%;
}

.positions-grid button {
  padding: 12px 10px;
  font-size: 0.95rem;
  font-weight: 600;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: none;
  line-height: 1.3;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  white-space: nowrap;
}

.positions-grid button:hover {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.positions-grid button.selected {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
}

.positions-grid button.selected:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.confirm-btn {
  width: 100%;
  padding: 15px;
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
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

.back-btn {
  width: 100%;
  padding: 12px 15px;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(74, 85, 104, 0.8) 0%, rgba(45, 55, 72, 1) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.back-btn:hover {
  background: linear-gradient(135deg, rgba(74, 85, 104, 1) 0%, rgba(55, 65, 81, 1) 100%);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.back-icon {
  width: 20px;
  height: 20px;
  color: #d1d5db;
  transition: all 0.3s ease;
}

.back-btn:hover .back-icon {
  color: #a78bfa;
}

/* Responsive */
@media (max-width: 600px) {
  .modal-overlay {
    padding: 1.25rem;
  }

  .modal-content {
    padding: 1.5rem 1.25rem;
    max-width: min(95vw, 420px);
  }

  h3 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .positions-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 1.5rem 0;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 1rem;
  }

  .modal-content {
    padding: 1.5rem 1rem;
    max-width: min(92vw, 380px);
  }

  h3 {
    font-size: 1.15rem;
    margin-bottom: 0.75rem;
  }

  .positions-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 1.25rem 0;
  }

  .positions-grid button {
    padding: 10px 5px;
    font-size: 0.85rem;
    min-height: 48px;
  }

  .confirm-btn {
    padding: 12px;
    font-size: 1.05rem;
  }
}

@media (max-width: 380px) {
  .modal-overlay {
    padding: 0.75rem;
  }

  .modal-content {
    padding: 1.25rem 0.85rem;
    border-radius: 12px;
    max-width: min(90vw, 340px);
  }

  h3 {
    font-size: 1.05rem;
    margin-bottom: 0.5rem;
  }

  .positions-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 7px;
    margin: 1rem 0;
  }

  .positions-grid button {
    padding: 9px 4px;
    font-size: 0.8rem;
    border-radius: 8px;
    min-height: 46px;
    white-space: normal;
    word-break: break-word;
  }

  .confirm-btn {
    padding: 11px;
    font-size: 0.95rem;
    border-radius: 8px;
  }
}

@media (max-width: 320px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-content {
    padding: 1rem 0.75rem;
    max-width: min(88vw, 300px);
  }

  h3 {
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }

  .positions-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin: 0.85rem 0;
  }

  .positions-grid button {
    padding: 8px 2px;
    font-size: 0.7rem;
    min-height: 44px;
    white-space: normal;
    word-break: break-word;
    line-height: 1.2;
  }

  .confirm-btn {
    padding: 10px;
    font-size: 0.9rem;
  }
}

/* Landscape mode - optimized for horizontal screens with limited height */
@media screen and (orientation: landscape) and (max-height: 600px) {
  .modal-overlay {
    padding: 0.75rem;
    align-items: flex-start;
    overflow-y: auto;
  }

  .modal-content {
    padding: 1.25rem 1.5rem;
    max-width: min(70vw, 600px);
    margin: auto 0;
  }

  h3 {
    font-size: 1.2rem;
    margin-bottom: 0.75rem;
  }

  .positions-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin: 1rem 0;
  }

  .positions-grid button {
    padding: 8px 6px;
    font-size: 0.85rem;
    min-height: 42px;
  }

  .confirm-btn {
    padding: 10px 16px;
    font-size: 1rem;
  }
}
</style>
