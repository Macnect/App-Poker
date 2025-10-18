<template>
  <div class="live-session-container">
    <div class="session-panel">

      <!-- WIDGET DE CONFIGURACIÓN -->
      <div class="widget config-widget">
        <!-- Botón de guardar minimalista en la esquina superior -->
        <button
          class="save-icon-btn"
          @click="saveConfiguration"
          :title="saveButtonText"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="save-icon">
            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
          </svg>
          <span v-if="saveButtonText === '✓ Guardado'" class="saved-indicator">✓</span>
        </button>

         <div class="widget-header">
          <span>CONFIGURACIÓN DEL TORNEO</span>
        </div>
        <fieldset class="config-fieldset">
          <div class="config-grid">
            <div class="config-item">
              <label for="game-type">Tipo de Juego</label>
              <select id="game-type" v-model="sessionStore.gameType">
                <option value="holdem">No-Limit Hold'em</option>
                <option value="omaha">Pot Limit Omaha</option>
                <option value="pineapple">Crazy Pineapple</option>
              </select>
            </div>
            <div class="config-item">
              <label for="tournament-type">Tipo de Torneo</label>
              <select id="tournament-type" v-model="sessionStore.tournamentType">
                <option value="Normal">Normal</option>
                <option value="Progressive KO">Progressive KO</option>
                <option value="Total KO">Total KO</option>
                <option value="Mystery KO">Mystery KO</option>
                <option value="Rebuy">Rebuy</option>
                <option value="Clasificatorio">Clasificatorio</option>
              </select>
            </div>
            <div class="config-item">
              <label for="structure">Estructura</label>
              <select id="structure" v-model="sessionStore.structure">
                <option value="Lenta">Lenta</option>
                <option value="Normal">Normal</option>
                <option value="Turbo">Turbo</option>
                <option value="Hyper Turbo">Hyper Turbo</option>
              </select>
            </div>
            <div class="config-item">
              <label for="buy-in">Buy-in</label>
              <input type="number" id="buy-in" v-model.number="sessionStore.buyIn" placeholder="Ej: 50">
            </div>
            <div class="config-item">
              <label for="location">Lugar</label>
              <input type="text" id="location" v-model="sessionStore.location" placeholder="Ej: Casino Gran Vía">
            </div>
            <div class="config-item">
              <label for="currency">Moneda</label>
              <select id="currency" v-model="sessionStore.currency">
                <option>$</option><option>€</option><option>£</option>
              </select>
            </div>
            <div class="config-item">
              <label for="initial-stack">Stack Inicial</label>
              <input type="number" id="initial-stack" v-model.number="sessionStore.initialStack" placeholder="Ej: 5000">
            </div>
            <div class="config-item">
              <label for="duration">Duración (HH:MM)</label>
              <input type="time" id="duration" v-model="durationTime" placeholder="00:00">
            </div>
          </div>
        </fieldset>
      </div>

      <!-- CONTROLES PRINCIPALES -->
      <div class="main-controls">
        <button @click="openCreateTournamentModal" class="btn-play">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
          <span>CREAR TORNEO</span>
        </button>
      </div>
    </div>
    <EndTournamentModal
      v-if="showEndSessionModal"
      @confirm="handleConfirmEndSession"
      @cancel="handleCancelModal"
      :is-saving="isSaving"
    />

    <!-- Notificación toast -->
    <Transition name="toast">
      <div v-if="showToast" class="toast-notification" :class="toastType">
        <div class="toast-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
          </svg>
        </div>
        <span class="toast-message">{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useTournamentSessionStore } from '../store/useTournamentSessionStore';
import { useAuthStore } from '../store/useAuthStore';
import EndTournamentModal from '../components/EndTournamentModal.vue';

const sessionStore = useTournamentSessionStore();
const authStore = useAuthStore();
const showEndSessionModal = ref(false);
const isSaving = ref(false);

const saveButtonText = ref('Guardar cambios');

// Computed property bidireccional para manejar la duración en formato HH:MM
const durationTime = computed({
  get() {
    const hours = String(sessionStore.durationHours || 0).padStart(2, '0');
    const minutes = String(sessionStore.durationMinutes || 0).padStart(2, '0');
    return `${hours}:${minutes}`;
  },
  set(value) {
    if (!value) {
      sessionStore.durationHours = 0;
      sessionStore.durationMinutes = 0;
      return;
    }
    const [hours, minutes] = value.split(':').map(v => parseInt(v) || 0);
    sessionStore.durationHours = hours;
    sessionStore.durationMinutes = minutes;
  }
});

// Sistema de notificaciones toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
let toastTimeout = null;

function showNotification(message, type = 'success') {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;

  // Limpiar timeout anterior si existe
  if (toastTimeout) clearTimeout(toastTimeout);

  // Ocultar después de 3 segundos
  toastTimeout = setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

async function handleConfirmEndSession(sessionData) {
  isSaving.value = true;
  try {
    await sessionStore.saveTournament(sessionData);
    showEndSessionModal.value = false;

    // Determinar el mensaje según si continúa o finaliza
    const message = sessionData.isDay2
      ? '✅ Día guardado. Torneo en progreso'
      : '✅ Torneo finalizado y guardado';
    showNotification(message);

    // Limpiar el flag de reanudación si estaba activo
    if (sessionStore.isResuming) {
      sessionStore.clearResumingFlag();
    }
  } catch (error) {
    alert(`Error al guardar el torneo: ${error.message}`);
  } finally {
    isSaving.value = false;
  }
}

function openCreateTournamentModal() {
  // Si no estamos reanudando, resetear currentDay a 1 para torneo nuevo
  if (!sessionStore.isResuming) {
    sessionStore.resetCurrentDay();
  }
  showEndSessionModal.value = true;
}

function handleCancelModal() {
  // Limpiar el flag de reanudación si estaba activo
  if (sessionStore.isResuming) {
    sessionStore.clearResumingFlag();
    sessionStore.resetCurrentDay(); // También resetear currentDay al cancelar
  }
  showEndSessionModal.value = false;
}

// Guardar configuración de sesión en localStorage
function saveConfiguration() {
  const config = {
    location: sessionStore.location,
    currency: sessionStore.currency,
    buyIn: sessionStore.buyIn,
    initialStack: sessionStore.initialStack,
    gameType: sessionStore.gameType,
    tournamentType: sessionStore.tournamentType,
    structure: sessionStore.structure
  };

  localStorage.setItem('liveTournamentSessionConfiguration', JSON.stringify(config));

  // Feedback visual
  saveButtonText.value = '✓ Guardado';
  setTimeout(() => {
    saveButtonText.value = 'Guardar cambios';
  }, 2000);
}

// Cargar configuración de sesión desde localStorage
function loadConfiguration() {
  const savedConfig = localStorage.getItem('liveTournamentSessionConfiguration');

  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      sessionStore.location = config.location || '';
      sessionStore.currency = config.currency || '$';
      sessionStore.buyIn = config.buyIn || 50;
      sessionStore.initialStack = config.initialStack || 5000;
      sessionStore.gameType = config.gameType || 'holdem';
      sessionStore.tournamentType = config.tournamentType || 'Normal';
      sessionStore.structure = config.structure || 'Normal';
    } catch (error) {
      console.error('Error al cargar la configuración de sesión guardada:', error);
    }
  }
}

// Cargar configuración al montar el componente
onMounted(() => {
  loadConfiguration();
});
</script>

<style scoped>
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   LiveTournamentSessionView - Premium Style
   ======================================== */

/* Import Premium Modern Font - Poppins */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

/* Apply Poppins font to all elements */
.live-session-container * {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1; /* Enhanced legibility */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.live-session-container *,
.live-session-container *::before,
.live-session-container *::after {
  box-sizing: border-box;
}

.live-session-container {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
  height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto; /* Permite scroll solo si el contenido excede la altura */
}

.session-panel {
  width: 100%;
  max-width: 950px;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas:
    "config"
    "controls";
  gap: 1.5rem;
  box-sizing: border-box;
}

/* ========================================
   WIDGETS - Premium Cards
   ======================================== */
.widget {
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(168, 85, 247, 0.15);
  border-radius: 16px;
  padding: 2rem;

  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 20px 60px -15px rgba(168, 85, 247, 0.03);

  animation: cardSlideIn 0.5s ease-out;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #d1d5db;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
}

.day-badge {
  margin-left: auto;
  padding: 6px 14px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.35) 100%);
  border: 1.5px solid rgba(168, 85, 247, 0.5);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #e9d5ff;
  letter-spacing: 0.5px;
  box-shadow:
    0 2px 8px rgba(168, 85, 247, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% {
    box-shadow:
      0 2px 8px rgba(168, 85, 247, 0.15),
      0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  }
  50% {
    box-shadow:
      0 2px 12px rgba(168, 85, 247, 0.3),
      0 0 16px rgba(168, 85, 247, 0.15),
      0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  }
}

.config-widget {
  grid-area: config;
  position: relative;
}

.duration-widget {
  grid-area: config;
}

/* ========================================
   SAVE BUTTON - Premium Icon Style
   ======================================== */
.save-icon-btn {
  position: absolute;
  top: 10px;
  right: 18px;
  width: 44px;
  height: 44px;
  padding: 10px;

  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%);
  border: 1.5px solid rgba(168, 85, 247, 0.25);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;

  box-shadow:
    0 2px 8px rgba(168, 85, 247, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.save-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.save-icon-btn:not(:disabled):hover {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%);
  border-color: rgba(168, 85, 247, 0.5);
  transform: translateY(-3px) scale(1.05);
  box-shadow:
    0 4px 16px rgba(168, 85, 247, 0.15),
    0 0 20px rgba(168, 85, 247, 0.08);
}

.save-icon-btn:not(:disabled):active {
  transform: translateY(-1px) scale(1.02);
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(168, 85, 247, 0.25) 100%);
}

.save-icon {
  width: 24px;
  height: 24px;
  color: #a855f7;
  filter: drop-shadow(0 2px 4px rgba(168, 85, 247, 0.2));
}

.saved-indicator {
  position: absolute;
  top: -6px;
  right: -6px;
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid rgba(10, 14, 26, 0.95);
  box-shadow: 0 4px 12px rgba(4, 120, 87, 0.25);
  animation: popInGlow 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popInGlow {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ========================================
   DURATION WIDGET - Active Session Duration Entry
   ======================================== */
.duration-inputs-active {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
}

.time-input-group-active {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.time-input-group-active label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.time-input-group-active input {
  width: 100%;
  padding: 16px 20px;
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  border-radius: 10px;

  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(168, 85, 247, 0.3);
  color: #a855f7;

  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.time-input-group-active input:hover {
  border-color: rgba(168, 85, 247, 0.5);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 8px rgba(168, 85, 247, 0.1);
}

.time-input-group-active input:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.7);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(168, 85, 247, 0.15),
    0 0 16px rgba(168, 85, 247, 0.1);
}

/* ========================================
   CONFIG WIDGET - Premium Form
   ======================================== */
.config-fieldset {
  border: none;
  padding: 0;
  margin: 0;
  transition: opacity 0.3s ease;
}

.config-fieldset:disabled {
  opacity: 0.5;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-item label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.config-item input,
.config-item select {
  font-size: 1.05rem;
  font-weight: 500;
  padding: 14px 18px;
  border-radius: 10px;

  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;

  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

/* Estilos específicos para input type="time" */
.config-item input[type="time"] {
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
}

.config-item input[type="time"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.config-item input[type="time"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.config-item input:hover,
.config-item select:hover {
  border-color: rgba(168, 85, 247, 0.4);
}

.config-item input:focus,
.config-item select:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(168, 85, 247, 0.1),
    0 0 12px rgba(168, 85, 247, 0.08);
}

.config-item select option {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 12px 16px;
  font-weight: 500;
}

/* ========================================
   MAIN CONTROLS - Premium Action Buttons
   ======================================== */
.main-controls {
  grid-area: controls;
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 0;
}

.main-controls button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 18px 32px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  flex-grow: 1;
  max-width: 300px;

  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.main-controls button svg {
  width: 28px;
  height: 28px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.btn-play {
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  color: white;
  box-shadow:
    0 4px 6px -1px rgba(4, 120, 87, 0.3),
    0 10px 20px -3px rgba(4, 120, 87, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.btn-play:hover {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 8px 16px -2px rgba(4, 120, 87, 0.35),
    0 16px 32px -4px rgba(4, 120, 87, 0.25),
    0 0 24px rgba(4, 120, 87, 0.15);
}

.btn-pause {
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  color: white;
  box-shadow:
    0 4px 6px -1px rgba(217, 119, 6, 0.3),
    0 10px 20px -3px rgba(217, 119, 6, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.btn-pause:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 8px 16px -2px rgba(217, 119, 6, 0.35),
    0 16px 32px -4px rgba(217, 119, 6, 0.25),
    0 0 24px rgba(217, 119, 6, 0.15);
}

.btn-stop {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 1) 100%);
  color: white;
  box-shadow:
    0 4px 6px -1px rgba(220, 38, 38, 0.3),
    0 10px 20px -3px rgba(220, 38, 38, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.btn-stop:hover {
  background: linear-gradient(135deg, rgba(220, 38, 38, 1) 0%, rgba(185, 28, 28, 1) 100%);
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 8px 16px -2px rgba(220, 38, 38, 0.35),
    0 16px 32px -4px rgba(220, 38, 38, 0.25),
    0 0 24px rgba(220, 38, 38, 0.15);
}

.main-controls button:active {
  transform: translateY(-1px) scale(1);
}

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */
@media (max-width: 820px) {
  .live-session-container {
    padding: 1rem 0.75rem;
  }

  .session-panel {
    grid-template-columns: 1fr;
    grid-template-areas:
      "config"
      "controls";
    gap: 1rem;
  }

  .widget {
    padding: 1.5rem 1.25rem;
  }

  .main-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .main-controls button {
    max-width: none;
    font-size: 1.1rem;
    padding: 16px 24px;
  }

  .main-controls button svg {
    width: 24px;
    height: 24px;
  }

  .config-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .save-icon-btn {
    top: 8px;
    right: 12px;
    width: 40px;
    height: 40px;
  }

  .save-icon {
    width: 22px;
    height: 22px;
  }

  .time-input-group-active input {
    font-size: 2rem;
    padding: 14px 18px;
  }
}

@media (max-width: 480px) {
  .live-session-container {
    padding: 0.75rem 0.5rem;
  }

  .session-panel {
    gap: 1rem;
  }

  .widget {
    padding: 1.25rem 1rem;
    border-radius: 12px;
  }

  .widget-header {
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .day-badge {
    padding: 5px 12px;
    font-size: 0.75rem;
  }

  .config-item label {
    font-size: 0.85rem;
  }

  .config-item input,
  .config-item select {
    padding: 12px 14px;
    font-size: 0.95rem;
  }

  .time-input-group-active input {
    font-size: 1.75rem;
    padding: 12px 16px;
  }

  .main-controls button {
    font-size: 1rem;
    padding: 14px 20px;
    gap: 10px;
  }

  .main-controls button svg {
    width: 22px;
    height: 22px;
  }

  .save-icon-btn {
    width: 36px;
    height: 36px;
    top: 6px;
    right: 10px;
  }

  .save-icon {
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 375px) {
  .live-session-container {
    padding: 0.5rem 0.375rem;
  }

  .session-panel {
    gap: 0.875rem;
  }

  .widget {
    padding: 1rem 0.75rem;
  }

  .widget-header {
    font-size: 0.8rem;
  }

  .day-badge {
    padding: 4px 10px;
    font-size: 0.7rem;
  }

  .config-item input,
  .config-item select {
    padding: 10px 12px;
    font-size: 0.9rem;
  }

  .time-input-group-active input {
    font-size: 1.5rem;
    padding: 10px 14px;
  }

  .main-controls button {
    font-size: 0.95rem;
    padding: 12px 18px;
    gap: 8px;
  }
}

/* ========================================
   TOAST NOTIFICATIONS - Premium Style
   ======================================== */
.toast-notification {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;

  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  min-width: 300px;
  max-width: 90vw;

  background: linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(17, 24, 39, 1) 100%);
  border: 1.5px solid rgba(16, 185, 129, 0.5);
  border-radius: 12px;

  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.4),
    0 4px 32px rgba(16, 185, 129, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.toast-notification.success {
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.4),
    0 4px 32px rgba(16, 185, 129, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.toast-icon {
  width: 28px;
  height: 28px;
  min-width: 28px;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 6px rgba(16, 185, 129, 0.4));
}

.toast-icon svg {
  width: 100%;
  height: 100%;
}

.toast-message {
  font-size: 1rem;
  font-weight: 600;
  color: #f9fafb;
  letter-spacing: 0.015em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Transición de entrada/salida */
.toast-enter-active {
  animation: toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  animation: toastSlideOut 0.3s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes toastSlideIn {
  0% {
    transform: translateX(-50%) translateY(-20px);
    opacity: 0;
  }
  100% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes toastSlideOut {
  0% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(-20px);
    opacity: 0;
  }
}

/* Responsive para móviles */
@media (max-width: 480px) {
  .toast-notification {
    top: 80px;
    min-width: 280px;
    padding: 14px 20px;
  }

  .toast-icon {
    width: 24px;
    height: 24px;
    min-width: 24px;
  }

  .toast-message {
    font-size: 0.95rem;
  }
}

@media (max-width: 375px) {
  .toast-notification {
    top: 70px;
    min-width: 260px;
    padding: 12px 18px;
  }

  .toast-message {
    font-size: 0.9rem;
  }
}
</style>
