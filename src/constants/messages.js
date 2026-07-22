/**
 * ============================================================================
 * UI Messages & Error Messages
 * ============================================================================
 * 
 * PURPOSE:
 * Centralizes ALL user-facing messages in one file. This is crucial for:
 * 
 * 1. INTERNATIONALIZATION (i18n) READINESS:
 *    - If you ever translate the app to English, you only change THIS file
 *    - Structure supports future i18n libraries (i18next, formatjs)
 *    - Messages are organized by context (success, error, info)
 * 
 * 2. CONSISTENCY:
 *    - Same message shown everywhere (no "Transfer successful" vs "Transfer complete")
 *    - Professional, consistent tone across the application
 * 
 * 3. MAINTENANCE:
 *    - Fix a typo in one place, it updates everywhere
 *    - Easy to review all user-facing text
 * 
 * 4. TESTING:
 *    - Can test UI with these constants: expect(element.textContent).toBe(MESSAGES.SUCCESS.LOGIN)
 * 
 * i18n FUTURE STRUCTURE:
 * Instead of: MESSAGES.SUCCESS.LOGIN
 * You'd use: t('success.login') where t() is the translation function
 * 
 * Example with i18next:
 * - en.json: { "success": { "login": "Login successful" } }
 * - es.json: { "success": { "login": "Inicio de sesión exitoso" } }
 * ============================================================================
 */

/**
 * SUCCESS_MESSAGES - Positive feedback for user actions
 * 
 * WHY: Users need confirmation that their action completed successfully.
 * Without feedback, users might click multiple times or think it didn't work.
 * 
 * Design principle: Be specific but concise.
 * Bad: "Operation completed successfully" (too vague)
 * Good: "Transfer completed successfully" (tells what happened)
 */
export const SUCCESS_MESSAGES = Object.freeze({
    // Authentication
    LOGIN: 'Inicio de sesión exitoso',
    REGISTER: 'Cuenta creada exitosamente',
    LOGOUT: 'Sesión cerrada exitosamente',
    PASSWORD_CHANGED: 'Contraseña actualizada exitosamente',
    PASSWORD_RESET: 'Contraseña restablecida exitosamente',
    EMAIL_VERIFIED: 'Correo electrónico verificado exitosamente',

    // Accounts
    ACCOUNT_CREATED: 'Cuenta creada exitosamente',
    ACCOUNT_UPDATED: 'Cuenta actualizada exitosamente',
    ACCOUNT_CLOSED: 'Cuenta cerrada exitosamente',

    // Transactions
    TRANSFER_COMPLETED: 'Transferencia completada exitosamente',
    DEPOSIT_COMPLETED: 'Depósito registrado exitosamente',
    WITHDRAWAL_COMPLETED: 'Retiro completado exitosamente',
    PAYMENT_COMPLETED: 'Pago procesado exitosamente',

    // Cards
    CARD_ACTIVATED: 'Tarjeta activada exitosamente',
    CARD_BLOCKED: 'Tarjeta bloqueada exitosamente',
    CARD_UNBLOCKED: 'Tarjeta desbloqueada exitosamente',

    // Profile
    PROFILE_UPDATED: 'Perfil actualizado exitosamente',
    SETTINGS_SAVED: 'Configuración guardada exitosamente',
    PREFERENCES_UPDATED: 'Preferencias actualizadas exitosamente',

    // Beneficiaries
    BENEFICIARY_ADDED: 'Beneficiario agregado exitosamente',
    BENEFICIARY_UPDATED: 'Beneficiario actualizado exitosamente',
    BENEFICIARY_DELETED: 'Beneficiario eliminado exitosamente',

    // Notifications
    NOTIFICATION_DELETED: 'Notificación eliminada exitosamente',
    ALL_NOTIFICATIONS_READ: 'Todas las notificaciones marcadas como leídas',

    // Generic
    CHANGES_SAVED: 'Cambios guardados exitosamente',
    ACTION_COMPLETED: 'Acción completada exitosamente',
    COPY_TO_CLIPBOARD: 'Copiado al portapapeles',
});

/**
 * ERROR_MESSAGES - Error feedback for failed actions
 * 
 * WHY: Users need to understand what went wrong and ideally how to fix it.
 * 
 * Design principles:
 * 1. Be specific but not technical (no "Error 500")
 * 2. Suggest a solution when possible
 * 3. Don't blame the user
 * 4. Keep it brief
 * 
 * Security: Never expose technical details (stack traces, SQL errors) to users
 * These messages are for UI only - log technical details separately
 */
export const ERROR_MESSAGES = Object.freeze({
    // Authentication
    INVALID_CREDENTIALS: 'Correo electrónico o contraseña incorrectos',
    ACCOUNT_LOCKED: 'Cuenta bloqueada. Contacta a soporte.',
    ACCOUNT_NOT_FOUND: 'No se encontró la cuenta',
    EMAIL_ALREADY_EXISTS: 'Este correo electrónico ya está registrado',
    INVALID_TOKEN: 'Sesión expirada. Por favor, inicia sesión nuevamente',
    TOKEN_EXPIRED: 'Tu sesión ha expirado',
    UNAUTHORIZED: 'No tienes permiso para realizar esta acción',
    FORBIDDEN: 'Acceso denegado',

    // Validation
    REQUIRED_FIELD: 'Este campo es obligatorio',
    INVALID_EMAIL: 'Ingresa un correo electrónico válido',
    INVALID_PASSWORD: 'La contraseña no cumple con los requisitos',
    PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
    INVALID_PHONE: 'Ingresa un número de teléfono válido',
    INVALID_AMOUNT: 'Ingresa un monto válido',
    INVALID_ACCOUNT_NUMBER: 'Número de cuenta inválido (18 dígitos)',
    INVALID_CLABE: 'CLABE inválida (18 dígitos)',
    INVALID_CARD_NUMBER: 'Número de tarjeta inválido (16 dígitos)',
    INVALID_DATE: 'Fecha inválida',
    MIN_LENGTH: (min) => `Mínimo ${min} caracteres`,
    MAX_LENGTH: (max) => `Máximo ${max} caracteres`,

    // Transactions
    INSUFFICIENT_FUNDS: 'Fondos insuficientes',
    TRANSFER_LIMIT_EXCEEDED: 'Límite de transferencia excedido',
    DAILY_LIMIT_EXCEEDED: 'Límite diario excedido',
    SAME_ACCOUNT_TRANSFER: 'No puedes transferir a la misma cuenta',
    INVALID_DESTINATION: 'Cuenta destino no válida',
    TRANSACTION_FAILED: 'La transacción no pudo completarse',
    TRANSACTION_CANCELLED: 'La transacción fue cancelada',

    // Cards
    CARD_BLOCKED: 'Esta tarjeta está bloqueada',
    CARD_EXPIRED: 'Esta tarjeta ha expirado',
    INVALID_CVV: 'CVV inválido',
    CARD_LIMIT_EXCEEDED: 'Límite de tarjeta excedido',

    // Network
    NETWORK_ERROR: 'Error de conexión. Verifica tu internet',
    TIMEOUT: 'Tiempo de espera agotado. Intenta de nuevo',
    SERVER_ERROR: 'Error del servidor. Intenta más tarde',
    OFFLINE: 'Sin conexión a internet',

    // Generic
    UNKNOWN_ERROR: 'Ocurrió un error inesperado',
    TRY_AGAIN: 'Intenta de nuevo más tarde',
    CONTACT_SUPPORT: 'Si el problema persiste, contacta a soporte',
    ACTION_FAILED: 'No se pudo completar la acción',
});

/**
 * INFO_MESSAGES - Informational messages (not success or error)
 * 
 * WHY: Sometimes users need neutral information, not success/error feedback.
 * Example: "Your transfer will be processed within 24 hours"
 */
export const INFO_MESSAGES = Object.freeze({
    PROCESSING: 'Procesando tu solicitud...',
    LOADING: 'Cargando...',
    NO_DATA: 'No hay datos disponibles',
    SEARCH_RESULTS: (count) => `${count} resultados encontrados`,
    TRANSACTIONS_PENDING: 'Hay transacciones pendientes de procesamiento',
    ACCOUNT_VERIFICATION: 'Tu cuenta está en proceso de verificación',
    MAINTENANCE: 'El sistema está en mantenimiento. Intenta más tarde',
    NEW_VERSION: 'Hay una nueva versión disponible',
    SESSION_EXPIRING: 'Tu sesión expirará en breve',
    TRANSFER_SCHEDULED: 'La transferencia se procesará en la siguiente fecha hábil',
    SAVINGS_GOAL: (amount) => `Te faltan $${amount} para alcanzar tu meta`,
    WELCOME: (name) => `¡Bienvenido, ${name}!`,
    LAST_LOGIN: (date) => `Último acceso: ${date}`,
});

/**
 * CONFIRMATION_MESSAGES - Dialog confirmations
 * 
 * WHY: Destructive actions need confirmation to prevent accidents.
 * - Deleting data
 * - Sending large amounts
 * - Changing security settings
 * 
 * Each has: title (bold header), message (explanation), confirmText, cancelText
 */
export const CONFIRMATION_MESSAGES = Object.freeze({
    LOGOUT: {
        title: 'Cerrar sesión',
        message: '¿Estás seguro de que deseas cerrar sesión?',
        confirmText: 'Cerrar sesión',
        cancelText: 'Cancelar',
    },
    DELETE_ACCOUNT: {
        title: 'Eliminar cuenta',
        message: 'Esta acción es irreversible. Se eliminarán todos tus datos.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
    },
    BLOCK_CARD: {
        title: 'Bloquear tarjeta',
        message: '¿Estás seguro de bloquear esta tarjeta? No podrás usarla hasta desbloquearla.',
        confirmText: 'Bloquear',
        cancelText: 'Cancelar',
    },
    CANCEL_TRANSACTION: {
        title: 'Cancelar transacción',
        message: '¿Estás seguro de cancelar esta transacción?',
        confirmText: 'Cancelar transacción',
        cancelText: 'No, continuar',
    },
    DELETE_BENEFICIARY: {
        title: 'Eliminar beneficiario',
        message: '¿Estás seguro de eliminar este beneficiario?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
    },
    UNSAVED_CHANGES: {
        title: 'Cambios sin guardar',
        message: 'Tienes cambios sin guardar. ¿Deseas salir sin guardar?',
        confirmText: 'Salir sin guardar',
        cancelText: 'Quedarme',
    },
    TRANSFER_CONFIRM: {
        title: 'Confirmar transferencia',
        message: (amount, destination) => 
            `¿Confirmar transferencia de $${amount} a la cuenta ${destination}?`,
        confirmText: 'Confirmar',
        cancelText: 'Revisar',
    },
});

/**
 * PLACEHOLDER_MESSAGES - Input placeholders
 * 
 * WHY: Good placeholders guide users on what to enter.
 * Bad: "Text" or "Enter text" (useless)
 * Good: "ej. correo@ejemplo.com" (shows expected format)
 */
export const PLACEHOLDER_MESSAGES = Object.freeze({
    EMAIL: 'ej. correo@ejemplo.com',
    PASSWORD: 'Ingresa tu contraseña',
    NAME: 'Nombre completo',
    PHONE: '10 dígitos',
    ACCOUNT_NUMBER: '18 dígitos',
    CLABE: '18 dígitos',
    CARD_NUMBER: '16 dígitos',
    AMOUNT: '0.00',
    SEARCH: 'Buscar...',
    CONCEPT: 'Descripción de la transferencia',
    beneficiary_NAME: 'Nombre del beneficiario',
});

/**
 * VALIDATION_MESSAGES - Dynamic validation messages
 * 
 * WHY: Some messages need parameters (min length, max value, etc.)
 * These are functions that return messages with the specific constraint
 */
export const VALIDATION_MESSAGES = Object.freeze({
    REQUIRED: (fieldName) => `${fieldName} es obligatorio`,
    MIN_LENGTH: (fieldName, min) => `${fieldName} debe tener al menos ${min} caracteres`,
    MAX_LENGTH: (fieldName, max) => `${fieldName} no puede exceder ${max} caracteres`,
    INVALID_FORMAT: (fieldName) => `${fieldName} tiene un formato inválido`,
    MIN_VALUE: (fieldName, min) => `${fieldName} debe ser al menos ${min}`,
    MAX_VALUE: (fieldName, max) => `${fieldName} no puede exceder ${max}`,
    PASSWORDS_MATCH: 'Las contraseñas deben coincidir',
    PASSWORD_STRENGTH: {
        WEAK: 'Contraseña débil',
        MEDIUM: 'Contraseña media',
        STRONG: 'Contraseña fuerte',
    },
});