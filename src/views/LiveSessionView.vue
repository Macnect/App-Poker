<template>
  <div class="live-session-container">
    <div class="session-panel">

      <!-- WIDGET DEL TEMPORIZADOR -->
      <div class="widget timer-widget" :class="{ 'on-break': sessionStore.isOnBreak }">
        <div class="widget-header">
          <span class="status-indicator"></span>
          <span>{{ sessionStore.isOnBreak ? 'EN DESCANSO' : (sessionStore.isActive ? 'SESIÓN ACTIVA' : 'SESIÓN DETENIDA') }}</span>
        </div>
        <div class="timer-display">
          {{ formattedTime }}
        </div>
      </div>

      <!-- WIDGET DE ACCIONES RÁPIDAS (solo visible durante la sesión) -->
      <div v-if="sessionStore.isActive && !sessionStore.isOnBreak" class="widget actions-widget">
        <div class="widget-header">
          <span>ACCIONES RÁPIDAS</span>
        </div>
        <div class="live-actions">
          <div class="action-group">
            <input type="number" v-model.number="rebuyAmount" placeholder="Monto Recarga">
            <button @click="handleAddRebuy">Añadir Recarga</button>
          </div>
          <div class="action-group">
            <input type="number" v-model.number="tipAmount" placeholder="Propina">
            <button @click="handleAddTip">Tip Dealer</button>
          </div>
          <div class="action-group">
            <input type="number" v-model.number="expenseAmount" placeholder="Gasto">
            <button @click="handleAddExpense">Consumición</button>
          </div>
        </div>
      </div>

      <!-- WIDGET DE CONFIGURACIÓN -->
      <div class="widget config-widget">
        <!-- Botón de guardar minimalista en la esquina superior -->
        <button
          class="save-icon-btn"
          @click="saveConfiguration"
          :title="saveButtonText"
          :disabled="sessionStore.isActive"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="save-icon">
            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
          </svg>
          <span v-if="saveButtonText === '✓ Guardado'" class="saved-indicator">✓</span>
        </button>

         <div class="widget-header">
          <span>CONFIGURACIÓN DE LA PARTIDA</span>
        </div>
        <fieldset class="config-fieldset" :disabled="sessionStore.isActive">
          <div class="config-grid">
            <div class="config-item">
              <label for="player-count">Jugadores</label>
              <select id="player-count" v-model.number="sessionStore.playerCount">
                <option v-for="n in 8" :key="n" :value="n + 1">{{ n + 1 }} jugadores</option>
              </select>
            </div>
            <div class="config-item">
              <label>Ciegas</label>
              <div class="blinds-inline-container">
                <input type="number" v-model.number="smallBlind" min="0.01" step="0.01" class="blind-input" placeholder="SB">
                <span class="blind-separator">/</span>
                <input type="number" v-model.number="bigBlind" min="0.01" step="0.01" class="blind-input" placeholder="BB">
              </div>
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
              <label for="initial-stack">Buy-in</label>
              <input type="number" id="initial-stack" v-model.number="sessionStore.initialStack" placeholder="Ej: 200">
            </div>
          </div>
        </fieldset>
      </div>
      
      <!-- CONTROLES PRINCIPALES -->
      <div class="main-controls">
        <button v-if="!sessionStore.isActive" @click="sessionStore.startSession()" class="btn-play">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
          <span>INICIAR SESIÓN</span>
        </button>
        <template v-if="sessionStore.isActive">
          <button v-if="!sessionStore.isOnBreak" @click="sessionStore.startBreak()" class="btn-pause">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>DESCANSO</span>
          </button>
          <button v-else @click="sessionStore.endBreak()" class="btn-play">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
            <span>FIN DEL DESCANSO</span>
          </button>
          <button @click="showEndSessionModal = true" class="btn-stop">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" /></svg>
            <span>FINALIZAR SESIÓN</span>
          </button>
        </template>
      </div>
    </div>
    <EndSessionModal 
      v-if="showEndSessionModal" 
      @confirm="handleConfirmEndSession" 
      @cancel="showEndSessionModal = false"
      :is-saving="isSaving" 
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useSessionStore } from '../store/useSessionStore';
import { useAuthStore } from '../store/useAuthStore';
import EndSessionModal from '../components/EndSessionModal.vue';

const sessionStore = useSessionStore();
const authStore = useAuthStore();
const showEndSessionModal = ref(false);
const isSaving = ref(false);

const rebuyAmount = ref(null);
const tipAmount = ref(null);
const expenseAmount = ref(null);

const saveButtonText = ref('Guardar cambios');

// Campos separados para ciegas
const smallBlind = ref(1);
const bigBlind = ref(2);

// Actualizar sessionStore.blinds cuando cambien los valores
watch([smallBlind, bigBlind], ([sb, bb]) => {
  if (sb !== null && sb !== undefined && bb !== null && bb !== undefined) {
    sessionStore.blinds = `${sb}/${bb}`;
  }
});

function handleAddRebuy() {
  if (rebuyAmount.value > 0) {
    sessionStore.addRebuy(rebuyAmount.value);
    rebuyAmount.value = null;
  }
}
function handleAddTip() {
  if (tipAmount.value > 0) {
    sessionStore.addExpense(tipAmount.value);
    tipAmount.value = null;
  }
}
function handleAddExpense() {
  if (expenseAmount.value > 0) {
    sessionStore.addExpense(expenseAmount.value);
    expenseAmount.value = null;
  }
}

async function handleConfirmEndSession(finalStack) {
  isSaving.value = true;
  try {
    await sessionStore.stopAndSaveSession(finalStack);
    showEndSessionModal.value = false;
  } catch (error) {
    alert(`Error al guardar la sesión: ${error.message}`);
  } finally {
    isSaving.value = false;
  }
}

// Guardar configuración de sesión en localStorage
function saveConfiguration() {
  const config = {
    playerCount: sessionStore.playerCount,
    smallBlind: smallBlind.value,
    bigBlind: bigBlind.value,
    location: sessionStore.location,
    currency: sessionStore.currency,
    initialStack: sessionStore.initialStack
  };

  localStorage.setItem('liveSessionConfiguration', JSON.stringify(config));

  // Feedback visual
  saveButtonText.value = '✓ Guardado';
  setTimeout(() => {
    saveButtonText.value = 'Guardar cambios';
  }, 2000);
}

// Cargar configuración de sesión desde localStorage
function loadConfiguration() {
  const savedConfig = localStorage.getItem('liveSessionConfiguration');

  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      sessionStore.playerCount = config.playerCount || 6;
      sessionStore.location = config.location || '';
      sessionStore.currency = config.currency || '$';
      sessionStore.initialStack = config.initialStack || 200;

      // Cargar ciegas separadas
      if (config.smallBlind !== undefined && config.bigBlind !== undefined) {
        smallBlind.value = config.smallBlind;
        bigBlind.value = config.bigBlind;
      } else if (config.blinds) {
        // Compatibilidad con formato antiguo "1/2"
        const [sb, bb] = config.blinds.split('/').map(Number);
        if (!isNaN(sb) && !isNaN(bb)) {
          smallBlind.value = sb;
          bigBlind.value = bb;
        }
      } else {
        smallBlind.value = 1;
        bigBlind.value = 2;
      }
    } catch (error) {
      console.error('Error al cargar la configuración de sesión guardada:', error);
    }
  }
}

// Cargar configuración al montar el componente
onMounted(() => {
  loadConfiguration();
});

const formattedTime = computed(() => {
  const totalSeconds = sessionStore.isOnBreak ? sessionStore.breakElapsedTime : sessionStore.elapsedTime;
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
});
</script>

<style scoped>
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   LiveSessionView - Premium Style
   ======================================== */

.live-session-container {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
}

.session-panel {
  width: 100%;
  max-width: 950px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-areas:
    "timer timer"
    "actions config"
    "controls controls";
  gap: 2rem;
}

/* ========================================
   WIDGETS - Premium Cards
   ======================================== */
.widget {
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 16px;
  padding: 2rem;

  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 20px 60px -15px rgba(212, 175, 55, 0.03);

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

.timer-widget { grid-area: timer; }
.actions-widget { grid-area: actions; }
.config-widget {
  grid-area: config;
  position: relative;
}

/* ========================================
   SAVE BUTTON - Premium Icon Style
   ======================================== */
.save-icon-btn {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 44px;
  height: 44px;
  padding: 10px;

  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
  border: 1.5px solid rgba(212, 175, 55, 0.25);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;

  box-shadow:
    0 2px 8px rgba(212, 175, 55, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.save-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.save-icon-btn:not(:disabled):hover {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.15) 100%);
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-3px) scale(1.05);
  box-shadow:
    0 4px 16px rgba(212, 175, 55, 0.15),
    0 0 20px rgba(212, 175, 55, 0.08);
}

.save-icon-btn:not(:disabled):active {
  transform: translateY(-1px) scale(1.02);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.35) 0%, rgba(212, 175, 55, 0.25) 100%);
}

.save-icon {
  width: 24px;
  height: 24px;
  color: #d4af37;
  filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.2));
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
   TIMER WIDGET - Premium Digital Display
   ======================================== */
.status-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #6b7280;
  transition: background-color 0.3s ease;
  box-shadow: 0 0 8px rgba(107, 114, 128, 0.4);
}

.timer-widget:not(.on-break) .status-indicator {
  background-color: #10b981;
  animation: pulseGreen 2s infinite;
}

.timer-widget.on-break .status-indicator {
  background-color: #3b82f6;
  animation: pulseBlue 2s infinite;
}

@keyframes pulseGreen {
  0%, 100% {
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  }
  50% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.4);
  }
}

@keyframes pulseBlue {
  0%, 100% {
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
  }
  50% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4);
  }
}

.timer-display {
  font-family: 'Poppins', 'Courier New', Courier, monospace;
  font-size: clamp(3.5rem, 10vw, 6rem);
  font-weight: 700;
  color: #f9fafb;
  text-align: center;
  text-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
}

.timer-widget.on-break .timer-display {
  color: #60a5fa;
  text-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* ========================================
   ACTIONS WIDGET - Premium Quick Actions
   ======================================== */
.live-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-group {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
}

.action-group input {
  padding: 16px 20px;
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  border-radius: 10px;

  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;

  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.action-group input:hover {
  border-color: rgba(212, 175, 55, 0.4);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 8px rgba(212, 175, 55, 0.05);
}

.action-group input:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(212, 175, 55, 0.1),
    0 0 12px rgba(212, 175, 55, 0.08);
}

.action-group button {
  padding: 16px 24px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  color: white;
  box-shadow:
    0 2px 6px rgba(4, 120, 87, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.action-group button:hover {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(4, 120, 87, 0.4),
    0 0 16px rgba(4, 120, 87, 0.2);
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

.config-item input:hover,
.config-item select:hover {
  border-color: rgba(212, 175, 55, 0.4);
}

.config-item input:focus,
.config-item select:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(212, 175, 55, 0.1),
    0 0 12px rgba(212, 175, 55, 0.08);
}

.config-item select option {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 12px 16px;
  font-weight: 500;
}

/* Blinds inputs side by side */
.blinds-inline-container {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.blind-input {
  width: 90px;
  padding: 14px 16px;
  font-size: 1.15rem;
  font-weight: 600;
  text-align: center;
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

.blind-input:hover {
  border-color: rgba(212, 175, 55, 0.4);
}

.blind-input:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(212, 175, 55, 0.1),
    0 0 12px rgba(212, 175, 55, 0.08);
}

.blind-separator {
  font-size: 1.8rem;
  font-weight: 300;
  color: rgba(212, 175, 55, 0.6);
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.15);
  user-select: none;
}

/* ========================================
   MAIN CONTROLS - Premium Action Buttons
   ======================================== */
.main-controls {
  grid-area: controls;
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
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
    padding: 1rem;
  }

  .session-panel {
    grid-template-columns: 1fr;
    grid-template-areas:
      "timer"
      "actions"
      "config"
      "controls";
    gap: 1.5rem;
  }

  .main-controls {
    flex-direction: column;
  }

  .main-controls button {
    max-width: none;
  }

  .config-grid {
    grid-template-columns: 1fr;
  }

  .save-icon-btn {
    top: 14px;
    right: 14px;
    width: 40px;
    height: 40px;
  }

  .save-icon {
    width: 22px;
    height: 22px;
  }
}

@media (max-width: 480px) {
  .action-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .action-group button {
    font-size: 1.1rem;
  }

  .blinds-inline-container {
    gap: 8px;
  }

  .blind-input {
    width: 75px;
    padding: 12px 14px;
    font-size: 1rem;
  }

  .blind-separator {
    font-size: 1.5rem;
  }

  .timer-display {
    font-size: clamp(2.5rem, 12vw, 4rem);
  }
}
</style>