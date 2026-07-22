<!--
  TransferForm - Multi-Step Vue Component
  
  PROVIDE/INJECT:
  - Vue's dependency injection system
  - Parent provides data, any descendant can inject it
  - WHY? Avoids "prop drilling" (passing props through many levels)
  - Similar to React's Context API
  - BUT: Not reactive by default (must use reactive/ref)
  
  MULTI-STEP FORMS in Vue:
  - v-if/v-else-if to show current step
  - Keep form state in reactive() for persistence
  - Each step can be a separate component
  - Use provide/inject to share form state
-->
<script setup>
import { ref, reactive, computed, provide } from 'vue';
import { useAccountStore } from '../store/accounts';
import { api } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const accountStore = useAccountStore();
const step = ref(1);
const isSubmitting = ref(false);
const result = ref(null);

// Form data persists across steps
const formData = reactive({
  fromAccountId: '',
  toAccountId: '',
  amount: 0,
  description: '',
});

// Validation errors per step
const errors = reactive({
  fromAccountId: '',
  toAccountId: '',
  amount: '',
  description: '',
});

// WHY provide form state to child components?
// If steps were separate components, they could inject this
provide('transferForm', { formData, errors });

// Computed validation for step 1
const isStep1Valid = computed(() => {
  return formData.fromAccountId && formData.toAccountId;
});

// Computed validation for step 2
const isStep2Valid = computed(() => {
  return formData.amount > 0 && formData.description.length > 0;
});

function validateStep1() {
  errors.fromAccountId = formData.fromAccountId ? '' : 'Select a source account';
  errors.toAccountId = formData.toAccountId ? '' : 'Select a destination account';
  return !errors.fromAccountId && !errors.toAccountId;
}

function validateStep2() {
  errors.amount = formData.amount > 0 ? '' : 'Amount must be positive';
  errors.description = formData.description ? '' : 'Description is required';
  return !errors.amount && !errors.description;
}

function nextStep() {
  if (step.value === 1 && validateStep1()) {
    step.value = 2;
  } else if (step.value === 2 && validateStep2()) {
    step.value = 3;
  }
}

function prevStep() {
  step.value--;
}

async function confirmTransfer() {
  isSubmitting.value = true;
  try {
    const response = await api.post('/transfers', {
      fromAccountId: formData.fromAccountId,
      toAccountId: formData.toAccountId,
      amount: formData.amount,
      description: formData.description,
    });
    result.value = { success: true, transactionId: response.data.id };
  } catch (err) {
    result.value = {
      success: false,
      error: err.response?.data?.message || 'Transfer failed',
    };
  } finally {
    isSubmitting.value = false;
  }
}

function resetForm() {
  step.value = 1;
  formData.fromAccountId = '';
  formData.toAccountId = '';
  formData.amount = 0;
  formData.description = '';
  result.value = null;
}

// Account helper
function getAccountName(id) {
  const account = accountStore.accounts.find((a) => a.id === id);
  return account ? account.name : 'Unknown';
}
</script>

<template>
  <div class="transfer-form">
    <h1>Transfer Money</h1>

    <!-- Step indicator -->
    <div class="step-indicator">
      <div
        v-for="s in 3"
        :key="s"
        class="step"
        :class="{ active: step === s, completed: step > s }"
      >
        <span class="step-number">{{ s }}</span>
        <span class="step-label">
          {{ s === 1 ? 'Accounts' : s === 2 ? 'Details' : 'Confirm' }}
        </span>
      </div>
    </div>

    <!-- Result screen -->
    <div v-if="result" class="transfer-result">
      <h2>{{ result.success ? 'Transfer Complete!' : 'Transfer Failed' }}</h2>
      <p v-if="result.success">Transaction ID: {{ result.transactionId }}</p>
      <p v-else class="error">{{ result.error }}</p>
      <button @click="resetForm">New Transfer</button>
    </div>

    <!-- Step 1: Select Accounts -->
    <form v-else-if="step === 1" @submit.prevent="nextStep">
      <h2>Select Accounts</h2>

      <div class="form-group">
        <label>From Account</label>
        <select v-model="formData.fromAccountId">
          <option value="">Select account</option>
          <option
            v-for="account in accountStore.accounts"
            :key="account.id"
            :value="account.id"
          >
            {{ account.name }} ({{ formatCurrency(account.balance) }})
          </option>
        </select>
        <span v-if="errors.fromAccountId" class="error-message">
          {{ errors.fromAccountId }}
        </span>
      </div>

      <div class="form-group">
        <label>To Account</label>
        <select v-model="formData.toAccountId">
          <option value="">Select account</option>
          <option
            v-for="account in accountStore.accounts"
            :key="account.id"
            :value="account.id"
          >
            {{ account.name }}
          </option>
        </select>
        <span v-if="errors.toAccountId" class="error-message">
          {{ errors.toAccountId }}
        </span>
      </div>

      <button type="submit">Next</button>
    </form>

    <!-- Step 2: Enter Amount -->
    <form v-else-if="step === 2" @submit.prevent="nextStep">
      <h2>Transfer Details</h2>

      <div class="form-group">
        <label>Amount</label>
        <!--
          v-model.number modifier converts input to number
          Alternative: v-model="formData.amount" with type="number"
        -->
        <input
          v-model.number="formData.amount"
          type="number"
          step="0.01"
          min="0.01"
        />
        <span v-if="errors.amount" class="error-message">
          {{ errors.amount }}
        </span>
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea v-model="formData.description" rows="3"></textarea>
        <span v-if="errors.description" class="error-message">
          {{ errors.description }}
        </span>
      </div>

      <div class="step-actions">
        <button type="button" @click="prevStep">Back</button>
        <button type="submit">Review</button>
      </div>
    </form>

    <!-- Step 3: Confirm -->
    <div v-else-if="step === 3" class="transfer-confirm">
      <h2>Confirm Transfer</h2>
      <div class="confirm-details">
        <p><strong>From:</strong> {{ getAccountName(formData.fromAccountId) }}</p>
        <p><strong>To:</strong> {{ getAccountName(formData.toAccountId) }}</p>
        <p><strong>Amount:</strong> {{ formatCurrency(formData.amount) }}</p>
        <p><strong>Description:</strong> {{ formData.description }}</p>
      </div>
      <div class="step-actions">
        <button @click="prevStep">Back</button>
        <button :disabled="isSubmitting" @click="confirmTransfer">
          {{ isSubmitting ? 'Processing...' : 'Confirm Transfer' }}
        </button>
      </div>
    </div>
  </div>
</template>
