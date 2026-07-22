/**
 * useForm - Custom Hook for Form Management
 * 
 * CONTROLLED vs UNCONTROLLED components:
 * - Controlled: React state is the "single source of truth"
 *   → input value={state} onChange={handler}
 *   → Full control, easy validation, but more renders
 * 
 * - Uncontrolled: DOM is the source of truth, read with refs
 *   → input defaultValue={state} ref={inputRef}
 *   → Simpler code, fewer renders, but less control
 * 
 * WHY react-hook-form instead of custom useForm?
 * - useForm is educational; react-hook-form is production-ready
 * - react-hook-form: uncontrolled by default (fewer re-renders)
 * - react-hook-form: built-in validation (Yup, Zod, custom)
 * - react-hook-form: smaller bundle (~8kb vs Formik's ~44kb)
 * 
 * This hook is for learning - SmartBank uses react-hook-form in LoginForm
 */
import { useState, useCallback } from 'react';

export function useForm(initialValues = {}, validate = null) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    setValues((prev) => ({
      ...prev,
      // WHY ternary for checkbox?
      // Checkboxes use "checked" instead of "value"
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // WHY clear error on change?
    // Immediate feedback when user corrects an error
    // Improves UX compared to only clearing on blur
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Validate single field on blur (better UX than on every keystroke)
    if (validate) {
      const fieldErrors = validate(values);
      if (fieldErrors[name]) {
        setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
      }
    }
  }, [values, validate]);

  const handleSubmit = useCallback(
    async (onSubmit) => {
      // Validate all fields before submission
      if (validate) {
        const formErrors = validate(values);
        setErrors(formErrors);
        
        // Mark all fields as touched to show all errors
        const allTouched = Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        );
        setTouched(allTouched);
        
        // WHY early return on validation failure?
        // Prevents unnecessary async work
        if (Object.keys(formErrors).length > 0) {
          return false;
        }
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
        return true;
      } catch (err) {
        setErrors({ submit: err.message });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
    setErrors,
  };
}
