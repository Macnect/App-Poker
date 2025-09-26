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
           <button class="notes-btn" @click="openNotesModal(session.id)" title="Añadir Notas">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
             </svg>
           </button>
           <button class="delete-btn" @click="confirmDelete(session.id)">Eliminar Sesión</button>
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
           <button class="confirm-btn" @click="deleteSession">Sí</button>
         </div>
       </div>
     </div>

     <!-- Notes Modal -->
     <div v-if="showNotesModal" class="modal-overlay" @click="closeNotesModal">
       <div class="modal-content notes-modal" @click.stop>
         <h3>Notas de la Sesión</h3>
         <textarea v-model="sessionNotes" placeholder="Escribe tus notas sobre esta sesión..." rows="6"></textarea>
         <div class="modal-actions">
           <button class="cancel-btn" @click="closeNotesModal">Cancelar</button>
           <button class="confirm-btn" @click="saveNotes">Guardar</button>
         </div>
       </div>
     </div>

    <!-- Success Toast -->
    <div v-if="showToast" class="toast success-toast">
      <div class="toast-icon">✓</div>
      <div class="toast-message">Sesión eliminada con éxito</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'; // <-- IMPORTAR ref Y computed
import { useSessionStore } from '../store/useSessionStore';

const sessionStore = useSessionStore();

// --- NUEVO ESTADO LOCAL PARA EL FILTRO ---
const selectedFilter = ref('all');

// --- ESTADO PARA EL MODAL Y TOAST ---
const showModal = ref(false);
const showToast = ref(false);
const selectedSessionId = ref(null);

// --- ESTADO PARA EL MODAL DE NOTAS ---
const showNotesModal = ref(false);
const sessionNotes = ref('');
const notesSessionId = ref(null);

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

function confirmDelete(sessionId) {
  selectedSessionId.value = sessionId;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedSessionId.value = null;
}

function deleteSession() {
  if (selectedSessionId.value) {
    sessionStore.deleteSession(selectedSessionId.value);
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
    closeModal();
  }
}

function openNotesModal(sessionId) {
  notesSessionId.value = sessionId;
  sessionNotes.value = localStorage.getItem(`sessionNotes_${sessionId}`) || '';
  showNotesModal.value = true;
}

function closeNotesModal() {
  showNotesModal.value = false;
  sessionNotes.value = '';
  notesSessionId.value = null;
}

function saveNotes() {
  if (notesSessionId.value) {
    localStorage.setItem(`sessionNotes_${notesSessionId.value}`, sessionNotes.value);
    closeNotesModal();
  }
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
.session-actions { display: flex; justify-content: space-between; margin-top: 1rem; }
.notes-btn { background-color: #48bb78; padding: 12px; font-size: 1.1rem; border: none; border-radius: 6px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.notes-btn:hover { background-color: #38a169; }
.notes-btn svg { width: 20px; height: 20px; }
.delete-btn { background-color: #c53030; padding: 12px 25px; font-size: 1.1rem; width: 100%; max-width: 300px; }
.delete-btn:hover { background-color: #9b2c2c; }

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

.notes-modal textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: #1a202c;
  color: white;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  margin-bottom: 1rem;
}

.notes-modal .confirm-btn {
  background-color: #48bb78;
}

.notes-modal .confirm-btn:hover {
  background-color: #38a169;
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