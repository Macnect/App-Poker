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

  // --- COMPUTED PROPERTIES (GETTERS) PARA EL SUMARIO GENERAL ---
  const totalNetProfit = computed(() => {
    return savedSessions.value.reduce((total, session) => total + (session.result || 0), 0);
  });

  const totalInvestment = computed(() => {
    return savedSessions.value.reduce((total, session) => {
      return total + (session.initialStack || 0) + (session.totalRebuys || 0);
    }, 0);
  });
  
  const roi = computed(() => {
    if (totalInvestment.value === 0) return 0;
    return (totalNetProfit.value / totalInvestment.value) * 100;
  });

  const winningDays = computed(() => {
    return savedSessions.value.filter(session => session.result > 0).length;
  });

  const losingDays = computed(() => {
    return savedSessions.value.filter(session => session.result < 0).length;
  });

  const bestDay = computed(() => {
    if (savedSessions.value.length === 0) return 0;
    const results = savedSessions.value.map(session => session.result || 0);
    return Math.max(...results);
  });

  const worstDay = computed(() => {
    if (savedSessions.value.length === 0) return 0;
    const results = savedSessions.value.map(session => session.result || 0);
    return Math.min(...results);
  });

  const winningStreak = computed(() => {
    if (savedSessions.value.length === 0) return 0;
    // Las sesiones se guardan con unshift, así que están en orden cronológico inverso. Las revertimos.
    const chronologicalSessions = [...savedSessions.value].reverse();
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
    // Comprobación final en caso de que la racha continúe hasta la última sesión
    maxStreak = Math.max(maxStreak, currentStreak);
    return maxStreak;
  });

  const averageBuyIn = computed(() => {
    if (savedSessions.value.length === 0) return 0;
    return totalInvestment.value / savedSessions.value.length;
  });
  
  const averageCashOut = computed(() => {
    if (savedSessions.value.length === 0) return 0;
    const totalCashOut = savedSessions.value.reduce((total, session) => total + (session.finalStack || 0), 0);
    return totalCashOut / savedSessions.value.length;
  });

  // --- COMPUTED PROPERTIES PARA EL PANEL DE SESIONES ---
  const sessionCount = computed(() => savedSessions.value.length);

  const totalHoursPlayed = computed(() => {
    const totalSeconds = savedSessions.value.reduce((total, session) => total + (session.duration || 0), 0);
    return totalSeconds / 3600;
  });
  
  const averageHoursPlayed = computed(() => {
    if (sessionCount.value === 0) return 0;
    return totalHoursPlayed.value / sessionCount.value;
  });

  const averageBreakDuration = computed(() => {
    if (sessionCount.value === 0) return 0;
    const totalBreakSeconds = savedSessions.value.reduce((total, session) => total + (session.totalBreakTime || 0), 0);
    const sessionsWithBreaks = savedSessions.value.filter(s => s.totalBreakTime > 0).length;
    if (sessionsWithBreaks === 0) return 0;
    return (totalBreakSeconds / sessionsWithBreaks) / 60; // Devuelve la media en minutos
  });

  const winRatePerHour = computed(() => {
    if (totalHoursPlayed.value === 0) return 0;
    return totalNetProfit.value / totalHoursPlayed.value;
  });

  const averageRebuys = computed(() => {
    if (sessionCount.value === 0) return 0;
    const totalRebuysAmount = savedSessions.value.reduce((sum, session) => sum + (session.totalRebuys || 0), 0);
    return totalRebuysAmount / sessionCount.value;
  });

  const totalAllExpenses = computed(() => {
    return savedSessions.value.reduce((sum, session) => sum + (session.totalExpenses || 0), 0);
  });

  // --- ACTIONS ---
  
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
  };
});