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
  const board = ref(['', '', '', '', '']);
  const pots = ref([]);
  const history = ref([]);
  const currentActionIndex = ref(-1);
  // Reemplazamos localStorage con un ref vacío
  const savedHands = ref([]);
  const displayInBBs = ref(false);

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

  const isPreActionPhase = ref(true);
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
      if (p.cards[0]) cards.add(p.cards[0]);
      if (p.cards[1]) cards.add(p.cards[1]);
    });
    board.value.forEach(c => {
      if (c) cards.add(c);
    });
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
    if (history.value.length === 0) return;
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
    };
    try {
      const newHand = await apiAddHand(handToSave);
      savedHands.value.unshift(newHand); // Añadimos la mano devuelta a nuestro estado local
    } catch (error) {
      console.error("Error al guardar la mano:", error);
      // Opcional: mostrar un error al usuario
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
    pots.value = deepCopy(initialState.pots);
    heroPosition.value = handData.posicion_heroe;
    smallBlind.value = handData.ciega_pequena;
    bigBlind.value = handData.ciega_grande;
    currency.value = handData.moneda;
    specialRule.value = handData.regla_especial || 'Ninguno';
    bombPotBB.value = handData.bomb_pot_bb || 2;
    history.value = deepCopy(handData.historial);
    currentActionIndex.value = 0;
    gamePhase.value = 'replay';
    isPreActionPhase.value = false;
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
    pots.value = deepCopy(stateToRestore.pots);
  }
  function toggleReplay() {
    if (isReplaying.value) {
      pauseReplay();
    } else {
      playReplay();
    }
  }
  function setupNewHand(numPlayers, newHeroPosition, newCurrency, newSb, newBb, newSpecialRule, newBombPotBB = null) {
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
    board.value = ['', '', '', '', ''];
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
        cards: ['', ''],
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
        postBet(player.id, bombAmount, true);
        player.isBombPot = true;
      });
      currentBet.value = bombAmount;
      minRaise.value = bombAmount * 2;
      lastRaiseAmount.value = bombAmount;
      activePlayerIndex.value = players.value[(bbIndex + 1) % numPlayers].id;
      lastRaiserIndex.value = activePlayerIndex.value;
      recordState(`Bomb Pot: Todos los jugadores ponen ${bombPotBB.value} BB inicialmente.`);
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
        actionDescription = `${player.name} se retira.`;
        break;
      case 'check':
        if (currentBet.value > player.betThisRound) return;
        actionDescription = `${player.name} pasa.`;
        break;
      case 'call':
        const callAmount = currentBet.value - player.betThisRound;
        postBet(player.id, callAmount);
        actionDescription = `${player.name} iguala.`;
        break;
      case 'all-in':
        const allInAmount = player.stack;
        const newTotalBet = player.betThisRound + allInAmount;
        postBet(player.id, allInAmount);
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
        actionDescription = `${player.name} ${action === 'bet' ? 'apuesta' : 'sube a'} ${totalBet}.`;
        break;
    }
    player.hasActedThisRound = true;
    recordState(actionDescription);
    checkHandOrRoundCompletion();
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

    if (players.value.length === 2) {
      nextIndex = (dealerIndexInPlayersArray + 1) % players.value.length;
    } else {
      nextIndex = (dealerIndexInPlayersArray + 1) % players.value.length;
    }

    while (!players.value[nextIndex].inHand || players.value[nextIndex].isAllIn) {
      nextIndex = (nextIndex + 1) % players.value.length;
    }
    activePlayerIndex.value = players.value[nextIndex].id;
    lastRaiserIndex.value = activePlayerIndex.value;

    switch (gamePhase.value) {
      case 'preflop': gamePhase.value = 'flop'; recordState("--- FLOP ---"); break;
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
  function resetHand() {
    pauseReplay();
    players.value = [];
    board.value = ['', '', '', '', ''];
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
      pots: deepCopy(pots.value),
      description: actionDescription,
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
      pots.value = deepCopy(stateToRestore.pots);
    }
  }
  function openCardPicker(target) {
    cardPickerTarget.value = target;
    isCardPickerOpen.value = true;

    // Detectar si estamos abriendo para el flop completo (posiciones 0, 1, 2)
    if (target.type === 'board' && target.id >= 0 && target.id <= 2) {
      const flopCards = [board.value[0], board.value[1], board.value[2]];
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
  }
  function assignCard(cardId) {
    if (!cardPickerTarget.value) return;
    const { type, id, cardIndex } = cardPickerTarget.value;

    if (type === 'player') {
      const player = players.value.find(p => p.id === id);
      if (player) player.cards[cardIndex] = cardId;
      closeCardPicker();
      recordState(`Se asigna la carta ${cardId}.`);
    } else if (type === 'board') {
      if (isFlopMultiSelect.value) {
        // Modo selección múltiple de flop
        board.value[flopSelectIndex.value] = cardId;
        recordState(`Se asigna la carta ${cardId} al flop.`);

        flopSelectIndex.value++;

        // Si completamos las 3 cartas del flop, cerrar el picker
        if (flopSelectIndex.value >= 3) {
          closeCardPicker();
        }
      } else {
        // Modo normal: asignar a la posición específica
        board.value[id] = cardId;
        closeCardPicker();
        recordState(`Se asigna la carta ${cardId}.`);
      }
    }
  }
  function unassignCard(target) {
    const { type, id, cardIndex } = target;
    let cardToUnassign = '';
    if (type === 'player') {
      const player = players.value.find(p => p.id === id);
      if (player) {
        cardToUnassign = player.cards[cardIndex];
        player.cards[cardIndex] = '';
      }
    } else if (type === 'board') {
      cardToUnassign = board.value[id];
      board.value[id] = '';
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
    if (isPreActionPhase.value && history.value.length > 0) {
      history.value[0].players = deepCopy(players.value);
    }
  }

  function updatePlayerTag(playerId, newTag) {
    const player = players.value.find(p => p.id === playerId);
    if (player) {
      player.tag = player.tag === newTag ? null : newTag;
    }
    if (isPreActionPhase.value && history.value.length > 0) {
      history.value[0].players = deepCopy(players.value);
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
    players, heroPosition, smallBlind, bigBlind, currency, specialRule, bombPotBB, board, savedHands, pots,
    gamePhase, activePlayerIndex, currentBet, lastRaiseAmount,
    activePlayer, totalPot, displayInBBs,
    isReplaying, isCardPickerOpen, usedCards,
    replaySpeed, isPreActionPhase, openNotesPanelPlayerId, tableLayout,
    isFlopMultiSelect, flopSelectIndex,
    toggleDisplayMode,
    playReplay, pauseReplay, restartReplay, setReplaySpeed, toggleReplay,
    setupNewHand, loadHand, saveCurrentHand, deleteHand, navigateHistory, recordState,
    performAction, resetHand,
    openCardPicker, closeCardPicker, assignCard, unassignCard,
    updatePlayerName, updatePlayerStack,
    updatePlayerNotes, updatePlayerTag, updatePlayerPosition, updateTableLayout, toggleNotesPanel, closeNotesPanel,
    fetchHands, loadMoreHands, hasMore, currentOffset, pageSize,
  }
});