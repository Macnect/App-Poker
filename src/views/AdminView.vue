<template>
  <div class="admin-container">
    <div class="admin-panel">
      <h2>Panel de Administrador</h2>

      <!-- Selector para elegir qué jugador supervisar -->
      <div class="user-selector">
        <label for="player-select">Seleccionar Jugador para Supervisar:</label>
        <select id="player-select" v-model="selectedPlayerId" @change="loadPlayerData">
          <option :value="null" disabled>-- Elige un jugador --</option>
          <option v-for="player in allPlayers" :key="player.id" :value="player.id">
            {{ player.nombre_usuario }} (ID: ...{{ player.id.slice(-6) }})
          </option>
        </select>
      </div>

      <!-- Mensaje de carga mientras se obtienen los datos -->
      <div v-if="isLoading" class="loading-message">
        Cargando datos del jugador...
      </div>

      <!-- Contenedor para mostrar los datos del jugador seleccionado -->
      <div v-else-if="selectedPlayerId" class="player-data-container">
        <h3>Datos de: {{ selectedPlayerName }}</h3>

        <!-- Sección de Sesiones -->
        <div class="data-section">
          <h4>Sesiones de Juego</h4>
          <ul v-if="playerSessions.length > 0" class="data-list">
            <li v-for="session in playerSessions" :key="session.id">
              <span>{{ new Date(session.fecha + 'T12:00:00').toLocaleDateString() }} - {{ session.ubicacion }}</span>
              <span :class="getResultClass(session.resultado)">Resultado: {{ session.moneda }}{{ session.resultado.toFixed(2) }}</span>
            </li>
          </ul>
          <p v-else class="no-data">Este jugador no tiene sesiones guardadas.</p>
        </div>
        
        <!-- Sección de Manos Guardadas -->
        <div class="data-section">
          <h4>Manos Guardadas</h4>
          <ul v-if="playerHands.length > 0" class="data-list">
            <!-- ========================================================== -->
            <!-- ===> INICIO DEL CAMBIO INTEGRADO Y AISLADO              <=== -->
            <!-- ========================================================== -->
            <li v-for="hand in playerHands" :key="hand.id" class="hand-item">
              <div class="hand-info">
                <span>{{ new Date(hand.fecha).toLocaleString() }} - Hero: {{ hand.posicion_heroe }}</span>
                <span>{{ hand.cantidad_jugadores }} Jugadores</span>
              </div>
              <button @click="loadHandForReplay(hand)" class="replay-btn">Ver Replay</button>
            </li>
            <!-- ========================================================== -->
            <!-- ===> FIN DEL CAMBIO INTEGRADO Y AISLADO                 <=== -->
            <!-- ========================================================== -->
          </ul>
          <p v-else class="no-data">Este jugador no tiene manos guardadas.</p>
        </div>

        <!-- Sección de Viajes de Poker -->
        <div class="data-section">
          <h4>Viajes de Poker</h4>
          <ul v-if="playerTrips.length > 0" class="data-list">
            <li v-for="trip in playerTrips" :key="trip.id">
              <span>{{ trip.ciudad || 'N/A' }} - {{ trip.casino || 'N/A' }}</span>
              <span :class="getResultClass(calculateTripProfit(trip))">
                Resultado: {{ trip.moneda }}{{ calculateTripProfit(trip).toFixed(2) }}
              </span>
            </li>
          </ul>
          <p v-else class="no-data">Este jugador no tiene viajes guardados.</p>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/supabase';
import { apiFetchSessions, apiFetchHands, apiFetchTrips } from '@/api';
// ==========================================================
// ===> INICIO DEL CAMBIO INTEGRADO Y AISLADO              <===
// ==========================================================
import { useGameStore } from '@/store/game';
// ==========================================================
// ===> FIN DEL CAMBIO INTEGRADO Y AISLADO                 <===
// ==========================================================


// --- STATE MANAGEMENT ---
const isLoading = ref(false);
const allPlayers = ref([]);
const selectedPlayerId = ref(null);
const playerSessions = ref([]);
const playerHands = ref([]);
const playerTrips = ref([]);
// ==========================================================
// ===> INICIO DEL CAMBIO INTEGRADO Y AISLADO              <===
// ==========================================================
const gameStore = useGameStore();
const emit = defineEmits(['switch-view']);
// ==========================================================
// ===> FIN DEL CAMBIO INTEGRADO Y AISLADO                 <===
// ==========================================================


// --- LÓGICA DE LA VISTA ---

// 1. Obtener la lista de todos los jugadores para poblar el selector
async function fetchAllPlayers() {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre_usuario');

  if (error) {
    console.error("Error al cargar la lista de jugadores:", error);
    return;
  }
  allPlayers.value = data;
}

// 2. Cargar los datos específicos del jugador seleccionado en el dropdown
async function loadPlayerData() {
  if (!selectedPlayerId.value) return;

  isLoading.value = true;
  // Limpiamos los datos anteriores de todas las secciones
  playerSessions.value = [];
  playerHands.value = [];
  playerTrips.value = [];

  try {
    // Usamos Promise.all para ejecutar todas las peticiones en paralelo para mayor eficiencia
    const [sessions, hands, trips] = await Promise.all([
      apiFetchSessions(selectedPlayerId.value),
      apiFetchHands(null, null, 0, selectedPlayerId.value),
      apiFetchTrips(selectedPlayerId.value)
    ]);

    playerSessions.value = sessions;
    playerHands.value = hands;
    playerTrips.value = trips;

  } catch (error) {
    console.error(`Error al cargar los datos del jugador ${selectedPlayerId.value}:`, error);
  } finally {
    isLoading.value = false;
  }
}

// ==========================================================
// ===> INICIO DEL CAMBIO INTEGRADO Y AISLADO              <===
// ==========================================================
// 3. Cargar la mano en el store y cambiar de vista
function loadHandForReplay(hand) {
  // Llama a la acción del store que prepara la mano para el replay
  gameStore.loadHand(hand);
  // Emite un evento que App.vue escuchará para cambiar a la vista del replayer
  emit('switch-view', 'CurrentHandView');
}
// ==========================================================
// ===> FIN DEL CAMBIO INTEGRADO Y AISLADO                 <===
// ==========================================================


// Se ejecuta cuando el componente se monta por primera vez para llenar el selector
onMounted(() => {
  fetchAllPlayers();
});

// --- PROPIEDADES COMPUTADAS Y HELPERS ---

// Para mostrar el nombre del jugador en el título
const selectedPlayerName = computed(() => {
  const player = allPlayers.value.find(p => p.id === selectedPlayerId.value);
  return player ? player.nombre_usuario : '';
});

// Helper para dar color a los resultados (positivo/negativo)
function getResultClass(result) {
  const numResult = parseFloat(result);
  if (numResult > 0) return 'profit';
  if (numResult < 0) return 'loss';
  return 'even';
}

// Helper para calcular el beneficio total de un viaje
function calculateTripProfit(trip) {
  if (!trip.dailyResults) return 0;
  return Object.values(trip.dailyResults).reduce((total, dayResults) => {
    const dayTotal = Object.values(dayResults).reduce((daySum, playerData) => daySum + (parseFloat(playerData.result) || 0), 0);
    return total + dayTotal;
  }, 0);
}
</script>

<style scoped>
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   AdminView - Administration Panel
   ======================================== */

/* Import Premium Modern Font - Poppins */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

* {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  box-sizing: border-box;
}

.admin-container {
  display: flex;
  justify-content: center;
  padding: 2.5rem;
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  width: 100%;
  overflow-x: hidden;
}

.admin-panel {
  width: 100%;
  max-width: 900px;
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  animation: cardSlideIn 0.5s ease-out;
  overflow-x: hidden;
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

h2 {
  text-align: center;
  margin-bottom: 2.5rem;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.user-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%);
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.15);
}

.user-selector label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.user-selector select {
  padding: 16px 20px;
  font-size: 1.1rem;
  font-weight: 500;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  width: 100%;
  max-width: 100%;
}

.user-selector select:hover {
  border-color: rgba(212, 175, 55, 0.4);
}

.user-selector select:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(212, 175, 55, 0.1),
    0 0 12px rgba(212, 175, 55, 0.08);
}

.user-selector select option {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 12px 16px;
  font-weight: 500;
}

.loading-message,
.no-data {
  text-align: center;
  margin-top: 1.5rem;
  color: #d1d5db;
  font-size: 1.1rem;
  font-weight: 500;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%);
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.1);
}

.player-data-container h3 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #f9fafb;
  border-bottom: 1.5px solid rgba(212, 175, 55, 0.2);
  padding-bottom: 1rem;
  letter-spacing: -0.01em;
}

.data-section {
  margin-bottom: 2.5rem;
}

.data-section h4 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #f9fafb;
  margin-bottom: 1.25rem;
  letter-spacing: -0.01em;
}

.data-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.data-list li {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.7) 100%);
  padding: 1rem 1.25rem;
  border-radius: 10px;
  border: 1px solid rgba(156, 163, 175, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.data-list li:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.9) 100%);
  border-color: rgba(212, 175, 55, 0.25);
  transform: translateX(5px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 0 12px rgba(212, 175, 55, 0.08);
}

.data-list li span {
  color: #d1d5db;
  font-weight: 500;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.profit {
  color: #10b981;
  font-weight: 700;
}

.loss {
  color: #fc8181;
  font-weight: 700;
}

.even {
  color: #e2e8f0;
  font-weight: 700;
}

/* Hand Item Special Styling */
.hand-item {
  flex-wrap: wrap;
  gap: 1rem;
}

.hand-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 0.5rem;
  max-width: 100%;
  min-width: 0;
}

.hand-info span {
  color: #d1d5db;
  font-weight: 500;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.replay-btn {
  padding: 10px 20px;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  color: white;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 6px rgba(4, 120, 87, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.replay-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(4, 120, 87, 0.4),
    0 0 16px rgba(4, 120, 87, 0.2);
}

.replay-btn:active {
  transform: translateY(0);
}

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */
@media (max-width: 768px) {
  .admin-container {
    padding: 0.75rem;
  }

  .admin-panel {
    padding: 1rem;
    border-radius: 12px;
    max-width: 100%;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    word-wrap: break-word;
  }

  .user-selector {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .user-selector label {
    font-size: 0.85rem;
  }

  .user-selector select {
    padding: 12px 14px;
    font-size: 1rem;
  }

  .player-data-container h3 {
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
    word-wrap: break-word;
  }

  .data-section {
    margin-bottom: 1.5rem;
  }

  .data-section h4 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .data-list {
    gap: 0.75rem;
  }

  .data-list li {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
  }

  .data-list li span {
    font-size: 0.9rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .hand-item {
    width: 100%;
  }

  .hand-info {
    width: 100%;
  }

  .hand-info span {
    font-size: 0.9rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .replay-btn {
    width: 100%;
    margin-left: 0;
    padding: 12px 16px;
    font-size: 0.9rem;
  }

  .loading-message,
  .no-data {
    font-size: 0.95rem;
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .admin-container {
    padding: 0.5rem;
  }

  .admin-panel {
    padding: 0.875rem;
  }

  h2 {
    font-size: 1.3rem;
  }

  .user-selector select {
    padding: 10px 12px;
    font-size: 0.95rem;
  }

  .data-list li span {
    font-size: 0.85rem;
  }

  .hand-info span {
    font-size: 0.85rem;
  }
}
</style>