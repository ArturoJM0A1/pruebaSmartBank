/**
 * TransferForm - Multi-Step Form Component
 * 
 * MULTI-STEP FORMS in React:
 * - Break complex forms into manageable steps
 * - Each step validates before proceeding
 * - Preserve form state across steps
 * - Common patterns: wizard, stepper, multi-page form
 * 
 * STEP MANAGEMENT approaches:
 * 1. useState with step counter (this implementation)
 * 2. useReducer for complex state machines
 * 3. Third-party: react-step-wizard, formik multi-step
 * 4. URL-based: Each step has its own route
 * 
 * FORM STATE across steps:
 * - LIFT STATE UP: Parent holds all form data
 * - Each step only reads/writes its portion
 * - Final step submits everything
 * - WHY? Single source of truth, easy validation
 */
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import { api } from '../services/api';
import { formatCurrency } from '../utils/helpers';

// Step 1: Select accounts
const step1Schema = z.object({
  fromAccountId: z.string().min(1, 'Please select a source account'),
  toAccountId: z.string().min(1, 'Please select a destination account'),
});

// Step 2: Enter amount and details
const step2Schema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(0.01, 'Minimum transfer amount is $0.01'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description must be 200 characters or less'),
});

// Step 3: Confirm (no additional validation needed)

export default function TransferForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  
  const { data: accounts } = useSelector((state) => state.accounts);

  // WHY separate form instances per step?
  // Each step has its own validation schema
  // Cleaner than one massive schema for everything
  const step1Form = useForm({
    resolver: zodResolver(step1Schema),
  });

  const step2Form = useForm({
    resolver: zodResolver(step2Schema),
  });

  // WHY useCallback for step handlers?
  // Stable references prevent unnecessary re-renders
  const handleStep1Submit = useCallback((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  }, []);

  const handleStep2Submit = useCallback((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(3);
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/transfers', {
        fromAccountId: formData.fromAccountId,
        toAccountId: formData.toAccountId,
        amount: formData.amount,
        description: formData.description,
      });
      setResult({ success: true, transactionId: response.data.id });
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const handleBack = useCallback(() => {
    setStep((prev) => prev - 1);
  }, []);

  // WHY render function instead of ternary?
  // More readable for multi-step forms
  // Each step's logic is clearly separated
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={step1Form.handleSubmit(handleStep1Submit)}>
            <h2>Select Accounts</h2>
            
            <div className="form-group">
              <label>From Account</label>
              <select {...step1Form.register('fromAccountId')}>
                <option value="">Select account</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
              {step1Form.formState.errors.fromAccountId && (
                <span className="error">
                  {step1Form.formState.errors.fromAccountId.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label>To Account</label>
              <select {...step1Form.register('toAccountId')}>
                <option value="">Select account</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              {step1Form.formState.errors.toAccountId && (
                <span className="error">
                  {step1Form.formState.errors.toAccountId.message}
                </span>
              )}
            </div>

            <button type="submit">Next</button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={step2Form.handleSubmit(handleStep2Submit)}>
            <h2>Transfer Details</h2>
            
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                {...step2Form.register('amount', { valueAsNumber: true })}
              />
              {step2Form.formState.errors.amount && (
                <span className="error">
                  {step2Form.formState.errors.amount.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                {...step2Form.register('description')}
                rows={3}
              />
              {step2Form.formState.errors.description && (
                <span className="error">
                  {step2Form.formState.errors.description.message}
                </span>
              )}
            </div>

            <div className="step-actions">
              <button type="button" onClick={handleBack}>
                Back
              </button>
              <button type="submit">Review</button>
            </div>
          </form>
        );

      case 3:
        if (result) {
          return (
            <div className="transfer-result">
              <h2>{result.success ? 'Transfer Complete!' : 'Transfer Failed'}</h2>
              {result.success ? (
                <p>Transaction ID: {result.transactionId}</p>
              ) : (
                <p className="error">{result.error}</p>
              )}
              <button onClick={() => { setStep(1); setFormData({}); setResult(null); }}>
                New Transfer
              </button>
            </div>
          );
        }

        return (
          <div className="transfer-confirm">
            <h2>Confirm Transfer</h2>
            <div className="confirm-details">
              <p><strong>From:</strong> {accounts?.find((a) => a.id === formData.fromAccountId)?.name}</p>
              <p><strong>To:</strong> {accounts?.find((a) => a.id === formData.toAccountId)?.name}</p>
              <p><strong>Amount:</strong> {formatCurrency(formData.amount)}</p>
              <p><strong>Description:</strong> {formData.description}</p>
            </div>
            <div className="step-actions">
              <button onClick={handleBack}>Back</button>
              <button onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="transfer-form">
      <h1>Transfer Money</h1>
      
      {/* Step indicator */}
      <div className="step-indicator">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`step ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
          >
            <span className="step-number">{s}</span>
            <span className="step-label">
              {s === 1 ? 'Accounts' : s === 2 ? 'Details' : 'Confirm'}
            </span>
          </div>
        ))}
      </div>

      {renderStep()}
    </div>
  );
}
