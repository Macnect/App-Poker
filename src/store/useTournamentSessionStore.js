import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const STORAGE_KEY = 'active-tournament-session';

export const useTournamentSessionStore = defineStore('tournamentSession', () => {
  // --- STATE ---
  const sessionState = ref({
    isActive: false,
    startTime: null,
    isOnBreak: false,
    breakStartTime: null,
    totalBreakDuration: 0,
    totalRebuys: 0,
    totalExpenses: 0,
    location: '',
    currency: '$',
    buyIn: 50,
    initialStack: 5000,
    gameType: 'holdem',
    tournamentType: 'Normal',
    structure: 'Normal',
  });

  const savedSessions = ref([]);

  const timerDisplay = ref(0);
  let sessionTimerInterval = null;

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
      if (sessionState.value.isActive) {
        startUiUpdater();
      }
    }
  }

  // --- COMPUTED PROPERTIES ---
  const elapsedTime = computed(() => {
    const _trigger = timerDisplay.value;
    if (!sessionState.value.isActive || !sessionState.value.startTime) return 0;
    const now = Date.now();
    const currentBreakDuration = sessionState.value.isOnBreak && sessionState.value.breakStartTime
      ? now - sessionState.value.breakStartTime
      : 0;
    const totalDuration = now - sessionState.value.startTime;
    const netDuration = totalDuration - sessionState.value.totalBreakDuration - currentBreakDuration;
    return Math.floor(netDuration / 1000);
  });

  const breakElapsedTime = computed(() => {
    const _trigger = timerDisplay.value;
    if (!sessionState.value.isOnBreak || !sessionState.value.breakStartTime) return 0;
    return Math.floor((Date.now() - sessionState.value.breakStartTime) / 1000);
  });

  // --- ACTIONS ---

  function startUiUpdater() {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = setInterval(() => {
      timerDisplay.value++;
    }, 1000);
  }

  function startSession() {
    sessionState.value = {
      ...sessionState.value,
      isActive: true,
      startTime: Date.now(),
      isOnBreak: false,
      breakStartTime: null,
      totalBreakDuration: 0,
      totalRebuys: 0,
      totalExpenses: 0,
    };
    saveStateToLocalStorage();
    startUiUpdater();
  }

  function startBreak() {
    if (!sessionState.value.isActive) return;
    sessionState.value.isOnBreak = true;
    sessionState.value.breakStartTime = Date.now();
    saveStateToLocalStorage();
  }

  function endBreak() {
    if (!sessionState.value.isOnBreak || !sessionState.value.breakStartTime) return;
    const breakDuration = Date.now() - sessionState.value.breakStartTime;
    sessionState.value.totalBreakDuration += breakDuration;
    sessionState.value.isOnBreak = false;
    sessionState.value.breakStartTime = null;
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
      const finalElapsedTimeInSeconds = elapsedTime.value;
      const finalTotalBreakTimeInSeconds = Math.floor(sessionState.value.totalBreakDuration / 1000);

      const ensureFloat = (value) => {
          const num = parseFloat(value);
          return isNaN(num) ? 0.0 : num;
      };

      const currentInvestment = ensureFloat(sessionState.value.buyIn) + ensureFloat(sessionState.value.totalRebuys);

      // Aquí podrías guardar en la base de datos si lo necesitas
      // Por ahora solo guardamos localmente
      const sessionData = {
        id: Date.now(),
        fecha: new Date().toISOString().split('T')[0],
        duracion_segundos: finalElapsedTimeInSeconds,
        tiempo_descanso_segundos: finalTotalBreakTimeInSeconds,
        ubicacion: sessionState.value.location,
        moneda: sessionState.value.currency,
        buy_in: ensureFloat(sessionState.value.buyIn),
        total_recompras: ensureFloat(sessionState.value.totalRebuys),
        tipo_juego: sessionState.value.gameType,
        tipo_torneo: sessionState.value.tournamentType,
        estructura: sessionState.value.structure,
        // Nuevos campos específicos de torneos
        es_dia_2: tournamentData.isDay2,
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
      clearInterval(sessionTimerInterval);
      sessionTimerInterval = null;
      sessionState.value.isActive = false;
      sessionState.value.startTime = null;
      clearStateFromLocalStorage();
    }
  }

  function clearActiveSession() {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
    sessionState.value.isActive = false;
    sessionState.value.startTime = null;
    clearStateFromLocalStorage();
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

  // Cargar estados al inicializar
  loadStateFromLocalStorage();
  loadSavedSessions();

  return {
    isActive: computed(() => sessionState.value.isActive),
    isOnBreak: computed(() => sessionState.value.isOnBreak),
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
    totalRebuys: computed(() => sessionState.value.totalRebuys),
    totalExpenses: computed(() => sessionState.value.totalExpenses),
    elapsedTime,
    breakElapsedTime,
    savedSessions,
    startSession,
    startBreak,
    endBreak,
    stopAndSaveSession,
    deleteSession,
    addRebuy,
    addExpense,
    clearActiveSession,
  };
});
