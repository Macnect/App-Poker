<template>
  <div class="saved-sessions-container">
    <h2>Sesiones Guardadas</h2>

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

    <!-- ESTADO DE CARGA -->
    <div v-if="isLoading" class="loading-message">
      Cargando sesiones...
    </div>
    
    <!-- MENSAJE Y LISTA AHORA USAN LA PROPIEDAD COMPUTADA 'filteredSessions' -->
    <div v-else-if="filteredSessions.length === 0" class="no-sessions">
      No tienes sesiones guardadas que coincidan con el filtro seleccionado.
    </div>
    <ul v-else class="sessions-list">
      <li v-for="session in filteredSessions" :key="session.id">
        
        <div class="session-header">
          <span class="location">{{ session.ubicacion || 'Partida Privada' }}</span>
          <!-- Formateamos la fecha que viene de la base de datos -->
          <span class="date">{{ new Date(session.fecha + 'T12:00:00').toLocaleDateString() }}</span>
        </div>
        
        <div class="session-result" :class="getResultClass(session.resultado)">
          <span>Resultado</span>
          <span class="result-amount">
            {{ formatResult(session.resultado, session.moneda) }}
          </span>
        </div>

        <div class="session-details">
          <div class="session-stats">
            <div class="stat-item"><strong>Duración:</strong> <span>{{ formatDuration(session.duracion_segundos) }}</span></div>
            <div class="stat-item"><strong>Descansos:</strong> <span>{{ formatDuration(session.tiempo_descanso_segundos) }}</span></div>
            <div class="stat-item"><strong>Ciegas:</strong> <span>{{ session.ciegas }}</span></div>
            <div class="stat-item"><strong>Jugadores:</strong> <span>{{ session.cantidad_jugadores }}</span></div>
            <div class="stat-item"><strong>Buy-in:</strong> <span>{{ session.moneda }}{{ session.stack_inicial }}</span></div>
            <div class="stat-item"><strong>Recargas:</strong> <span>{{ session.moneda }}{{ session.total_recompras || 0 }}</span></div>
            <div class="stat-item"><strong>Gastos:</strong> <span>-{{ session.moneda }}{{ session.total_gastos || 0 }}</span></div>
            <div class="stat-item"><strong>Stack Final:</strong> <span>{{ session.moneda }}{{ session.stack_final !== undefined ? session.stack_final : 'N/A' }}</span></div>
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
           <button class="confirm-btn" @click="deleteAndClose">Sí</button>
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
import { ref, computed, onMounted } from 'vue';
import { useSessionStore } from '../store/useSessionStore';

const sessionStore = useSessionStore();
const isLoading = ref(true);
const selectedFilter = ref('all');
const showModal = ref(false);
const showToast = ref(false);
const selectedSessionId = ref(null);

const showNotesModal = ref(false);
const sessionNotes = ref('');
const notesSessionId = ref(null);

// Cargar sesiones al montar el componente
onMounted(async () => {
  isLoading.value = true;
  await sessionStore.fetchSessions();
  isLoading.value = false;
});

const filteredSessions = computed(() => {
  const filter = selectedFilter.value;
  const allSessions = sessionStore.savedSessions;

  if (filter === 'all') {
    return allSessions;
  }

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

  return allSessions.filter(session => {
    // La fecha de la DB (YYYY-MM-DD) se convierte a objeto Date para comparar
    const sessionDate = new Date(session.fecha);
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

async function deleteAndClose() {
  if (selectedSessionId.value) {
    await sessionStore.deleteSession(selectedSessionId.value);
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
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

* {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.saved-sessions-container {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
}

h2 {
  margin-bottom: 2rem;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.loading-message,
.no-sessions {
  margin-top: 2rem;
  color: rgba(212, 175, 55, 0.7);
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
  border: 1px solid rgba(212, 175, 55, 0.15);
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
  color: rgba(212, 175, 55, 0.9);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.filters-container select {
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 500;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.filters-container select:hover {
  border-color: rgba(212, 175, 55, 0.4);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
}

.filters-container select option {
  background-color: #1f2937;
  color: white;
  padding: 8px;
}

.sessions-list li {
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  padding: 1.5rem;
  border-radius: 14px;
  border: 1px solid rgba(212, 175, 55, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
}

.sessions-list li:hover {
  border-color: rgba(212, 175, 55, 0.3);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.08);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  padding-bottom: 1rem;
}

.location {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f9fafb;
  letter-spacing: 0.5px;
}

.date {
  font-size: 0.95rem;
  color: rgba(212, 175, 55, 0.7);
  flex-shrink: 0;
  margin-left: 1rem;
  font-weight: 500;
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
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item strong {
  color: rgba(212, 175, 55, 0.8);
  margin-right: 1rem;
  font-weight: 600;
}

.stat-item span {
  font-weight: 600;
  color: #f9fafb;
}

.session-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  gap: 1rem;
}

.notes-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 12px;
  font-size: 1rem;
  border-radius: 10px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.notes-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.notes-btn svg {
  width: 20px;
  height: 20px;
  color: white;
}

.delete-btn {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid rgba(212, 175, 55, 0.2);
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
  border: 1px solid rgba(212, 175, 55, 0.2);
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
  color: rgba(212, 175, 55, 0.8);
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
  border: 1px solid rgba(212, 175, 55, 0.2);
  color: #fff;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.confirm-btn {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
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
  border: 1px solid rgba(212, 175, 55, 0.2);
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
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.notes-modal .confirm-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.notes-modal .confirm-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  border: 1px solid rgba(212, 175, 55, 0.3);
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
  .sessions-list li {
    padding: 1rem;
  }
  .location {
    font-size: 1.2rem;
  }
  .date {
    font-size: 0.85rem;
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