<!--
  Dashboard - Vue Component
  
  COMPUTED PROPERTIES vs WATCHERS:
  - computed: Derive values from reactive state (cached)
    → Use when you need a derived value in the template
    → Runs only when dependencies change
  
  - watch: Run side effects when data changes
    → Use when you need to do something (API call, log, etc.)
    → Can access both old and new values
  
  WHY computed is preferred over methods in templates?
  - Methods run on every re-render
  - Computed properties cache and only recalculate when needed
  - Templates call computed properties like properties, not methods
-->
<script setup>
import { computed } from 'vue';
import { useAuth } from '../composables/useAuth';
import { useFetch } from '../composables/useFetch';
import { formatCurrency, formatDate } from '../utils/helpers';

const { user } = useAuth();

// useFetch returns reactive refs
const { data: accounts, loading: accountsLoading } = useFetch('/accounts');
const { data: recentTransactions, loading: transactionsLoading } = useFetch(
  '/transactions?limit=5'
);

// WHY computed for derived data?
// - Automatically updates when accounts change
// - Cached: total balance only recalculates when accounts change
// - Cleaner than putting logic in the template
const totalBalance = computed(() => {
  if (!accounts.value) return 0;
  return accounts.value.reduce((sum, account) => sum + account.balance, 0);
});

const isLoading = computed(() => accountsLoading.value || transactionsLoading.value);
</script>

<template>
  <div class="dashboard">
    <!--
      WHY v-if for loading state?
      Shows loading spinner only while data is being fetched
      Removes it from DOM when done (not just hidden)
    -->
    <div v-if="isLoading" class="loading-spinner">
      Loading dashboard...
    </div>

    <template v-else>
      <header class="dashboard-header">
        <!--
          {{ user?.name }} uses optional chaining
          Vue 3.3+ supports optional chaining in templates
        -->
        <h1>Welcome, {{ user?.name || 'User' }}</h1>
        <p class="dashboard-date">{{ formatDate(new Date()) }}</p>
      </header>

      <!-- Total balance summary -->
      <section class="balance-summary">
        <h2>Total Balance</h2>
        <p class="total-balance">{{ formatCurrency(totalBalance) }}</p>
      </section>

      <section class="accounts-summary">
        <h2>Account Overview</h2>
        <!--
          WHY v-else-if and v-else?
          Vue provides conditional rendering directives
          Cleaner than multiple v-if statements
        -->
        <div v-if="accounts?.length > 0" class="account-cards">
          <!--
            WHY :key="account.id"?
            Same as React's key prop
            Helps Vue track and efficiently update list items
          -->
          <div
            v-for="account in accounts"
            :key="account.id"
            class="account-card"
          >
            <h3>{{ account.name }}</h3>
            <p class="account-type">{{ account.type }}</p>
            <p class="account-balance">{{ formatCurrency(account.balance) }}</p>
          </div>
        </div>
        <p v-else class="empty-state">No accounts found.</p>
      </section>

      <section class="recent-transactions">
        <h2>Recent Transactions</h2>
        <table v-if="recentTransactions?.length > 0" class="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in recentTransactions" :key="tx.id">
              <td>{{ formatDate(tx.date) }}</td>
              <td>{{ tx.description }}</td>
              <!--
                WHY :class with object syntax?
                :class="{ positive: tx.amount >= 0 }"
                Conditionally applies CSS class
              -->
              <td :class="{ positive: tx.amount >= 0, negative: tx.amount < 0 }">
                {{ formatCurrency(tx.amount) }}
              </td>
              <td>
                <span :class="'status-' + tx.status">{{ tx.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty-state">No recent transactions.</p>
      </section>
    </template>
  </div>
</template>
