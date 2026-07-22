/**
 * LoginForm - React Component with react-hook-form
 * 
 * WHY react-hook-form?
 * - Uncontrolled by default: fewer re-renders (only re-renders on errors)
 * - Built-in validation with schemas (Yup, Zod)
 * - Smaller bundle (~8kb) vs Formik (~44kb)
 * - Better TypeScript support out of the box
 * 
 * FORM HANDLING PATTERNS:
 * 1. useState for each field: Simple but verbose, many re-renders
 * 2. useReducer: Complex forms, centralized state
 * 3. Formik: Popular but heavy, class-component era
 * 4. react-hook-form: Modern, performant, hooks-based
 * 5. Component library: MUI, Ant Design (most production-ready)
 * 
 * VALIDATION STRATEGIES:
 * - On submit: Show errors when user tries to submit
 * - On blur: Show errors when user leaves field (recommended)
 * - On change: Show errors as user types (can be annoying)
 * - Real-time: Validate against API as user types (for availability)
 */
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// WHY Zod for validation?
// - TypeScript-first: schema defines the type automatically
// - Composable: build complex schemas from simple ones
// - Runtime validation: catches errors at runtime, not just compile time
// - Great error messages out of the box
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  rememberMe: z.boolean().optional(),
});

export default function LoginForm() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  // WHY useForm with zodResolver?
  // Connects Zod schema to react-hook-form automatically
  // Provides: validation, error messages, type safety
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // WHY async onSubmit?
  // Handles API calls, shows loading state, catches errors
  const onSubmit = async (data) => {
    const success = await login(data);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>SmartBank Login</h1>
        
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={errors.email ? 'input-error' : ''}
            />
            {/* WHY conditional rendering for errors? */}
            {/* Only shows error for touched + invalid fields */}
            {errors.email && (
              <span className="error-message">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
          </div>

          <div className="form-group checkbox">
            <label>
              <input type="checkbox" {...register('rememberMe')} />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="btn-primary"
          >
            {/* WHY conditional text? */}
            {/* Clear feedback during async operations */}
            {isSubmitting || loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
