import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// Importamos nuestras nuevas funciones de API
import { apiFetchHands, apiAddHand, apiDeleteHand } from '@/api';

const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

// --- LÓGICA DE EVALUACIÓN DE MANOS (PLACEHOLDER) ---
const evaluateHand = (playerCards, boardCards) => {
  const allCards = [...playerCards, ...boardCards].filter(c => c);
  if (allCards.length < 2) return { rank: 0, description: 'Nada' };
  const ranks = allCards.map(c => c.slice(0, -1));
  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {});
  const pairs = Object.keys(rankCounts).filter(r => rankCounts[r] === 2);
  const trips = Object.keys(rankCounts).filter(r => rankCounts[r] === 3);
  const quads = Object.keys(rankCounts).filter(r => rankCounts[r] === 4);
  if (quads.length > 0) return { rank: 7, description: `Poker de ${quads[0]}`};
  if (trips.length > 0 && pairs.length > 0) return { rank: 6, description: `Full House de ${trips[0]} y ${pairs[0]}`};
  if (trips.length > 0) return { rank: 3, description: `Trío de ${trips[0]}`};
  if (pairs.length === 2) return { rank: 2, description: `Doble pareja de ${pairs[0]} y ${pairs[1]}`};
  if (pairs.length === 1) return { rank: 1, description: `Pareja de ${pairs[0]}`};
  return { rank: 0, description: `Carta alta ${ranks[0]}` };
};

export const useGameStore = defineStore('game', () => {
  const players = ref([]);
  const heroPosition = ref(null);
  const smallBlind = ref(1);
  const bigBlind = ref(2);
  const currency = ref('$');
  const specialRule = ref('Ninguno');
  const bombPotBB = ref(2);
  const bombPotType = ref('single'); // 'single' o 'double'
  const gameVariant = ref('holdem'); // 'holdem' o 'omaha'
  const board = ref(['', '', '', '', '']);
  const board2 = ref(['', '', '', '', '']); // Segundo board para Double Board Bomb Pot
  const pots = ref([]);
  const history = ref([]);
  const currentActionIndex = ref(-1);
  // Reemplazamos localStorage con un ref vacío
  const savedHands = ref([]);
  const displayInBBs = ref(false);

  // Helper function: returns empty card slots based on game variant
  const getEmptyCardSlots = () => {
    if (gameVariant.value === 'omaha') return ['', '', '', ''];
    if (gameVariant.value === 'pineapple') return ['', '', ''];
    return ['', ''];
  };

  // Pagination state
  const hasMore = ref(true);
  const currentOffset = ref(0);
  const pageSize = ref(20);
  
  const replaySpeed = ref(2000);
  const isReplaying = ref(false);
  let replayIntervalId = null;

  const gamePhase = ref('setup');
  const dealerPosition = ref(0);
  const activePlayerIndex = ref(null);
  const currentBet = ref(0);
  const minRaise = ref(0);
  const lastRaiserIndex = ref(null);
  const lastRaiseAmount = ref(0);
  const isCardPickerOpen = ref(false);
  const cardPickerTarget = ref(null);
  const isFlopMultiSelect = ref(false);
  const flopSelectIndex = ref(0);
  const isPlayerCardsMultiSelect = ref(false);
  const playerCardsSelectIndex = ref(0);

  const isPreActionPhase = ref(true);

  // Crazy Pineapple discard tracking
  const playersWhoDiscarded = ref(new Set());
  const openNotesPanelPlayerId = ref(null);
  const tableLayout = ref({
    board: { x: 0, y: 0 },
    pot: { x: 0, y: 0 }
  });

  const totalPot = computed(() => pots.value.reduce((sum, pot) => sum + pot.amount, 0));

  const activePlayer = computed(() => {
    if (activePlayerIndex.value === null) return null;
    return players.value.find(p => p.id === activePlayerIndex.value);
  });

  const usedCards = computed(() => {
    const cards = new Set();
    players.value.forEach(p => {
      p.cards.forEach(card => {
        if (card) cards.add(card);
      });
    });
    board.value.forEach(c => {
      if (c) cards.add(c);
    });
    // Agregar cartas del segundo board si es double board bomb pot
    if (bombPotType.value === 'double') {
      board2.value.forEach(c => {
        if (c) cards.add(c);
      });
    }
    return cards;
  });

  // --- ACCIONES NUEVAS Y MODIFICADAS ---

  async function fetchHands(date = null, incremental = false) {
    console.log('[DEBUG] gameStore.fetchHands: Starting with date:', date, 'incremental:', incremental, 'currentOffset:', currentOffset.value);
    const limit = pageSize.value;
    const offset = incremental ? currentOffset.value : 0;
    console.log('[DEBUG] gameStore.fetchHands: Calling apiFetchHands with limit:', limit, 'offset:', offset);
    const result = await apiFetchHands(date, limit, offset);
    console.log('[DEBUG] gameStore.fetchHands: apiFetchHands completed, result count:', result?.length || 0);
    if (incremental) {
      savedHands.value = [...savedHands.value, ...result];
      console.log('[DEBUG] gameStore.fetchHands: Appended to savedHands, new total:', savedHands.value.length);
    } else {
      savedHands.value = result;
      currentOffset.value = 0;
      console.log('[DEBUG] gameStore.fetchHands: Replaced savedHands, count:', savedHands.value.length, 'offset reset to 0');
    }
    currentOffset.value += result.length;
    hasMore.value = result.length === limit;
    console.log('[DEBUG] gameStore.fetchHands: Updated currentOffset to:', currentOffset.value, 'hasMore:', hasMore.value);
  }

  async function loadMoreHands(date = null) {
    if (!hasMore.value) return;
    await fetchHands(date, true);
  }

  async function saveCurrentHand() {
    if (history.value.length === 0) return null;
    const handToSave = {
      // id y fecha los genera la BD, ya no los necesitamos aquí
      fecha: new Date().toISOString(),
      posicion_heroe: heroPosition.value,
      cantidad_jugadores: players.value.length,
      historial: deepCopy(history.value), // El historial se guarda en JSONB
      ciega_pequena: smallBlind.value,
      ciega_grande: bigBlind.value,
      moneda: currency.value,
      regla_especial: specialRule.value,
      bomb_pot_bb: bombPotBB.value,
      bomb_pot_type: bombPotType.value, // Guardar el tipo de bomb pot
      game_variant: gameVariant.value, // Guardar variante del juego
    };
    try {
      const newHand = await apiAddHand(handToSave);
      savedHands.value.unshift(newHand); // Añadimos la mano devuelta a nuestro estado local
      return newHand; // Devolver la mano guardada
    } catch (error) {
      console.error("Error al guardar la mano:", error);
      // Opcional: mostrar un error al usuario
      return null;
    }
  }
  
  async function deleteHand(handId) {
    try {
      await apiDeleteHand(handId);
      savedHands.value = savedHands.value.filter(hand => hand.id !== handId);
    } catch(error) {
       console.error("Error al borrar la mano:", error);
    }
  }

  // loadHand no necesita ser async, porque opera con datos ya cargados
  function loadHand(handData) {
    pauseReplay();
    const initialState = handData.historial[0]; // El historial viene del campo JSONB
    players.value = deepCopy(initialState.players);
    board.value = deepCopy(initialState.board);
    board2.value = deepCopy(initialState.board2 || ['', '', '', '', '']); // Cargar segundo board si existe
    pots.value = deepCopy(initialState.pots);
    heroPosition.value = handData.posicion_heroe;
    smallBlind.value = handData.ciega_pequena;
    bigBlind.value = handData.ciega_grande;
    currency.value = handData.moneda;
    specialRule.value = handData.regla_especial || 'Ninguno';
    bombPotBB.value = handData.bomb_pot_bb || 2;
    bombPotType.value = handData.bomb_pot_type || 'single'; // Cargar tipo de bomb pot
    gameVariant.value = handData.game_variant || 'holdem'; // Cargar variante del juego (default holdem para compatibilidad)

    // Consolidar snapshots del flop para que aparezcan las 3 cartas a la vez
    const consolidatedHistory = consolidateFlopSnapshots(deepCopy(handData.historial));
    history.value = consolidatedHistory;

    currentActionIndex.value = 0;
    gamePhase.value = 'replay'; // IMPORTANT: Always keep 'replay' when loading saved hands
    isPreActionPhase.value = false;
    // Restaurar estado del juego desde el snapshot inicial (excepto gamePhase)
    if (initialState.gamePhase !== undefined) {
      // NO restaurar gamePhase - debe permanecer como 'replay'
      dealerPosition.value = initialState.dealerPosition;
      activePlayerIndex.value = initialState.activePlayerIndex;
      currentBet.value = initialState.currentBet;
      minRaise.value = initialState.minRaise;
      lastRaiserIndex.value = initialState.lastRaiserIndex;
      lastRaiseAmount.value = initialState.lastRaiseAmount;
    }
  }

  // Función para consolidar snapshots consecutivos del flop
  function consolidateFlopSnapshots(historial) {
    const consolidated = [];
    let i = 0;

    while (i < historial.length) {
      const current = historial[i];

      // Detectar si es un Double Board Bomb Pot (mirando el snapshot inicial)
      const isDoubleBoard = historial[0]?.description?.includes('Double Board Bomb Pot');

      // Para Double Board Bomb Pot: consolidar 2 snapshots (uno por cada board con 3 cartas)
      if (isDoubleBoard && i + 1 < historial.length) {
        const prev = i > 0 ? historial[i - 1] : { board: ['', '', '', '', ''], board2: ['', '', '', '', ''] };
        const snap1 = historial[i];
        const snap2 = historial[i + 1];

        // Verificar que snap1 tiene Board 1 con 3 cartas y Board 2 vacío
        // Y que snap2 tiene Board 1 con 3 cartas y Board 2 con 3 cartas
        const prevBoard1Count = prev.board?.slice(0, 3).filter(c => c).length || 0;
        const prevBoard2Count = prev.board2?.slice(0, 3).filter(c => c).length || 0;
        const snap1Board1Count = snap1.board?.slice(0, 3).filter(c => c).length || 0;
        const snap1Board2Count = snap1.board2?.slice(0, 3).filter(c => c).length || 0;
        const snap2Board1Count = snap2.board?.slice(0, 3).filter(c => c).length || 0;
        const snap2Board2Count = snap2.board2?.slice(0, 3).filter(c => c).length || 0;

        // Patrón esperado: prev (0,0) -> snap1 (3,0) -> snap2 (3,3)
        if (prevBoard1Count === 0 && prevBoard2Count === 0 &&
            snap1Board1Count === 3 && snap1Board2Count === 0 &&
            snap2Board1Count === 3 && snap2Board2Count === 3) {

          // Consolidar los 2 snapshots en uno solo
          const consolidatedSnapshot = deepCopy(snap2); // El último snapshot tiene ambos boards completos
          const flopCards1 = snap2.board.slice(0, 3);
          const flopCards2 = snap2.board2.slice(0, 3);
          consolidatedSnapshot.description = `Se asignan las cartas del flop:\nBoard 1: ${flopCards1.join(', ')}\nBoard 2: ${flopCards2.join(', ')}`;
          consolidated.push(consolidatedSnapshot);
          i += 2; // Saltar los 2 snapshots
          continue;
        }
      }

      // Detectar secuencia de flop normal (single board) - solo para cartas individuales
      if (i + 2 < historial.length) {
        const prev = i > 0 ? historial[i - 1] : { board: ['', '', '', '', ''] };
        const snap1 = historial[i];
        const snap2 = historial[i + 1];
        const snap3 = historial[i + 2];

        const prevFlopCount = prev.board?.slice(0, 3).filter(c => c).length || 0;
        const snap1FlopCount = snap1.board?.slice(0, 3).filter(c => c).length || 0;
        const snap2FlopCount = snap2.board?.slice(0, 3).filter(c => c).length || 0;
        const snap3FlopCount = snap3.board?.slice(0, 3).filter(c => c).length || 0;

        // Verificar que estamos pasando de 0 cartas a 1, luego a 2, luego a 3
        // Y que solo cambia el board (cartas del flop), no las cartas de jugadores
        if (prevFlopCount === 0 &&
            snap1FlopCount === 1 &&
            snap2FlopCount === 2 &&
            snap3FlopCount === 3 &&
            arePlayersCardsUnchanged(prev, snap1, snap2, snap3)) {

          // Consolidar los 3 snapshots en uno solo
          const consolidatedSnapshot = deepCopy(snap3);
          const flopCards = snap3.board.slice(0, 3);
          consolidatedSnapshot.description = `Se asignan las cartas del flop: ${flopCards.join(', ')}.`;
          consolidated.push(consolidatedSnapshot);
          i += 3; // Saltar los 3 snapshots
          continue;
        }
      }

      // Si no es una secuencia de flop, añadir el snapshot tal cual
      consolidated.push(current);
      i++;
    }

    return consolidated;
  }

  // Función auxiliar para verificar que las cartas de los jugadores no cambiaron
  function arePlayersCardsUnchanged(snap1, snap2, snap3, snap4) {
    const getPlayerCards = (snapshot) => {
      if (!snapshot || !snapshot.players) return '';
      return snapshot.players.map(p => p.cards.join('')).join('|');
    };

    const cards1 = getPlayerCards(snap1);
    const cards2 = getPlayerCards(snap2);
    const cards3 = getPlayerCards(snap3);
    const cards4 = getPlayerCards(snap4);

    return cards1 === cards2 && cards2 === cards3 && cards3 === cards4;
  }
  
  // --- RESTO DE FUNCIONES (sin cambios en su mayoría) ---

  function toggleDisplayMode() { displayInBBs.value = !displayInBBs.value; }
  
  function setReplaySpeed(newSpeed) {
    replaySpeed.value = parseInt(newSpeed, 10) || 2000;
    if (isReplaying.value) {
      pauseReplay();
      playReplay();
    }
  }

  function playReplay() {
    if (isReplaying.value) return;
    isReplaying.value = true;
    
    const intervalDuration = replaySpeed.value;

    replayIntervalId = setInterval(() => {
      if (currentActionIndex.value >= history.value.length - 1) {
        pauseReplay();
      } else {
        navigateHistory(1);
      }
    }, intervalDuration);
  }
  function pauseReplay() {
    clearInterval(replayIntervalId);
    isReplaying.value = false;
  }
  function restartReplay() {
    pauseReplay();
    currentActionIndex.value = 0;
    const stateToRestore = history.value[0];
    players.value = deepCopy(stateToRestore.players);
    board.value = deepCopy(stateToRestore.board);
    board2.value = deepCopy(stateToRestore.board2 || ['', '', '', '', '']); // Restaurar segundo board
    pots.value = deepCopy(stateToRestore.pots);
    // Restaurar estado del juego (con backward compatibility)
    if (stateToRestore.gamePhase !== undefined) {
      // NO restaurar gamePhase si estamos en modo replay
      if (gamePhase.value !== 'replay') {
        gamePhase.value = stateToRestore.gamePhase;
      }
      dealerPosition.value = stateToRestore.dealerPosition;
      activePlayerIndex.value = stateToRestore.activePlayerIndex;
      currentBet.value = stateToRestore.currentBet;
      minRaise.value = stateToRestore.minRaise;
      lastRaiserIndex.value = stateToRestore.lastRaiserIndex;
      lastRaiseAmount.value = stateToRestore.lastRaiseAmount;
    }
  }
  function toggleReplay() {
    if (isReplaying.value) {
      pauseReplay();
    } else {
      playReplay();
    }
  }
  function setupNewHand(numPlayers, newHeroPosition, newCurrency, newSb, newBb, newSpecialRule, newBombPotBB = null, newBombPotType = 'single', newGameVariant = 'holdem') {
    // ... (El resto de la lógica de setupNewHand, performAction, etc., es interna y no cambia)
    // ... (ya que solo manipula el estado de la mano actual, no la lista de manos guardadas)
    pauseReplay();
    players.value = [];
    heroPosition.value = newHeroPosition;
    currency.value = newCurrency;
    smallBlind.value = newSb;
    bigBlind.value = newBb;
    specialRule.value = newSpecialRule;
    bombPotBB.value = newBombPotBB || 2;
    bombPotType.value = newBombPotType || 'single';
    gameVariant.value = newGameVariant || 'holdem';
    board.value = ['', '', '', '', ''];
    board2.value = ['', '', '', '', '']; // Resetear segundo board
    pots.value = [{ amount: 0, eligiblePlayers: [] }];
    history.value = [];
    currentActionIndex.value = -1;
    gamePhase.value = 'preflop';
    lastRaiseAmount.value = 0;
    displayInBBs.value = false;
    isPreActionPhase.value = true;
    const positions = getPositions(numPlayers);

    for (let i = 0; i < numPlayers; i++) {
      const isHero = positions[i] === newHeroPosition;

      players.value.push({
        id: i,
        name: isHero ? 'Hero' : `Jugador ${i + 1}`,
        stack: newBb * 100,
        cards: getEmptyCardSlots(),
        position: positions[i],
        inHand: true,
        isAllIn: false,
        hasActedThisRound: false,
        betThisRound: 0,
        totalBetInHand: 0,
        isDealer: false,
        isSB: false,
        isBB: false,
        isStraddle: false,
        isMississippi: false,
        isBombPot: false,
        notes: '',
        tag: null,
        x: null,
        y: null,
        lastAction: null,
      });
    }
    dealerPosition.value = players.value.find((p,i) => i === 0).id
    players.value[0].isDealer = true;
    let sbIndex, bbIndex;
    if (numPlayers === 2) {
      sbIndex = 0;
      bbIndex = 1;
      activePlayerIndex.value = players.value[sbIndex].id;
      lastRaiserIndex.value = players.value[bbIndex].id;
    } else {
      sbIndex = 1;
      bbIndex = 2;
      activePlayerIndex.value = players.value[(bbIndex + 1) % numPlayers].id;
      lastRaiserIndex.value = players.value[bbIndex].id;
    }

    if (specialRule.value === 'Bomb Pot') {
      const bombAmount = bigBlind.value * bombPotBB.value;
      players.value.forEach(player => {
        player.stack -= bombAmount;
        player.isBombPot = true;
        player.totalBetInHand += bombAmount;
      });
      // Las apuestas van directamente al bote
      pots.value[0].amount = bombAmount * numPlayers;
      pots.value[0].eligiblePlayers = players.value.map(p => p.id);

      // Configurar para empezar en flop - la acción comienza por la SB
      currentBet.value = 0;
      minRaise.value = bigBlind.value;
      lastRaiseAmount.value = 0;
      // En Bomb Pot, la acción post-flop comienza en la SB (como en una partida real)
      activePlayerIndex.value = players.value[sbIndex].id;
      lastRaiserIndex.value = activePlayerIndex.value;

      // Si es Crazy Pineapple Bomb Pot, esperar al flop y permitir descarte
      if (gameVariant.value === 'pineapple') {
        gamePhase.value = 'waitingForFlop';
        const bombTypeText = bombPotType.value === 'double' ? 'Double Board Bomb Pot' : 'Bomb Pot';
        recordState(`${bombTypeText}: Todos los jugadores ponen ${bombPotBB.value} BB. Total del bote: ${bombAmount * numPlayers}. Se va directo al flop. Asigna las cartas del flop.`);
      } else {
        gamePhase.value = 'flop'; // Iniciar directamente en flop
        const bombTypeText = bombPotType.value === 'double' ? 'Double Board Bomb Pot' : 'Bomb Pot';
        recordState(`${bombTypeText}: Todos los jugadores ponen ${bombPotBB.value} BB. Total del bote: ${bombAmount * numPlayers}. Se va directo al flop.`);
      }
    } else {
      players.value[sbIndex].isSB = true;
      postBet(players.value[sbIndex].id, smallBlind.value, true);
      players.value[bbIndex].isBB = true;
      postBet(players.value[bbIndex].id, bigBlind.value, true);
      currentBet.value = bigBlind.value;
      minRaise.value = bigBlind.value * 2;
      lastRaiseAmount.value = bigBlind.value;
      recordState("Inicio de mano. Ciegas puestas.");

      if (specialRule.value === 'Straddle' && numPlayers > 2) {
        const straddleIndex = (bbIndex + 1) % numPlayers;
        players.value[straddleIndex].isStraddle = true;
        postBet(players.value[straddleIndex].id, bigBlind.value * 2, true);
        currentBet.value = bigBlind.value * 2;
        minRaise.value = bigBlind.value * 4;
        lastRaiseAmount.value = bigBlind.value * 2;
        lastRaiserIndex.value = players.value[straddleIndex].id;
        recordState(`Straddle puesto por ${players.value[straddleIndex].name}.`);
        activePlayerIndex.value = players.value[(straddleIndex + 1) % numPlayers].id;
      }

      if (specialRule.value === 'Mississippi') {
        const buttonIndex = players.value.findIndex(p => p.isDealer);
        players.value[buttonIndex].isMississippi = true;
        postBet(players.value[buttonIndex].id, bigBlind.value * 2, true);
        currentBet.value = Math.max(currentBet.value, bigBlind.value * 2);
        minRaise.value = bigBlind.value * 4;
        lastRaiseAmount.value = bigBlind.value * 2;
        lastRaiserIndex.value = players.value[buttonIndex].id;
        recordState(`Mississippi puesto por ${players.value[buttonIndex].name}.`);
        // En Mississippi, la acción preflop empieza en la SB (no en UTG como sería con straddle normal)
        activePlayerIndex.value = players.value[sbIndex].id;
      }
    }
  }
  function performAction(action, amount = 0) {
    if (isPreActionPhase.value) {
      isPreActionPhase.value = false;
    }

    if (activePlayer.value === null) return;
    const player = activePlayer.value;
    player.hasActedThisRound = true;
    let actionDescription = '';
    switch (action) {
      case 'fold':
        player.inHand = false;
        player.lastAction = null;
        actionDescription = `${player.name} se retira.`;
        break;
      case 'check':
        if (currentBet.value > player.betThisRound) return;
        player.lastAction = 'check';
        actionDescription = `${player.name} pasa.`;
        break;
      case 'call':
        const callAmount = currentBet.value - player.betThisRound;
        postBet(player.id, callAmount);
        player.lastAction = 'call';
        actionDescription = `${player.name} iguala.`;
        break;
      case 'all-in':
        const allInAmount = player.stack;
        const newTotalBet = player.betThisRound + allInAmount;
        postBet(player.id, allInAmount);
        player.lastAction = 'all-in';
        actionDescription = `${player.name} va All-In por ${newTotalBet}.`;
        if (newTotalBet > currentBet.value) {
            players.value.forEach(p => { if(p.inHand && !p.isAllIn) p.hasActedThisRound = false; });
            const raiseDifference = newTotalBet - currentBet.value;
            lastRaiserIndex.value = player.id;
            minRaise.value = newTotalBet + raiseDifference;
            lastRaiseAmount.value = currentBet.value;
            currentBet.value = newTotalBet;
        }
        break;
      case 'bet':
      case 'raise':
        if (amount < minRaise.value && amount < player.stack + player.betThisRound) return;
        players.value.forEach(p => { if(p.inHand) p.hasActedThisRound = false; });
        const totalBet = amount;
        const raiseDifference = totalBet - currentBet.value;
        postBet(player.id, totalBet - player.betThisRound);
        lastRaiserIndex.value = player.id;
        minRaise.value = totalBet + raiseDifference;
        lastRaiseAmount.value = currentBet.value;
        currentBet.value = totalBet;
        player.lastAction = action === 'bet' ? 'bet' : 'raise';
        actionDescription = `${player.name} ${action === 'bet' ? 'apuesta' : 'sube a'} ${totalBet}.`;
        break;
    }
    player.hasActedThisRound = true;
    recordState(actionDescription);
    checkHandOrRoundCompletion();
  }

  function performDiscard(playerId, cardIndex) {
    const player = players.value.find(p => p.id === playerId);
    if (!player || !player.inHand) return;

    // Remove card from player's hand
    const discardedCard = player.cards[cardIndex];
    player.cards.splice(cardIndex, 1);

    // Mark player as having discarded
    playersWhoDiscarded.value.add(playerId);

    // Record state
    recordState(`${player.name} descarta una carta.`);

    // Check if all active players have discarded
    const playersInHand = players.value.filter(p => p.inHand);
    const allDiscarded = playersInHand.every(p => playersWhoDiscarded.value.has(p.id));

    if (allDiscarded) {
      // Reset discard tracking
      playersWhoDiscarded.value.clear();

      // Transition to normal flop betting
      gamePhase.value = 'flop';
      recordState("--- Todos los jugadores han descartado. Comienza la apuesta del flop. ---");
    }
  }

  function autoDiscardNonHeroPlayers() {
    const playersInHand = players.value.filter(p => p.inHand);

    playersInHand.forEach(player => {
      // Skip Hero - they must discard manually
      if (player.name === 'Hero') return;

      // Randomly discard one of the 3 cards
      const randomIndex = Math.floor(Math.random() * player.cards.length);
      player.cards.splice(randomIndex, 1);

      // Mark player as having discarded
      playersWhoDiscarded.value.add(player.id);

      // Record state
      recordState(`${player.name} descarta una carta.`);
    });

    // Check if Hero is still in hand - if not, we can proceed immediately
    const heroInHand = playersInHand.find(p => p.name === 'Hero');
    if (!heroInHand) {
      // No Hero in hand, all players have discarded automatically
      playersWhoDiscarded.value.clear();
      gamePhase.value = 'flop';
      recordState("--- Todos los jugadores han descartado. Comienza la apuesta del flop. ---");
    }
  }

  function checkHandOrRoundCompletion() {
    const playersInHand = players.value.filter(p => p.inHand);
    if (playersInHand.length === 1) {
      advanceRound();
      endHand(playersInHand[0]);
      return;
    }
    const playersAbleToAct = playersInHand.filter(p => !p.isAllIn);
    const roundIsOver = playersAbleToAct.every(p => {
      return p.hasActedThisRound && p.betThisRound === currentBet.value;
    });
    if (roundIsOver) {
      const isPreflopBbCheck = gamePhase.value === 'preflop' &&
        activePlayer.value.isBB &&
        currentBet.value === bigBlind.value;
      if (isPreflopBbCheck || playersAbleToAct.length < 2) {
        advanceRound();
      } else {
        advanceRound();
      }
    } else {
      advanceTurn();
    }
  }

  function runItOut() {
    advanceRound();
    if(gamePhase.value === 'showdown') return;
    recordState("--- Apuestas finalizadas, se reparten las cartas restantes ---");
    if (gamePhase.value === 'preflop') {
        gamePhase.value = 'flop';
        recordState("--- FLOP ---");
    }
    if (gamePhase.value === 'flop') {
        gamePhase.value = 'turn';
        recordState("--- TURN ---");
    }
    if (gamePhase.value === 'turn') {
        gamePhase.value = 'river';
        recordState("--- RIVER ---");
    }
    endHand();
  }
  function postBet(playerId, amount, isBlind = false) {
    const player = players.value.find(p => p.id === playerId);
    const bet = Math.min(amount, player.stack);
    player.stack -= bet;
    player.betThisRound += bet;

    if (player.stack === 0 && !isBlind) {
      player.isAllIn = true;
    }
  }
  function advanceTurn() {
    const currentIndex = players.value.findIndex(p => p.id === activePlayerIndex.value);
    let nextIndex = (currentIndex + 1) % players.value.length;
    while (!players.value[nextIndex].inHand || players.value[nextIndex].isAllIn) {
      nextIndex = (nextIndex + 1) % players.value.length;
    }
    activePlayerIndex.value = players.value[nextIndex].id;
  }
  function collectBetsAndCreatePots() {
      const playersInHand = players.value.filter(p => p.betThisRound > 0 || p.inHand);
      if (playersInHand.length === 0) return;
      playersInHand.forEach(p => p.totalBetInHand += p.betThisRound);
      while (true) {
          const playersWithMoney = playersInHand.filter(p => p.betThisRound > 0);
          if (playersWithMoney.length === 0) break;
          const allInPlayer = playersWithMoney.find(p => p.isAllIn);
          let currentPotContribution;
          if (allInPlayer) {
              const lowestAllInBet = Math.min(...playersWithMoney.filter(p => p.isAllIn).map(p => p.totalBetInHand));
              const lastTotalBetInPot = pots.value.reduce((sum, pot) => sum + (pot.betAmountPerPlayer || 0), 0);
              currentPotContribution = lowestAllInBet - lastTotalBetInPot;
          } else {
              currentPotContribution = Math.min(...playersWithMoney.map(p => p.betThisRound));
          }
          if (currentPotContribution <= 0) break;
          const newPot = { amount: 0, eligiblePlayers: [] };
          playersInHand.forEach(p => {
              if(p.totalBetInHand > 0) {
                  const contribution = Math.min(p.betThisRound, currentPotContribution);
                  p.betThisRound -= contribution;
                  newPot.amount += contribution;
                  if (!newPot.eligiblePlayers.includes(p.id)) {
                      newPot.eligiblePlayers.push(p.id);
                  }
              }
          });
          pots.value.push(newPot);
      }
      players.value.forEach(p => p.betThisRound = 0);
  }

  function advanceRound() {
    const betsOnTable = players.value.reduce((sum, p) => sum + p.betThisRound, 0);
    if(betsOnTable > 0) {
      if(pots.value.length === 1 && pots.value[0].amount === 0){
          pots.value[0].amount += betsOnTable;
          pots.value[0].eligiblePlayers = players.value.filter(p => p.inHand).map(p => p.id);
      } else {
         collectBetsAndCreatePots();
      }
    }
    players.value.forEach(p => {
        p.betThisRound = 0;
        p.hasActedThisRound = false;
        p.lastAction = null;
    });
    currentBet.value = 0;
    minRaise.value = bigBlind.value;
    lastRaiseAmount.value = 0;
    if (gamePhase.value === 'river') {
        endHand();
        return;
    }
    const playersAbleToAct = players.value.filter(p => p.inHand && !p.isAllIn);
    if (playersAbleToAct.length < 2) {
      runItOut();
      return;
    }

    let nextIndex;
    const dealerIndexInPlayersArray = players.value.findIndex(p => p.id === dealerPosition.value);

    // Postflop SIEMPRE empieza en la SB (dealerIndex + 1)
    // Esto aplica para manos normales, Straddle, Mississippi, etc.
    if (players.value.length === 2) {
      // Heads-up: BB es dealer+1, acción empieza allí
      nextIndex = (dealerIndexInPlayersArray + 1) % players.value.length;
    } else {
      // Multi-way: SB es dealer+1, acción empieza allí
      nextIndex = (dealerIndexInPlayersArray + 1) % players.value.length;
    }

    // Saltar jugadores que se retiraron o están all-in
    while (!players.value[nextIndex].inHand || players.value[nextIndex].isAllIn) {
      nextIndex = (nextIndex + 1) % players.value.length;
    }
    activePlayerIndex.value = players.value[nextIndex].id;
    lastRaiserIndex.value = activePlayerIndex.value;

    switch (gamePhase.value) {
      case 'preflop':
        // For Crazy Pineapple, wait for flop assignment before entering discard phase
        if (gameVariant.value === 'pineapple') {
          gamePhase.value = 'waitingForFlop';
          recordState("--- FLOP --- Asigna las cartas del flop.");
        } else {
          gamePhase.value = 'flop';
          recordState("--- FLOP ---");
        }
        break;
      case 'waitingForFlop':
        // After flop is assigned, enter discard phase
        gamePhase.value = 'discard';
        playersWhoDiscarded.value.clear();
        recordState("--- Los jugadores deben descartar una carta antes de apostar. ---");

        // Auto-discard for non-hero players
        autoDiscardNonHeroPlayers();
        break;
      case 'flop': gamePhase.value = 'turn'; recordState("--- TURN ---"); break;
      case 'turn': gamePhase.value = 'river'; recordState("--- RIVER ---"); break;
    }
  }

  function endHand(winnerByFold = null) {
    gamePhase.value = 'showdown';
    activePlayerIndex.value = null;
    if(winnerByFold) {
      const winner = players.value.find(p => p.id === winnerByFold.id);
      winner.stack += totalPot.value;
      recordState(`La mano termina. ${winner.name} gana el bote de ${totalPot.value}.`);
      return;
    }
    recordState("--- SHOWDOWN --- Se muestran las cartas.");
    const playersToShowdown = players.value.filter(p => p.inHand);

    // Si es Double Board Bomb Pot, dividir cada bote 50/50 entre ambos boards
    if (bombPotType.value === 'double' && specialRule.value === 'Bomb Pot') {
      pots.value.forEach((pot, index) => {
        if(pot.amount === 0) return;
        const eligiblePlayers = playersToShowdown.filter(p => pot.eligiblePlayers.includes(p.id));

        // Dividir el bote 50/50 entre los dos boards
        const halfPot = Math.floor(pot.amount / 2);

        // Evaluar Board 1
        eligiblePlayers.forEach(p => { p.handResult1 = evaluateHand(p.cards, board.value); });
        eligiblePlayers.sort((a, b) => b.handResult1.rank - a.handResult1.rank);
        const bestRank1 = eligiblePlayers[0].handResult1.rank;
        const winners1 = eligiblePlayers.filter(p => p.handResult1.rank === bestRank1);
        const potSplit1 = Math.floor(halfPot / winners1.length);
        winners1.forEach(winner => { winner.stack += potSplit1; });
        const winnerNames1 = winners1.map(w => w.name).join(', ');
        recordState(`Board 1 - ${winnerNames1} gana${winners1.length > 1 ? 'n' : ''} ${halfPot} con ${winners1[0].handResult1.description}.`);

        // Evaluar Board 2
        eligiblePlayers.forEach(p => { p.handResult2 = evaluateHand(p.cards, board2.value); });
        eligiblePlayers.sort((a, b) => b.handResult2.rank - a.handResult2.rank);
        const bestRank2 = eligiblePlayers[0].handResult2.rank;
        const winners2 = eligiblePlayers.filter(p => p.handResult2.rank === bestRank2);
        const potSplit2 = Math.floor(halfPot / winners2.length);
        winners2.forEach(winner => { winner.stack += potSplit2; });
        const winnerNames2 = winners2.map(w => w.name).join(', ');
        recordState(`Board 2 - ${winnerNames2} gana${winners2.length > 1 ? 'n' : ''} ${halfPot} con ${winners2[0].handResult2.description}.`);
      });
    } else {
      // Lógica normal para manos sin double board
      pots.value.forEach((pot, index) => {
          if(pot.amount === 0) return;
          const eligiblePlayers = playersToShowdown.filter(p => pot.eligiblePlayers.includes(p.id));
          if(eligiblePlayers.length === 1) {
              const winner = eligiblePlayers[0];
              winner.stack += pot.amount;
              recordState(`${winner.name} gana el bote ${index+1} de ${pot.amount}.`);
          } else if (eligiblePlayers.length > 1) {
              eligiblePlayers.forEach(p => { p.handResult = evaluateHand(p.cards, board.value); });
              eligiblePlayers.sort((a, b) => b.handResult.rank - a.handResult.rank);
              const bestRank = eligiblePlayers[0].handResult.rank;
              const winners = eligiblePlayers.filter(p => p.handResult.rank === bestRank);
              const potSplit = Math.floor(pot.amount / winners.length);
              winners.forEach(winner => { winner.stack += potSplit; });
              const winnerNames = winners.map(w => w.name).join(', ');
              recordState(`${winnerNames} gana${winners.length > 1 ? 'n' : ''} el bote ${index+1} de ${pot.amount} con ${winners[0].handResult.description}.`);
          }
      });
    }
  }
  function resetHand() {
    pauseReplay();
    players.value = [];
    board.value = ['', '', '', '', ''];
    board2.value = ['', '', '', '', '']; // Resetear segundo board
    pots.value = [];
    history.value = [];
    currentActionIndex.value = -1;
    gamePhase.value = 'setup';
    isPreActionPhase.value = false;
    dealerPosition.value = 0;
    activePlayerIndex.value = null;
    currentBet.value = 0;
    minRaise.value = 0;
    lastRaiserIndex.value = null;
    lastRaiseAmount.value = 0;
  }
  function recordState(actionDescription) {
    const currentState = {
      players: deepCopy(players.value),
      board: deepCopy(board.value),
      board2: deepCopy(board2.value), // Incluir segundo board en snapshots
      pots: deepCopy(pots.value),
      description: actionDescription,
      // Estado del juego
      gamePhase: gamePhase.value,
      dealerPosition: dealerPosition.value,
      activePlayerIndex: activePlayerIndex.value,
      currentBet: currentBet.value,
      minRaise: minRaise.value,
      lastRaiserIndex: lastRaiserIndex.value,
      lastRaiseAmount: lastRaiseAmount.value,
    };
    if(currentActionIndex.value < history.value.length - 1) {
      history.value.splice(currentActionIndex.value + 1);
    }
    history.value.push(currentState);
    currentActionIndex.value++;
  }
  function navigateHistory(direction) {
    const newIndex = currentActionIndex.value + direction;
    if (newIndex >= 0 && newIndex < history.value.length) {
      currentActionIndex.value = newIndex;
      const stateToRestore = history.value[newIndex];
      players.value = deepCopy(stateToRestore.players);
      board.value = deepCopy(stateToRestore.board);
      board2.value = deepCopy(stateToRestore.board2 || ['', '', '', '', '']); // Restaurar segundo board
      pots.value = deepCopy(stateToRestore.pots);
      // Restaurar estado del juego (con backward compatibility)
      if (stateToRestore.gamePhase !== undefined) {
        // NO restaurar gamePhase si estamos en modo replay
        if (gamePhase.value !== 'replay') {
          gamePhase.value = stateToRestore.gamePhase;
        }
        dealerPosition.value = stateToRestore.dealerPosition;
        activePlayerIndex.value = stateToRestore.activePlayerIndex;
        currentBet.value = stateToRestore.currentBet;
        minRaise.value = stateToRestore.minRaise;
        lastRaiserIndex.value = stateToRestore.lastRaiserIndex;
        lastRaiseAmount.value = stateToRestore.lastRaiseAmount;
      }
    }
  }
  function openCardPicker(target) {
    cardPickerTarget.value = target;
    isCardPickerOpen.value = true;

    // Detectar si estamos abriendo para las cartas de un jugador
    if (target.type === 'player') {
      const player = players.value.find(p => p.id === target.id);
      if (player) {
        const emptyCardsCount = player.cards.filter(c => !c).length;
        const totalCardsCount = player.cards.length;

        // Activar modo multi-select solo si todas las cartas están vacías
        if (emptyCardsCount === totalCardsCount) {
          isPlayerCardsMultiSelect.value = true;
          playerCardsSelectIndex.value = 0;
        }
      }
    }
    // Detectar si estamos abriendo para el flop completo (posiciones 0, 1, 2)
    else if (target.type === 'board' && target.id >= 0 && target.id <= 2) {
      // Determinar qué board estamos usando basándonos en boardNumber
      const targetBoard = target.boardNumber === 2 ? board2 : board;
      const flopCards = [targetBoard.value[0], targetBoard.value[1], targetBoard.value[2]];
      const emptyFlopCount = flopCards.filter(c => !c).length;

      // Activar modo multi-select solo si todas las cartas del flop están vacías
      if (emptyFlopCount === 3) {
        isFlopMultiSelect.value = true;
        flopSelectIndex.value = 0;
      }
    }
  }
  function closeCardPicker() {
    isCardPickerOpen.value = false;
    cardPickerTarget.value = null;
    isFlopMultiSelect.value = false;
    flopSelectIndex.value = 0;
    isPlayerCardsMultiSelect.value = false;
    playerCardsSelectIndex.value = 0;
  }
  function assignCard(cardId) {
    if (!cardPickerTarget.value) return;
    const { type, id, cardIndex, boardNumber } = cardPickerTarget.value;

    if (type === 'player') {
      const player = players.value.find(p => p.id === id);
      if (!player) return;

      if (isPlayerCardsMultiSelect.value) {
        // Modo selección múltiple de cartas de jugador (2 o 4 cartas)
        player.cards[playerCardsSelectIndex.value] = cardId;
        // No registrar estado hasta que se completen todas las cartas

        playerCardsSelectIndex.value++;

        // Si completamos todas las cartas, cerrar el picker y registrar estado
        if (playerCardsSelectIndex.value >= player.cards.length) {
          closeCardPicker();
          // Registrar un solo estado con todas las cartas
          const cardsText = player.cards.filter(c => c).join(', ');
          recordState(`${player.name} recibe las cartas: ${cardsText}.`);
        }
      } else {
        // Modo normal: asignar a la posición específica
        player.cards[cardIndex] = cardId;
        closeCardPicker();
        recordState(`Se asigna la carta ${cardId}.`);
      }
    } else if (type === 'board') {
      const targetBoard = boardNumber === 2 ? board2 : board;
      const boardLabel = boardNumber === 2 ? 'Board 2' : 'Board 1';

      if (isFlopMultiSelect.value) {
        // Modo selección múltiple de flop
        targetBoard.value[flopSelectIndex.value] = cardId;
        // No registrar estado hasta que se completen las 3 cartas

        flopSelectIndex.value++;

        // Si completamos las 3 cartas del flop, cerrar el picker y registrar estado
        if (flopSelectIndex.value >= 3) {
          closeCardPicker();
          // Registrar un solo estado con las 3 cartas del flop
          const boardLabelText = bombPotType.value === 'double' ? ` (${boardLabel})` : '';
          recordState(`Se asignan las cartas del flop${boardLabelText}: ${targetBoard.value[0]}, ${targetBoard.value[1]}, ${targetBoard.value[2]}.`);

          // Si estamos en Crazy Pineapple y en la fase waitingForFlop, avanzar a discard
          if (gamePhase.value === 'waitingForFlop' && gameVariant.value === 'pineapple') {
            // En Double Board, solo avanzar cuando ambos boards tengan sus 3 cartas del flop
            if (bombPotType.value === 'double') {
              const board1HasFlop = board.value.slice(0, 3).every(c => c);
              const board2HasFlop = board2.value.slice(0, 3).every(c => c);

              // Solo avanzar a discard cuando ambos boards tengan el flop completo
              if (board1HasFlop && board2HasFlop) {
                advanceRound();
              }
            } else {
              // Single board: avanzar inmediatamente
              advanceRound();
            }
          }
        }
      } else {
        // Modo normal: asignar a la posición específica
        targetBoard.value[id] = cardId;
        closeCardPicker();
        const boardLabelText = bombPotType.value === 'double' ? ` en ${boardLabel}` : '';
        recordState(`Se asigna la carta ${cardId}${boardLabelText}.`);
      }
    }
  }
  function unassignCard(target) {
    const { type, id, cardIndex, boardNumber } = target;
    let cardToUnassign = '';
    if (type === 'player') {
      const player = players.value.find(p => p.id === id);
      if (player) {
        cardToUnassign = player.cards[cardIndex];
        player.cards[cardIndex] = '';
      }
    } else if (type === 'board') {
      const targetBoard = boardNumber === 2 ? board2 : board;
      const boardLabel = boardNumber === 2 ? 'Board 2' : 'Board 1';
      cardToUnassign = targetBoard.value[id];
      targetBoard.value[id] = '';

      if (cardToUnassign && bombPotType.value === 'double') {
        recordState(`Se desasigna la carta ${cardToUnassign} de ${boardLabel}.`);
        return;
      }
    }
    if (cardToUnassign) {
      recordState(`Se desasigna la carta ${cardToUnassign}.`);
    }
  }

  function getPositions(numPlayers) {
    if (numPlayers === 2) { return ['BTN / SB', 'BB']; }
    if (numPlayers === 3) { return ['BTN', 'SB', 'BB']; }
    if (numPlayers === 4) { return ['BTN', 'SB', 'BB', 'CO']; }
    if (numPlayers === 5) { return ['BTN', 'SB', 'BB', 'MP', 'CO']; }
    if (numPlayers === 6) { return ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO']; }
    if (numPlayers === 7) { return ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO']; }
    if (numPlayers === 8) { return ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO']; }
    if (numPlayers === 9) { return ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO']; }
    const basePositions = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP1', 'MP2', 'HJ', 'CO'];
    return basePositions.slice(0, numPlayers);
  }

  function updatePlayerName(playerId, newName) {
    if (!newName.trim()) return;
    const player = players.value.find(p => p.id === playerId);
    if (player) {
      player.name = newName;
    }
    if (isPreActionPhase.value && history.value.length > 0) {
      history.value[0].players = deepCopy(players.value);
    }
  }

  function updatePlayerStack(playerId, newStack) {
    const stack = parseInt(newStack, 10);
    if (isNaN(stack) || stack < 0) return;
    const player = players.value.find(p => p.id === playerId);
    if (player) {
      player.stack = stack;
    }
    if (isPreActionPhase.value && history.value.length > 0) {
      history.value[0].players = deepCopy(players.value);
    }
  }

  function updatePlayerNotes(playerId, newNotes) {
    const player = players.value.find(p => p.id === playerId);
    if (player) {
      player.notes = newNotes;
    }
    // Actualizar las notas en TODOS los snapshots del historial
    // para que persistan durante el replay
    if (history.value.length > 0) {
      history.value.forEach(snapshot => {
        const snapshotPlayer = snapshot.players.find(p => p.id === playerId);
        if (snapshotPlayer) {
          snapshotPlayer.notes = newNotes;
        }
      });
    }
  }

  function updatePlayerTag(playerId, newTag) {
    const player = players.value.find(p => p.id === playerId);
    if (player) {
      player.tag = player.tag === newTag ? null : newTag;
    }
    // Actualizar el tag en TODOS los snapshots del historial
    // para que persista durante el replay
    if (history.value.length > 0) {
      const finalTag = player.tag;
      history.value.forEach(snapshot => {
        const snapshotPlayer = snapshot.players.find(p => p.id === playerId);
        if (snapshotPlayer) {
          snapshotPlayer.tag = finalTag;
        }
      });
    }
  }

  function updatePlayerPosition(playerId, x, y) {
    const player = players.value.find(p => p.id === playerId);
    if (player) {
      player.x = x;
      player.y = y;
    }
    if (isPreActionPhase.value && history.value.length > 0) {
      history.value[0].players = deepCopy(players.value);
    }
  }

  function updateTableLayout(element, x, y) {
    if (tableLayout.value[element]) {
      tableLayout.value[element].x = x;
      tableLayout.value[element].y = y;
    }
  }

  function toggleNotesPanel(playerId) {
    if (openNotesPanelPlayerId.value === playerId) {
      openNotesPanelPlayerId.value = null;
    } else {
      openNotesPanelPlayerId.value = playerId;
    }
  }

  function closeNotesPanel() {
    openNotesPanelPlayerId.value = null;
  }

  return {
    players, heroPosition, smallBlind, bigBlind, currency, specialRule, bombPotBB, bombPotType, gameVariant, board, board2, savedHands, pots,
    gamePhase, activePlayerIndex, currentBet, lastRaiseAmount,
    activePlayer, totalPot, displayInBBs,
    isReplaying, isCardPickerOpen, usedCards,
    replaySpeed, isPreActionPhase, openNotesPanelPlayerId, tableLayout,
    isFlopMultiSelect, flopSelectIndex,
    isPlayerCardsMultiSelect, playerCardsSelectIndex,
    playersWhoDiscarded,
    toggleDisplayMode,
    playReplay, pauseReplay, restartReplay, setReplaySpeed, toggleReplay,
    setupNewHand, loadHand, saveCurrentHand, deleteHand, navigateHistory, recordState,
    performAction, performDiscard, resetHand,
    openCardPicker, closeCardPicker, assignCard, unassignCard,
    updatePlayerName, updatePlayerStack,
    updatePlayerNotes, updatePlayerTag, updatePlayerPosition, updateTableLayout, toggleNotesPanel, closeNotesPanel,
    fetchHands, loadMoreHands, hasMore, currentOffset, pageSize,
  }
});