/**
 * ============================================================================
 * Form Utilities
 * ============================================================================
 * 
 * PURPOSE:
 * Form creation, validation, and state management utilities.
 * 
 * FORM PATTERNS:
 * 
 * 1. CONTROLLED (React style):
 *    - Form state stored in JavaScript
 *    - Every keystroke updates state
 *    - State drives the UI
 *    - More control, more code
 * 
 * 2. UNCONTROLLED (Traditional):
 *    - Form state stored in DOM
 *    - Read values when needed
 *    - Less code, less control
 * 
 * 3. HYBRID (what we do):
 *    - Use DOM for values
 *    - JavaScript for validation
 *    - Best of both worlds
 * 
 * FORM VALIDATION:
 * - On submit: Validate all fields
 * - On blur: Validate single field (better UX)
 * - On change: Validate as user types (can be annoying)
 * 
 * RELATED CONCEPTS:
 * - Form libraries: Formik, React Hook Form, Vue Formulate
 * - Controlled vs Uncontrolled components
 * - Form state management
 * - Client-side validation
 * ============================================================================
 */

import { $, createElement, on, addClass, removeClass } from '../../utils/dom.js';

/**
 * createForm - Create a form with validation
 * 
 * @param {Object} config - Form configuration
 * @param {Array} config.fields - Field definitions
 * @param {Function} config.onSubmit - Submit handler
 * @param {Function} config.onChange - Change handler
 * @returns {Object} Form instance
 */
export function createForm(config) {
    const {
        fields = [],
        onSubmit = null,
        onChange = null,
        className = '',
    } = config;
    
    const state = {
        values: {},
        errors: {},
        touched: {},
        isSubmitting: false,
    };
    
    // Initialize values
    fields.forEach(field => {
        state.values[field.name] = field.defaultValue || '';
    });
    
    let formElement = null;
    
    /**
     * render - Create form DOM
     * 
     * @returns {Element} Form element
     */
    function render() {
        formElement = createElement('form', {
            className: `form ${className}`,
            novalidate: true, // We handle validation ourselves
        },
            ...fields.map(field => renderField(field)),
            
            createElement('div', { className: 'form__actions' },
                createElement('button', {
                    type: 'submit',
                    className: 'btn btn--primary',
                }, 'Enviar')
            )
        );
        
        // Add event listeners
        on(formElement, 'submit', handleSubmit);
        
        // Add change listeners to all inputs
        fields.forEach(field => {
            const input = formElement.querySelector(`[name="${field.name}"]`);
            if (input) {
                on(input, 'input', (e) => handleFieldChange(field.name, e.target.value));
                on(input, 'blur', () => handleFieldBlur(field.name));
            }
        });
        
        return formElement;
    }
    
    /**
     * renderField - Render a form field
     * 
     * @param {Object} field - Field configuration
     * @returns {Element} Field element
     */
    function renderField(field) {
        const { name, label, type = 'text', placeholder = '', required = false, options = [] } = field;
        const value = state.values[name] || '';
        const error = state.errors[name];
        const touched = state.touched[name];
        
        let input;
        
        switch (type) {
            case 'select':
                input = createElement('select', {
                    name,
                    className: `form__input ${error && touched ? 'form__input--error' : ''}`,
                    required,
                },
                    createElement('option', { value: '' }, 'Seleccionar...'),
                    ...options.map(opt => 
                        createElement('option', { 
                            value: opt.value,
                            selected: opt.value === value,
                        }, opt.label)
                    )
                );
                break;
                
            case 'textarea':
                input = createElement('textarea', {
                    name,
                    className: `form__input ${error && touched ? 'form__input--error' : ''}`,
                    placeholder,
                    rows: 4,
                    required,
                }, value);
                break;
                
            case 'checkbox':
                input = createElement('label', { className: 'form__checkbox' },
                    createElement('input', {
                        type: 'checkbox',
                        name,
                        checked: value,
                        onChange: (e) => handleFieldChange(name, e.target.checked),
                    }),
                    createElement('span', { className: 'form__checkbox-label' }, label)
                );
                
                return createElement('div', { className: 'form__group form__group--checkbox' }, input);
                
            default:
                input = createElement('input', {
                    type,
                    name,
                    value,
                    className: `form__input ${error && touched ? 'form__input--error' : ''}`,
                    placeholder,
                    required,
                });
        }
        
        return createElement('div', { className: 'form__group' },
            createElement('label', { 
                className: 'form__label',
                for: name,
            }, label + (required ? ' *' : '')),
            input,
            error && touched ? createElement('span', { className: 'form__error' }, error) : null
        );
    }
    
    /**
     * handleFieldChange - Handle field value change
     * 
     * @param {string} fieldName - Field name
     * @param {*} value - New value
     */
    function handleFieldChange(fieldName, value) {
        state.values[fieldName] = value;
        
        // Clear error on change
        if (state.errors[fieldName]) {
            delete state.errors[fieldName];
        }
        
        if (onChange) {
            onChange(state.values);
        }
    }
    
    /**
     * handleFieldBlur - Handle field blur (validate)
     * 
     * @param {string} fieldName - Field name
     */
    function handleFieldBlur(fieldName) {
        state.touched[fieldName] = true;
        
        // Validate single field
        const field = fields.find(f => f.name === fieldName);
        if (field && field.validate) {
            const error = field.validate(state.values[fieldName], state.values);
            if (error) {
                state.errors[fieldName] = error;
            }
        }
    }
    
    /**
     * handleSubmit - Handle form submission
     * 
     * @param {Event} e - Submit event
     */
    async function handleSubmit(e) {
        e.preventDefault();
        
        // Mark all fields as touched
        fields.forEach(field => {
            state.touched[field.name] = true;
        });
        
        // Validate all fields
        const errors = validateAll();
        
        if (Object.keys(errors).length > 0) {
            state.errors = errors;
            _update();
            return;
        }
        
        // Submit
        if (onSubmit) {
            state.isSubmitting = true;
            _update();
            
            try {
                await onSubmit(state.values);
            } catch (error) {
                console.error('Form submission error:', error);
            } finally {
                state.isSubmitting = false;
                _update();
            }
        }
    }
    
    /**
     * validateAll - Validate all fields
     * 
     * @returns {Object} Errors object
     */
    function validateAll() {
        const errors = {};
        
        fields.forEach(field => {
            if (field.validate) {
                const error = field.validate(state.values[field.name], state.values);
                if (error) {
                    errors[field.name] = error;
                }
            }
            
            // Required validation
            if (field.required && !state.values[field.name]) {
                errors[field.name] = `${field.label} es obligatorio`;
            }
        });
        
        return errors;
    }
    
    /**
     * _update - Update form display
     */
    function _update() {
        if (!formElement) return;
        
        // Update field values and errors
        fields.forEach(field => {
            const input = formElement.querySelector(`[name="${field.name}"]`);
            const errorEl = formElement.querySelector(`[data-error="${field.name}"]`);
            
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = state.values[field.name];
                } else {
                    input.value = state.values[field.name] || '';
                }
                
                // Update error class
                if (state.errors[field.name] && state.touched[field.name]) {
                    addClass(input, 'form__input--error');
                } else {
                    removeClass(input, 'form__input--error');
                }
            }
            
            if (errorEl) {
                errorEl.textContent = state.errors[field.name] || '';
            }
        });
        
        // Update submit button
        const submitBtn = formElement.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = state.isSubmitting;
            submitBtn.textContent = state.isSubmitting ? 'Enviando...' : 'Enviar';
        }
    }
    
    /**
     * setValues - Set multiple field values
     * 
     * @param {Object} values - Field values
     */
    function setValues(values) {
        Object.assign(state.values, values);
        _update();
    }
    
    /**
     * setErrors - Set multiple field errors
     * 
     * @param {Object} errors - Field errors
     */
    function setErrors(errors) {
        state.errors = errors;
        _update();
    }
    
    /**
     * reset - Reset form to initial state
     */
    function reset() {
        fields.forEach(field => {
            state.values[field.name] = field.defaultValue || '';
        });
        state.errors = {};
        state.touched = {};
        _update();
    }
    
    /**
     * getValues - Get current form values
     * 
     * @returns {Object} Form values
     */
    function getValues() {
        return { ...state.values };
    }
    
    /**
     * isValid - Check if form is valid
     * 
     * @returns {boolean} True if form is valid
     */
    function isValid() {
        return Object.keys(validateAll()).length === 0;
    }
    
    return {
        render,
        setValues,
        setErrors,
        reset,
        getValues,
        isValid,
        validate: validateAll,
    };
}

export default createForm;