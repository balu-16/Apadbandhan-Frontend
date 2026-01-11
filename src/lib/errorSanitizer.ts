/**
 * Error Sanitization Utility
 * Prevents exposing sensitive error details to end users
 */

interface SanitizedError {
  message: string;
  code?: string;
  isRetryable: boolean;
}

// Error codes that are safe to show to users
const USER_FRIENDLY_ERRORS: Record<string, string> = {
  // Authentication errors
  'UNAUTHORIZED': 'Please log in to continue.',
  'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
  'INVALID_CREDENTIALS': 'Invalid email or password.',
  'ACCOUNT_DISABLED': 'Your account has been disabled. Please contact support.',
  'ACCOUNT_NOT_FOUND': 'Account not found. Please check your details.',
  
  // Validation errors
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'INVALID_INPUT': 'The information provided is invalid.',
  'MISSING_REQUIRED_FIELD': 'Please fill in all required fields.',
  'INVALID_PHONE': 'Please enter a valid phone number.',
  'INVALID_EMAIL': 'Please enter a valid email address.',
  'INVALID_OTP': 'The OTP entered is incorrect or expired.',
  
  // Resource errors
  'NOT_FOUND': 'The requested resource was not found.',
  'DEVICE_NOT_FOUND': 'Device not found. It may have been removed.',
  'USER_NOT_FOUND': 'User not found.',
  'ALERT_NOT_FOUND': 'Alert not found.',
  
  // Permission errors
  'FORBIDDEN': 'You do not have permission to perform this action.',
  'ACCESS_DENIED': 'Access denied.',
  'INSUFFICIENT_PERMISSIONS': 'You do not have the required permissions.',
  
  // Rate limiting
  'RATE_LIMITED': 'Too many requests. Please wait a moment and try again.',
  'TOO_MANY_ATTEMPTS': 'Too many attempts. Please try again later.',
  
  // Network errors
  'NETWORK_ERROR': 'Unable to connect. Please check your internet connection.',
  'TIMEOUT': 'The request took too long. Please try again.',
  'SERVICE_UNAVAILABLE': 'Service is temporarily unavailable. Please try again later.',
  
  // Server errors
  'INTERNAL_ERROR': 'Something went wrong. Please try again later.',
  'SERVER_ERROR': 'A server error occurred. Our team has been notified.',
  
  // Device errors
  'DEVICE_ALREADY_REGISTERED': 'This device is already registered.',
  'DEVICE_OFFLINE': 'Device is currently offline.',
  'INVALID_DEVICE_CODE': 'Invalid device code. Please check and try again.',
  
  // Sharing errors
  'ALREADY_SHARED': 'This device is already shared with this user.',
  'CANNOT_SHARE_WITH_SELF': 'You cannot share a device with yourself.',
  'SHARE_NOT_FOUND': 'Share record not found.',
  
  // SOS errors
  'SOS_ALREADY_ACTIVE': 'An SOS alert is already active.',
  'LOCATION_REQUIRED': 'Location is required for this action.',
  'NO_RESPONDERS_AVAILABLE': 'No responders are currently available in your area.',
};

// HTTP status code to user-friendly message mapping
const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Please log in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  408: 'Request timed out. Please try again.',
  409: 'This action conflicts with existing data.',
  422: 'Unable to process your request. Please check your input.',
  429: 'Too many requests. Please wait and try again.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'Service temporarily unavailable. Please try again.',
  503: 'Service is currently under maintenance. Please try again later.',
  504: 'Request timed out. Please try again.',
};

// Errors that can be retried
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Sanitize an error for display to the user
 */
export function sanitizeError(error: unknown): SanitizedError {
  // Default safe error
  const defaultError: SanitizedError = {
    message: 'Something went wrong. Please try again.',
    isRetryable: true,
  };

  if (!error) {
    return defaultError;
  }

  // Handle Axios-like errors
  if (typeof error === 'object' && error !== null) {
    const err = error as {
      response?: {
        status?: number;
        data?: {
          message?: string;
          error?: string;
          code?: string;
          statusCode?: number;
        };
      };
      code?: string;
      message?: string;
    };

    // Check for network errors
    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
      return {
        message: USER_FRIENDLY_ERRORS['NETWORK_ERROR'],
        code: 'NETWORK_ERROR',
        isRetryable: true,
      };
    }

    // Check for response with error code
    if (err.response?.data?.code) {
      const code = err.response.data.code;
      if (USER_FRIENDLY_ERRORS[code]) {
        return {
          message: USER_FRIENDLY_ERRORS[code],
          code,
          isRetryable: RETRYABLE_STATUS_CODES.includes(err.response.status || 0),
        };
      }
    }

    // Check for HTTP status code
    if (err.response?.status) {
      const status = err.response.status;
      const message = HTTP_STATUS_MESSAGES[status] || defaultError.message;
      
      // For 400 errors, try to extract a safe message
      if (status === 400 && err.response.data?.message) {
        const backendMessage = err.response.data.message;
        // Only show backend message if it looks safe (no stack traces, paths, etc.)
        if (isSafeMessage(backendMessage)) {
          return {
            message: backendMessage,
            code: `HTTP_${status}`,
            isRetryable: false,
          };
        }
      }

      return {
        message,
        code: `HTTP_${status}`,
        isRetryable: RETRYABLE_STATUS_CODES.includes(status),
      };
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    if (isSafeMessage(error)) {
      return {
        message: error,
        isRetryable: true,
      };
    }
  }

  return defaultError;
}

/**
 * Check if a message is safe to display to users
 * (doesn't contain sensitive info like stack traces, file paths, etc.)
 */
function isSafeMessage(message: string): boolean {
  if (!message || typeof message !== 'string') return false;
  
  // Patterns that indicate unsafe/technical messages
  const unsafePatterns = [
    /at\s+\w+\s+\(/i,           // Stack trace patterns
    /node_modules/i,            // Node paths
    /\.ts:|\.js:/i,             // File references
    /Error:/i,                  // Generic error prefixes
    /TypeError|ReferenceError|SyntaxError/i,  // JS error types
    /undefined|null/i,          // Technical terms
    /^\[object\s+\w+\]$/i,      // Object toString
    /mongo|sql|database/i,      // Database references
    /password|secret|key|token/i, // Sensitive terms
    /\/api\/|\/src\//i,         // API/Source paths
    /localhost|127\.0\.0\.1/i,  // Local references
  ];

  return !unsafePatterns.some(pattern => pattern.test(message));
}

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(code: string): string {
  return USER_FRIENDLY_ERRORS[code] || 'Something went wrong. Please try again.';
}

/**
 * Extract error message for toast notifications
 */
export function getToastErrorMessage(error: unknown): string {
  return sanitizeError(error).message;
}

export default sanitizeError;
