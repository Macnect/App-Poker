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
.admin-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
}
.admin-panel {
  width: 100%;
  max-width: 800px;
  background-color: #2d3748;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid var(--border-color);
}
h2 {
  text-align: center;
  margin-bottom: 2rem;
}
.user-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 2rem;
}
.user-selector label {
  font-weight: bold;
  font-size: 1.2rem;
  color: #a0aec0;
}
.user-selector select {
  padding: 12px;
  font-size: 1.1rem;
}
.loading-message, .no-data {
  text-align: center;
  margin-top: 1rem;
  color: #a0aec0;
}
.player-data-container h3 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}
.data-section {
  margin-bottom: 2rem;
}
.data-section h4 {
  font-size: 1.3rem;
  color: #cbd5e0;
  margin-bottom: 1rem;
}
.data-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.data-list li {
  background-color: #1a202c;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.profit { color: #68d391; }
.loss { color: #fc8181; }
.even { color: #e2e8f0; }

/* ========================================================== */
/* ===> INICIO DEL CAMBIO INTEGRADO Y AISLADO              <=== */
/* ========================================================== */
.hand-item {
  flex-wrap: wrap; /* Permite que el botón pase a la siguiente línea si no hay espacio */
}
.hand-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Ocupa el espacio disponible */
}
.replay-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  flex-shrink: 0; /* Evita que el botón se encoja */
  margin-left: 1rem;
}
/* ========================================================== */
/* ===> FIN DEL CAMBIO INTEGRADO Y AISLADO                 <=== */
/* ========================================================== */
</style>