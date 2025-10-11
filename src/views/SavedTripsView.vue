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
/* ========================================
   PREMIUM TRIPS DESIGN SYSTEM
   ======================================== */

/* Import Premium Modern Font - Poppins */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

* {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.saved-trips-container {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  min-height: 100vh;
}

h2 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.loading-message, .no-trips {
  margin-top: 1rem;
  color: #d1d5db;
  text-align: center;
  font-size: 1.2rem;
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(212, 175, 55, 0.15);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4);
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
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid rgba(212, 175, 55, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.trips-list li:hover {
  transform: translateY(-3px);
  border-color: rgba(212, 175, 55, 0.3);
  box-shadow:
    0 8px 16px -2px rgba(0, 0, 0, 0.35),
    0 16px 32px -4px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 0 24px rgba(212, 175, 55, 0.08);
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
  font-weight: 700;
  color: #f9fafb;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.trip-date {
  font-size: 0.9rem;
  color: #d1d5db;
  font-weight: 500;
  letter-spacing: 0.025em;
}

.trip-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.trip-actions button {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.025em;
  text-transform: uppercase;
  font-size: 0.95rem;
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  color: white;
  box-shadow:
    0 4px 6px -1px rgba(4, 120, 87, 0.3),
    0 10px 20px -3px rgba(4, 120, 87, 0.2);
}

.trip-actions button:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 8px 16px -2px rgba(4, 120, 87, 0.35),
    0 16px 32px -4px rgba(4, 120, 87, 0.25);
}

.delete-btn {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
  box-shadow:
    0 4px 6px -1px rgba(220, 38, 38, 0.3),
    0 10px 20px -3px rgba(220, 38, 38, 0.2) !important;
}

.delete-btn:hover {
  background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%) !important;
  box-shadow:
    0 8px 16px -2px rgba(220, 38, 38, 0.35),
    0 16px 32px -4px rgba(220, 38, 38, 0.25) !important;
}

.trip-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: rgba(26, 32, 44, 0.5);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(26, 32, 44, 0.7);
  transform: translateY(-2px);
}

.stat-item label {
  font-size: 0.95rem;
  color: #d1d5db;
  margin-bottom: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.stat-item .value {
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  border: 1px solid rgba(212, 175, 55, 0.15);
  box-shadow:
    0 20px 60px -15px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  animation: slideUp 0.3s ease-out;
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

.modal-content h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #f9fafb;
}

.modal-content p {
  margin: 0 0 2rem 0;
  color: #d1d5db;
  font-size: 1.1rem;
  font-weight: 400;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.cancel-btn, .confirm-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.cancel-btn {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  color: white;
  border: 1.5px solid rgba(156, 163, 175, 0.2);
}

.cancel-btn:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 1) 100%);
  transform: translateY(-2px);
}

.confirm-btn {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  box-shadow:
    0 4px 6px -1px rgba(220, 38, 38, 0.3),
    0 10px 20px -3px rgba(220, 38, 38, 0.2);
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
  transform: translateY(-3px);
  box-shadow:
    0 8px 16px -2px rgba(220, 38, 38, 0.35),
    0 16px 32px -4px rgba(220, 38, 38, 0.25);
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
  border-radius: 12px;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  backdrop-filter: blur(10px);
}

.success-toast {
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  color: white;
}

.toast-icon {
  font-size: 1.5rem;
  font-weight: bold;
}

.toast-message {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.025em;
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

@media (max-width: 640px) {
  .saved-trips-container {
    padding: 1rem 0.5rem;
  }

  h2 {
    font-size: 2rem;
  }

  .trip-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .trip-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .trip-actions button {
    padding: 10px 18px;
    font-size: 0.9rem;
  }

  .trip-destination {
    font-size: 1.2rem;
  }

  .trip-stats {
    grid-template-columns: 1fr 1fr;
    padding: 1rem;
  }

  .stat-item .value {
    font-size: 1.2rem;
  }

  .modal-content {
    padding: 2rem;
  }
}
</style>