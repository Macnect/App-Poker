<template>
  <div class="modal-overlay" @click.self="cancel">
    <div class="modal-content">
      <h3>Finalizar Sesión</h3>
      
      <div class="summary">
        <div class="summary-item"><span>Buy-in Inicial:</span> <span>{{ sessionStore.currency }}{{ sessionStore.initialStack }}</span></div>
        <div class="summary-item"><span>Rebuys/Add-ons:</span> <span>{{ sessionStore.currency }}{{ sessionStore.totalRebuys }}</span></div>
        <div class="summary-item"><span>Gastos (propinas, etc.):</span> <span>- {{ sessionStore.currency }}{{ sessionStore.totalExpenses }}</span></div>
        <hr>
        <div class="summary-item total-investment"><span>Inversión Total:</span> <span>{{ sessionStore.currency }}{{ totalInvestment }}</span></div>
      </div>

      <div class="final-stack-input">
        <label for="final-stack">Introduce tu Stack Final:</label>
        <div class="input-group">
          <span>{{ sessionStore.currency }}</span>
          <input id="final-stack" type="number" v-model.number="finalStack" placeholder="Stack al finalizar" ref="inputRef">
        </div>
      </div>
      
      <div class="result-display" :class="resultClass">
        <h4>Resultado de la Sesión</h4>
        <p>{{ sessionResult >= 0 ? '+' : '' }}{{ sessionStore.currency }}{{ sessionResult.toFixed(2) }}</p>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" @click="cancel" :disabled="isSaving">Cancelar</button>
        <button class="btn-confirm" @click="confirm" :disabled="finalStack === null || finalStack < 0 || isSaving">
          {{ isSaving ? 'Guardando...' : 'Confirmar y Guardar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSessionStore } from '../store/useSessionStore';

const props = defineProps({
  isSaving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['confirm', 'cancel']);
const sessionStore = useSessionStore();

const finalStack = ref(null);
const inputRef = ref(null);

const totalInvestment = computed(() => sessionStore.initialStack + sessionStore.totalRebuys);
const sessionResult = computed(() => {
  if (finalStack.value === null || finalStack.value < 0) return 0;
  return finalStack.value - totalInvestment.value - sessionStore.totalExpenses;
});

const resultClass = computed(() => {
  if (sessionResult.value > 0) return 'profit';
  if (sessionResult.value < 0) return 'loss';
  return 'even';
});

function confirm() {
  emit('confirm', finalStack.value);
}

function cancel() {
  if (props.isSaving) return;
  emit('cancel');
}

onMounted(() => {
  inputRef.value?.focus();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  padding: 2rem;
  border-radius: 14px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  width: 100%;
  max-width: 450px;
  text-align: center;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h3 {
  margin-top: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.summary {
  text-align: left;
  margin: 1.5rem 0;
  font-size: 1.1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: rgba(255, 255, 255, 0.9);
}

.total-investment {
  font-weight: 700;
  border-top: 1px solid rgba(212, 175, 55, 0.3);
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  color: rgba(212, 175, 55, 0.9);
}

.final-stack-input {
  margin: 1.5rem 0;
}

.final-stack-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: rgba(212, 175, 55, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.9rem;
}

.input-group {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 10px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-group:focus-within {
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.input-group span {
  padding: 0 15px;
  font-size: 1.2rem;
  color: rgba(212, 175, 55, 0.7);
  font-weight: 600;
}

.input-group input {
  flex-grow: 1;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  padding: 15px;
  color: #fff;
  outline: 0;
  font-weight: 600;
}

.result-display {
  margin: 1.5rem 0;
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid;
}

.result-display h4 {
  margin: 0 0 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.result-display p {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.result-display.profit {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%);
  border-color: rgba(16, 185, 129, 0.4);
  color: #10b981;
}

.result-display.loss {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(153, 27, 27, 0.15) 100%);
  border-color: rgba(220, 38, 38, 0.4);
  color: #ef4444;
}

.result-display.even {
  background: linear-gradient(135deg, rgba(74, 85, 104, 0.15) 0%, rgba(45, 55, 72, 0.15) 100%);
  border-color: rgba(160, 174, 192, 0.4);
  color: #a0aec0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.modal-actions button {
  flex-grow: 1;
  padding: 15px;
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.btn-cancel {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-color: rgba(212, 175, 55, 0.2);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.btn-cancel:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.btn-confirm {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: rgba(212, 175, 55, 0.3);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  box-shadow: none;
}

@media (max-width: 480px) {
  .modal-content {
    padding: 1.5rem;
  }
  h3 {
    font-size: 1.5rem;
  }
  .summary {
    font-size: 1rem;
  }
  .input-group input {
    font-size: 1.2rem;
    padding: 12px;
  }
  .result-display p {
    font-size: 2rem;
  }
  .modal-actions button {
    padding: 12px;
    font-size: 1rem;
  }
}
</style>