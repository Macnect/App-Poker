<template>
  <div class="tournament-manager-container">
    <!-- Acciones de Torneos Section -->
    <div class="section-panel">
      <div class="section-header">
        <h2>Acciones de Torneos</h2>
      </div>

      <!-- Sub-tabs -->
      <div class="sub-tabs-header">
        <button
          @click="activeSubTab = 'new'"
          :class="{ active: activeSubTab === 'new' }"
          class="sub-tab-btn"
        >
          Nueva Acción
        </button>
        <button
          @click="activeSubTab = 'saved'"
          :class="{ active: activeSubTab === 'saved' }"
          class="sub-tab-btn"
        >
          Acciones Guardadas
          <span v-if="savedActions.length > 0" class="badge">{{ savedActions.length }}</span>
        </button>
      </div>

      <!-- Nuevo Torneo -->
      <div v-if="activeSubTab === 'new'" class="sub-section">
        <div class="action-card">
          <div class="action-card-header">
            <h3>Nueva Acción de Torneo</h3>
            <button @click="resetCurrentAction" class="reset-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="reset-icon">
                <path fill-rule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clip-rule="evenodd" />
              </svg>
              Limpiar
            </button>
          </div>

          <!-- Tipo de Acción Selector -->
          <div class="action-type-selector">
            <button
              @click="currentAction.actionType = 'venta'"
              :class="{ active: currentAction.actionType === 'venta' }"
              class="type-selector-btn venta"
            >
              💰 Venta de Acciones
            </button>
            <button
              @click="currentAction.actionType = 'compra'"
              :class="{ active: currentAction.actionType === 'compra' }"
              class="type-selector-btn compra"
            >
              💳 Compra de Acciones
            </button>
          </div>

          <div class="action-form-grid-two-columns">
            <!-- Columna 1 -->
            <div class="column">
              <!-- VENTA: El jugador es quien vende -->
              <div v-if="currentAction.actionType === 'venta'" class="form-field">
                <label>Jugador (Vendedor)</label>
                <input type="text" v-model="currentAction.playerName" placeholder="Ej: Juan Pérez">
              </div>

              <!-- COMPRA: El jugador es quien compra -->
              <div v-if="currentAction.actionType === 'compra'" class="form-field">
                <label>Jugador (Comprador)</label>
                <input type="text" v-model="currentAction.playerName" placeholder="Ej: Juan Pérez">
              </div>

              <div class="form-field">
                <label>Torneo</label>
                <input type="text" v-model="currentAction.tournamentName" placeholder="Ej: Main Event WSOP">
              </div>

              <div class="form-field">
                <label>Moneda</label>
                <select v-model="currentAction.currency">
                  <option>€</option>
                  <option>$</option>
                  <option>£</option>
                </select>
              </div>

              <div class="form-field">
                <label>Precio del Torneo ({{ currentAction.currency || '€' }})</label>
                <input type="number" v-model.number="currentAction.price" @input="calculateTotals(currentAction)" min="0" placeholder="0">
              </div>

              <div v-if="currentAction.actionType === 'venta'" class="form-field">
                <label>% en Venta</label>
                <input type="number" v-model.number="currentAction.percentageForSale" @input="calculateTotals(currentAction)" min="0" max="100" placeholder="0">
              </div>

              <div class="form-field">
                <label>Mark-Up</label>
                <input type="number" v-model.number="currentAction.markup" @input="calculateTotals(currentAction)" min="1" step="0.1" placeholder="1.0">
              </div>

              <div class="form-field calculated">
                <label>Precio por 1% ({{ currentAction.currency || '€' }})</label>
                <div class="calculated-value">{{ currentAction.pricePerPercent?.toFixed(2) || '0.00' }}</div>
              </div>
            </div>

            <!-- Columna 2 -->
            <div class="column">
              <!-- COMPRA: Campo de vendedor (quien juega el torneo) -->
              <div v-if="currentAction.actionType === 'compra'" class="form-field">
                <label>Vendedor (Quien juega)</label>
                <input type="text" v-model="currentAction.buyer" placeholder="Nombre del jugador">
              </div>

              <div v-if="currentAction.actionType === 'compra'" class="form-field">
                <label>% Comprado</label>
                <input type="number" v-model.number="currentAction.percentageBought" @input="calculateTotals(currentAction)" min="0" max="100" placeholder="0">
              </div>

              <!-- VENTA: Sección de múltiples compradores -->
              <div v-if="currentAction.actionType === 'venta'" class="form-field full-width-in-column">
                <label class="section-label">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="label-icon">
                    <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                  </svg>
                  Compradores
                </label>

                <!-- Lista de compradores agregados -->
                <div v-if="currentAction.buyers && currentAction.buyers.length > 0" class="buyers-list">
                  <div v-for="(buyer, index) in currentAction.buyers" :key="index" class="buyer-item">
                    <div class="buyer-info">
                      <div class="buyer-name">{{ buyer.name }}</div>
                      <div class="buyer-details">
                        <span class="buyer-percentage">{{ buyer.percentage }}%</span>
                        <span class="buyer-total">{{ buyer.totalPaid?.toFixed(2) }}{{ currentAction.currency || '€' }}</span>
                      </div>
                    </div>
                    <button @click="removeBuyer(index)" class="remove-buyer-btn" type="button">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Formulario para agregar comprador -->
                <div class="add-buyer-form">
                  <div class="add-buyer-inputs">
                    <input
                      type="text"
                      v-model="newBuyer.name"
                      placeholder="Nombre del comprador"
                      class="buyer-name-input"
                    >
                    <div class="percentage-input-wrapper">
                      <input
                        type="number"
                        v-model.number="newBuyer.percentage"
                        placeholder="0"
                        min="0"
                        :max="remainingPercentage"
                        class="buyer-percentage-input"
                      >
                      <span class="percentage-symbol">%</span>
                    </div>
                    <button @click="addBuyer" type="button" class="add-buyer-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div class="remaining-percentage">
                    Disponible: <strong>{{ remainingPercentage }}%</strong> de {{ currentAction.percentageForSale }}%
                  </div>
                </div>
              </div>

              <div class="form-field calculated">
                <label>Total {{ currentAction.actionType === 'venta' ? 'Recibido' : 'Pagado' }} ({{ currentAction.currency || '€' }})</label>
                <div class="calculated-value">{{ currentAction.totalPaid?.toFixed(2) || '0.00' }}</div>
              </div>

              <div v-if="currentAction.actionType === 'venta'" class="form-field calculated">
                <label>% Retenido Jugador</label>
                <div class="calculated-value">{{ currentAction.percentageRetained?.toFixed(2) || '0.00' }}%</div>
              </div>

              <div class="form-field">
                <label>Estado</label>
                <select v-model="currentAction.status">
                  <option value="Confirmado">Confirmado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En venta">En venta</option>
                </select>
              </div>

              <div class="form-field">
                <button @click="saveCurrentAction" class="save-action-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="save-icon">
                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                  </svg>
                  Guardar Acción
                </button>
              </div>
            </div>

            <!-- Notas en toda la fila -->
            <div class="form-field full-width">
              <label>Notas</label>
              <textarea v-model="currentAction.notes" placeholder="Añade notas adicionales aquí..." rows="2"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Acciones Guardadas -->
      <div v-if="activeSubTab === 'saved'" class="sub-section">
        <div v-if="savedActions.length === 0" class="empty-state">
          <p>No hay acciones guardadas. Crea una en la pestaña "Nueva Acción".</p>
        </div>

        <div v-else>
          <!-- Filtros -->
          <div class="filters-bar">
            <button
              @click="filterType = 'all'"
              :class="{ active: filterType === 'all' }"
              class="filter-btn"
            >
              Todas ({{ savedActions.length }})
            </button>
            <button
              @click="filterType = 'venta'"
              :class="{ active: filterType === 'venta' }"
              class="filter-btn venta"
            >
              💰 Ventas ({{ filteredByType('venta').length }})
            </button>
            <button
              @click="filterType = 'compra'"
              :class="{ active: filterType === 'compra' }"
              class="filter-btn compra"
            >
              💳 Compras ({{ filteredByType('compra').length }})
            </button>
          </div>

          <div class="actions-list">
            <div v-for="(action, index) in filteredActions" :key="action.id" class="action-card">
            <div class="action-card-header">
              <div class="header-left">
                <h3>{{ action.tournamentName || `Torneo #${index + 1}` }}</h3>
                <span class="action-type-badge" :class="action.actionType || 'venta'">
                  {{ action.actionType === 'compra' ? '💳 Compra' : '💰 Venta' }}
                </span>
              </div>
              <div class="action-header-buttons">
                <button @click="editAction(action)" class="edit-btn">✏️ Editar</button>
                <button @click="deleteSavedAction(action.id)" class="delete-btn">🗑️</button>
              </div>
            </div>

            <div class="action-summary">
              <div class="summary-row">
                <div class="summary-item">
                  <span class="summary-label">{{ action.actionType === 'compra' ? 'Comprador' : 'Vendedor' }}:</span>
                  <span class="summary-value">{{ action.playerName || 'N/A' }}</span>
                </div>
                <div v-if="action.actionType === 'compra' || !action.buyers || action.buyers.length === 0" class="summary-item">
                  <span class="summary-label">{{ action.actionType === 'compra' ? 'Vendedor' : 'Comprador' }}:</span>
                  <span class="summary-value">{{ action.buyer || 'N/A' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Precio Torneo:</span>
                  <span class="summary-value">{{ action.price }}{{ action.currency || '€' }}</span>
                </div>
              </div>

              <!-- Múltiples compradores (si existen) -->
              <div v-if="action.actionType === 'venta' && action.buyers && action.buyers.length > 0" class="summary-buyers-section">
                <div class="summary-buyers-header">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="buyers-icon">
                    <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                  </svg>
                  <span class="summary-label">Compradores ({{ action.buyers.length }}):</span>
                </div>
                <div class="summary-buyers-grid">
                  <div v-for="(buyer, idx) in action.buyers" :key="idx" class="summary-buyer-item">
                    <div class="summary-buyer-name">{{ buyer.name }}</div>
                    <div class="summary-buyer-stats">
                      <span class="summary-buyer-percentage">{{ buyer.percentage }}%</span>
                      <span class="summary-buyer-total">{{ buyer.totalPaid?.toFixed(2) }}{{ action.currency || '€' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="summary-row">
                <div class="summary-item">
                  <span class="summary-label">Mark-Up:</span>
                  <span class="summary-value">{{ action.markup }}x</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">{{ action.actionType === 'compra' ? '% Comprado' : '% Vendido' }}:</span>
                  <span class="summary-value">{{ action.percentageBought }}%</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Total {{ action.actionType === 'compra' ? 'Pagado' : 'Recibido' }}:</span>
                  <span class="summary-value highlight">{{ action.totalPaid?.toFixed(2) }}{{ action.currency || '€' }}</span>
                </div>
              </div>

              <div class="summary-row">
                <div v-if="action.actionType === 'venta'" class="summary-item">
                  <span class="summary-label">% Retenido:</span>
                  <span class="summary-value">{{ action.percentageRetained?.toFixed(2) }}%</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Estado:</span>
                  <span class="summary-value" :class="getStatusClass(action.status)">{{ action.status }}</span>
                </div>
              </div>

              <div v-if="action.notes" class="summary-notes">
                <span class="summary-label">Notas:</span>
                <p>{{ action.notes }}</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showToast" class="toast success-toast">
      <div class="toast-icon">✓</div>
      <div class="toast-message">{{ toastMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';

const activeSubTab = ref('new');
const savedActions = ref([]);
const showToast = ref(false);
const toastMessage = ref('');
const filterType = ref('all');
let nextId = 1;

// Current action being created/edited
const currentAction = ref({
  id: null,
  actionType: 'venta', // 'venta' o 'compra'
  playerName: '',
  tournamentName: '',
  currency: '€',
  price: 0,
  percentageForSale: 0,
  markup: 1,
  pricePerPercent: 0,
  buyer: '',
  percentageBought: 0,
  totalPaid: 0,
  percentageRetained: 100,
  status: 'Pendiente',
  notes: '',
  buyers: [] // Array de compradores para ventas múltiples
});

// Campos para agregar nuevo comprador
const newBuyer = ref({
  name: '',
  percentage: 0
});

// Computed property for filtered actions
const filteredActions = computed(() => {
  if (filterType.value === 'all') {
    return savedActions.value;
  }
  return savedActions.value.filter(action => (action.actionType || 'venta') === filterType.value);
});

// Computed property for total percentage sold to buyers
const totalBuyersPercentage = computed(() => {
  if (!currentAction.value.buyers || currentAction.value.buyers.length === 0) {
    return 0;
  }
  return currentAction.value.buyers.reduce((sum, buyer) => sum + (buyer.percentage || 0), 0);
});

// Computed property for remaining percentage available to sell
const remainingPercentage = computed(() => {
  return (currentAction.value.percentageForSale || 0) - totalBuyersPercentage.value;
});

// Helper function for filtering by type (for badges)
function filteredByType(type) {
  return savedActions.value.filter(action => (action.actionType || 'venta') === type);
}

// Add buyer to the list
function addBuyer() {
  if (!newBuyer.value.name || !newBuyer.value.percentage || newBuyer.value.percentage <= 0) {
    showToastMessage('Por favor ingresa nombre y porcentaje válido');
    return;
  }

  const totalAfterAdd = totalBuyersPercentage.value + newBuyer.value.percentage;
  if (totalAfterAdd > currentAction.value.percentageForSale) {
    showToastMessage(`No puedes vender más del ${currentAction.value.percentageForSale}%. Disponible: ${remainingPercentage.value}%`);
    return;
  }

  // Calculate total paid for this buyer
  const buyerTotalPaid = currentAction.value.pricePerPercent * newBuyer.value.percentage;

  currentAction.value.buyers.push({
    name: newBuyer.value.name,
    percentage: newBuyer.value.percentage,
    totalPaid: buyerTotalPaid
  });

  // Reset new buyer form
  newBuyer.value = {
    name: '',
    percentage: 0
  };

  // Recalculate totals
  calculateTotals(currentAction.value);
  showToastMessage('Comprador agregado correctamente');
}

// Remove buyer from the list
function removeBuyer(index) {
  currentAction.value.buyers.splice(index, 1);
  calculateTotals(currentAction.value);
  showToastMessage('Comprador eliminado');
}

function resetCurrentAction() {
  currentAction.value = {
    id: null,
    actionType: 'venta',
    playerName: '',
    tournamentName: '',
    currency: '€',
    price: 0,
    percentageForSale: 0,
    markup: 1,
    pricePerPercent: 0,
    buyer: '',
    percentageBought: 0,
    totalPaid: 0,
    percentageRetained: 100,
    status: 'Pendiente',
    notes: '',
    buyers: []
  };
  newBuyer.value = {
    name: '',
    percentage: 0
  };
  showToastMessage('Formulario limpiado');
}

function saveCurrentAction() {
  // Validate basic fields
  if (!currentAction.value.playerName || !currentAction.value.tournamentName || !currentAction.value.price) {
    showToastMessage('Por favor completa al menos: Jugador, Torneo y Precio');
    return;
  }

  if (currentAction.value.id === null) {
    // New action - add to saved list
    const newAction = {
      ...currentAction.value,
      id: nextId++,
      createdAt: new Date().toISOString()
    };
    savedActions.value.push(newAction);
    showToastMessage('✅ Torneo guardado correctamente');
    console.log('💾 Nuevo torneo guardado:', newAction.tournamentName);
  } else {
    // Editing existing action - update it
    const index = savedActions.value.findIndex(a => a.id === currentAction.value.id);
    if (index !== -1) {
      savedActions.value[index] = {
        ...currentAction.value,
        updatedAt: new Date().toISOString()
      };
      showToastMessage('✅ Torneo actualizado correctamente');
      console.log('🔄 Torneo actualizado:', currentAction.value.tournamentName);
    }
  }

  // Force immediate save to localStorage
  saveToLocalStorage();

  // Reset form and switch to saved tab
  resetCurrentAction();
  activeSubTab.value = 'saved';
}

function editAction(action) {
  // Load the action into the form for editing
  currentAction.value = { ...action };
  activeSubTab.value = 'new';
  showToastMessage('Editando torneo');
}

function deleteSavedAction(id) {
  const index = savedActions.value.findIndex(a => a.id === id);
  if (index !== -1) {
    const action = savedActions.value[index];
    const actionName = action.tournamentName || 'este torneo';

    // Enhanced confirmation with details
    const confirmMessage = `⚠️ CONFIRMACIÓN DE ELIMINACIÓN\n\n` +
      `Estás a punto de eliminar:\n` +
      `- Torneo: ${actionName}\n` +
      `- Jugador: ${action.playerName || 'N/A'}\n` +
      `- Precio: ${action.price}€\n\n` +
      `Esta acción NO se puede deshacer.\n\n` +
      `¿Estás completamente seguro de que quieres eliminar este torneo?`;

    if (confirm(confirmMessage)) {
      // Create a backup before deletion
      const deletedActionBackup = { ...action };
      localStorage.setItem('lastDeletedAction', JSON.stringify({
        action: deletedActionBackup,
        deletedAt: new Date().toISOString()
      }));

      savedActions.value.splice(index, 1);
      showToastMessage(`Torneo "${actionName}" eliminado permanentemente`);

      console.log('🗑️ Torneo eliminado:', actionName);
      console.log('💾 Copia de seguridad creada en lastDeletedAction');
    }
  }
}

function calculateTotals(action) {
  // Calculate Precio por 1%: (Precio del torneo / 100) × Mark-Up
  // Ejemplo: Torneo de 1000€, mark-up 1.2 → (1000/100) × 1.2 = 10 × 1.2 = 12€ por cada 1%
  const baseValuePerPercent = (action.price || 0) / 100;
  action.pricePerPercent = baseValuePerPercent * (action.markup || 1);

  // Si hay múltiples compradores (venta), calcular basado en ellos
  if (action.actionType === 'venta' && action.buyers && action.buyers.length > 0) {
    // Recalcular el total pagado de cada comprador
    action.buyers.forEach(buyer => {
      buyer.totalPaid = action.pricePerPercent * (buyer.percentage || 0);
    });

    // Calcular el total vendido sumando todos los compradores
    const totalSoldPercentage = action.buyers.reduce((sum, buyer) => sum + (buyer.percentage || 0), 0);
    action.percentageBought = totalSoldPercentage;
    action.totalPaid = action.buyers.reduce((sum, buyer) => sum + (buyer.totalPaid || 0), 0);
    action.percentageRetained = 100 - totalSoldPercentage;
  } else {
    // Modo simple (compra o venta a un solo comprador)
    // Calculate Total Pagado: Precio por 1% × % Comprado
    action.totalPaid = action.pricePerPercent * (action.percentageBought || 0);

    // Calculate % Retenido Jugador: 100 - % Comprado
    action.percentageRetained = 100 - (action.percentageBought || 0);
  }
}

function getStatusClass(status) {
  if (status === 'Confirmado') return 'status-confirmed';
  if (status === 'En venta') return 'status-sale';
  return 'status-pending';
}

function showToastMessage(message) {
  toastMessage.value = message;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

// Enhanced save function with error handling and backup
function saveToLocalStorage() {
  try {
    const dataToSave = {
      actions: savedActions.value,
      lastSaved: new Date().toISOString(),
      version: '1.0'
    };

    // Save main data
    localStorage.setItem('tournamentActions', JSON.stringify(dataToSave));

    // Create automatic backup (keep last 3 backups)
    const backups = JSON.parse(localStorage.getItem('tournamentActions_backups') || '[]');
    backups.unshift({
      data: dataToSave,
      timestamp: new Date().toISOString()
    });

    // Keep only last 3 backups
    if (backups.length > 3) {
      backups.splice(3);
    }

    localStorage.setItem('tournamentActions_backups', JSON.stringify(backups));

    console.log('✅ Datos guardados correctamente:', new Date().toLocaleString());
  } catch (e) {
    console.error('❌ Error al guardar datos:', e);
    showToastMessage('Error al guardar. Verifica el espacio en localStorage');
  }
}

// Load data from localStorage on mount with backup recovery
onMounted(() => {
  try {
    const saved = localStorage.getItem('tournamentActions');

    if (saved) {
      const parsedData = JSON.parse(saved);

      // Check if it's new format (with metadata) or old format (just array)
      if (Array.isArray(parsedData)) {
        // Old format - migrate to new format
        savedActions.value = parsedData;
        console.log('📦 Datos migrados al nuevo formato');
        saveToLocalStorage(); // Save in new format
      } else if (parsedData.actions) {
        // New format
        savedActions.value = parsedData.actions;
        console.log('✅ Datos cargados correctamente. Última actualización:', parsedData.lastSaved);
      }

      // Find the highest ID to continue from there
      if (savedActions.value.length > 0) {
        nextId = Math.max(...savedActions.value.map(a => a.id)) + 1;
      }

      console.log(`📊 ${savedActions.value.length} torneos cargados`);

      // Show data persistence info
      console.log('\n🔒 INFORMACIÓN DE PERSISTENCIA:');
      console.log('✅ Tus datos están guardados de forma permanente en el navegador');
      console.log('✅ Los datos se mantienen incluso si cierras la aplicación');
      console.log('✅ Sistema de respaldo automático activo (últimas 3 versiones)');
      console.log('✅ Los datos solo se eliminan si tú lo haces manualmente');
      console.log('⚠️ Los datos están vinculados a este navegador y dispositivo');
      console.log('💡 Para mayor seguridad, exporta tus datos periódicamente\n');
    } else {
      console.log('📭 No hay datos guardados previos');
    }
  } catch (e) {
    console.error('❌ Error al cargar datos:', e);

    // Try to restore from backup
    try {
      const backups = JSON.parse(localStorage.getItem('tournamentActions_backups') || '[]');
      if (backups.length > 0) {
        const lastBackup = backups[0];
        savedActions.value = lastBackup.data.actions;
        showToastMessage('Datos restaurados desde respaldo');
        console.log('🔄 Datos restaurados desde respaldo:', lastBackup.timestamp);
      }
    } catch (backupError) {
      console.error('❌ Error al restaurar desde respaldo:', backupError);
      showToastMessage('Error al cargar datos. Los datos pueden haberse perdido.');
    }
  }
});

// Save to localStorage whenever savedActions change with debounce
let saveTimeout;
watch(savedActions, () => {
  // Clear previous timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Debounce save to avoid excessive writes
  saveTimeout = setTimeout(() => {
    saveToLocalStorage();
  }, 500);
}, { deep: true });
</script>

<style scoped>
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   TournamentTripsView - Tournament Purple Theme
   ======================================== */

/* Import Premium Modern Font - Poppins */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

* {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.tournament-manager-container {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
}

/* ========================================
   TABS NAVIGATION
   ======================================== */
.tabs-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.tab-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  border: 2px solid rgba(168, 85, 247, 0.2);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.7) 100%);
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tab-btn:hover {
  border-color: rgba(168, 85, 247, 0.4);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.9) 100%);
  color: #f9fafb;
}

.tab-btn.active {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  border-color: rgba(168, 85, 247, 0.6);
  color: white;
  box-shadow:
    0 4px 12px rgba(168, 85, 247, 0.4),
    0 0 20px rgba(168, 85, 247, 0.2);
}

/* ========================================
   SUB-TABS NAVIGATION
   ======================================== */
.sub-tabs-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 0.5rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(31, 41, 55, 0.5) 100%);
  border-radius: 12px;
  border: 1px solid rgba(168, 85, 247, 0.1);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.sub-tab-btn {
  flex: 1;
  padding: 0.85rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.025em;
  position: relative;
}

.sub-tab-btn:hover {
  color: #d1d5db;
  background: rgba(168, 85, 247, 0.05);
}

.sub-tab-btn.active {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3);
}

.sub-tab-btn .badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  margin-left: 0.5rem;
}

.sub-tab-btn.active .badge {
  background: rgba(255, 255, 255, 0.3);
}

.sub-section {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========================================
   SECTION PANEL
   ======================================== */
.section-panel {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(168, 85, 247, 0.15);
  border-radius: 20px;
  padding: 2rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  animation: slideIn 0.4s ease-out;
  box-sizing: border-box;
  overflow-x: hidden;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(168, 85, 247, 0.2);
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.add-action-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
  font-size: 1.05rem;
  font-weight: 600;
  padding: 0.9rem 1.8rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  letter-spacing: 0.025em;
  box-shadow:
    0 4px 6px -1px rgba(124, 58, 237, 0.3),
    0 10px 20px -3px rgba(124, 58, 237, 0.2);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.add-action-btn:hover {
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(124, 58, 237, 0.4);
}

.add-action-btn:active {
  transform: translateY(0);
}

/* ========================================
   ACTIONS TABLE
   ======================================== */
.actions-table-container {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding-right: 0.5rem;
}

.actions-table-container::-webkit-scrollbar {
  width: 8px;
}

.actions-table-container::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 10px;
}

.actions-table-container::-webkit-scrollbar-thumb {
  background: rgba(168, 85, 247, 0.3);
  border-radius: 10px;
}

.actions-table-container::-webkit-scrollbar-thumb:hover {
  background: rgba(168, 85, 247, 0.5);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #9ca3af;
  font-size: 1.1rem;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* ========================================
   ACTION TYPE SELECTOR
   ======================================== */
.action-type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0.5rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(31, 41, 55, 0.5) 100%);
  border-radius: 12px;
  border: 1px solid rgba(168, 85, 247, 0.1);
}

.type-selector-btn {
  padding: 1rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  border-radius: 8px;
  border: 2px solid transparent;
  background: rgba(55, 65, 81, 0.3);
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.025em;
}

.type-selector-btn:hover {
  color: #d1d5db;
  background: rgba(55, 65, 81, 0.5);
}

.type-selector-btn.active.venta {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.3) 100%);
  border-color: rgba(34, 197, 94, 0.5);
  color: #4ade80;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.type-selector-btn.active.compra {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.3) 100%);
  border-color: rgba(59, 130, 246, 0.5);
  color: #60a5fa;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

/* ========================================
   FILTERS BAR
   ======================================== */
.filters-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(31, 41, 55, 0.5) 100%);
  border-radius: 12px;
  border: 1px solid rgba(168, 85, 247, 0.1);
  flex-wrap: wrap;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.filter-btn {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1.5px solid transparent;
  background: rgba(55, 65, 81, 0.4);
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.025em;
}

.filter-btn:hover {
  color: #d1d5db;
  background: rgba(55, 65, 81, 0.6);
}

.filter-btn.active {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  border-color: rgba(168, 85, 247, 0.6);
  color: white;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3);
}

.filter-btn.venta.active {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.4) 100%);
  border-color: rgba(34, 197, 94, 0.6);
  color: #4ade80;
}

.filter-btn.compra.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.4) 100%);
  border-color: rgba(59, 130, 246, 0.6);
  color: #60a5fa;
}

/* ========================================
   ACTION CARD
   ======================================== */
.action-card {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.7) 100%);
  border: 1.5px solid rgba(168, 85, 247, 0.15);
  border-radius: 14px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.action-card:hover {
  border-color: rgba(168, 85, 247, 0.3);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
}

.action-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(168, 85, 247, 0.15);
}

.action-card-header .header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-card-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #f9fafb;
  word-break: break-word;
  overflow-wrap: break-word;
}

.action-type-badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 20px;
  letter-spacing: 0.025em;
  width: fit-content;
}

.action-type-badge.venta {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.3) 100%);
  border: 1.5px solid rgba(34, 197, 94, 0.4);
  color: #4ade80;
}

.action-type-badge.compra {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.3) 100%);
  border: 1.5px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.action-header-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.edit-btn,
.reset-btn,
.delete-btn {
  font-size: 0.95rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1.5px solid;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-btn {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.3) 100%);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.edit-btn:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.4) 100%);
  border-color: rgba(59, 130, 246, 0.5);
  color: #93c5fd;
  transform: scale(1.05);
}

.reset-btn {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(185, 28, 28, 0.3) 100%);
  border-color: rgba(220, 38, 38, 0.3);
  color: #f87171;
}

.reset-btn:hover {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(185, 28, 28, 0.4) 100%);
  border-color: rgba(220, 38, 38, 0.5);
  color: #fca5a5;
  transform: scale(1.05);
}

.reset-icon {
  width: 20px;
  height: 20px;
  filter: drop-shadow(0 2px 4px rgba(220, 38, 38, 0.2));
}

.delete-btn {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(185, 28, 28, 0.3) 100%);
  border-color: rgba(220, 38, 38, 0.3);
  color: #f87171;
}

.delete-btn:hover {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(185, 28, 28, 0.4) 100%);
  border-color: rgba(220, 38, 38, 0.5);
  color: #fca5a5;
  transform: scale(1.05);
}

/* ========================================
   ACTION FORM GRID - TWO COLUMNS
   ======================================== */
.action-form-grid-two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.action-form-grid-two-columns .column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.form-field.full-width {
  grid-column: 1 / -1;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.form-field label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.form-field input,
.form-field select,
.form-field textarea {
  padding: 0.9rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) inset;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(168, 85, 247, 0.1);
}

.form-field input:hover,
.form-field select:hover,
.form-field textarea:hover {
  border-color: rgba(168, 85, 247, 0.3);
}

.form-field select {
  cursor: pointer;
}

.form-field select option {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 0.75rem;
}

.form-field textarea {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

/* Calculated fields */
.form-field.calculated .calculated-value {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.2) 100%);
  border: 1.5px solid rgba(168, 85, 247, 0.3);
  padding: 0.9rem 1rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 10px;
  text-align: center;
  color: #a855f7;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Multiple Buyers Section */
.form-field.full-width-in-column {
  grid-column: 1 / -1;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: #a855f7;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.label-icon {
  width: 20px;
  height: 20px;
  filter: drop-shadow(0 2px 4px rgba(168, 85, 247, 0.3));
}

.buyers-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.buyers-list::-webkit-scrollbar {
  width: 6px;
}

.buyers-list::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 10px;
}

.buyers-list::-webkit-scrollbar-thumb {
  background: rgba(168, 85, 247, 0.3);
  border-radius: 10px;
}

.buyers-list::-webkit-scrollbar-thumb:hover {
  background: rgba(168, 85, 247, 0.5);
}

.buyer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%);
  border: 1.5px solid rgba(168, 85, 247, 0.2);
  border-radius: 10px;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.buyer-item:hover {
  border-color: rgba(168, 85, 247, 0.4);
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.1);
}

.buyer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
  overflow: hidden;
}

.buyer-name {
  font-weight: 600;
  font-size: 1rem;
  color: #f9fafb;
  word-break: break-word;
  overflow-wrap: break-word;
}

.buyer-details {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.buyer-percentage {
  color: #a855f7;
  font-weight: 700;
}

.buyer-total {
  color: #10b981;
  font-weight: 600;
}

.remove-buyer-btn {
  width: 36px;
  height: 36px;
  padding: 8px;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(185, 28, 28, 0.3) 100%);
  border: 1.5px solid rgba(220, 38, 38, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-buyer-btn svg {
  width: 20px;
  height: 20px;
  color: #f87171;
}

.remove-buyer-btn:hover {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(185, 28, 28, 0.4) 100%);
  border-color: rgba(220, 38, 38, 0.5);
  transform: scale(1.05);
}

.remove-buyer-btn:hover svg {
  color: #fca5a5;
}

.add-buyer-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(31, 41, 55, 0.5) 100%);
  border: 1.5px solid rgba(168, 85, 247, 0.15);
  border-radius: 10px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.add-buyer-inputs {
  display: grid;
  grid-template-columns: 1fr 100px auto;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.buyer-name-input {
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.percentage-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.buyer-percentage-input {
  padding: 0.75rem 2rem 0.75rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
  text-align: center;
}

.percentage-symbol {
  position: absolute;
  right: 0.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #a855f7;
  pointer-events: none;
  user-select: none;
}

.buyer-name-input:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(168, 85, 247, 0.1);
}

.buyer-percentage-input:focus {
  outline: none;
  border-color: rgba(168, 85, 247, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(168, 85, 247, 0.1);
}

.buyer-name-input:hover {
  border-color: rgba(168, 85, 247, 0.3);
}

.buyer-percentage-input:hover {
  border-color: rgba(168, 85, 247, 0.3);
}

.add-buyer-btn {
  width: 44px;
  height: 44px;
  padding: 10px;
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 2px 6px rgba(124, 58, 237, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.add-buyer-btn svg {
  width: 24px;
  height: 24px;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.add-buyer-btn:hover {
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(124, 58, 237, 0.4),
    0 0 20px rgba(168, 85, 247, 0.2);
}

.add-buyer-btn:active {
  transform: translateY(0);
}

.remaining-percentage {
  font-size: 0.9rem;
  color: #d1d5db;
  text-align: center;
  padding: 0.5rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.15) 100%);
  border-radius: 8px;
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.remaining-percentage strong {
  color: #a855f7;
  font-weight: 700;
  font-size: 1.05rem;
}

/* Save Action Button */
.save-action-btn {
  width: 100%;
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.9rem 1rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  letter-spacing: 0.025em;
  box-shadow:
    0 4px 6px -1px rgba(124, 58, 237, 0.3),
    0 10px 20px -3px rgba(124, 58, 237, 0.2);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.save-action-btn:hover {
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
  transform: translateY(-2px);
  box-shadow:
    0 6px 12px rgba(124, 58, 237, 0.4),
    0 0 20px rgba(168, 85, 247, 0.2);
}

.save-action-btn:active {
  transform: translateY(0);
}

.save-action-btn .save-icon {
  width: 22px;
  height: 22px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* ========================================
   ACTION SUMMARY (for saved tournaments)
   ======================================== */
.action-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 0.75rem 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.summary-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f9fafb;
  word-break: break-word;
  overflow-wrap: break-word;
}

.summary-value.highlight {
  font-size: 1.3rem;
  color: #a855f7;
  font-weight: 700;
  word-break: break-word;
  overflow-wrap: break-word;
}

.summary-notes {
  margin-top: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(31, 41, 55, 0.5) 100%);
  border-radius: 8px;
  border: 1px solid rgba(168, 85, 247, 0.1);
}

.summary-notes p {
  margin: 0.5rem 0 0 0;
  color: #d1d5db;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Summary Buyers Section */
.summary-buyers-section {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(31, 41, 55, 0.5) 100%);
  border-radius: 10px;
  border: 1.5px solid rgba(168, 85, 247, 0.15);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.summary-buyers-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);
}

.buyers-icon {
  width: 20px;
  height: 20px;
  color: #a855f7;
  filter: drop-shadow(0 2px 4px rgba(168, 85, 247, 0.3));
}

.summary-buyers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.summary-buyer-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%);
  border: 1px solid rgba(168, 85, 247, 0.15);
  border-radius: 8px;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.summary-buyer-item:hover {
  border-color: rgba(168, 85, 247, 0.3);
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.1);
}

.summary-buyer-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #f9fafb;
  word-break: break-word;
  overflow-wrap: break-word;
}

.summary-buyer-stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.summary-buyer-percentage {
  color: #a855f7;
  font-weight: 700;
}

.summary-buyer-total {
  color: #10b981;
  font-weight: 600;
}

/* Status colors */
.status-confirmed {
  color: #10b981;
  font-weight: 700;
}

.status-pending {
  color: #f59e0b;
  font-weight: 700;
}

.status-sale {
  color: #60a5fa;
  font-weight: 700;
}

/* ========================================
   PLANIFICADOR PLACEHOLDER
   ======================================== */
.planner-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  text-align: center;
}

.placeholder-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  opacity: 0.7;
}

.placeholder-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #d1d5db;
  margin-bottom: 0.75rem;
}

.placeholder-subtext {
  font-size: 1.1rem;
  color: #9ca3af;
  max-width: 500px;
}

/* ========================================
   TOAST NOTIFICATIONS
   ======================================== */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  z-index: 2000;
  animation: toastSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.success-toast {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
}

.toast-icon {
  font-size: 1.6rem;
  font-weight: 700;
}

.toast-message {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.025em;
}

@keyframes toastSlideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ========================================
   RESPONSIVE DESIGN - MOBILE
   ======================================== */
@media (max-width: 768px) {
  .tournament-manager-container {
    padding: 1rem;
  }

  .tabs-header {
    margin-bottom: 1.5rem;
  }

  .tab-btn {
    padding: 0.8rem 1.5rem;
    font-size: 0.95rem;
  }

  .sub-tabs-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .sub-tab-btn {
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
  }

  .section-panel {
    padding: 1.5rem;
    border-radius: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-header h2 {
    font-size: 1.6rem;
  }

  .add-action-btn {
    width: 100%;
    padding: 0.8rem 1.5rem;
  }

  .action-form-grid-two-columns {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .action-form-grid-two-columns .column {
    gap: 0.75rem;
  }

  .action-type-selector {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .type-selector-btn {
    padding: 0.85rem 1.25rem;
    font-size: 1rem;
  }

  .filters-bar {
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-btn {
    min-width: 100%;
    padding: 0.65rem 1rem;
    font-size: 0.9rem;
  }

  .action-card {
    padding: 1.25rem;
  }

  .action-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .action-card-header .header-left {
    width: 100%;
  }

  .action-card-header h3 {
    font-size: 1.1rem;
  }

  .action-type-badge {
    font-size: 0.8rem;
    padding: 0.3rem 0.7rem;
  }

  .action-header-buttons {
    flex-direction: column;
    width: 100%;
  }

  .edit-btn,
  .reset-btn,
  .delete-btn {
    font-size: 0.9rem;
    padding: 0.5rem 0.8rem;
    width: 100%;
  }

  .summary-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .summary-value {
    font-size: 1rem;
  }

  .summary-value.highlight {
    font-size: 1.15rem;
  }

  .summary-buyers-grid {
    grid-template-columns: 1fr;
  }

  .tournament-manager-container {
    padding: 1rem;
  }

  .section-panel {
    padding: 1.5rem;
  }

  .form-field input,
  .form-field select,
  .form-field textarea {
    padding: 0.75rem 0.9rem;
    font-size: 0.95rem;
  }

  .add-buyer-inputs {
    grid-template-columns: 1fr 80px auto;
    gap: 0.5rem;
  }

  .buyer-name-input {
    padding: 0.65rem 0.85rem;
    font-size: 0.9rem;
  }

  .buyer-percentage-input {
    padding: 0.65rem 1.75rem 0.65rem 0.85rem;
    font-size: 0.9rem;
  }

  .percentage-symbol {
    right: 0.65rem;
    font-size: 0.9rem;
  }

  .add-buyer-btn {
    width: 40px;
    height: 40px;
    padding: 8px;
  }

  .add-buyer-btn svg {
    width: 22px;
    height: 22px;
  }

  .summary-buyers-grid {
    grid-template-columns: 1fr;
  }

  .action-form-grid-two-columns {
    grid-template-columns: 1fr;
  }

  .add-buyer-inputs {
    grid-template-columns: 1fr 70px auto;
  }

  .buyer-percentage-input {
    padding: 0.65rem 1.75rem 0.65rem 0.85rem;
  }

  .percentage-symbol {
    right: 0.6rem;
    font-size: 0.85rem;
  }

  .summary-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .planner-placeholder {
    padding: 4rem 1.5rem;
  }

  .placeholder-icon {
    font-size: 3.5rem;
  }

  .placeholder-text {
    font-size: 1.2rem;
  }

  .placeholder-subtext {
    font-size: 1rem;
  }

  .toast {
    top: 10px;
    right: 10px;
    left: 10px;
  }
}

/* ========================================
   LANDSCAPE MODE
   ======================================== */
@media (orientation: landscape) and (max-height: 600px) {
  .tournament-manager-container {
    padding: 1rem;
  }

  .section-panel {
    padding: 1.5rem;
  }

  .actions-table-container {
    max-height: calc(100vh - 250px);
  }
}
</style>
