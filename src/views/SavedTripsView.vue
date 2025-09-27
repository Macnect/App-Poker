<template>
  <div class="saved-trips-container">
    <h2>Viajes Guardados</h2>

    <div v-if="isLoading" class="loading-message">
      Cargando viajes...
    </div>
    <div v-else-if="tripStore.savedTrips.length === 0" class="no-trips">
      No tienes viajes guardados todavía.
    </div>
    <ul v-else class="trips-list">
      <li v-for="trip in tripStore.savedTrips" :key="trip.id">
        <div class="trip-header">
          <div class="trip-info">
            <span class="trip-destination">{{ trip.ciudad || 'Viaje sin ciudad' }}, {{ trip.casino || 'Sin casino' }}</span>
            <span class="trip-date">Guardado el: {{ new Date(trip.fecha_creacion).toLocaleDateString() }}</span>
          </div>
          <div class="trip-actions">
            <button @click="loadTripForEditing(trip.id)">Cargar y Editar</button>
            <button class="delete-btn" @click="confirmDelete(trip.id)">Eliminar</button>
          </div>
        </div>

        <div class="trip-stats">
          <div class="stat-item">
            <label>Jugadores</label>
            <span class="value">{{ trip.players.length }}</span>
          </div>
          <div class="stat-item">
            <label>Horas Totales</label>
            <span class="value">{{ calculateTripHours(trip).toFixed(1) }} h</span>
          </div>
          <div class="stat-item">
            <label>Beneficio Total</label>
            <span class="value" :class="getResultClass(calculateTripProfit(trip))">
              {{ calculateTripProfit(trip).toFixed(2) }} {{ trip.moneda }}
            </span>
          </div>
          <div class="stat-item">
            <label>Media {{ trip.moneda }}/h</label>
            <span class="value" :class="getResultClass(calculateTripWinRate(trip))">
              {{ calculateTripWinRate(trip).toFixed(2) }}
            </span>
          </div>
        </div>
      </li>
    </ul>

    <!-- Confirmation Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>Confirmar Eliminación</h3>
        <p>¿Está seguro de que desea eliminar este viaje?</p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeModal">No</button>
          <button class="confirm-btn" @click="deleteAndClose">Sí</button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showToast" class="toast success-toast">
      <div class="toast-icon">✓</div>
      <div class="toast-message">Viaje eliminado con éxito</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue';
import { useTripStore } from '../store/useTripStore';

const tripStore = useTripStore();
const emit = defineEmits(['switch-view']);

const isLoading = ref(true);
const showModal = ref(false);
const showToast = ref(false);
const selectedTripId = ref(null);

const loadTrips = async () => {
  isLoading.value = true;
  await tripStore.fetchTrips();
  isLoading.value = false;
};

onMounted(loadTrips);

// ========================================================================
// === BLOQUE DE CÓDIGO ADITIVO Y AISLADO PARA SOLUCIONAR EL BUG ==========
// ========================================================================
// El hook `onActivated` se ejecuta cada vez que el componente es mostrado
// al navegar internamente (cuando el componente ya estaba "montado").
// Esto asegura que los datos se recarguen siempre que el usuario
// vuelva a esta vista.
onActivated(loadTrips);
// ========================================================================
// ========================================================================

function loadTripForEditing(tripId) {
  tripStore.loadTrip(tripId);
  emit('switch-view', 'CommunityView');
}

function calculateTripProfit(trip) {
  if (!trip.dailyResults) return 0;
  return Object.values(trip.dailyResults).reduce((total, dayResults) => {
    const dayTotal = Object.values(dayResults).reduce((daySum, playerData) => daySum + (parseFloat(playerData.result) || 0), 0);
    return total + dayTotal;
  }, 0);
}

function calculateTripHours(trip) {
  if (!trip.dailyResults) return 0;
  return Object.values(trip.dailyResults).reduce((total, dayResults) => {
    const dayTotal = Object.values(dayResults).reduce((daySum, playerData) => daySum + (parseFloat(playerData.hours) || 0), 0);
    return total + dayTotal;
  }, 0);
}

function calculateTripWinRate(trip) {
  const totalProfit = calculateTripProfit(trip);
  const totalHours = calculateTripHours(trip);
  return totalHours === 0 ? 0 : totalProfit / totalHours;
}

function getResultClass(result) {
  if (result > 0) return 'profit';
  if (result < 0) return 'loss';
  return 'even';
}

function confirmDelete(tripId) {
  selectedTripId.value = tripId;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedTripId.value = null;
}

async function deleteAndClose() {
  if (selectedTripId.value) {
    await tripStore.deleteTrip(selectedTripId.value);
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 3000);
    closeModal();
  }
}
</script>

<style scoped>
.saved-trips-container {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}
h2 {
  text-align: center;
  margin-bottom: 2rem;
}
.loading-message, .no-trips {
  margin-top: 1rem;
  color: #a0aec0;
  text-align: center;
  font-size: 1.2rem;
}
.trips-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.trips-list li {
  background-color: #2d3748;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}
.trip-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}
.trip-destination {
  font-size: 1.5rem;
  font-weight: bold;
}
.trip-date {
  font-size: 0.9rem;
  color: #a0aec0;
}
.trip-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.trip-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  background-color: #1a202c;
  padding: 1rem;
  border-radius: 8px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
}
.stat-item label {
  font-size: 0.9rem;
  color: #a0aec0;
  margin-bottom: 0.25rem;
  font-weight: bold;
}
.stat-item .value {
  font-size: 1.5rem;
  font-weight: bold;
}

.delete-btn {
  background-color: #c53030;
}
.delete-btn:hover {
  background-color: #9b2c2c;
}
.profit { color: #68d391; }
.loss { color: #fc8181; }
.even { color: #e2e8f0; }

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #2d3748;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  border: 1px solid var(--border-color);
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: white;
}

.modal-content p {
  margin: 0 0 2rem 0;
  color: #a0aec0;
  font-size: 1.1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.cancel-btn, .confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cancel-btn {
  background-color: #4A5568;
  color: white;
}

.cancel-btn:hover {
  background-color: #2D3748;
}

.confirm-btn {
  background-color: #c53030;
  color: white;
}

.confirm-btn:hover {
  background-color: #9b2c2c;
}

/* Toast Styles */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.success-toast {
  background-color: #38a169;
  color: white;
}

.toast-icon {
  font-size: 1.5rem;
  font-weight: bold;
}

.toast-message {
  font-size: 1rem;
  font-weight: bold;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>