<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h3>Configuración del Torneo</h3>

      <div class="config-section">
        <div class="config-item">
          <label for="buyin-input">Precio del Torneo (Buy-in):</label>
          <div class="input-with-currency">
            <span class="currency-symbol">{{  currency }}</span>
            <input
              id="buyin-input"
              type="number"
              v-model.number="buyIn"
              min="1"
              class="buyin-input"
            />
          </div>
        </div>

        <div class="config-item">
          <label for="tournament-type-select">Tipo de Torneo:</label>
          <select id="tournament-type-select" v-model="tournamentType">
            <option value="Normal">Normal</option>
            <option value="Progressive KO">Progressive KO</option>
            <option value="Total KO">Total KO</option>
            <option value="Mystery KO">Mystery KO</option>
          </select>
        </div>

        <div class="config-item">
          <label class="toggle-label">
            <span>In The Money (ITM):</span>
            <div class="toggle-switch" @click="isITM = !isITM" :class="{ active: isITM }">
              <div class="toggle-slider"></div>
            </div>
          </label>
        </div>

        <div class="config-item">
          <label for="remaining-players-input">Participantes Restantes:</label>
          <input
            id="remaining-players-input"
            type="number"
            v-model.number="remainingPlayers"
            min="2"
            class="remaining-input"
          />
        </div>
      </div>

      <div class="positions-section">
        <h4>Selecciona tu Posición (Hero)</h4>
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
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  width: 100%;
  max-width: 550px;
  box-sizing: border-box;
  margin: auto;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 90vh;
  overflow-y: auto;
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
  margin-bottom: 1.5rem;
  font-size: 1.6rem;
  font-weight: 700;
  color: #f9fafb;
  text-align: center;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

h4 {
  margin: 1.5rem 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #a78bfa;
  text-align: center;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.input-with-currency {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-symbol {
  position: absolute;
  left: 15px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #a78bfa;
  pointer-events: none;
}

.buyin-input,
.remaining-input {
  width: 100%;
  padding: 14px 14px 14px 40px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 10px;
  box-sizing: border-box;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.remaining-input {
  padding: 14px 18px;
  text-align: center;
}

.buyin-input:hover,
.remaining-input:hover {
  border-color: rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.9) 100%);
}

.buyin-input:focus,
.remaining-input:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(139, 92, 246, 0.1),
    0 0 12px rgba(139, 92, 246, 0.08);
}

select {
  padding: 14px 18px;
  font-size: 1.1rem;
  font-weight: 500;
  border-radius: 10px;
  box-sizing: border-box;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  cursor: pointer;
}

select:hover {
  border-color: rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.9) 100%);
}

select:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(139, 92, 246, 0.1),
    0 0 12px rgba(139, 92, 246, 0.08);
}

select option {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 12px 16px;
  font-weight: 500;
}

.toggle-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.toggle-switch {
  position: relative;
  width: 52px;
  height: 28px;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.9) 100%);
  border-radius: 14px;
  border: 1.5px solid rgba(156, 163, 175, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-switch.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.toggle-switch.active .toggle-slider {
  transform: translateX(24px);
}

.positions-section {
  margin-bottom: 1.5rem;
}

.positions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 1rem;
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
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  .modal-content {
    padding: 1.5rem;
    max-width: 95vw;
  }

  h3 {
    font-size: 1.3rem;
  }

  .positions-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .positions-grid button {
    padding: 10px 5px;
    font-size: 0.85rem;
    min-height: 48px;
  }
}

@media (max-width: 380px) {
  .positions-grid button {
    padding: 9px 4px;
    font-size: 0.8rem;
    min-height: 46px;
  }
}
</style>
