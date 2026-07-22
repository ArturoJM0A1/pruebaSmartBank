/**
 * useForm Composable
 * 
 * V-MODEL in Vue:
 * - Two-way data binding directive
 * - Syntactic sugar for :value + @input
 * - <input v-model="name"> === <input :value="name" @input="name = $event.target.value">
 * - Works with <input>, <textarea>, <select>
 * - Supports modifiers: .lazy, .number, .trim
 * 
 * VUE REACTIVE FORMS vs TEMPLATE DRIVEN:
 * - Template-driven (v-model): Simple, quick, less boilerplate
 * - Reactive (Form/VeeValidate): More control, better validation
 * 
 * This composable uses v-model approach for simplicity
 * For complex forms, consider VeeValidate or FormKit
 */
import { reactive, computed } from 'vue';

export function useForm(initialValues = {}, validateFn = null) {
  // WHY reactive instead of ref for forms?
  // reactive lets us access form.field directly
  // ref would require form.value.field (more verbose)
  // For forms with many fields, reactive is cleaner
  const values = reactive({ ...initialValues });
  const errors = reactive({});
  const touched = reactive({});

  // WHY computed for isValid?
  // Automatically updates when errors change
  // Cached: only recalculates when dependencies change
  const isValid = computed(() => {
    return Object.values(errors).every((err) => !err);
  });

  const isDirty = computed(() => {
    return Object.keys(values).some(
      (key) => values[key] !== initialValues[key]
    );
  });

  function setFieldValue(field, value) {
    values[field] = value;
    // Clear error when field changes
    if (errors[field]) {
      errors[field] = null;
    }
  }

  function setFieldError(field, message) {
    errors[field] = message;
  }

  function handleBlur(field) {
    touched[field] = true;
    // Validate single field on blur
    if (validateFn) {
      const fieldErrors = validateFn(values);
      if (fieldErrors[field]) {
        errors[field] = fieldErrors[field];
      }
    }
  }

  async function handleSubmit(onSubmit) {
    // Validate all fields
    if (validateFn) {
      const formErrors = validateFn(values);
      Object.assign(errors, formErrors);
      
      // Mark all fields as touched
      Object.keys(values).forEach((key) => {
        touched[key] = true;
      });
      
      if (Object.values(formErrors).some((err) => err)) {
        return false;
      }
    }

    try {
      await onSubmit({ ...values });
      return true;
    } catch (err) {
      errors.submit = err.message;
      return false;
    }
  }

  function reset() {
    Object.assign(values, initialValues);
    Object.keys(errors).forEach((key) => {
      errors[key] = null;
    });
    Object.keys(touched).forEach((key) => {
      touched[key] = false;
    });
  }

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    setFieldValue,
    setFieldError,
    handleBlur,
    handleSubmit,
    reset,
  };
}
