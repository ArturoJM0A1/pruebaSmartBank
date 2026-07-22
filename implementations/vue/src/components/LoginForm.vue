<!--
  LoginForm - Vue Component
  
  TEMPLATE REFS:
  - Access DOM elements directly from <script setup>
  - Use sparingly (Vue's reactivity handles most cases)
  - Good for: focus management, third-party libraries, animations
  
  VEEVALIDATE vs MANUAL VALIDATION:
  - VeeValidate: Production-ready, schema-based, field-level validation
  - Manual: More control, less dependencies, educational
  - This example shows manual validation for learning
-->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useForm } from '../composables/useForm';

const router = useRouter();
const { login, loading, error } = useAuth();

// Validation function
function validateLogin(values) {
  const errors = {};
  
  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  return errors;
}

const {
  values,
  errors: formErrors,
  touched,
  handleBlur,
  handleSubmit,
} = useForm(
  { email: '', password: '', rememberMe: false },
  validateLogin
);

async function onSubmit(data) {
  const success = await login(data);
  if (success) {
    router.push('/dashboard');
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>SmartBank Login</h1>

      <!-- WHY v-if over v-show for error banner? -->
      <!-- v-if removes element from DOM (saves memory) -->
      <!-- v-show only hides with CSS (keeps in DOM) -->
      <!-- Use v-show for frequently toggled elements -->
      <div v-if="error" class="error-banner" role="alert">
        {{ error }}
      </div>

      <!--
        WHY @submit.prevent instead of @submit?
        .prevent modifier calls event.preventDefault()
        Prevents page reload on form submission
        Equivalent to: @submit.prevent="handleSubmit(onSubmit)"
      -->
      <form @submit.prevent="handleSubmit(onSubmit)">
        <div class="form-group">
          <label for="email">Email</label>
          <!--
            v-model binds input value to values.email
            @blur triggers validation for this field
            :class dynamically adds error class
          -->
          <input
            id="email"
            v-model="values.email"
            type="email"
            :class="{ 'input-error': formErrors.email }"
            @blur="handleBlur('email')"
          />
          <!--
            WHY v-if for errors?
            Only render error message when it exists
            Better for performance than v-show
          -->
          <span v-if="formErrors.email" class="error-message">
            {{ formErrors.email }}
          </span>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="values.password"
            type="password"
            :class="{ 'input-error': formErrors.password }"
            @blur="handleBlur('password')"
          />
          <span v-if="formErrors.password" class="error-message">
            {{ formErrors.password }}
          </span>
        </div>

        <div class="form-group checkbox">
          <label>
            <input v-model="values.rememberMe" type="checkbox" />
            Remember me
          </label>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn-primary"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>
