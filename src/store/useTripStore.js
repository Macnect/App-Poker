import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { apiFetchTrips, apiAddOrUpdateTrip, apiDeleteTrip } from '@/api';
import { supabase } from '@/supabase';

export const useTripStore = defineStore('trip', () => {
  // --- STATE ---
  const savedTrips = ref([]);
  const currentTripId = ref(null); 
  const realtimeChannel = ref(null);

  // --- STATE DE PLANIFICACIÓN ---
  const playerCount = ref(4);
  const city = ref('');
  const casino = ref('');
  const players = ref([]);
  const currency = ref('$');
  const repartoType = ref('participation');

  // --- ESTADO DE SEGUIMIENTO ---
  const isTripActive = ref(false);
  const tripDays = ref([]);
  const dailyResults = ref({});

  // --- COMPUTED ---
  const collectiveBankroll = computed(() => {
    return players.value.reduce((sum, player) => sum + (player.individualBankroll || 0), 0);
  });

  const tripTotalProfit = computed(() => {
    return Object.values(dailyResults.value).reduce((total, dayResults) => {
      const dayTotal = Object.values(dayResults).reduce((daySum, playerData) => daySum + (playerData.result || 0), 0);
      return total + dayTotal;
    }, 0);
  });
  
  const totalParticipation = computed(() => {
    const sum = players.value.reduce((sum, player) => sum + (parseFloat(player.participation) || 0), 0);
    return parseFloat(sum.toFixed(2));
  });

  const playerTotalHours = computed(() => {
    const totals = {};
    players.value.forEach(player => { totals[player.id] = 0; });
    for (const day in dailyResults.value) {
      for (const playerId in dailyResults.value[day]) {
        if (totals[playerId] !== undefined) {
          totals[playerId] += dailyResults.value[day][playerId].hours || 0;
        }
      }
    }
    return totals;
  });

  const tripTotalHours = computed(() => {
    return Object.values(playerTotalHours.value).reduce((sum, hours) => sum + hours, 0);
  });

  const playerTotals = computed(() => {
    const totals = {};
    players.value.forEach(player => { totals[player.id] = 0; });
    for (const day in dailyResults.value) {
      for (const playerId in dailyResults.value[day]) {
        if (totals[playerId] !== undefined) {
          totals[playerId] += dailyResults.value[day][playerId].result || 0;
        }
      }
    }
    return totals;
  });
  
  const playerFinalShares = computed(() => {
    const finalBankroll = collectiveBankroll.value + tripTotalProfit.value;
    const shares = {};

    if (repartoType.value === 'hours') {
      if (tripTotalHours.value === 0) return shares;
      players.value.forEach(player => {
        const playerHours = playerTotalHours.value[player.id] || 0;
        const hourPercentage = (playerHours / tripTotalHours.value) * 100;
        const shareAmount = (hourPercentage / 100) * finalBankroll;
        shares[player.id] = isNaN(shareAmount) ? 0 : shareAmount;
      });
    } else {
      players.value.forEach(player => {
        const participationPercent = parseFloat(player.participation) || 0;
        const shareAmount = (participationPercent / 100) * finalBankroll;
        shares[player.id] = isNaN(shareAmount) ? 0 : shareAmount;
      });
    }
    return shares;
  });

  const playerAverageWinRates = computed(() => {
    const rates = {};
    players.value.forEach(player => {
      const totalProfit = playerTotals.value[player.id];
      const totalHours = playerTotalHours.value[player.id];
      rates[player.id] = totalHours > 0 ? totalProfit / totalHours : 0;
    });
    return rates;
  });

  const tripAverageWinRate = computed(() => {
    return tripTotalHours.value > 0 ? tripTotalProfit.value / tripTotalHours.value : 0;
  });

  // --- ACTIONS ---
  
  async function fetchTrips() {
    try {
        savedTrips.value = await apiFetchTrips();
    } catch (error) {
        console.error("Error al cargar los viajes:", error);
        savedTrips.value = [];
    }
  }

  async function saveCurrentTrip() {
    const tripData = {
      id: currentTripId.value,
      city: city.value,
      casino: casino.value,
      players: players.value,
      currency: currency.value,
      repartoType: repartoType.value,
      isTripActive: isTripActive.value,
      tripDays: tripDays.value,
      dailyResults: dailyResults.value,
    };

    try {
      const savedTripId = await apiAddOrUpdateTrip(tripData);
      if (!currentTripId.value) {
        currentTripId.value = savedTripId;
      }
      alert('¡Viaje guardado con éxito!');
    } catch (error) {
      alert(`Error al guardar el viaje: ${error.message}`);
    }
  }
  
  function loadTrip(tripId) {
    const tripToLoad = savedTrips.value.find(t => t.id === tripId);
    if (!tripToLoad) {
        console.error("No se encontró el viaje para cargar con ID:", tripId);
        return;
    }
    
    currentTripId.value = tripToLoad.id;
    playerCount.value = tripToLoad.players ? tripToLoad.players.length : 0;
    city.value = tripToLoad.ciudad;
    casino.value = tripToLoad.casino;
    players.value = tripToLoad.players;
    currency.value = tripToLoad.moneda;
    repartoType.value = tripToLoad.tipo_reparto;
    isTripActive.value = tripToLoad.activo;
    tripDays.value = tripToLoad.tripDays;
    dailyResults.value = tripToLoad.dailyResults;
    
    subscribeToTripChanges(tripId);
  }

  async function deleteTrip(tripId) {
    try {
        await apiDeleteTrip(tripId);
        savedTrips.value = savedTrips.value.filter(t => t.id !== tripId);
    } catch(error) {
        alert(`Error al borrar el viaje: ${error.message}`);
    }
  }
  
  function resetCurrentTrip() {
    if (realtimeChannel.value) {
      supabase.removeChannel(realtimeChannel.value);
      realtimeChannel.value = null;
    }
    
    currentTripId.value = null;
    playerCount.value = 4;
    city.value = '';
    casino.value = '';
    players.value = [];
    currency.value = '$';
    repartoType.value = 'participation';
    isTripActive.value = false;
    tripDays.value = [];
    dailyResults.value = {};
    setPlayerCount(4);
  }
  
  function subscribeToTripChanges(tripId) {
    // ESTE ES EL LOG DE VERIFICACIÓN. SI ESTO NO APARECE, LA FUNCIÓN NO SE ESTÁ LLAMANDO.
    console.log(`[VERIFICACIÓN] La función subscribeToTripChanges se está ejecutando para el viaje: ${tripId}`);

    if (realtimeChannel.value) {
      supabase.removeChannel(realtimeChannel.value);
    }

    const channel = supabase.channel(`trip-${tripId}`);
    
    channel.on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'resultados_diarios_viaje', 
        filter: `viaje_id=eq.${tripId}` 
      },
      (payload) => {
        console.log('[REALTIME] ¡CAMBIO RECIBIDO en resultados_diarios_viaje!', payload);
        fetchTrips().then(() => {
          loadTrip(tripId);
        });
      }
    ).subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[REALTIME] Suscripción al canal trip-${tripId} exitosa.`);
      }
      if (status === 'CHANNEL_ERROR') {
        console.error(`[REALTIME] Error en el canal trip-${tripId}:`, err);
      }
      if (status === 'TIMED_OUT') {
        console.warn(`[REALTIME] Se agotó el tiempo de espera para la suscripción al canal trip-${tripId}.`);
      }
    });

    realtimeChannel.value = channel;
  }

  function recalculateParticipations() {
    const totalBank = collectiveBankroll.value;
    if (totalBank === 0) {
      players.value.forEach(player => { player.participation = 0; });
      return;
    }
    players.value.forEach(player => {
      const bankroll = player.individualBankroll || 0;
      player.participation = parseFloat(((bankroll / totalBank) * 100).toFixed(2));
    });
    const currentTotal = totalParticipation.value;
    const difference = 100 - currentTotal;
    if (difference !== 0 && players.value.length > 0) {
      players.value[0].participation = parseFloat((players.value[0].participation + difference).toFixed(2));
    }
  }
  
  function setPlayerCount(newCount) {
    const currentCount = players.value.length;
    if (newCount > currentCount) {
      for (let i = currentCount; i < newCount; i++) {
        players.value.push({
          id: uuidv4(),
          name: `Jugador ${i + 1}`,
          individualBankroll: 1000,
          participation: 0,
        });
      }
    } else if (newCount < currentCount) {
      players.value.splice(newCount);
    }
    playerCount.value = newCount;
    recalculateParticipations();
  }

  function updatePlayerBankroll(playerId, value) {
    const player = players.value.find(p => p.id === playerId);
    if (player) {
      player.individualBankroll = parseFloat(value) || 0;
      recalculateParticipations();
    }
  }

  function startTrip() { isTripActive.value = true; }

  function addTripDay(dateString) {
    if (!dateString) return;
    if (!tripDays.value.includes(dateString)) {
      tripDays.value.push(dateString);
      tripDays.value.sort();
      dailyResults.value[dateString] = {};
      players.value.forEach(p => {
        dailyResults.value[dateString][p.id] = { result: 0, hours: 0, stake: '' };
      });
    }
  }

  function updatePlayerDailyData(day, playerId, field, value) {
    if (dailyResults.value[day]?.[playerId]) {
      const finalValue = (field === 'result' || field === 'hours') ? parseFloat(value) || 0 : value;
      dailyResults.value[day][playerId][field] = finalValue;
    }
  }

  return {
    savedTrips, currentTripId, playerCount, city, casino, players, currency, repartoType,
    isTripActive, tripDays, dailyResults,
    collectiveBankroll, tripTotalProfit, totalParticipation, playerFinalShares,
    playerTotalHours, tripTotalHours, playerAverageWinRates, tripAverageWinRate, playerTotals,
    fetchTrips, saveCurrentTrip, loadTrip, deleteTrip, resetCurrentTrip,
    setPlayerCount, startTrip, addTripDay, updatePlayerDailyData, updatePlayerBankroll,
  };
});