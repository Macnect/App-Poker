<template>
  <div class="trip-accounts-view">
    <div class="header">
      <h1 class="title">{{ $t('tripAccounts.title') || '¿Quién Paga?' }}</h1>
      <p class="subtitle">{{ $t('tripAccounts.subtitle') || 'Toca una tarjeta para editar el nombre' }}</p>
    </div>

    <div class="controls">
      <button
        class="btn-shuffle"
        @click="shuffleCards"
        :disabled="isShuffling || cards.length < 2"
      >
        <span v-if="!isShuffling">{{ $t('tripAccounts.shuffle') || 'Mover' }}</span>
        <span v-else>{{ $t('tripAccounts.shuffling') || 'Mezclando...' }}</span>
      </button>

      <div class="card-controls">
        <button
          class="btn-icon"
          @click="removeCard"
          :disabled="cards.length <= 2"
          :title="$t('tripAccounts.removeCard') || 'Quitar tarjeta'"
        >
          <span>-</span>
        </button>
        <span class="card-count">{{ cards.length }}</span>
        <button
          class="btn-icon"
          @click="addCard"
          :disabled="cards.length >= 10"
          :title="$t('tripAccounts.addCard') || 'Añadir tarjeta'"
        >
          <span>+</span>
        </button>
      </div>
    </div>

    <div class="cards-container" ref="cardsContainer">
      <div
        v-for="(card, index) in cards"
        :key="card.id"
        class="card-wrapper"
        :class="{
          'is-shuffling': isShuffling,
          'is-winner': winner && winner.id === card.id,
          'is-not-winner': winner && winner.id !== card.id
        }"
        :style="getCardStyle(index)"
      >
        <div class="credit-card" :style="{ background: card.gradient }">
          <div class="card-chip">
            <div class="chip-line"></div>
            <div class="chip-line"></div>
            <div class="chip-line"></div>
            <div class="chip-line"></div>
          </div>

          <div class="card-number">•••• •••• •••• ••••</div>

          <div class="card-details">
            <div class="card-holder">
              <div class="label">{{ $t('tripAccounts.cardHolder') || 'TITULAR' }}</div>
              <input
                v-if="editingCardId === card.id"
                v-model="editingName"
                @blur="saveCardName(card.id)"
                @keyup.enter="saveCardName(card.id)"
                class="name-input"
                :ref="el => { if (el) nameInputRef = el }"
                maxlength="20"
              />
              <div
                v-else
                class="name"
                @click="startEditName(card)"
              >
                {{ card.name }}
              </div>
            </div>

            <div class="card-expiry">
              <div class="label">{{ $t('tripAccounts.expires') || 'VENCE' }}</div>
              <div class="expiry">••/••</div>
            </div>
          </div>

          <div class="card-brand">POKER</div>
        </div>
      </div>
    </div>

    <transition name="winner-announcement">
      <div v-if="winner" class="winner-announcement">
        <div class="confetti">
          <div v-for="i in 50" :key="i" class="confetti-piece" :style="getConfettiStyle()"></div>
        </div>
        <div class="announcement-content">
          <div class="announcement-icon">🎉</div>
          <div class="announcement-text">
            <strong>{{ winner.name }}</strong>
            <span>{{ $t('tripAccounts.paysTheBill') || 'paga la cuenta!' }}</span>
          </div>
          <button class="btn-reset" @click="resetGame">
            {{ $t('tripAccounts.playAgain') || 'Jugar de nuevo' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const STORAGE_KEY = 'tripAccountsCards'

const cards = ref([])
const isShuffling = ref(false)
const winner = ref(null)
const editingCardId = ref(null)
const editingName = ref('')
const nameInputRef = ref(null)
const cardsContainer = ref(null)

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)'
]

const loadCards = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      cards.value = JSON.parse(stored)
    } catch (e) {
      initializeDefaultCards()
    }
  } else {
    initializeDefaultCards()
  }
}

const initializeDefaultCards = () => {
  cards.value = [
    { id: 1, name: `${t('tripAccounts.playerName')} 1`, gradient: gradients[0] },
    { id: 2, name: `${t('tripAccounts.playerName')} 2`, gradient: gradients[1] },
    { id: 3, name: `${t('tripAccounts.playerName')} 3`, gradient: gradients[2] },
    { id: 4, name: `${t('tripAccounts.playerName')} 4`, gradient: gradients[3] }
  ]
  saveCards()
}

const saveCards = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards.value))
}

const addCard = () => {
  if (cards.value.length >= 10) return

  const newId = Math.max(...cards.value.map(c => c.id), 0) + 1
  const gradientIndex = (cards.value.length) % gradients.length

  cards.value.push({
    id: newId,
    name: `${t('tripAccounts.playerName')} ${newId}`,
    gradient: gradients[gradientIndex]
  })

  saveCards()
}

const removeCard = () => {
  if (cards.value.length <= 2) return
  cards.value.pop()
  saveCards()
}

const startEditName = (card) => {
  if (isShuffling.value || winner.value) return

  editingCardId.value = card.id
  editingName.value = card.name

  nextTick(() => {
    if (nameInputRef.value) {
      nameInputRef.value.focus()
      nameInputRef.value.select()
    }
  })
}

const saveCardName = (cardId) => {
  const card = cards.value.find(c => c.id === cardId)
  if (card && editingName.value.trim()) {
    card.name = editingName.value.trim()
    saveCards()
  }
  editingCardId.value = null
  editingName.value = ''
}

const getCardStyle = (index) => {
  if (!isShuffling.value) {
    return {
      transform: 'none',
      transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }
  }

  const randomX = (Math.random() - 0.5) * 200
  const randomY = (Math.random() - 0.5) * 200
  const randomRotate = (Math.random() - 0.5) * 360

  return {
    transform: `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg)`,
    transition: 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  }
}

const shuffleCards = async () => {
  if (isShuffling.value || cards.value.length < 2) return

  winner.value = null
  isShuffling.value = true

  await new Promise(resolve => setTimeout(resolve, 100))

  await new Promise(resolve => setTimeout(resolve, 1500))

  isShuffling.value = false

  await new Promise(resolve => setTimeout(resolve, 300))

  const randomIndex = Math.floor(Math.random() * cards.value.length)
  winner.value = cards.value[randomIndex]
}

const resetGame = () => {
  winner.value = null
}

const getConfettiStyle = () => {
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b', '#fa709a', '#fee140']
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  const randomX = Math.random() * 100
  const randomDelay = Math.random() * 0.5
  const randomDuration = 1 + Math.random() * 2

  return {
    left: `${randomX}%`,
    backgroundColor: randomColor,
    animationDelay: `${randomDelay}s`,
    animationDuration: `${randomDuration}s`
  }
}

onMounted(() => {
  loadCards()
})
</script>

<style scoped>
.trip-accounts-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 20px 20px 90px;
  position: relative;
  overflow-x: hidden;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 10px rgba(102, 126, 234, 0.5);
}

.subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.controls {
  display: flex;
  gap: 15px;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.btn-shuffle {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 40px;
  border-radius: 25px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  min-width: 160px;
}

.btn-shuffle:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.btn-shuffle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.card-count {
  color: white;
  font-size: 18px;
  font-weight: 600;
  min-width: 30px;
  text-align: center;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  min-height: 400px;
}

.card-wrapper {
  perspective: 1000px;
  position: relative;
}

.card-wrapper.is-shuffling {
  z-index: 10;
}

.card-wrapper.is-winner {
  z-index: 100;
  animation: winnerPulse 1s ease-in-out infinite;
}

.card-wrapper.is-not-winner {
  opacity: 0.3;
  filter: blur(2px);
  transition: all 0.5s ease;
}

@keyframes winnerPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.credit-card {
  width: 100%;
  aspect-ratio: 1.586;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.credit-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.card-wrapper.is-winner .credit-card {
  box-shadow: 0 0 40px rgba(102, 126, 234, 0.8), 0 8px 32px rgba(0, 0, 0, 0.3);
}

.card-chip {
  width: 50px;
  height: 40px;
  background: linear-gradient(135deg, #d4af37 0%, #f9e79f 50%, #d4af37 100%);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.chip-line {
  height: 2px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1px;
}

.card-number {
  font-size: 24px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-top: 20px;
}

.card-details {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
}

.card-holder {
  flex: 1;
}

.label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 1px;
  margin-bottom: 5px;
  text-transform: uppercase;
}

.name {
  font-size: 16px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  padding: 4px 0;
  transition: all 0.3s ease;
}

.name:hover {
  color: rgba(255, 255, 255, 0.8);
}

.name-input {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;
  width: 100%;
  outline: none;
}

.name-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.card-expiry {
  text-align: right;
}

.expiry {
  font-size: 14px;
  font-weight: 500;
  color: white;
  letter-spacing: 2px;
}

.card-brand {
  position: absolute;
  bottom: 20px;
  right: 24px;
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 3px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.winner-announcement {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.confetti {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.confetti-piece {
  position: absolute;
  width: 10px;
  height: 10px;
  top: -10px;
  opacity: 0;
  animation: confettiFall 3s linear forwards;
}

@keyframes confettiFall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.announcement-content {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.announcement-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.announcement-text {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
}

.announcement-text strong {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 10px rgba(102, 126, 234, 0.5);
}

.announcement-text span {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.8);
}

.btn-reset {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  border: none;
  padding: 14px 40px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(67, 233, 123, 0.4);
}

.btn-reset:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(67, 233, 123, 0.6);
}

.winner-announcement-enter-active,
.winner-announcement-leave-active {
  transition: all 0.5s ease;
}

.winner-announcement-enter-from,
.winner-announcement-leave-to {
  opacity: 0;
}

.winner-announcement-enter-from .announcement-content,
.winner-announcement-leave-to .announcement-content {
  transform: scale(0.8);
}

@media (max-width: 768px) {
  .title {
    font-size: 28px;
  }

  .cards-container {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 10px;
  }

  .controls {
    flex-direction: column;
    gap: 12px;
  }

  .btn-shuffle {
    width: 100%;
    max-width: 300px;
  }

  .announcement-content {
    padding: 30px 20px;
  }

  .announcement-icon {
    font-size: 60px;
  }

  .announcement-text strong {
    font-size: 26px;
  }

  .announcement-text span {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .card-number {
    font-size: 20px;
  }

  .name {
    font-size: 14px;
  }

  .card-brand {
    font-size: 16px;
  }
}
</style>
