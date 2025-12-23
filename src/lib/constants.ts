/**
 * Application constants - centralized location for hardcoded strings
 */

// App Info
export const APP_NAME = 'Apadbandhav';
export const APP_TAGLINE = 'Real-time AIoT Accident Alerts';

// Messages
export const MESSAGES = {
    WELCOME: `Welcome to ${APP_NAME}`,
    OTP_SENT: 'A 6-digit OTP has been sent to your phone',
    ACCOUNT_CREATED: `Welcome to ${APP_NAME}`,
    LOGIN_SUCCESS: 'You have successfully logged in',
    VERIFY_PHONE: 'Please enter a valid 10-digit phone number',
    VERIFY_OTP: 'Please enter the 6-digit OTP',
    FILL_ALL_FIELDS: 'Please fill in all fields',
    NEW_USER: 'This phone number is not registered. Please sign up first.',
    ACCOUNT_EXISTS: 'This phone number is already registered. Please login instead.',
    ERROR_GENERIC: 'Something went wrong. Please try again.',
};

// Dashboard Statistics Labels
export const STAT_LABELS = {
    CONNECTED_DEVICES: 'Connected Devices',
    ALERTS_SENT: 'Alerts Sent',
    LOCATION_TRACKING: 'Location Tracking',
    INSURANCE_DETAILS: 'Insurance Details',
    TOTAL_USERS: 'Total Users',
    TOTAL_DEVICES: 'Total Devices',
    ONLINE_DEVICES: 'Online Devices',
    OFFLINE_DEVICES: 'Offline Devices',
};

// Status values
export const STATUS = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    ENABLED: 'Enabled',
    DISABLED: 'Disabled',
    STORED: 'Stored',
    NOT_SET: 'Not Set',
} as const;

// Time formats
export const TIME_LABELS = {
    NEVER: 'Never',
    JUST_NOW: 'Just now',
    MINUTE_AGO: 'minute ago',
    MINUTES_AGO: 'minutes ago',
    HOUR_AGO: 'hour ago',
    HOURS_AGO: 'hours ago',
    DAY_AGO: 'day ago',
    DAYS_AGO: 'days ago',
};

// Response time display
export const RESPONSE_TIME = '<30s';
