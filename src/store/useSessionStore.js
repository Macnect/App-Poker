import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';

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
  const savedSessions = ref(JSON.parse(localStorage.getItem('pokerSavedSessions')) || []);
  
  // --- NUEVO ESTADO PARA EL FILTRO DEL SUMARIO ---
  const summaryDateFilter = ref('all');

  // --- NUEVA ACCIÓN PARA CAMBIAR EL FILTRO ---
  function setSummaryDateFilter(newFilter) {
    summaryDateFilter.value = newFilter;
  }

  // --- NUEVA COMPUTADA PARA FILTRAR SESIONES SEGÚN EL FILTRO SELECCIONADO ---
  const filteredSessionsForSummary = computed(() => {
    const filter = summaryDateFilter.value;
    if (filter === 'all') {
      return savedSessions.value;
    }

    const now = new Date();
    const cutoffDate = new Date();
    
    // El día de hoy a las 00:00 para que 'today' y 'last7days' funcionen correctamente
    cutoffDate.setHours(0, 0, 0, 0); 

    switch (filter) {
      case 'last7days': cutoffDate.setDate(now.getDate() - 7); break;
      case 'last1month': cutoffDate.setMonth(now.getMonth() - 1); break;
      case 'last3months': cutoffDate.setMonth(now.getMonth() - 3); break;
      case 'last6months': cutoffDate.setMonth(now.getMonth() - 6); break;
      case 'last1year': cutoffDate.setFullYear(now.getFullYear() - 1); break;
    }

    return savedSessions.value.filter(session => {
      // Usamos la misma lógica de parseo de fechas que en otras vistas
      const dateParts = session.date.split('/');
      const sessionDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
      return sessionDate >= cutoffDate;
    });
  });

  // --- TODAS LAS COMPUTADAS SIGUIENTES AHORA USAN 'filteredSessionsForSummary' ---
  const totalNetProfit = computed(() => {
    return filteredSessionsForSummary.value.reduce((total, session) => total + (session.result || 0), 0);
  });

  const totalInvestment = computed(() => {
    return filteredSessionsForSummary.value.reduce((total, session) => {
      return total + (session.initialStack || 0) + (session.totalRebuys || 0);
    }, 0);
  });
  
  const roi = computed(() => {
    if (totalInvestment.value === 0) return 0;
    return (totalNetProfit.value / totalInvestment.value) * 100;
  });

  const winningDays = computed(() => {
    return filteredSessionsForSummary.value.filter(session => session.result > 0).length;
  });

  const losingDays = computed(() => {
    return filteredSessionsForSummary.value.filter(session => session.result < 0).length;
  });

  const bestDay = computed(() => {
    if (filteredSessionsForSummary.value.length === 0) return 0;
    const results = filteredSessionsForSummary.value.map(session => session.result || 0);
    return Math.max(...results);
  });

  const worstDay = computed(() => {
    if (filteredSessionsForSummary.value.length === 0) return 0;
    const results = filteredSessionsForSummary.value.map(session => session.result || 0);
    return Math.min(...results);
  });

  const winningStreak = computed(() => {
    if (filteredSessionsForSummary.value.length === 0) return 0;
    const chronologicalSessions = [...filteredSessionsForSummary.value].reverse();
    let maxStreak = 0;
    let currentStreak = 0;
    for (const session of chronologicalSessions) {
      if (session.result > 0) {
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
    const totalInvest = filteredSessionsForSummary.value.reduce((total, session) => total + (session.initialStack || 0) + (session.totalRebuys || 0), 0);
    return totalInvest / filteredSessionsForSummary.value.length;
  });
  
  const averageCashOut = computed(() => {
    if (filteredSessionsForSummary.value.length === 0) return 0;
    const totalCashOut = filteredSessionsForSummary.value.reduce((total, session) => total + (session.finalStack || 0), 0);
    return totalCashOut / filteredSessionsForSummary.value.length;
  });

  const sessionCount = computed(() => filteredSessionsForSummary.value.length);

  const totalHoursPlayed = computed(() => {
    const totalSeconds = filteredSessionsForSummary.value.reduce((total, session) => total + (session.duration || 0), 0);
    return totalSeconds / 3600;
  });
  
  const averageHoursPlayed = computed(() => {
    if (sessionCount.value === 0) return 0;
    return totalHoursPlayed.value / sessionCount.value;
  });

  const averageBreakDuration = computed(() => {
    if (sessionCount.value === 0) return 0;
    const totalBreakSeconds = filteredSessionsForSummary.value.reduce((total, session) => total + (session.totalBreakTime || 0), 0);
    const sessionsWithBreaks = filteredSessionsForSummary.value.filter(s => s.totalBreakTime > 0).length;
    if (sessionsWithBreaks === 0) return 0;
    return (totalBreakSeconds / sessionsWithBreaks) / 60;
  });

  const winRatePerHour = computed(() => {
    if (totalHoursPlayed.value === 0) return 0;
    return totalNetProfit.value / totalHoursPlayed.value;
  });

  const averageRebuys = computed(() => {
    if (sessionCount.value === 0) return 0;
    const totalRebuysAmount = filteredSessionsForSummary.value.reduce((sum, session) => sum + (session.totalRebuys || 0), 0);
    return totalRebuysAmount / sessionCount.value;
  });

  const totalAllExpenses = computed(() => {
    return filteredSessionsForSummary.value.reduce((sum, session) => sum + (session.totalExpenses || 0), 0);
  });

  // --- ACTIONS --- (Sin cambios aquí)
  
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
  
  function stopAndSaveSession(finalStack) {
    if (isOnBreak.value) {
      totalBreakTime.value += breakElapsedTime.value;
    }

    const currentInvestment = initialStack.value + totalRebuys.value;
    const result = finalStack - currentInvestment - totalExpenses.value;

    const sessionSummary = {
      id: uuidv4(),
      date: new Date().toLocaleDateString(),
      duration: elapsedTime.value,
      totalBreakTime: totalBreakTime.value,
      playerCount: playerCount.value,
      blinds: blinds.value,
      location: location.value,
      currency: currency.value,
      initialStack: initialStack.value,
      totalRebuys: totalRebuys.value,
      totalExpenses: totalExpenses.value,
      finalStack: finalStack,
      result: result,
    };

    savedSessions.value.unshift(sessionSummary);
    localStorage.setItem('pokerSavedSessions', JSON.stringify(savedSessions.value));

    isActive.value = false;
    isOnBreak.value = false;
    clearInterval(sessionTimerInterval);
    clearInterval(breakTimerInterval);
    sessionTimerInterval = null;
    breakTimerInterval = null;
    elapsedTime.value = 0;
    breakElapsedTime.value = 0;
  }
  
  function deleteSession(sessionId) {
    savedSessions.value = savedSessions.value.filter(session => session.id !== sessionId);
    localStorage.setItem('pokerSavedSessions', JSON.stringify(savedSessions.value));
  }

  return {
    isActive, elapsedTime, isOnBreak, breakElapsedTime, playerCount, blinds, 
    location, currency, initialStack, savedSessions, totalRebuys, totalExpenses,
    summaryDateFilter, // <-- Exportar estado del filtro
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
    setSummaryDateFilter, // <-- Exportar acción del filtro
  };
});