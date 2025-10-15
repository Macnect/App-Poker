import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/supabase';
import { useAuthStore } from './useAuthStore';
import { apiFetchSessions, apiAddSession, apiDeleteSession } from '@/api';

const STORAGE_KEY = 'active-poker-session';

export const useSessionStore = defineStore('session', () => {
  // --- STATE ---
  const sessionState = ref({
    isActive: false,
    startTime: null,
    isOnBreak: false,
    breakStartTime: null,
    totalBreakDuration: 0,
    totalRebuys: 0,
    totalExpenses: 0,
    playerCount: 6,
    blinds: '1/2',
    location: '',
    currency: '$',
    initialStack: 200,
    gameType: 'holdem',
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
  
  // --- COMPUTED PROPERTIES MODIFICADAS ---
  const elapsedTime = computed(() => {
    // ==========================================================
    // ===> INICIO DEL CAMBIO: AÑADIR DEPENDENCIA REACTIVA     <===
    // ==========================================================
    // Al acceder a timerDisplay, hacemos que esta propiedad se recalcule cada segundo.
    const _trigger = timerDisplay.value;
    // ==========================================================
    // ===> FIN DEL CAMBIO                                     <===
    // ==========================================================
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
    // ==========================================================
    // ===> INICIO DEL CAMBIO: AÑADIR DEPENDENCIA REACTIVA     <===
    // ==========================================================
    const _trigger = timerDisplay.value;
    // ==========================================================
    // ===> FIN DEL CAMBIO                                     <===
    // ==========================================================
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
  
  async function stopAndSaveSession(finalStack) {
    try {
      const finalElapsedTimeInSeconds = elapsedTime.value;
      const finalTotalBreakTimeInSeconds = Math.floor(sessionState.value.totalBreakDuration / 1000);

      const ensureFloat = (value) => {
          const num = parseFloat(value);
          return isNaN(num) ? 0.0 : num;
      };

      const currentInvestment = ensureFloat(sessionState.value.initialStack) + ensureFloat(sessionState.value.totalRebuys);
      const result = ensureFloat(finalStack) - currentInvestment - ensureFloat(sessionState.value.totalExpenses);

      const sessionData = {
        fecha: new Date().toISOString().split('T')[0],
        duracion_segundos: finalElapsedTimeInSeconds,
        tiempo_descanso_segundos: finalTotalBreakTimeInSeconds,
        cantidad_jugadores: sessionState.value.playerCount,
        ciegas: sessionState.value.blinds,
        ubicacion: sessionState.value.location,
        moneda: sessionState.value.currency,
        stack_inicial: ensureFloat(sessionState.value.initialStack),
        total_recompras: ensureFloat(sessionState.value.totalRebuys),
        total_gastos: ensureFloat(sessionState.value.totalExpenses),
        stack_final: ensureFloat(finalStack),
        resultado: result,
        tipo_juego: sessionState.value.gameType,
      };
      
      await apiAddSession(sessionData);
      await fetchSessions();

    } catch (error) {
      console.error('Error en el store al guardar sesión:', error);
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

  const summaryDateFilter = ref('all');

  function setSummaryDateFilter(newFilter) {
    summaryDateFilter.value = newFilter;
  }

  const filteredSessionsForSummary = computed(() => {
    const filter = summaryDateFilter.value;
    if (filter === 'all') {
      return savedSessions.value;
    }

    const now = new Date();
    const cutoffDate = new Date();
    
    cutoffDate.setHours(0, 0, 0, 0); 

    switch (filter) {
      case 'last7days': cutoffDate.setDate(now.getDate() - 7); break;
      case 'last1month': cutoffDate.setMonth(now.getMonth() - 1); break;
      case 'last3months': cutoffDate.setMonth(now.getMonth() - 3); break;
      case 'last6months': cutoffDate.setMonth(now.getMonth() - 6); break;
      case 'last1year': cutoffDate.setFullYear(now.getFullYear() - 1); break;
    }

    return savedSessions.value.filter(session => {
      const sessionDate = new Date(session.fecha);
      return sessionDate >= cutoffDate;
    });
  });

  const totalNetProfit = computed(() => {
    return filteredSessionsForSummary.value.reduce((total, session) => total + (parseFloat(session.resultado) || 0), 0);
  });

  const totalInvestment = computed(() => {
    return filteredSessionsForSummary.value.reduce((total, session) => {
      return total + (parseFloat(session.stack_inicial) || 0) + (parseFloat(session.total_recompras) || 0);
    }, 0);
  });
  
  const roi = computed(() => {
    if (totalInvestment.value === 0) return 0;
    return (totalNetProfit.value / totalInvestment.value) * 100;
  });

  const winningDays = computed(() => {
    return filteredSessionsForSummary.value.filter(session => session.resultado > 0).length;
  });

  const losingDays = computed(() => {
    return filteredSessionsForSummary.value.filter(session => session.resultado < 0).length;
  });

  const bestDay = computed(() => {
    if (filteredSessionsForSummary.value.length === 0) return 0;
    const results = filteredSessionsForSummary.value.map(session => parseFloat(session.resultado) || 0);
    return Math.max(...results);
  });

  const worstDay = computed(() => {
    if (filteredSessionsForSummary.value.length === 0) return 0;
    const results = filteredSessionsForSummary.value.map(session => parseFloat(session.resultado) || 0);
    return Math.min(...results);
  });

  const winningStreak = computed(() => {
    if (filteredSessionsForSummary.value.length === 0) return 0;
    const chronologicalSessions = [...filteredSessionsForSummary.value].sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
    let maxStreak = 0;
    let currentStreak = 0;
    for (const session of chronologicalSessions) {
      if (session.resultado > 0) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 0;
      }
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    return maxStreak;
  });

  const averageBuyIn = computed(() => {
    if (filteredSessionsForSummary.value.length === 0) return 0;
    const totalInvest = filteredSessionsForSummary.value.reduce((total, session) => total + (parseFloat(session.stack_inicial) || 0) + (parseFloat(session.total_recompras) || 0), 0);
    return totalInvest / filteredSessionsForSummary.value.length;
  });
  
  const averageCashOut = computed(() => {
    if (filteredSessionsForSummary.value.length === 0) return 0;
    const totalCashOut = filteredSessionsForSummary.value.reduce((total, session) => total + (parseFloat(session.stack_final) || 0), 0);
    return totalCashOut / filteredSessionsForSummary.value.length;
  });

  const sessionCount = computed(() => filteredSessionsForSummary.value.length);

  const totalHoursPlayed = computed(() => {
    const totalSeconds = filteredSessionsForSummary.value.reduce((total, session) => total + (session.duracion_segundos || 0), 0);
    return totalSeconds / 3600;
  });
  
  const averageHoursPlayed = computed(() => {
    if (sessionCount.value === 0) return 0;
    return totalHoursPlayed.value / sessionCount.value;
  });

  const averageBreakDuration = computed(() => {
    if (sessionCount.value === 0) return 0;
    const totalBreakSeconds = filteredSessionsForSummary.value.reduce((total, session) => total + (session.tiempo_descanso_segundos || 0), 0);
    const sessionsWithBreaks = filteredSessionsForSummary.value.filter(s => s.tiempo_descanso_segundos > 0).length;
    if (sessionsWithBreaks === 0) return 0;
    return (totalBreakSeconds / sessionsWithBreaks) / 60;
  });

  const winRatePerHour = computed(() => {
    if (totalHoursPlayed.value === 0) return 0;
    return totalNetProfit.value / totalHoursPlayed.value;
  });

  const averageRebuys = computed(() => {
    if (sessionCount.value === 0) return 0;
    const totalRebuysAmount = filteredSessionsForSummary.value.reduce((sum, session) => sum + (parseFloat(session.total_recompras) || 0), 0);
    return totalRebuysAmount / sessionCount.value;
  });

  const totalAllExpenses = computed(() => {
    return filteredSessionsForSummary.value.reduce((sum, session) => sum + (parseFloat(session.total_gastos) || 0), 0);
  });

  async function fetchSessions() {
    savedSessions.value = await apiFetchSessions();
  }
  
  async function deleteSession(sessionId) {
    try {
      await apiDeleteSession(sessionId);
      await fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error.message);
    }
  }

  loadStateFromLocalStorage();

  return {
    isActive: computed(() => sessionState.value.isActive),
    isOnBreak: computed(() => sessionState.value.isOnBreak),
    // ==========================================================
    // ===> INICIO DEL CAMBIO: CORREGIR GUARDADO DE SETTINGS   <===
    // ==========================================================
    playerCount: computed({
      get: () => sessionState.value.playerCount,
      set: (val) => { sessionState.value.playerCount = val; saveStateToLocalStorage(); }
    }),
    blinds: computed({
      get: () => sessionState.value.blinds,
      set: (val) => { sessionState.value.blinds = val; saveStateToLocalStorage(); }
    }),
    location: computed({
      get: () => sessionState.value.location,
      set: (val) => { sessionState.value.location = val; saveStateToLocalStorage(); }
    }),
    currency: computed({
      get: () => sessionState.value.currency,
      set: (val) => { sessionState.value.currency = val; saveStateToLocalStorage(); }
    }),
    initialStack: computed({
      get: () => sessionState.value.initialStack,
      set: (val) => { sessionState.value.initialStack = val; saveStateToLocalStorage(); }
    }),
    gameType: computed({
      get: () => sessionState.value.gameType,
      set: (val) => { sessionState.value.gameType = val; saveStateToLocalStorage(); }
    }),
    // ==========================================================
    // ===> FIN DEL CAMBIO                                     <===
    // ==========================================================
    totalRebuys: computed(() => sessionState.value.totalRebuys),
    totalExpenses: computed(() => sessionState.value.totalExpenses),
    elapsedTime, 
    breakElapsedTime,
    savedSessions,
    startSession, startBreak, endBreak, stopAndSaveSession, deleteSession,
    addRebuy, addExpense,
    clearActiveSession,
    fetchSessions,
    summaryDateFilter,
    totalNetProfit,
    averageBuyIn,
    averageCashOut,
    sessionCount,
    totalHoursPlayed,
    averageHoursPlayed,
    averageBreakDuration,
    winRatePerHour,
    roi,
    winningDays,
    losingDays,
    bestDay,
    worstDay,
    winningStreak,
    averageRebuys,
    totalAllExpenses,
    setSummaryDateFilter,
  };
});