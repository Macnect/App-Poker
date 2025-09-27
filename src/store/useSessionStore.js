import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/supabase';
import { useAuthStore } from './useAuthStore';
import { apiFetchSessions, apiAddSession, apiDeleteSession } from '@/api'; // Importamos la API

export const useSessionStore = defineStore('session', () => {
  // --- STATE ---
  const isActive = ref(false);
  const elapsedTime = ref(0);
  let sessionTimerInterval = null;
  const isOnBreak = ref(false);
  const breakElapsedTime = ref(0);
  let breakTimerInterval = null;
  const totalBreakTime = ref(0);
  const totalRebuys = ref(0);
  const totalExpenses = ref(0);
  const playerCount = ref(6);
  const blinds = ref('1/2');
  const location = ref('');
  const currency = ref('$');
  const initialStack = ref(200);
  const savedSessions = ref([]);
  
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
    // La lógica ahora llama a la API centralizada
    savedSessions.value = await apiFetchSessions();
  }

  function startSession() {
    elapsedTime.value = 0;
    totalBreakTime.value = 0;
    totalRebuys.value = 0;
    totalExpenses.value = 0;
    isActive.value = true;
    isOnBreak.value = false;
    
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = setInterval(() => {
      if (!isOnBreak.value) {
        elapsedTime.value++;
      }
    }, 1000);
  }

  function startBreak() {
    if (!isActive.value) return;
    isOnBreak.value = true;
    breakElapsedTime.value = 0;

    clearInterval(breakTimerInterval);
    breakTimerInterval = setInterval(() => {
      breakElapsedTime.value++;
    }, 1000);
  }

  function endBreak() {
    isOnBreak.value = false;
    totalBreakTime.value += breakElapsedTime.value;
    clearInterval(breakTimerInterval);
    breakTimerInterval = null;
  }

  function addRebuy(amount) {
    if (amount > 0) {
      totalRebuys.value += amount;
    }
  }

  function addExpense(amount) {
    if (amount > 0) {
      totalExpenses.value += amount;
    }
  }
  
  // *** ÚNICO BLOQUE MODIFICADO ***
  async function stopAndSaveSession(finalStack) {
    try {
      if (isOnBreak.value) {
        totalBreakTime.value += breakElapsedTime.value;
      }

      const ensureFloat = (value) => {
          const num = parseFloat(value);
          return isNaN(num) ? 0.0 : num;
      };

      const currentInvestment = ensureFloat(initialStack.value) + ensureFloat(totalRebuys.value);
      const result = ensureFloat(finalStack) - currentInvestment - ensureFloat(totalExpenses.value);

      const sessionData = {
        fecha: new Date().toISOString().split('T')[0],
        duracion_segundos: ensureFloat(elapsedTime.value),
        tiempo_descanso_segundos: ensureFloat(totalBreakTime.value),
        cantidad_jugadores: playerCount.value || 2,
        ciegas: blinds.value || 'N/A',
        ubicacion: location.value || null,
        moneda: currency.value || '$',
        stack_inicial: ensureFloat(initialStack.value),
        total_recompras: ensureFloat(totalRebuys.value),
        total_gastos: ensureFloat(totalExpenses.value),
        stack_final: ensureFloat(finalStack),
        resultado: result,
      };
      
      // 1. Guardamos en la BBDD a través de la API
      await apiAddSession(sessionData);
      
      // 2. Volvemos a cargar TODAS las sesiones para asegurar consistencia
      await fetchSessions();

    } catch (error) {
      console.error('Error en el store al guardar sesión:', error);
      throw error; // Propaga el error para que la vista lo maneje
    } finally {
      // Este bloque se ejecuta siempre, haya error o no.
      isActive.value = false;
      isOnBreak.value = false;
      clearInterval(sessionTimerInterval);
      clearInterval(breakTimerInterval);
      sessionTimerInterval = null;
      breakTimerInterval = null;
      elapsedTime.value = 0;
      breakElapsedTime.value = 0;
    }
  }
  
  async function deleteSession(sessionId) {
    try {
      // Llama a la API para borrar
      await apiDeleteSession(sessionId);
      // Vuelve a cargar para mantener la consistencia
      await fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error.message);
    }
  }

  return {
    isActive, elapsedTime, isOnBreak, breakElapsedTime, playerCount, blinds, 
    location, currency, initialStack, savedSessions, totalRebuys, totalExpenses,
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
    startSession, startBreak, endBreak, stopAndSaveSession, deleteSession,
    addRebuy, addExpense,
    setSummaryDateFilter,
    fetchSessions,
  };
});