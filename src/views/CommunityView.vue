<template>
  <div class="trip-planner-container">
    <!-- Panel de Planificación -->
    <div v-if="!tripStore.isTripActive" class="planner-panel">
      <h2>Planificador de Viajes de Poker</h2>
      <div class="form-grid">
        <div class="form-column">
          <div class="config-item"><label for="trip-city">Ciudad</label><input id="trip-city" type="text" v-model="tripStore.city" placeholder="Ej: Las Vegas"></div>
          <div class="config-item"><label for="trip-casino">Casino / Club</label><input id="trip-casino" type="text" v-model="tripStore.casino" placeholder="Ej: Bellagio"></div>
          
          <!-- SELECTOR DE MONEDA ACTUALIZADO CON LA LISTA COMPLETA -->
          <div class="config-item">
            <label for="trip-currency">Moneda</label>
            <select id="trip-currency" v-model="tripStore.currency">
              <option v-for="c in currencies" :key="c.symbol" :value="c.symbol">
                {{ c.symbol }} - {{ c.name }}
              </option>
            </select>
          </div>

          <div class="config-item"><label for="player-count">Número de Jugadores</label><select id="player-count" v-model.number="tripStore.playerCount" @change="tripStore.setPlayerCount(tripStore.playerCount)"><option v-for="n in 14" :key="n" :value="n + 1">{{ n + 1 }} Jugadores</option></select></div>
          <div class="config-item collective-bankroll"><label>Banca Colectiva (Total)</label><div class="calculated-value">{{ tripStore.collectiveBankroll }} {{ tripStore.currency }}</div></div>
        </div>
        <div class="form-column">
          <div class="config-item">
            <label for="reparto-type">Tipo de Reparto Final</label>
            <select id="reparto-type" v-model="tripStore.repartoType">
              <option value="participation">Reparto por Aportación</option>
              <option value="hours">Reparto por Horas Jugadas</option>
            </select>
          </div>
          <div class="config-item">
            <label>Nombres y Aportación</label>
            <div class="player-list">
              <div v-for="player in tripStore.players" :key="player.id" class="player-entry">
                <input type="text" v-model="player.name" class="player-name-input" placeholder="Nombre">
                <div v-if="tripStore.repartoType === 'participation'" class="participation-input-group">
                  <input type="number" :value="player.individualBankroll" @input="tripStore.updatePlayerBankroll(player.id, $event.target.value)" class="player-participation-input" min="0">
                  <span class="currency-symbol">{{ tripStore.currency }}</span>
                  <span class="participation-percentage">({{ player.participation.toFixed(2) }}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="actions-footer"><button class="start-trip-btn" @click="tripStore.startTrip()">Iniciar Viaje</button></div>
    </div>

    <!-- Panel de Seguimiento por Días -->
    <div v-else class="tracking-panel">
      <header class="tracking-header">
        <h2>Seguimiento del Viaje</h2>
        <div class="trip-info"><span><strong>Destino:</strong> {{ tripStore.city || 'N/A' }}, {{ tripStore.casino || 'N/A' }}</span></div>
        <div class="trip-actions-header">
          <button @click="handleSaveTrip()" class="save-trip-btn">Guardar Viaje</button>
          <button @click="tripStore.resetCurrentTrip()" class="new-trip-btn">Nuevo Viaje</button>
        </div>
        <div class="add-day-form">
          <input type="date" v-model="newDayDateString" class="date-input">
          <button @click="confirmAddDay" class="add-day-btn">Añadir Día</button>
        </div>
      </header>
      
      <div class="days-container">
        <div v-for="day in tripStore.tripDays" :key="day" class="day-card">
          <h3>Día: {{ new Date(day + 'T12:00:00').toLocaleDateString() }}</h3>
          <div class="player-results-list">
            <div v-for="player in tripStore.players" :key="player.id" class="player-session-details">
              <span class="player-name">{{ player.name }}</span>
              <div class="player-inputs-grid">
                <div class="input-group"><label>Resultado ({{ tripStore.currency }})</label><input type="number" :value="tripStore.dailyResults[day]?.[player.id]?.result" @input="tripStore.updatePlayerDailyData(day, player.id, 'result', $event.target.value)"></div>
                <div class="input-group"><label>Horas</label><input type="number" :value="tripStore.dailyResults[day]?.[player.id]?.hours" @input="tripStore.updatePlayerDailyData(day, player.id, 'hours', $event.target.value)"></div>
                <div class="input-group"><label>Stake</label><input type="text" :value="tripStore.dailyResults[day]?.[player.id]?.stake" @input="tripStore.updatePlayerDailyData(day, player.id, 'stake', $event.target.value)" placeholder="1/2"></div>
                <div class="input-group calculated"><label>{{ tripStore.currency }} / Hora</label><span :class="getResultClass(calculateWinRate(tripStore.dailyResults[day]?.[player.id]))">{{ calculateWinRate(tripStore.dailyResults[day]?.[player.id]).toFixed(2) }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="tripStore.tripDays.length > 0" class="totals-section">
        <h3>Resultados Acumulados</h3>
        <div class="player-totals-list">
           <div v-for="player in tripStore.players" :key="player.id" class="player-total-item-detailed">
              <span class="player-name">
                {{ player.name }}
                <span v-if="tripStore.repartoType === 'participation'">({{ player.participation || 0 }}%)</span>
              </span>
              <div class="player-financials">
                <div class="financial-item"><label>Horas Totales</label><span class="value">{{ tripStore.playerTotalHours[player.id]?.toFixed(1) || '0.0' }} h</span></div>
                <div class="financial-item"><label>Media {{tripStore.currency}}/h</label><span class="value" :class="getResultClass(tripStore.playerAverageWinRates[player.id])">{{ tripStore.playerAverageWinRates[player.id]?.toFixed(2) || '0.00' }}</span></div>
                <div class="financial-item"><label>P/L Individual</label><span class="value" :class="getResultClass(tripStore.playerTotals[player.id])">{{ tripStore.playerTotals[player.id]?.toFixed(2) || '0.00' }} {{ tripStore.currency }}</span></div>
                <div class="financial-item"><label>{{ repartoLabel }}</label><span class="value">{{ tripStore.playerFinalShares[player.id]?.toFixed(2) || '0.00' }} {{ tripStore.currency }}</span></div>
              </div>
            </div>
        </div>
        <div class="trip-totals-summary">
          <div class="trip-total-item"><label>Horas Totales del Viaje</label><span class="trip-total-value">{{ tripStore.tripTotalHours.toFixed(1) }} h</span></div>
          <div class="trip-total-item"><label>Media {{tripStore.currency}}/h del Viaje</label><span class="trip-total-value" :class="getResultClass(tripStore.tripAverageWinRate)">{{ tripStore.tripAverageWinRate.toFixed(2) }}</span></div>
          <div class="trip-total-item main-total"><label>Beneficio Total del Viaje</label><span class="trip-total-value" :class="getResultClass(tripStore.tripTotalProfit)">{{ tripStore.tripTotalProfit.toFixed(2) }} {{ tripStore.currency }}</span></div>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showToast" class="toast success-toast">
      <div class="toast-icon">✓</div>
      <div class="toast-message">Viaje guardado con éxito</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useTripStore } from '../store/useTripStore';

const tripStore = useTripStore();
const showToast = ref(false);

// --- LISTA AMPLIADA DE LAS 30 MONEDAS MÁS USADAS ---
const currencies = ref([
  { symbol: '$', name: 'USD - Dólar estadounidense' },
  { symbol: '€', name: 'EUR - Euro' },
  { symbol: '¥', name: 'JPY - Yen japonés' },
  { symbol: '£', name: 'GBP - Libra esterlina' },
  { symbol: 'A$', name: 'AUD - Dólar australiano' },
  { symbol: 'C$', name: 'CAD - Dólar canadiense' },
  { symbol: 'CHF', name: 'CHF - Franco suizo' },
  { symbol: 'CN¥', name: 'CNY - Yuan chino' },
  { symbol: 'SEK', name: 'SEK - Corona sueca' },
  { symbol: 'NZ$', name: 'NZD - Dólar neozelandés' },
  { symbol: 'Mex$', name: 'MXN - Peso mexicano' },
  { symbol: 'S$', name: 'SGD - Dólar de Singapur' },
  { symbol: 'HK$', name: 'HKD - Dólar de Hong Kong' },
  { symbol: 'NOK', name: 'NOK - Corona noruega' },
  { symbol: '₩', name: 'KRW - Won surcoreano' },
  { symbol: '₺', name: 'TRY - Lira turca' },
  { symbol: '₽', name: 'RUB - Rublo ruso' },
  { symbol: '₹', name: 'INR - Rupia india' },
  { symbol: 'R$', name: 'BRL - Real brasileño' },
  { symbol: 'R', name: 'ZAR - Rand sudafricano' },
  { symbol: 'zł', name: 'PLN - Zloty polaco' },
  { symbol: '฿', name: 'THB - Baht tailandés' },
  { symbol: 'Rp', name: 'IDR - Rupia indonesia' },
  { symbol: 'Ft', name: 'HUF - Forinto húngaro' },
  { symbol: 'Kč', name: 'CZK - Corona checa' },
  { symbol: '₪', name: 'ILS - Nuevo séquel israelí' },
  { symbol: 'CLP$', name: 'CLP - Peso chileno' },
  { symbol: '₱', name: 'PHP - Peso filipino' },
  { symbol: 'د.إ', name: 'AED - Dírham de los EAU' },
  { symbol: 'Col$', name: 'COP - Peso colombiano' }
]);

const newDayDateString = ref(new Date().toISOString().split('T')[0]);

const repartoLabel = computed(() => {
  return tripStore.repartoType === 'hours' ? 'Reparto Final (x Horas)' : 'Reparto Final (x Aport.)';
});

function getResultClass(result) {
  if (result === undefined || result === null || result === 0) return 'even';
  return result > 0 ? 'profit' : 'loss';
}

function calculateWinRate(playerData) {
  if (!playerData || !playerData.hours || playerData.hours <= 0) { return 0; }
  return playerData.result / playerData.hours;
}

function confirmAddDay() {
  if (newDayDateString.value) { tripStore.addTripDay(newDayDateString.value); }
}

function handleSaveTrip() {
  tripStore.saveCurrentTrip();
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

onMounted(() => {
  if (tripStore.players.length !== tripStore.playerCount) { 
    tripStore.setPlayerCount(tripStore.playerCount); 
  }
});
</script>

<style scoped>
/* --- (Estilos existentes sin cambios) --- */
.trip-planner-container { display: flex; justify-content: center; padding: 3rem; }
.planner-panel, .tracking-panel { width: 100%; max-width: 1000px; background-color: #2d3748; border-radius: 12px; padding: 2.5rem; }
h2 { margin-top: 0; margin-bottom: 2rem; text-align: center; font-size: 2.2rem; }
h3 { font-size: 1.6rem; color: #cbd5e0; border-bottom: 1px solid #4a5568; padding-bottom: 0.75rem; margin-bottom: 1.5rem; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 3rem; }
.form-column { display: flex; flex-direction: column; gap: 1.5rem; }
.config-item { display: flex; flex-direction: column; gap: 10px; }
.config-item label { font-weight: bold; font-size: 1.2rem; color: #a0aec0; }
.config-item input, .config-item select { padding: 15px; font-size: 1.1rem; border-radius: 6px; }
.collective-bankroll .calculated-value { background-color: #1a202c; padding: 15px; font-size: 1.5rem; font-weight: bold; border-radius: 6px; text-align: center; color: #68d391; }
.player-list { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 10px; }
.actions-footer { margin-top: 2rem; display: flex; justify-content: center; }
.start-trip-btn { background-color: #38a169; color: white; font-size: 1.4rem; padding: 15px 40px; border-radius: 8px; font-weight: bold; }
.player-entry { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; }
.player-name-input { width: 100%; }
.participation-input-group { display: flex; align-items: center; background-color: #2d3748; border: 1px solid var(--border-color); border-radius: 6px; padding-left: 10px; }
.player-participation-input { border: none; background: transparent; width: 100px; -moz-appearance: textfield; font-size: 1.1rem; color: var(--text-color); }
.player-participation-input::-webkit-outer-spin-button, .player-participation-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.participation-input-group .currency-symbol { color: #a0aec0; padding: 0 5px; }
.participation-input-group .participation-percentage { color: #a0aec0; font-size: 0.9rem; padding-right: 10px; min-width: 60px; text-align: right;}
.tracking-header { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
.trip-info { font-size: 1.2rem; }
.trip-actions-header { display: flex; gap: 1rem; }
.save-trip-btn { background-color: #38a169; color: white; padding: 12px 25px; font-size: 1.1rem; font-weight: bold; border-radius: 6px; }
.new-trip-btn { background-color: #718096; padding: 12px 25px; font-size: 1.1rem; font-weight: bold; border-radius: 6px; }
.add-day-form { display: flex; align-items: center; gap: 1rem; background-color: #1a202c; padding: 1rem; border-radius: 8px; }
.date-input { padding: 12px; font-size: 1.1rem; border-radius: 6px; border: 1px solid var(--border-color); background-color: #2d3748; color: var(--text-color); color-scheme: dark; }
.add-day-btn { background-color: var(--primary-color); padding: 12px 25px; font-size: 1.1rem; font-weight: bold; border-radius: 6px; }
.days-container { display: flex; flex-direction: column; gap: 2rem; }
.day-card { background-color: #1a202c; padding: 1.5rem; border-radius: 8px; border: 1px solid #4a5568; }
.player-results-list { display: flex; flex-direction: column; gap: 1.5rem; }
.player-session-details { border-bottom: 1px solid #3a475c; padding-bottom: 1.5rem; }
.player-session-details:last-child { border-bottom: none; padding-bottom: 0; }
.player-name { font-size: 1.4rem; font-weight: bold; margin-bottom: 1rem; display: block; }
.player-inputs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; align-items: flex-end; }
.input-group { display: flex; flex-direction: column; gap: 8px; }
.input-group label { font-size: 0.9rem; color: #a0aec0; font-weight: bold; }
.input-group input { width: 100%; padding: 10px; font-size: 1.1rem; border-radius: 4px; }
.input-group.calculated span { font-size: 1.4rem; font-weight: bold; padding: 8px 10px; text-align: center; }
.totals-section { margin-top: 3rem; background-color: #1a202c; padding: 1.5rem; border-radius: 8px; }
.player-totals-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
.player-total-item-detailed { padding: 1rem; border: 1px solid #3a475c; border-radius: 6px; }
.player-total-item-detailed > .player-name { font-size: 1.3rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #3a475c; }
.player-financials { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.financial-item { display: flex; flex-direction: column; }
.financial-item label { font-size: 0.9rem; color: #a0aec0; margin-bottom: 0.25rem; }
.financial-item .value { font-weight: bold; font-size: 1.2rem; }
.trip-totals-summary { display: flex; flex-direction: column; gap: 0.75rem; border-top: 2px solid #4a5568; padding-top: 1.5rem; }
.trip-total-item { display: flex; justify-content: space-between; font-size: 1.1rem; }
.trip-total-item.main-total { font-size: 1.6rem; font-weight: bold; }
.trip-total-value { font-weight: bold; }
.profit { color: #68d391; }
.loss { color: #fc8181; }
.even { color: #e2e8f0; }

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