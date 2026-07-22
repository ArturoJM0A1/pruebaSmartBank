<!--
  TransactionHistory - Vue Component
  
  TELEPORT:
  - Renders content in a different place in the DOM
  - Useful for: modals, tooltips, notifications
  - <Teleport to="body"> moves content to <body>
  - Why? Avoids CSS overflow/z-index issues
  
  SUSPENSE (mentioned, not fully used here):
  - Handles async components
  - Shows fallback while loading
  - <Suspense> wraps async components
  - Shows <template #fallback> while loading
-->
<script setup>
import { ref, computed, watch } from 'vue';
import { useFetch } from '../composables/useFetch';
import { useDebounce } from '../composables/useDebounce';
import { formatCurrency, formatDate } from '../utils/helpers';

const dateFrom = ref('');
const dateTo = ref('');
const minAmount = ref('');
const maxAmount = ref('');
const sortBy = ref('date');
const sortOrder = ref('desc');

const debouncedMinAmount = useDebounce(minAmount, 500);
const debouncedMaxAmount = useDebounce(maxAmount, 500);

// Computed URL for API call
const apiUrl = computed(() => {
  const params = new URLSearchParams();
  if (dateFrom.value) params.set('from', dateFrom.value);
  if (dateTo.value) params.set('to', dateTo.value);
  if (debouncedMinAmount.value) params.set('minAmount', debouncedMinAmount.value);
  if (debouncedMaxAmount.value) params.set('maxAmount', debouncedMaxAmount.value);
  return `/transactions?${params.toString()}`;
});

const { data: transactions, loading, error } = useFetch(apiUrl);

// WHY computed for sorting?
// Automatically re-sorts when data or sort settings change
// Cached: only recalculates when dependencies change
const sortedTransactions = computed(() => {
  if (!transactions.value) return [];
  
  return [...transactions.value].sort((a, b) => {
    let comparison = 0;
    switch (sortBy.value) {
      case 'date':
        comparison = new Date(a.date) - new Date(b.date);
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'description':
        comparison = a.description.localeCompare(b.description);
        break;
    }
    return sortOrder.value === 'asc' ? comparison : -comparison;
  });
});

function toggleSort(field) {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortOrder.value = 'asc';
  }
}

function resetFilters() {
  dateFrom.value = '';
  dateTo.value = '';
  minAmount.value = '';
  maxAmount.value = '';
}
</script>

<template>
  <div class="transaction-history">
    <h1>Transaction History</h1>

    <div class="filters">
      <div class="filter-group">
        <label>From:</label>
        <input v-model="dateFrom" type="date" />
      </div>
      <div class="filter-group">
        <label>To:</label>
        <input v-model="dateTo" type="date" />
      </div>
      <div class="filter-group">
        <label>Min Amount:</label>
        <input v-model="minAmount" type="number" placeholder="0" />
      </div>
      <div class="filter-group">
        <label>Max Amount:</label>
        <input v-model="maxAmount" type="number" placeholder="Infinity" />
      </div>
      <button @click="resetFilters" class="btn-secondary">
        Reset Filters
      </button>
    </div>

    <div v-if="loading" class="loading-spinner">
      Loading transactions...
    </div>

    <div v-else-if="error" class="error-message">
      Error: {{ error }}
    </div>

    <template v-else>
      <table class="transactions-table">
        <thead>
          <tr>
            <th @click="toggleSort('date')">
              Date
              <span v-if="sortBy === 'date'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th @click="toggleSort('description')">
              Description
              <span v-if="sortBy === 'description'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th>From</th>
            <th>To</th>
            <th @click="toggleSort('amount')">
              Amount
              <span v-if="sortBy === 'amount'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in sortedTransactions" :key="tx.id">
            <td>{{ formatDate(tx.date) }}</td>
            <td>{{ tx.description }}</td>
            <td>{{ tx.fromAccount }}</td>
            <td>{{ tx.toAccount }}</td>
            <td :class="{ positive: tx.amount >= 0, negative: tx.amount < 0 }">
              {{ formatCurrency(tx.amount) }}
            </td>
            <td>
              <span :class="'status-' + tx.status">{{ tx.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="sortedTransactions.length === 0" class="empty-state">
        No transactions found.
      </p>
    </template>
  </div>
</template>
