<!-- src/components/EndSessionModal.vue -->
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
        <button class="btn-cancel" @click="cancel">Cancelar</button>
        <button class="btn-confirm" @click="confirm" :disabled="finalStack === null || finalStack < 0">Confirmar y Guardar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSessionStore } from '../store/useSessionStore';

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
  emit('cancel');
}

onMounted(() => {
  inputRef.value?.focus();
});
</script>

<style scoped>
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.8);display:flex;justify-content:center;align-items:center;z-index:2000}.modal-content{background-color:#2d3748;padding:2rem;border-radius:12px;border:1px solid var(--border-color);width:90%;max-width:450px;text-align:center}h3{margin-top:0;font-size:1.8rem}.summary{text-align:left;margin:1.5rem 0;font-size:1.1rem}.summary-item{display:flex;justify-content:space-between;padding:.5rem 0}.total-investment{font-weight:700;border-top:1px solid var(--border-color);margin-top:.5rem;padding-top:.5rem}.final-stack-input{margin:1.5rem 0}.final-stack-input label{display:block;margin-bottom:.5rem;font-weight:700}.input-group{display:flex;align-items:center;background-color:#1a202c;border-radius:6px;border:1px solid var(--border-color)}.input-group span{padding:0 15px;font-size:1.2rem;color:#a0aec0}.input-group input{flex-grow:1;background:0 0;border:none;font-size:1.5rem;padding:15px;color:#fff;outline:0}.result-display{margin:1.5rem 0;padding:1rem;border-radius:8px}.result-display h4{margin:0 0 .5rem}.result-display p{margin:0;font-size:2.5rem;font-weight:700}.result-display.profit{background-color:rgba(47,133,90,.3);color:#68d391}.result-display.loss{background-color:rgba(197,48,48,.3);color:#fc8181}.result-display.even{background-color:rgba(74,85,104,.3);color:#a0aec0}.modal-actions{display:flex;gap:1rem;margin-top:2rem}.modal-actions button{flex-grow:1;padding:15px;font-size:1.1rem;font-weight:700}.btn-cancel{background-color:#718096}.btn-confirm{background-color:#48bb78}
</style>