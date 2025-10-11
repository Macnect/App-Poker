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
.live-session-container {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
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

/* --- Widgets --- */
.widget {
  background-color: #2d3748;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 2rem;
}
.widget-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: bold;
  color: #a0aec0;
  margin-bottom: 1.5rem;
  letter-spacing: 1px;
}
.timer-widget { grid-area: timer; }
.actions-widget { grid-area: actions; }
.config-widget {
  grid-area: config;
  position: relative;
}

/* Botón de guardar minimalista en la esquina superior del widget de configuración */
.save-icon-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  padding: 8px;
  background-color: rgba(59, 130, 246, 0.15);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.save-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.save-icon-btn:not(:disabled):hover {
  background-color: rgba(59, 130, 246, 0.25);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
}

.save-icon-btn:not(:disabled):active {
  transform: translateY(0);
  background-color: rgba(59, 130, 246, 0.35);
}

.save-icon {
  width: 22px;
  height: 22px;
  color: #60a5fa;
}

.saved-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #22c55e;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* --- Timer Widget --- */
.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #718096;
  transition: background-color 0.3s ease;
}
.timer-widget:not(.on-break) .status-indicator {
  background-color: #68d391;
  animation: pulse 2s infinite;
}
.timer-widget.on-break .status-indicator {
  background-color: #63b3ed;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(104, 211, 145, 0.7); }
  70% { box-shadow: 0 0 0 12px rgba(104, 211, 145, 0); }
  100% { box-shadow: 0 0 0 0 rgba(104, 211, 145, 0); }
}
.timer-display {
  font-family: 'Courier New', Courier, monospace;
  font-size: clamp(3.5rem, 10vw, 6rem);
  font-weight: 700;
  color: #fff;
  text-align: center;
}
.timer-widget.on-break .timer-display {
  color: #63b3ed;
}

/* --- Actions Widget --- */
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
  padding: 15px;
  font-size: 1.1rem;
  text-align: center;
}
.action-group button {
  padding: 15px;
  font-size: 1rem;
  background-color: #4A5568;
}

/* --- Config Widget --- */
.config-fieldset {
  border: none; padding: 0; margin: 0;
  transition: opacity 0.3s ease;
}
.config-fieldset:disabled { opacity: 0.6; }
.config-grid {
  display: grid; grid-template-columns: 1fr 1fr; 
  gap: 1.5rem;
}
.config-item { display: flex; flex-direction: column; gap: 10px; }
.config-item label {
  font-weight: bold;
  font-size: 1.1rem;
  color: #a0aec0;
}
.config-item input, .config-item select {
  font-size: 1.1rem;
  padding: 15px;
}

/* Contenedor de ciegas en línea */
.blinds-inline-container {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.blind-input {
  width: 80px;
  padding: 15px;
  font-size: 1.1rem;
  text-align: center;
  border-radius: 8px;
  box-sizing: border-box;
}

.blind-separator {
  font-size: 1.5rem;
  font-weight: bold;
  color: #a0aec0;
}

/* --- Main Controls --- */
.main-controls {
  grid-area: controls;
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
}
.main-controls button {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  font-size: 1.3rem;
  font-weight: bold; 
  padding: 18px 30px;
  border-radius: 8px;
  flex-grow: 1; max-width: 300px;
}
.main-controls button svg { 
  width: 28px;
  height: 28px; 
}
.btn-play { background-color: #38a169; color: white; }
.btn-pause { background-color: #dd6b20; color: white; }
.btn-stop { background-color: #c53030; color: white; }

/* --- Media Queries for Responsiveness --- */
@media (max-width: 820px) {
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
    grid-template-columns: 1fr; /* Apila los inputs de configuración */
  }
  .save-icon-btn {
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
  }
  .save-icon {
    width: 20px;
    height: 20px;
  }
}

/* ================================================== */
/* ===> NUEVO BLOQUE DE CÓDIGO PARA LA SOLUCIÓN <=== */
/* ================================================== */
/* En pantallas muy estrechas (móviles verticales), apilamos las acciones rápidas */
@media (max-width: 480px) {
  .action-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem; /* Un espacio más pequeño entre input y botón */
  }

  .action-group button {
    font-size: 1.1rem; /* Hacemos el texto del botón un poco más grande */
  }

  .blinds-inline-container {
    gap: 8px;
  }

  .blind-input {
    width: 70px;
    padding: 12px;
    font-size: 1rem;
  }

  .blind-separator {
    font-size: 1.3rem;
  }
}

</style>