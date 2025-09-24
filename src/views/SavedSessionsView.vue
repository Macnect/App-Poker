<template>
  <div class="saved-sessions-container">
    <h2>Sesiones Guardadas</h2>

    <!-- SECCIÓN DE FILTROS AÑADIDA -->
    <div class="filters-container">
      <label for="date-range-filter">Mostrar Sesiones de:</label>
      <select id="date-range-filter" v-model="selectedFilter">
        <option value="all">Todo</option>
        <option value="today">Hoy</option>
        <option value="last7days">Última semana</option>
        <option value="last1month">Último mes</option>
        <option value="last3months">Últimos 3 meses</option>
        <option value="last6months">Últimos 6 meses</option>
        <option value="last1year">Último año</option>
      </select>
    </div>

    <!-- MENSAJE Y LISTA AHORA USAN LA PROPIEDAD COMPUTADA 'filteredSessions' -->
    <div v-if="filteredSessions.length === 0" class="no-sessions">
      No tienes sesiones guardadas que coincidan con el filtro seleccionado.
    </div>
    <ul v-else class="sessions-list">
      <li v-for="session in filteredSessions" :key="session.id">
        
        <div class="session-header">
          <span class="location">{{ session.location || 'Partida Privada' }}</span>
          <span class="date">{{ session.date }}</span>
        </div>
        
        <div class="session-result" :class="getResultClass(session.result)">
          <span>Resultado</span>
          <span class="result-amount">
            {{ formatResult(session.result, session.currency) }}
          </span>
        </div>

        <div class="session-details">
          <div class="session-stats">
            <div class="stat-item"><strong>Duración:</strong> <span>{{ formatDuration(session.duration) }}</span></div>
            <div class="stat-item"><strong>Descansos:</strong> <span>{{ formatDuration(session.totalBreakTime) }}</span></div>
            <div class="stat-item"><strong>Ciegas:</strong> <span>{{ session.blinds }}</span></div>
            <div class="stat-item"><strong>Jugadores:</strong> <span>{{ session.playerCount }}</span></div>
            <div class="stat-item"><strong>Buy-in:</strong> <span>{{ session.currency }}{{ session.initialStack }}</span></div>
            <div class="stat-item"><strong>Recargas:</strong> <span>{{ session.currency }}{{ session.totalRebuys || 0 }}</span></div>
            <div class="stat-item"><strong>Gastos:</strong> <span>-{{ session.currency }}{{ session.totalExpenses || 0 }}</span></div>
            <div class="stat-item"><strong>Stack Final:</strong> <span>{{ session.currency }}{{ session.finalStack !== undefined ? session.finalStack : 'N/A' }}</span></div>
          </div>
        </div>

        <div class="session-actions">
          <button class="delete-btn" @click="sessionStore.deleteSession(session.id)">Eliminar Sesión</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'; // <-- IMPORTAR ref Y computed
import { useSessionStore } from '../store/useSessionStore';

const sessionStore = useSessionStore();

// --- NUEVO ESTADO LOCAL PARA EL FILTRO ---
const selectedFilter = ref('all');

// --- NUEVA PROPIEDAD COMPUTADA PARA FILTRAR LAS SESIONES ---
const filteredSessions = computed(() => {
  const filter = selectedFilter.value;
  const allSessions = sessionStore.savedSessions;

  if (filter === 'all') {
    return allSessions;
  }

  const now = new Date();
  const cutoffDate = new Date();

  // Establecer la fecha de corte según el filtro seleccionado
  switch (filter) {
    case 'today':
      cutoffDate.setHours(0, 0, 0, 0);
      break;
    case 'last7days':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case 'last1month':
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
    case 'last3months':
      cutoffDate.setMonth(now.getMonth() - 3);
      break;
    case 'last6months':
      cutoffDate.setMonth(now.getMonth() - 6);
      break;
    case 'last1year':
      cutoffDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return allSessions.filter(session => {
    // Parsea la fecha en formato DD/MM/YYYY para que sea comparable
    const parts = session.date.split('/');
    const sessionDate = new Date(parts[2], parts[1] - 1, parts[0]);
    return sessionDate >= cutoffDate;
  });
});

function formatDuration(totalSeconds) {
  if (!totalSeconds) return '0m';
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m`;
  return result.trim();
}

function getResultClass(result) {
  if (typeof result !== 'number') return 'even';
  if (result > 0) return 'profit';
  if (result < 0) return 'loss';
  return 'even';
}

function formatResult(result, currency) {
  if (typeof result !== 'number') {
    return 'N/A';
  }
  const prefix = result >= 0 ? '+' : '';
  return `${prefix}${currency}${result.toFixed(2)}`;
}
</script>

<style scoped>
.saved-sessions-container {
  padding: 2rem;
  max-width: 700px;
  margin: 0 auto;
}
.no-sessions {
  margin-top: 1rem;
  color: #a0aec0;
  font-size: 1.2rem;
  text-align: center;
}
.sessions-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* --- NUEVOS ESTILOS PARA LA BARRA DE FILTROS --- */
.filters-container {
  background-color: #2d3748;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
.filters-container label {
  font-weight: bold;
  font-size: 1.1rem;
  color: #a0aec0;
}
.filters-container select {
  padding: 10px 15px;
  font-size: 1.1rem;
  background-color: #4A5568;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: white;
}

/* --- (Estilos existentes sin cambios) --- */
.sessions-list li { background-color: #2d3748; padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 1.5rem; }
.session-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #4a5568; padding-bottom: 1rem; }
.location { font-size: 1.8rem; font-weight: 700; }
.date { font-size: 1rem; color: #a0aec0; flex-shrink: 0; margin-left: 1rem; }
.session-result { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem; border-radius: 8px; text-align: center; }
.session-result span:first-child { font-size: 1.1rem; opacity: .8; margin-bottom: .5rem; text-transform: uppercase; letter-spacing: 1px; }
.result-amount { font-size: 2.8rem; font-weight: 700; }
.profit { background-color: rgba(47, 133, 90, .3); color: #68d391; }
.loss { background-color: rgba(197, 48, 48, .3); color: #fc8181; }
.even { background-color: rgba(74, 85, 104, .3); color: #a0aec0; }
.session-stats { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.stat-item { display: flex; justify-content: space-between; align-items: center; font-size: 1.3rem; padding: 0.5rem 0; border-bottom: 1px solid #3c485e; }
.stat-item:last-child { border-bottom: none; }
.stat-item strong { color: #a0aec0; margin-right: 1rem; }
.stat-item span { font-weight: bold; }
.session-actions { display: flex; justify-content: center; margin-top: 1rem; }
.delete-btn { background-color: #c53030; padding: 12px 25px; font-size: 1.1rem; width: 100%; max-width: 300px; }
.delete-btn:hover { background-color: #9b2c2c; }
</style>