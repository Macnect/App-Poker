<template>
  <div class="saved-trips-container">
    <h2>Viajes Guardados</h2>
    <div v-if="tripStore.savedTrips.length === 0" class="no-trips">
      No tienes viajes guardados todavía.
    </div>
    <ul v-else class="trips-list">
      <li v-for="trip in tripStore.savedTrips" :key="trip.id">
        <div class="trip-header">
          <div class="trip-info">
            <span class="trip-destination">{{ trip.city || 'Viaje sin ciudad' }}, {{ trip.casino || 'Sin casino' }}</span>
            <span class="trip-date">Guardado el: {{ trip.date }}</span>
          </div>
          <div class="trip-actions">
            <button @click="loadTripForEditing(trip.id)">Cargar y Editar</button>
            <button class="delete-btn" @click="tripStore.deleteTrip(trip.id)">Eliminar</button>
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
              {{ calculateTripProfit(trip).toFixed(2) }} {{ trip.currency }}
            </span>
          </div>
          <div class="stat-item">
            <label>Media {{ trip.currency }}/h</label>
            <span class="value" :class="getResultClass(calculateTripWinRate(trip))">
              {{ calculateTripWinRate(trip).toFixed(2) }}
            </span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useTripStore } from '../store/useTripStore';

const tripStore = useTripStore();
const emit = defineEmits(['switch-view']);

function loadTripForEditing(tripId) {
  tripStore.loadTrip(tripId);
  emit('switch-view', 'CommunityView');
}

function calculateTripProfit(trip) {
  if (!trip.dailyResults) return 0;
  return Object.values(trip.dailyResults).reduce((total, dayResults) => {
    const dayTotal = Object.values(dayResults).reduce((daySum, playerData) => daySum + (playerData.result || 0), 0);
    return total + dayTotal;
  }, 0);
}

function calculateTripHours(trip) {
  if (!trip.dailyResults) return 0;
  return Object.values(trip.dailyResults).reduce((total, dayResults) => {
    const dayTotal = Object.values(dayResults).reduce((daySum, playerData) => daySum + (playerData.hours || 0), 0);
    return total + dayTotal;
  }, 0);
}

function calculateTripWinRate(trip) {
  const totalProfit = calculateTripProfit(trip);
  const totalHours = calculateTripHours(trip);
  if (totalHours === 0) {
    return 0;
  }
  return totalProfit / totalHours;
}

function getResultClass(result) {
  if (result > 0) return 'profit';
  if (result < 0) return 'loss';
  return 'even';
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
.no-trips {
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
</style>