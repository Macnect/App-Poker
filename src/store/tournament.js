import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

export const useTournamentStore = defineStore('tournament', () => {
  const players = ref([]);
  const heroPosition = ref(null);
  const smallBlind = ref(25);
  const bigBlind = ref(50);
  const currency = ref('$');

  // Campos específicos de torneos
  const buyIn = ref(100); // Precio del torneo
  const tournamentType = ref('Normal'); // Normal, Progressive KO, Total KO, Mystery KO
  const isITM = ref(false); // In The Money
  const remainingPlayers = ref(50); // Participantes restantes

  const gameVariant = ref('holdem'); // 'holdem', 'omaha', 'pineapple'
  const board = ref(['', '', '', '', '']);
  const pots = ref([]);
  const history = ref([]);
  const currentActionIndex = ref(-1);
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
    return cards;
  });

  // --- ACCIONES PARA MANOS DE TORNEO ---

  async function fetchHands(date = null, incremental = false) {
    // TODO: Implementar llamada API para torneos cuando se cree la tabla
    console.log('[DEBUG] tournamentStore.fetchHands: Starting with date:', date);
    // Placeholder: por ahora devuelve array vacío
    savedHands.value = [];
    hasMore.value = false;
  }

  async function loadMoreHands(date = null) {
    if (!hasMore.value) return;
    await fetchHands(date, true);
  }

  async function saveCurrentHand() {
    if (history.value.length === 0) return null;
    const handToSave = {
      fecha: new Date().toISOString(),
      posicion_heroe: heroPosition.value,
      cantidad_jugadores: players.value.length,
      historial: deepCopy(history.value),
      ciega_pequena: smallBlind.value,
      ciega_grande: bigBlind.value,
      moneda: currency.value,
      game_variant: gameVariant.value,
      // Campos específicos de torneos
      buy_in: buyIn.value,
      tournament_type: tournamentType.value,
      is_itm: isITM.value,
      remaining_players: remainingPlayers.value,
    };

    // TODO: Guardar en tabla de manos de torneo cuando se implemente
    console.log('[DEBUG] Mano de torneo a guardar:', handToSave);
    return handToSave;
  }

  async function deleteHand(handId) {
    // TODO: Implementar eliminación cuando se cree la API
    console.log('[DEBUG] Eliminar mano de torneo:', handId);
    savedHands.value = savedHands.value.filter(hand => hand.id !== handId);
  }

  function loadHand(handData) {
    pauseReplay();
    const initialState = handData.historial[0];
    players.value = deepCopy(initialState.players);
    board.value = deepCopy(initialState.board);
    pots.value = deepCopy(initialState.pots);
    heroPosition.value = handData.posicion_heroe;
    smallBlind.value = handData.ciega_pequena;
    bigBlind.value = handData.ciega_grande;
    currency.value = handData.moneda;
    gameVariant.value = handData.game_variant || 'holdem';

    // Cargar campos específicos de torneo
    buyIn.value = handData.buy_in || 100;
    tournamentType.value = handData.tournament_type || 'Normal';
    isITM.value = handData.is_itm || false;
    remainingPlayers.value = handData.remaining_players || 50;

    // Consolidar snapshots del flop
    const consolidatedHistory = consolidateFlopSnapshots(deepCopy(handData.historial));
    history.value = consolidatedHistory;

    currentActionIndex.value = 0;
    gamePhase.value = 'replay';
    isPreActionPhase.value = false;

    if (initialState.gamePhase !== undefined) {
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

      // Detectar secuencia de flop (3 cartas individuales)
      if (i + 2 < historial.length) {
        const prev = i > 0 ? historial[i - 1] : { board: ['', '', '', '', ''] };
        const snap1 = historial[i];
        const snap2 = historial[i + 1];
        const snap3 = historial[i + 2];

        const prevFlopCount = prev.board?.slice(0, 3).filter(c => c).length || 0;
        const snap1FlopCount = snap1.board?.slice(0, 3).filter(c => c).length || 0;
        const snap2FlopCount = snap2.board?.slice(0, 3).filter(c => c).length || 0;
        const snap3FlopCount = snap3.board?.slice(0, 3).filter(c => c).length || 0;

        if (prevFlopCount === 0 &&
            snap1FlopCount === 1 &&
            snap2FlopCount === 2 &&
            snap3FlopCount === 3 &&
            arePlayersCardsUnchanged(prev, snap1, snap2, snap3)) {

          const consolidatedSnapshot = deepCopy(snap3);
          const flopCards = snap3.board.slice(0, 3);
          consolidatedSnapshot.description = `Se asignan las cartas del flop: ${flopCards.join(', ')}.`;
          consolidated.push(consolidatedSnapshot);
          i += 3;
          continue;
        }
      }

      consolidated.push(current);
      i++;
    }

    return consolidated;
  }

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

    if (stateToRestore.gamePhase !== undefined) {
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

  function setupNewHand(numPlayers, newHeroPosition, newCurrency, newSb, newBb, newGameVariant = 'holdem', newBuyIn = 100, newTournamentType = 'Normal', newIsITM = false, newRemainingPlayers = 50) {
    pauseReplay();
    players.value = [];
    heroPosition.value = newHeroPosition;
    currency.value = newCurrency;
    smallBlind.value = newSb;
    bigBlind.value = newBb;
    gameVariant.value = newGameVariant || 'holdem';

    // Configurar campos de torneo
    buyIn.value = newBuyIn;
    tournamentType.value = newTournamentType;
    isITM.value = newIsITM;
    remainingPlayers.value = newRemainingPlayers;

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

    // Postear ciegas (en torneos no hay reglas especiales)
    players.value[sbIndex].isSB = true;
    postBet(players.value[sbIndex].id, smallBlind.value, true);
    players.value[bbIndex].isBB = true;
    postBet(players.value[bbIndex].id, bigBlind.value, true);
    currentBet.value = bigBlind.value;
    minRaise.value = bigBlind.value * 2;
    lastRaiseAmount.value = bigBlind.value;
    recordState("Inicio de mano. Ciegas puestas.");
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

    const discardedCard = player.cards[cardIndex];
    player.cards.splice(cardIndex, 1);
    playersWhoDiscarded.value.add(playerId);
    recordState(`${player.name} descarta una carta.`);

    const playersInHand = players.value.filter(p => p.inHand);
    const allDiscarded = playersInHand.every(p => playersWhoDiscarded.value.has(p.id));

    if (allDiscarded) {
      playersWhoDiscarded.value.clear();
      gamePhase.value = 'flop';
      recordState("--- Todos los jugadores han descartado. Comienza la apuesta del flop. ---");
    }
  }

  function autoDiscardNonHeroPlayers() {
    const playersInHand = players.value.filter(p => p.inHand);

    playersInHand.forEach(player => {
      if (player.name === 'Hero') return;

      const randomIndex = Math.floor(Math.random() * player.cards.length);
      player.cards.splice(randomIndex, 1);
      playersWhoDiscarded.value.add(player.id);
      recordState(`${player.name} descarta una carta.`);
    });

    const heroInHand = playersInHand.find(p => p.name === 'Hero');
    if (!heroInHand) {
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
      case 'preflop':
        if (gameVariant.value === 'pineapple') {
          gamePhase.value = 'waitingForFlop';
          recordState("--- FLOP --- Asigna las cartas del flop.");
        } else {
          gamePhase.value = 'flop';
          recordState("--- FLOP ---");
        }
        break;
      case 'waitingForFlop':
        gamePhase.value = 'discard';
        playersWhoDiscarded.value.clear();
        recordState("--- Los jugadores deben descartar una carta antes de apostar. ---");
        autoDiscardNonHeroPlayers();
        break;
      case 'flop':
        gamePhase.value = 'turn';
        recordState("--- TURN ---");
        break;
      case 'turn':
        gamePhase.value = 'river';
        recordState("--- RIVER ---");
        break;
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
      pots.value = deepCopy(stateToRestore.pots);

      if (stateToRestore.gamePhase !== undefined) {
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

    if (target.type === 'player') {
      const player = players.value.find(p => p.id === target.id);
      if (player) {
        const emptyCardsCount = player.cards.filter(c => !c).length;
        const totalCardsCount = player.cards.length;

        if (emptyCardsCount === totalCardsCount) {
          isPlayerCardsMultiSelect.value = true;
          playerCardsSelectIndex.value = 0;
        }
      }
    }
    else if (target.type === 'board' && target.id >= 0 && target.id <= 2) {
      const flopCards = [board.value[0], board.value[1], board.value[2]];
      const emptyFlopCount = flopCards.filter(c => !c).length;

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
    const { type, id, cardIndex } = cardPickerTarget.value;

    if (type === 'player') {
      const player = players.value.find(p => p.id === id);
      if (!player) return;

      if (isPlayerCardsMultiSelect.value) {
        player.cards[playerCardsSelectIndex.value] = cardId;
        playerCardsSelectIndex.value++;

        if (playerCardsSelectIndex.value >= player.cards.length) {
          closeCardPicker();
          const cardsText = player.cards.filter(c => c).join(', ');
          recordState(`${player.name} recibe las cartas: ${cardsText}.`);
        }
      } else {
        player.cards[cardIndex] = cardId;
        closeCardPicker();
        recordState(`Se asigna la carta ${cardId}.`);
      }
    } else if (type === 'board') {
      if (isFlopMultiSelect.value) {
        board.value[flopSelectIndex.value] = cardId;
        flopSelectIndex.value++;

        if (flopSelectIndex.value >= 3) {
          closeCardPicker();
          recordState(`Se asignan las cartas del flop: ${board.value[0]}, ${board.value[1]}, ${board.value[2]}.`);

          if (gamePhase.value === 'waitingForFlop' && gameVariant.value === 'pineapple') {
            advanceRound();
          }
        }
      } else {
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
    players, heroPosition, smallBlind, bigBlind, currency, gameVariant, board, savedHands, pots,
    // Campos específicos de torneo
    buyIn, tournamentType, isITM, remainingPlayers,
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
