<template>
  <div class="saved-sessions-container">
    <h2>Torneos Guardados</h2>

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

    <div v-if="groupedTournaments.length === 0" class="no-sessions">
      No tienes sesiones guardadas que coincidan con el filtro seleccionado.
    </div>
    <ul v-else class="sessions-list">
      <li v-for="tournament in groupedTournaments" :key="tournament.tournamentId" class="tournament-group">

        <!-- Cabecera del torneo (siempre visible) -->
        <div class="tournament-header" @click="toggleTournament(tournament.tournamentId)">
          <div class="tournament-info">
            <div class="tournament-title-row">
              <span class="expand-icon">{{ isTournamentExpanded(tournament.tournamentId) ? '▼' : '▶' }}</span>
              <span class="location">{{ tournament.mainSession.ubicacion || 'Torneo Online' }}</span>
              <span class="game-variant-badge" :class="getGameVariantClass(tournament.mainSession.tipo_juego)">
                {{ formatGameType(tournament.mainSession.tipo_juego) }}
              </span>
              <span v-if="tournament.mainSession.tipo_torneo" class="tournament-type-badge">
                {{ tournament.mainSession.tipo_torneo }}
              </span>
              <span v-if="tournament.totalDays > 1" class="multi-day-badge">
                {{ tournament.totalDays }} Días
              </span>
              <span v-if="!tournament.isFinished" class="in-progress-badge">
                En Progreso
              </span>
            </div>
            <div class="tournament-summary">
              <span class="summary-item">{{ formatDuration(tournament.totalDuration) }}</span>
              <span class="summary-item">{{ tournament.mainSession.moneda }}{{ tournament.mainSession.buy_in }} buy-in</span>
              <span v-if="tournament.totalRebuys > 0" class="summary-item">+{{ tournament.mainSession.moneda }}{{ tournament.totalRebuys }} rebuys</span>
            </div>
          </div>
          <span class="date">{{ tournament.latestDate.toLocaleDateString() }}</span>
        </div>

        <!-- Resultado final del torneo (solo si está terminado) -->
        <div v-if="tournament.isFinished" class="session-result" :class="getResultClass(tournament.lastDay.resultado)">
          <span>Resultado Final</span>
          <span class="result-amount">
            {{ formatResult(tournament.lastDay.resultado, tournament.mainSession.moneda) }}
          </span>
        </div>

        <!-- Contenido expandible con los días -->
        <div v-if="isTournamentExpanded(tournament.tournamentId)" class="tournament-days">
          <div v-for="(day, index) in tournament.days" :key="day.id" class="day-card">
            <div class="day-header">
              <span class="day-label">Día {{ day.dia_torneo || 1 }}</span>
              <span class="day-date">{{ new Date(day.fecha + 'T12:00:00').toLocaleDateString() }}</span>
            </div>

            <div class="day-stats">
              <div class="stat-item"><strong>Duración:</strong> <span>{{ formatDuration(day.duracion_segundos) }}</span></div>
              <div class="stat-item"><strong>Recompras:</strong> <span>{{ day.moneda }}{{ day.total_recompras || 0 }}</span></div>
              <div v-if="day.stack_dia_2 && day.es_dia_2" class="stat-item"><strong>Stack Final:</strong> <span>{{ day.stack_dia_2 }} fichas</span></div>
              <div v-if="day.posicion_final" class="stat-item"><strong>Posición:</strong> <span>#{{ day.posicion_final }}</span></div>
              <div v-if="day.premio_ganado" class="stat-item"><strong>Premio:</strong> <span>{{ day.moneda }}{{ day.premio_ganado }}</span></div>
            </div>

            <div class="day-actions">
              <button v-if="index === tournament.days.length - 1 && day.es_dia_2" class="resume-btn" @click="resumeTournament(day)" title="Reanudar Torneo">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Reanudar
              </button>
              <button class="edit-btn" @click="openEditModal(day)" title="Editar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Acciones del torneo completo -->
        <div class="tournament-actions">
          <button v-if="!tournament.isFinished" class="resume-btn" @click="resumeTournament(tournament.lastDay)" title="Reanudar Torneo">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            Reanudar
          </button>
          <button class="delete-btn" @click="confirmDelete(tournament.mainSession.id)">Eliminar Torneo</button>
        </div>
      </li>
    </ul>

    <!-- Confirmation Modal -->
     <div v-if="showModal" class="modal-overlay" @click="closeModal">
       <div class="modal-content" @click.stop>
         <h3>Confirmar Eliminación</h3>
         <p>¿Estás seguro de que deseas eliminar esta sesión?</p>
         <div class="modal-actions">
           <button class="cancel-btn" @click="closeModal">No</button>
           <button class="confirm-btn" @click="deleteAndClose">Sí</button>
         </div>
       </div>
     </div>

     <!-- Notes Modal -->
     <div v-if="showNotesModal" class="modal-overlay" @click="closeNotesModal">
       <div class="modal-content notes-modal" @click.stop>
         <h3>Notas del Torneo</h3>
         <textarea v-model="sessionNotes" placeholder="Escribe tus notas sobre este torneo..." rows="6"></textarea>
         <div class="modal-actions">
           <button class="cancel-btn" @click="closeNotesModal">Cancelar</button>
           <button class="confirm-btn" @click="saveNotes">Guardar</button>
         </div>
       </div>
     </div>

     <!-- Edit Modal -->
     <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
       <div class="modal-content edit-modal" @click.stop>
         <h3>Editar Torneo</h3>
         <div class="edit-form">
           <div class="form-group">
             <label>Posición Final:</label>
             <input type="number" v-model.number="editFormData.posicion_final" placeholder="Ej: 1, 2, 3...">
           </div>
           <div class="form-group">
             <label>Premio Ganado ({{ editFormData.moneda }}):</label>
             <input type="number" v-model.number="editFormData.premio_ganado" placeholder="0">
           </div>
           <div class="form-group">
             <label>Stack Día {{ editFormData.dia_torneo || 2 }} (Fichas):</label>
             <input type="number" v-model.number="editFormData.stack_dia_2" placeholder="Stack en fichas">
           </div>
         </div>
         <div class="modal-actions">
           <button class="cancel-btn" @click="closeEditModal">Cancelar</button>
           <button class="confirm-btn" @click="saveEdit">Guardar Cambios</button>
         </div>
       </div>
     </div>

    <!-- Resume Tournament Modal -->
    <EndTournamentModal
      v-if="showResumeModal"
      @confirm="handleConfirmResume"
      @cancel="handleCancelResume"
      :is-saving="isSavingResume"
    />

    <!-- Success Toast -->
    <div v-if="showToast" class="toast success-toast">
      <div class="toast-icon">✓</div>
      <div class="toast-message">{{ toastMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTournamentSessionStore } from '../store/useTournamentSessionStore';
import EndTournamentModal from '../components/EndTournamentModal.vue';

const emit = defineEmits(['switch-view']);

const tournamentSessionStore = useTournamentSessionStore();
const selectedFilter = ref('all');
const showModal = ref(false);
const showToast = ref(false);
const toastMessage = ref('Sesión eliminada con éxito');
const selectedSessionId = ref(null);

const showNotesModal = ref(false);
const sessionNotes = ref('');
const notesSessionId = ref(null);

const showEditModal = ref(false);
const editFormData = ref({
  id: null,
  posicion_final: null,
  premio_ganado: null,
  stack_dia_2: null,
  moneda: '$',
  dia_torneo: 2
});

// Estado para controlar torneos expandidos/colapsados
const expandedTournaments = ref(new Set());

// Estado para el modal de reanudación
const showResumeModal = ref(false);
const isSavingResume = ref(false);

const filteredSessions = computed(() => {
  const filter = selectedFilter.value;
  const allSessions = tournamentSessionStore.savedSessions;

  let sessions = [];

  if (filter === 'all') {
    sessions = [...allSessions];
  } else {
    const now = new Date();
    const cutoffDate = new Date();

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

    sessions = allSessions.filter(session => {
      const sessionDate = new Date(session.fecha);
      return sessionDate >= cutoffDate;
    });
  }

  // Ordenar por fecha descendente (más recientes primero)
  return sessions.sort((a, b) => {
    const dateA = new Date(a.fecha);
    const dateB = new Date(b.fecha);
    return dateB - dateA;
  });
});

// Agrupar sesiones por tournamentId
const groupedTournaments = computed(() => {
  const sessions = filteredSessions.value;
  const groups = new Map();

  sessions.forEach(session => {
    // Si la sesión tiene tournamentId, agruparla
    const tournamentId = session.tournamentId || `single_${session.id}`;

    if (!groups.has(tournamentId)) {
      groups.set(tournamentId, []);
    }
    groups.get(tournamentId).push(session);
  });

  // Convertir Map a array y ordenar los días dentro de cada grupo
  return Array.from(groups.entries()).map(([tournamentId, days]) => {
    // Ordenar días por dia_torneo
    const sortedDays = days.sort((a, b) => (a.dia_torneo || 1) - (b.dia_torneo || 1));

    // El primer día tiene la info principal del torneo
    const mainSession = sortedDays[0];

    // El último día determina si el torneo está finalizado
    const lastDay = sortedDays[sortedDays.length - 1];
    const isFinished = !lastDay.es_dia_2;

    // Calcular totales acumulados
    const totalDuration = sortedDays.reduce((sum, day) => sum + (day.duracion_segundos || 0), 0);
    const totalRebuys = sortedDays.reduce((sum, day) => sum + (day.total_recompras || 0), 0);

    return {
      tournamentId,
      days: sortedDays,
      mainSession,
      lastDay,
      isFinished,
      totalDays: sortedDays.length,
      totalDuration,
      totalRebuys,
      // Fecha más reciente
      latestDate: sortedDays.reduce((latest, day) => {
        const dayDate = new Date(day.fecha);
        return dayDate > latest ? dayDate : latest;
      }, new Date(sortedDays[0].fecha))
    };
  }).sort((a, b) => b.latestDate - a.latestDate); // Ordenar por fecha más reciente
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

function formatGameType(gameType) {
  const gameTypeMap = {
    'holdem': 'Hold\'em',
    'omaha': 'Omaha',
    'pineapple': 'Pineapple'
  };
  return gameTypeMap[gameType] || 'Hold\'em';
}

function getGameVariantClass(gameType) {
  if (gameType === 'omaha') return 'variant-omaha';
  if (gameType === 'pineapple') return 'variant-pineapple';
  return 'variant-holdem';
}

function getResultClass(result) {
  const numResult = parseFloat(result);
  if (isNaN(numResult)) return 'even';
  if (numResult > 0) return 'profit';
  if (numResult < 0) return 'loss';
  return 'even';
}

function formatResult(result, currency) {
  const numResult = parseFloat(result);
  if (isNaN(numResult)) {
    return 'N/A';
  }
  const prefix = numResult >= 0 ? '+' : '';
  return `${prefix}${currency}${numResult.toFixed(2)}`;
}

function confirmDelete(sessionId) {
  selectedSessionId.value = sessionId;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedSessionId.value = null;
}

function deleteAndClose() {
  if (selectedSessionId.value) {
    tournamentSessionStore.deleteSession(selectedSessionId.value);
    toastMessage.value = 'Sesión eliminada con éxito';
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
    closeModal();
  }
}

function openEditModal(session) {
  editFormData.value = {
    id: session.id,
    posicion_final: session.posicion_final,
    premio_ganado: session.premio_ganado,
    stack_dia_2: session.stack_dia_2,
    moneda: session.moneda,
    dia_torneo: session.dia_torneo || 2
  };
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
  editFormData.value = {
    id: null,
    posicion_final: null,
    premio_ganado: null,
    stack_dia_2: null,
    moneda: '$',
    dia_torneo: 2
  };
}

function saveEdit() {
  if (editFormData.value.id) {
    // Calcular el nuevo resultado
    const session = tournamentSessionStore.savedSessions.find(s => s.id === editFormData.value.id);
    const investment = (session.buy_in || 0) + (session.total_recompras || 0);
    const prize = editFormData.value.premio_ganado || 0;
    const newResult = prize - investment;

    tournamentSessionStore.updateSession(editFormData.value.id, {
      posicion_final: editFormData.value.posicion_final,
      premio_ganado: editFormData.value.premio_ganado,
      stack_dia_2: editFormData.value.stack_dia_2,
      resultado: newResult
    });

    toastMessage.value = 'Torneo actualizado correctamente';
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
    closeEditModal();
  }
}

function resumeTournament(session) {
  try {
    // Cargar la configuración del torneo a reanudar
    tournamentSessionStore.resumeTournament(session);

    // Abrir el modal de finalización directamente
    showResumeModal.value = true;
  } catch (error) {
    toastMessage.value = '❌ Error: ' + error.message;
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
  }
}

async function handleConfirmResume(sessionData) {
  isSavingResume.value = true;
  try {
    await tournamentSessionStore.saveTournament(sessionData);
    showResumeModal.value = false;

    // Determinar el mensaje según si continúa o finaliza
    const message = sessionData.isDay2
      ? '✅ Día guardado. Torneo en progreso'
      : '✅ Torneo finalizado y guardado';

    toastMessage.value = message;
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 3000);

    // Limpiar el flag de reanudación
    tournamentSessionStore.clearResumingFlag();
    tournamentSessionStore.resetCurrentDay();
  } catch (error) {
    toastMessage.value = '❌ Error al guardar: ' + error.message;
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
  } finally {
    isSavingResume.value = false;
  }
}

function handleCancelResume() {
  showResumeModal.value = false;
  // Limpiar el flag de reanudación al cancelar
  tournamentSessionStore.clearResumingFlag();
  tournamentSessionStore.resetCurrentDay();
}

function openNotesModal(sessionId) {
  notesSessionId.value = sessionId;
  sessionNotes.value = localStorage.getItem(`tournamentSessionNotes_${sessionId}`) || '';
  showNotesModal.value = true;
}

function closeNotesModal() {
  showNotesModal.value = false;
  sessionNotes.value = '';
  notesSessionId.value = null;
}

function saveNotes() {
  if (notesSessionId.value) {
    localStorage.setItem(`tournamentSessionNotes_${notesSessionId.value}`, sessionNotes.value);
    closeNotesModal();
  }
}

function toggleTournament(tournamentId) {
  if (expandedTournaments.value.has(tournamentId)) {
    expandedTournaments.value.delete(tournamentId);
  } else {
    expandedTournaments.value.add(tournamentId);
  }
  // Forzar reactividad
  expandedTournaments.value = new Set(expandedTournaments.value);
}

function isTournamentExpanded(tournamentId) {
  return expandedTournaments.value.has(tournamentId);
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

* {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.saved-sessions-container {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  overflow-y: auto;
}

h2 {
  margin-bottom: 2rem;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.no-sessions {
  margin-top: 2rem;
  color: rgba(168, 85, 247, 0.7);
  font-size: 1.2rem;
  text-align: center;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.sessions-list {
  list-style: none;
  padding: 0;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.filters-container {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 1.2rem 1.5rem;
  border-radius: 14px;
  border: 1px solid rgba(168, 85, 247, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.03);
}

.filters-container label {
  font-weight: 600;
  font-size: 1rem;
  color: rgba(168, 85, 247, 0.9);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.filters-container select {
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 500;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.filters-container select:hover {
  border-color: rgba(168, 85, 247, 0.4);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
}

.filters-container select option {
  background-color: #1f2937;
  color: white;
  padding: 8px;
}

.sessions-list li,
.tournament-group {
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  padding: 0;
  border-radius: 14px;
  border: 1px solid rgba(168, 85, 247, 0.15);
  display: flex;
  flex-direction: column;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.sessions-list li::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.3), transparent);
}

.sessions-list li:hover,
.tournament-group:hover {
  border-color: rgba(168, 85, 247, 0.3);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.08);
}

.tournament-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);
  transition: background-color 0.2s ease;
}

.tournament-header:hover {
  background: rgba(168, 85, 247, 0.05);
}

.tournament-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tournament-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.expand-icon {
  font-size: 0.9rem;
  color: rgba(168, 85, 247, 0.8);
  transition: transform 0.3s ease;
  min-width: 20px;
  display: inline-block;
}

.multi-day-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.7) 0%, rgba(37, 99, 235, 0.8) 100%);
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.in-progress-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.7) 0%, rgba(22, 163, 74, 0.8) 100%);
  color: white;
  border: 1px solid rgba(34, 197, 94, 0.3);
  animation: pulse 2s infinite;
}

.tournament-summary {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
  padding-left: 32px;
}

.summary-item {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.tournament-days {
  padding: 0 1.5rem 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: expandDown 0.3s ease-out;
}

@keyframes expandDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

.day-card {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(168, 85, 247, 0.15);
}

.day-label {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(168, 85, 247, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.day-date {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.day-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.day-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tournament-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(168, 85, 247, 0.15);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);
  padding-bottom: 1rem;
  gap: 1rem;
}

.session-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.location {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f9fafb;
  letter-spacing: 0.5px;
}

.date {
  font-size: 0.95rem;
  color: rgba(168, 85, 247, 0.7);
  flex-shrink: 0;
  font-weight: 500;
}

.game-variant-badge,
.tournament-type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.variant-holdem {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.7) 0%, rgba(37, 99, 235, 0.8) 100%);
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.variant-omaha {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.7) 0%, rgba(126, 34, 206, 0.8) 100%);
  color: white;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.variant-pineapple {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.7) 0%, rgba(219, 39, 119, 0.8) 100%);
  color: white;
  border: 1px solid rgba(236, 72, 153, 0.3);
}

.tournament-type-badge {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.7) 0%, rgba(126, 34, 206, 0.8) 100%);
  color: white;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.day2-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.7) 0%, rgba(217, 119, 6, 0.8) 100%);
  color: white;
  border: 1px solid rgba(245, 158, 11, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 8px rgba(245, 158, 11, 0.3);
  }
  50% {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 16px rgba(245, 158, 11, 0.5);
  }
}

.session-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  border: 2px solid;
}

.session-result span:first-child {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 600;
}

.result-amount {
  font-size: 2.8rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.profit {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%);
  border-color: rgba(16, 185, 129, 0.4);
  color: #10b981;
}

.loss {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(153, 27, 27, 0.15) 100%);
  border-color: rgba(220, 38, 38, 0.4);
  color: #ef4444;
}

.even {
  background: linear-gradient(135deg, rgba(74, 85, 104, 0.15) 0%, rgba(45, 55, 72, 0.15) 100%);
  border-color: rgba(160, 174, 192, 0.4);
  color: #a0aec0;
}

.day2-status {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%);
  border-color: rgba(245, 158, 11, 0.4);
  color: #f59e0b;
}

.session-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(168, 85, 247, 0.1);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item strong {
  color: rgba(168, 85, 247, 0.8);
  margin-right: 1rem;
  font-weight: 600;
}

.stat-item span {
  font-weight: 600;
  color: #f9fafb;
}

.session-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 1rem;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.notes-btn,
.edit-btn,
.resume-btn {
  padding: 12px;
  font-size: 0.95rem;
  border-radius: 10px;
  border: 1px solid rgba(168, 85, 247, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
}

.notes-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
  color: white;
}

.notes-btn:hover {
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
}

.notes-btn svg {
  width: 20px;
  height: 20px;
  color: white;
}

.edit-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  color: white;
}

.edit-btn:hover {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.edit-btn svg {
  width: 20px;
  height: 20px;
  color: white;
}

.resume-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  color: white;
  padding: 12px 18px;
}

.resume-btn:hover {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.resume-btn svg {
  width: 20px;
  height: 20px;
  color: white;
}

.delete-btn {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  padding: 12px 18px;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid rgba(168, 85, 247, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.delete-btn:hover {
  background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

/* Modales y Toast */
.modal-overlay,
.toast {
  position: fixed;
  z-index: 1000;
}

.modal-overlay {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  border-radius: 14px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
}

.modal-content h3 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.modal-content p {
  margin: 0 0 2rem;
  color: rgba(168, 85, 247, 0.8);
  font-size: 1.1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.cancel-btn,
.confirm-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.cancel-btn {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(168, 85, 247, 0.2);
  color: #fff;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.confirm-btn {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  border: 1px solid rgba(168, 85, 247, 0.2);
  color: #fff;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

.notes-modal textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 10px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #fff;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  margin-bottom: 1rem;
  transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notes-modal textarea:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.5);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

.notes-modal .confirm-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
}

.notes-modal .confirm-btn:hover {
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
}

.edit-modal {
  max-width: 500px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 1.5rem 0;
  text-align: left;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.95rem;
  color: rgba(168, 85, 247, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input {
  padding: 14px 16px;
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 10px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #fff;
  font-family: inherit;
  font-size: 1.1rem;
  font-weight: 500;
  transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-group input:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.5);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

.toast {
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  animation: slideIn 0.3s ease-out;
}

.success-toast {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: #fff;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.toast-icon {
  font-size: 1.5rem;
  font-weight: 700;
}

.toast-message {
  font-size: 1rem;
  font-weight: 600;
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
  .saved-sessions-container {
    padding: 1rem 0.5rem;
  }
  h2 {
    font-size: 2rem;
  }
  .tournament-group {
    padding: 0;
  }
  .tournament-header {
    padding: 1rem;
  }
  .tournament-summary {
    padding-left: 28px;
    gap: 1rem;
  }
  .summary-item {
    font-size: 0.85rem;
  }
  .tournament-days {
    padding: 0 1rem 1rem 1rem;
  }
  .day-card {
    padding: 0.75rem;
  }
  .day-stats {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
  .day-actions {
    flex-direction: column;
  }
  .day-actions button {
    width: 100%;
  }
  .tournament-actions {
    flex-direction: column;
    padding: 1rem;
  }
  .tournament-actions button {
    width: 100%;
  }
  .sessions-list li {
    padding: 1rem;
  }
  .session-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .session-title {
    width: 100%;
  }
  .location {
    font-size: 1.2rem;
  }
  .date {
    font-size: 0.85rem;
  }
  .game-variant-badge,
  .tournament-type-badge,
  .multi-day-badge,
  .in-progress-badge {
    font-size: 0.7rem;
    padding: 3px 8px;
  }
  .result-amount {
    font-size: 2.2rem;
  }
  .session-stats {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
  .stat-item {
    font-size: 0.95rem;
    padding: 0.4rem 0;
  }
  .session-actions {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }
  .session-actions button {
    width: 100%;
    justify-content: center;
  }
}
</style>
