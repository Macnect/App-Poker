<template>
  <div class="trip-planner-container">
    <!-- Panel de Planificación -->
    <div v-if="!tripStore.isTripActive" class="planner-panel">
      <h2>Planificador de Viajes de Poker - Torneos</h2>
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
import { useTournamentTripStore } from '../store/useTournamentTripStore';

const tripStore = useTournamentTripStore();
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
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   TournamentTripsView - Tournament Purple Theme
   ======================================== */

/* Import Premium Modern Font - Poppins */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

* {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.trip-planner-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
  height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  overflow-y: auto;
}

.planner-panel,
.tracking-panel {
  width: 100%;
  max-width: 1100px;
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(168, 85, 247, 0.15);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
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

h2 {
  margin: 0 0 2rem 0;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

h3 {
  font-size: 1.8rem;
  color: #f9fafb;
  border-bottom: 1.5px solid rgba(168, 85, 247, 0.2);
  padding-bottom: 0.75rem;
  margin-bottom: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* ========================================
   FORM ELEMENTS - Premium Inputs
   ======================================== */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 2.5rem;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-item label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.config-item input,
.config-item select {
  padding: 16px 20px;
  font-size: 1.1rem;
  font-weight: 500;
  border-radius: 12px;
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
  border-color: rgba(168, 85, 247, 0.4);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.9) 100%);
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

.collective-bankroll .calculated-value {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.2) 100%);
  border: 1.5px solid rgba(168, 85, 247, 0.3);
  padding: 18px;
  font-size: 1.8rem;
  font-weight: 700;
  border-radius: 12px;
  text-align: center;
  color: #a855f7;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  box-shadow: 0 4px 8px rgba(168, 85, 247, 0.15);
}

/* ========================================
   PLAYER LIST - Premium Cards
   ======================================== */
.player-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 450px;
  overflow-y: auto;
  padding-right: 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(168, 85, 247, 0.3) rgba(31, 41, 55, 0.5);
}

.player-list::-webkit-scrollbar {
  width: 8px;
}

.player-list::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 10px;
}

.player-list::-webkit-scrollbar-thumb {
  background: rgba(168, 85, 247, 0.3);
  border-radius: 10px;
}

.player-entry {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%);
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(156, 163, 175, 0.1);
  transition: all 0.3s ease;
}

.player-entry:hover {
  border-color: rgba(168, 85, 247, 0.2);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.7) 100%);
}

.player-name-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 1.05rem;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;
  transition: all 0.3s ease;
}

.player-name-input:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.6);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

.participation-input-group {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  border-radius: 8px;
  padding-left: 12px;
  transition: all 0.3s ease;
}

.participation-input-group:focus-within {
  border-color: rgba(168, 85, 247, 0.6);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

.player-participation-input {
  border: none;
  background: transparent;
  width: 110px;
  padding: 12px 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #f9fafb;
  -moz-appearance: textfield;
}

.player-participation-input::-webkit-outer-spin-button,
.player-participation-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.player-participation-input:focus {
  outline: none;
}

.participation-input-group .currency-symbol {
  color: #a855f7;
  padding: 0 6px;
  font-weight: 600;
}

.participation-input-group .participation-percentage {
  color: #d1d5db;
  font-size: 0.95rem;
  padding-right: 12px;
  min-width: 70px;
  text-align: right;
  font-weight: 500;
}

/* ========================================
   BUTTONS - Premium Actions
   ======================================== */
.actions-footer {
  margin-top: 2.5rem;
  display: flex;
  justify-content: center;
}

.start-trip-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
  font-size: 1.35rem;
  font-weight: 700;
  padding: 18px 48px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  box-shadow:
    0 4px 6px -1px rgba(124, 58, 237, 0.3),
    0 10px 20px -3px rgba(124, 58, 237, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.start-trip-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
  transition: left 0.6s ease;
}

.start-trip-btn:hover {
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 8px 16px -2px rgba(124, 58, 237, 0.35),
    0 16px 32px -4px rgba(124, 58, 237, 0.25),
    0 0 24px rgba(168, 85, 247, 0.15);
}

.start-trip-btn:hover::before {
  left: 100%;
}

.start-trip-btn:active {
  transform: translateY(-1px) scale(1);
}

/* ========================================
   TRACKING PANEL - Dashboard Style
   ======================================== */
.tracking-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1.5px solid rgba(168, 85, 247, 0.2);
}

.trip-info {
  font-size: 1.2rem;
  color: #d1d5db;
  font-weight: 500;
  text-align: center;
}

.trip-info strong {
  color: #a855f7;
  font-weight: 600;
}

.trip-actions-header {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.save-trip-btn,
.new-trip-btn,
.add-day-btn {
  padding: 14px 28px;
  font-size: 1.05rem;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.save-trip-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
  box-shadow:
    0 4px 6px -1px rgba(124, 58, 237, 0.3),
    0 10px 20px -3px rgba(124, 58, 237, 0.2);
}

.save-trip-btn:hover {
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(124, 58, 237, 0.4);
}

.new-trip-btn {
  background: linear-gradient(135deg, rgba(113, 128, 150, 0.6) 0%, rgba(74, 85, 104, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;
}

.new-trip-btn:hover {
  background: linear-gradient(135deg, rgba(113, 128, 150, 0.8) 0%, rgba(74, 85, 104, 1) 100%);
  transform: translateY(-2px);
}

.add-day-form {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(168, 85, 247, 0.15);
}

.date-input {
  padding: 14px 18px;
  font-size: 1.05rem;
  font-weight: 500;
  border-radius: 10px;
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  color: #f9fafb;
  color-scheme: dark;
  transition: all 0.3s ease;
}

.date-input:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.6);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

.add-day-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
}

.add-day-btn:hover {
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
  transform: translateY(-2px);
}

/* ========================================
   DAY CARDS - Premium Session Cards
   ======================================== */
.days-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.day-card {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.7) 100%);
  padding: 1.75rem;
  border-radius: 14px;
  border: 1px solid rgba(168, 85, 247, 0.15);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.day-card:hover {
  border-color: rgba(168, 85, 247, 0.25);
  transform: translateX(3px);
}

.day-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #f9fafb;
  border-bottom-color: rgba(168, 85, 247, 0.25);
}

.player-results-list {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.player-session-details {
  border-bottom: 1px solid rgba(168, 85, 247, 0.1);
  padding-bottom: 1.5rem;
}

.player-session-details:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.player-name {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: block;
  color: #f9fafb;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.player-inputs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1.25rem;
  align-items: flex-end;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-group label {
  font-size: 0.9rem;
  color: #d1d5db;
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.input-group input {
  width: 100%;
  padding: 12px 16px;
  font-size: 1.05rem;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.6);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

.input-group.calculated span {
  font-size: 1.3rem;
  font-weight: 700;
  padding: 12px 16px;
  text-align: center;
  border-radius: 8px;
  background: rgba(26, 32, 44, 0.5);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* ========================================
   TOTALS SECTION - Premium Summary
   ======================================== */
.totals-section {
  margin-top: 3rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.7) 100%);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
}

.totals-section h3 {
  margin-top: 0;
}

.player-totals-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}

.player-total-item-detailed {
  padding: 1.25rem;
  border: 1.5px solid rgba(168, 85, 247, 0.15);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.4) 0%, rgba(17, 24, 39, 0.6) 100%);
  transition: all 0.3s ease;
}

.player-total-item-detailed:hover {
  border-color: rgba(168, 85, 247, 0.3);
  transform: scale(1.01);
}

.player-total-item-detailed > .player-name {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1.5px solid rgba(168, 85, 247, 0.15);
}

.player-financials {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.financial-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.financial-item label {
  font-size: 0.9rem;
  color: #d1d5db;
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.financial-item .value {
  font-weight: 700;
  font-size: 1.3rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.trip-totals-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-top: 2px solid rgba(168, 85, 247, 0.3);
  padding-top: 2rem;
}

.trip-total-item {
  display: flex;
  justify-content: space-between;
  font-size: 1.2rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(26, 32, 44, 0.3);
  transition: all 0.3s ease;
}

.trip-total-item:hover {
  background: rgba(26, 32, 44, 0.5);
}

.trip-total-item.main-total {
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%);
  border: 2px solid rgba(168, 85, 247, 0.3);
  padding: 1.25rem;
}

.trip-total-value {
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* ========================================
   RESULT COLORS
   ======================================== */
.profit {
  color: #10b981;
}

.loss {
  color: #fc8181;
}

.even {
  color: #e2e8f0;
}

/* ========================================
   TOAST NOTIFICATIONS - Premium
   ======================================== */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  z-index: 1000;
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.success-toast {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
}

.toast-icon {
  font-size: 1.6rem;
  font-weight: 700;
}

.toast-message {
  font-size: 1.05rem;
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

/* ========================================================== */
/* ===> ADAPTACIÓN COMPLETA PARA MÓVILES <=== */
/* ========================================================== */
@media (max-width: 640px) {
  .trip-planner-container {
    padding: 0.5rem;
  }

  .planner-panel, .tracking-panel {
    padding: 1rem;
    border-radius: 8px;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-column {
    gap: 1rem;
  }

  .config-item label {
    font-size: 0.95rem;
  }

  .config-item input,
  .config-item select {
    padding: 10px;
    font-size: 0.95rem;
    width: 100%;
    box-sizing: border-box;
  }

  .config-item select option {
    font-size: 0.9rem;
  }

  .collective-bankroll .calculated-value {
    font-size: 1.2rem;
    padding: 12px;
  }

  .player-list {
    max-height: 300px;
  }

  .player-entry {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .player-name-input {
    font-size: 0.95rem;
    padding: 10px;
  }

  .participation-input-group {
    width: 100%;
    padding-left: 8px;
  }

  .player-participation-input {
    width: 80px;
    font-size: 0.95rem;
    padding: 8px;
  }

  .participation-input-group .currency-symbol,
  .participation-input-group .participation-percentage {
    font-size: 0.85rem;
  }

  .start-trip-btn {
    font-size: 1.1rem;
    padding: 12px 30px;
  }

  .tracking-header {
    gap: 1rem;
  }

  .trip-info {
    font-size: 1rem;
    text-align: center;
    padding: 0 0.5rem;
  }

  .trip-actions-header {
    flex-direction: column;
    width: 100%;
  }

  .save-trip-btn,
  .new-trip-btn {
    width: 100%;
    padding: 10px 20px;
    font-size: 1rem;
  }

  .add-day-form {
    flex-direction: column;
    width: 100%;
    gap: 0.75rem;
  }

  .date-input {
    width: 100%;
    padding: 10px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .add-day-btn {
    width: 100%;
    padding: 10px 20px;
    font-size: 1rem;
  }

  .day-card {
    padding: 1rem;
  }

  .day-card h3 {
    font-size: 1.2rem;
  }

  .player-session-details {
    padding-bottom: 1rem;
  }

  .player-name {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
  }

  .player-inputs-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .input-group {
    gap: 6px;
  }

  .input-group label {
    font-size: 0.85rem;
  }

  .input-group input {
    padding: 8px;
    font-size: 0.95rem;
    box-sizing: border-box;
  }

  .input-group.calculated span {
    font-size: 1.1rem;
    padding: 8px;
  }

  .totals-section {
    margin-top: 2rem;
    padding: 1rem;
  }

  .player-total-item-detailed {
    padding: 0.75rem;
  }

  .player-total-item-detailed > .player-name {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
  }

  .player-financials {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .financial-item label {
    font-size: 0.85rem;
  }

  .financial-item .value {
    font-size: 1.1rem;
  }

  .trip-totals-summary {
    gap: 0.5rem;
    padding-top: 1rem;
  }

  .trip-total-item {
    flex-direction: column;
    gap: 0.25rem;
    font-size: 1rem;
  }

  .trip-total-item.main-total {
    font-size: 1.3rem;
  }

  .toast {
    top: 10px;
    right: 10px;
    left: 10px;
    padding: 12px 15px;
  }

  .toast-icon {
    font-size: 1.2rem;
  }

  .toast-message {
    font-size: 0.9rem;
  }
}
</style>
