import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const STORAGE_KEY = 'active-tournament-session';

export const useTournamentSessionStore = defineStore('tournamentSession', () => {
  // --- STATE ---
  const sessionState = ref({
    isActive: false,
    isResuming: false, // Flag para indicar que se está reanudando un torneo
    tournamentId: null, // ID único para agrupar días del mismo torneo
    durationHours: 0,
    durationMinutes: 0,
    totalRebuys: 0,
    totalExpenses: 0,
    location: '',
    currency: '$',
    buyIn: 50,
    initialStack: 5000,
    gameType: 'holdem',
    tournamentType: 'Normal',
    structure: 'Normal',
    currentDay: 1, // Día actual del torneo (1-15)
  });

  const savedSessions = ref([]);

  // --- HELPERS ---
  function saveStateToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionState.value));
  }

  function clearStateFromLocalStorage() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function loadStateFromLocalStorage() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      sessionState.value = { ...sessionState.value, ...parsedState };
    }
  }

  // --- COMPUTED PROPERTIES ---
  const totalDurationInSeconds = computed(() => {
    const hours = parseInt(sessionState.value.durationHours) || 0;
    const minutes = parseInt(sessionState.value.durationMinutes) || 0;
    return (hours * 3600) + (minutes * 60);
  });

  // --- ACTIONS ---

  function startSession() {
    sessionState.value = {
      ...sessionState.value,
      isActive: true,
      durationHours: 0,
      durationMinutes: 0,
      totalRebuys: 0,
      totalExpenses: 0,
    };
    saveStateToLocalStorage();
  }

  function addRebuy(amount) {
    if (amount > 0) {
      sessionState.value.totalRebuys += amount;
      saveStateToLocalStorage();
    }
  }

  function addExpense(amount) {
    if (amount > 0) {
      sessionState.value.totalExpenses += amount;
      saveStateToLocalStorage();
    }
  }

  async function stopAndSaveSession(tournamentData) {
    try {
      const finalElapsedTimeInSeconds = totalDurationInSeconds.value;

      const ensureFloat = (value) => {
          const num = parseFloat(value);
          return isNaN(num) ? 0.0 : num;
      };

      // Aquí podrías guardar en la base de datos si lo necesitas
      // Por ahora solo guardamos localmente
      const sessionData = {
        id: Date.now(),
        fecha: new Date().toISOString().split('T')[0],
        duracion_segundos: finalElapsedTimeInSeconds,
        tiempo_descanso_segundos: 0, // Ya no usamos tiempo de descanso
        ubicacion: sessionState.value.location,
        moneda: sessionState.value.currency,
        buy_in: ensureFloat(sessionState.value.buyIn),
        total_recompras: ensureFloat(tournamentData.totalRebuys),
        tipo_juego: sessionState.value.gameType,
        tipo_torneo: sessionState.value.tournamentType,
        estructura: sessionState.value.structure,
        // Nuevos campos específicos de torneos multi-día
        es_dia_2: tournamentData.isDay2,
        dia_torneo: tournamentData.isDay2 ? (sessionState.value.currentDay + 1) : 1, // Incrementar día si continúa
        stack_dia_2: tournamentData.day2Stack,
        posicion_final: tournamentData.finalPosition,
        premio_ganado: tournamentData.prizeWon,
        resultado: tournamentData.result,
      };

      savedSessions.value.push(sessionData);

      // Guardar en localStorage
      localStorage.setItem('tournament-sessions', JSON.stringify(savedSessions.value));

    } catch (error) {
      console.error('Error en el store al guardar sesión de torneo:', error);
      throw error;
    } finally {
      sessionState.value.isActive = false;
      clearStateFromLocalStorage();
    }
  }

  async function saveTournament(tournamentData) {
    try {
      // Calcular duración desde los campos manuales
      const finalElapsedTimeInSeconds = totalDurationInSeconds.value;

      const ensureFloat = (value) => {
          const num = parseFloat(value);
          return isNaN(num) ? 0.0 : num;
      };

      // Generar tournamentId solo si no existe (torneo nuevo)
      // Si ya existe, significa que estamos continuando un torneo multi-día
      const tournamentId = sessionState.value.tournamentId || `tournament_${Date.now()}`;

      // Crear el objeto de torneo con toda la información
      const tournamentSession = {
        id: Date.now(),
        tournamentId: tournamentId, // ID para agrupar días del mismo torneo
        fecha: new Date().toISOString().split('T')[0],
        duracion_segundos: finalElapsedTimeInSeconds,
        tiempo_descanso_segundos: 0,
        ubicacion: sessionState.value.location,
        moneda: sessionState.value.currency,
        buy_in: ensureFloat(sessionState.value.buyIn),
        total_recompras: ensureFloat(tournamentData.totalRebuys),
        tipo_juego: sessionState.value.gameType,
        tipo_torneo: sessionState.value.tournamentType,
        estructura: sessionState.value.structure,
        // Campos específicos de torneos multi-día
        es_dia_2: tournamentData.isDay2,
        dia_torneo: tournamentData.isDay2 ? (sessionState.value.currentDay + 1) : sessionState.value.currentDay,
        stack_dia_2: tournamentData.day2Stack,
        posicion_final: tournamentData.finalPosition,
        premio_ganado: tournamentData.prizeWon,
        resultado: tournamentData.result,
      };

      savedSessions.value.push(tournamentSession);

      // Guardar en localStorage
      localStorage.setItem('tournament-sessions', JSON.stringify(savedSessions.value));

      // Si no va a continuar (no es día 2), resetear el tournamentId
      if (!tournamentData.isDay2) {
        sessionState.value.tournamentId = null;
        sessionState.value.currentDay = 1;
      }

      // Resetear duración después de guardar
      sessionState.value.durationHours = 0;
      sessionState.value.durationMinutes = 0;
      saveStateToLocalStorage();

    } catch (error) {
      console.error('Error al guardar torneo:', error);
      throw error;
    }
  }

  function clearActiveSession() {
    sessionState.value.isActive = false;
    clearStateFromLocalStorage();
  }

  function clearResumingFlag() {
    sessionState.value.isResuming = false;
    saveStateToLocalStorage();
  }

  function resetCurrentDay() {
    sessionState.value.currentDay = 1;
    saveStateToLocalStorage();
  }

  function loadSavedSessions() {
    const saved = localStorage.getItem('tournament-sessions');
    if (saved) {
      try {
        savedSessions.value = JSON.parse(saved);
      } catch (error) {
        console.error('Error al cargar sesiones guardadas:', error);
      }
    }
  }

  function deleteSession(sessionId) {
    savedSessions.value = savedSessions.value.filter(s => s.id !== sessionId);
    localStorage.setItem('tournament-sessions', JSON.stringify(savedSessions.value));
  }

  function resumeTournament(sessionData) {
    if (!sessionData.es_dia_2) {
      throw new Error('Solo se pueden reanudar torneos multi-día');
    }

    // Calcular el tiempo ya transcurrido del día anterior
    const previousElapsedSeconds = sessionData.duracion_segundos || 0;

    // Convertir segundos a horas y minutos
    const previousHours = Math.floor(previousElapsedSeconds / 3600);
    const previousMinutes = Math.floor((previousElapsedSeconds % 3600) / 60);

    // Obtener el día actual del torneo (por defecto 2 si no existe el campo)
    const currentDay = sessionData.dia_torneo || 2;

    // Restaurar la configuración del torneo y activar el flag de reanudación
    sessionState.value = {
      ...sessionState.value,
      location: sessionData.ubicacion,
      currency: sessionData.moneda,
      buyIn: sessionData.buy_in,
      initialStack: sessionData.stack_dia_2 || sessionData.initialStack || 5000,
      gameType: sessionData.tipo_juego,
      tournamentType: sessionData.tipo_torneo,
      structure: sessionData.estructura || 'Normal',
      totalRebuys: sessionData.total_recompras,
      totalExpenses: sessionData.total_gastos || 0,
      currentDay: currentDay, // Restaurar el día actual del torneo
      tournamentId: sessionData.tournamentId, // IMPORTANTE: Mantener el tournamentId
      isActive: false, // No activar, solo cargar la configuración
      isResuming: true, // Marcar que se está reanudando
      durationHours: previousHours, // Restaurar horas del día anterior
      durationMinutes: previousMinutes, // Restaurar minutos del día anterior
    };

    saveStateToLocalStorage();
  }

  function updateSession(sessionId, updatedData) {
    const index = savedSessions.value.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      savedSessions.value[index] = {
        ...savedSessions.value[index],
        ...updatedData
      };
      localStorage.setItem('tournament-sessions', JSON.stringify(savedSessions.value));
    }
  }

  // Cargar estados al inicializar
  loadStateFromLocalStorage();
  loadSavedSessions();

  return {
    isActive: computed(() => sessionState.value.isActive),
    isResuming: computed(() => sessionState.value.isResuming),
    location: computed({
      get: () => sessionState.value.location,
      set: (val) => { sessionState.value.location = val; saveStateToLocalStorage(); }
    }),
    currency: computed({
      get: () => sessionState.value.currency,
      set: (val) => { sessionState.value.currency = val; saveStateToLocalStorage(); }
    }),
    buyIn: computed({
      get: () => sessionState.value.buyIn,
      set: (val) => { sessionState.value.buyIn = val; saveStateToLocalStorage(); }
    }),
    initialStack: computed({
      get: () => sessionState.value.initialStack,
      set: (val) => { sessionState.value.initialStack = val; saveStateToLocalStorage(); }
    }),
    gameType: computed({
      get: () => sessionState.value.gameType,
      set: (val) => { sessionState.value.gameType = val; saveStateToLocalStorage(); }
    }),
    tournamentType: computed({
      get: () => sessionState.value.tournamentType,
      set: (val) => { sessionState.value.tournamentType = val; saveStateToLocalStorage(); }
    }),
    structure: computed({
      get: () => sessionState.value.structure,
      set: (val) => { sessionState.value.structure = val; saveStateToLocalStorage(); }
    }),
    durationHours: computed({
      get: () => sessionState.value.durationHours,
      set: (val) => { sessionState.value.durationHours = val; saveStateToLocalStorage(); }
    }),
    durationMinutes: computed({
      get: () => sessionState.value.durationMinutes,
      set: (val) => { sessionState.value.durationMinutes = val; saveStateToLocalStorage(); }
    }),
    currentDay: computed(() => sessionState.value.currentDay),
    totalRebuys: computed(() => sessionState.value.totalRebuys),
    totalExpenses: computed(() => sessionState.value.totalExpenses),
    totalDurationInSeconds,
    savedSessions,
    startSession,
    stopAndSaveSession,
    saveTournament,
    deleteSession,
    resumeTournament,
    updateSession,
    addRebuy,
    addExpense,
    clearActiveSession,
    clearResumingFlag,
    resetCurrentDay,
  };
});
