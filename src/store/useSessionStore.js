import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/supabase';
import { useAuthStore } from './useAuthStore';

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
    const authStore = useAuthStore();
    if (!authStore.user) return;

    try {
      const { data, error } = await supabase
        .from('sesiones_juego')
        .select('*')
        .eq('usuario_id', authStore.user.id)
        .order('fecha', { ascending: false });

      if (error) throw error;
      savedSessions.value = data;
    } catch (error) {
      console.error('Error fetching sessions:', error.message);
    }
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
  
  async function stopAndSaveSession(finalStack) {
    const authStore = useAuthStore();
    if (!authStore.user) {
      isActive.value = false;
      clearInterval(sessionTimerInterval);
      throw new Error("Usuario no autenticado. No se puede guardar la sesión.");
    }
    
    try {
      if (isOnBreak.value) {
        totalBreakTime.value += breakElapsedTime.value;
      }

      const currentInvestment = initialStack.value + totalRebuys.value;
      const result = finalStack - currentInvestment - totalExpenses.value;

      const sessionData = {
        usuario_id: authStore.user.id,
        fecha: new Date().toISOString().split('T')[0],
        duracion_segundos: elapsedTime.value,
        tiempo_descanso_segundos: totalBreakTime.value,
        cantidad_jugadores: playerCount.value,
        ciegas: blinds.value,
        ubicacion: location.value,
        moneda: currency.value,
        stack_inicial: parseFloat(initialStack.value) || 0,
        total_recompras: parseFloat(totalRebuys.value) || 0,
        total_gastos: parseFloat(totalExpenses.value) || 0,
        stack_final: parseFloat(finalStack) || 0,
        resultado: parseFloat(result) || 0,
      };

      // =================================================================
      // =========== LÍNEA DE DEPURACIÓN INTEGRADA ======================
      console.log('DEBUG: Objeto a insertar en Supabase:', JSON.stringify(sessionData, null, 2));
      // =================================================================

      const { data, error } = await supabase
        .from('sesiones_juego')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      
      savedSessions.value.unshift(data);

    } catch (error) {
      console.error('Error saving session in store:', error.message);
      throw error;
    } finally {
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
      const { error } = await supabase
        .from('sesiones_juego')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;

      savedSessions.value = savedSessions.value.filter(session => session.id !== sessionId);

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