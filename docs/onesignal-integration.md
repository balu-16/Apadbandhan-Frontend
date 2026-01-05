# OneSignal Web Push Notifications Integration

## Overview

This document describes the OneSignal Web Push Notifications integration for the Apadbandhav platform. The integration uses OneSignal Web SDK v16 for browser-side subscription and OneSignal REST API for server-side notification dispatch.

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │   Backend       │      │   OneSignal     │
│   (React)       │      │   (NestJS)      │      │   Cloud         │
├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ SDK v16 Init    │──────│ REST API Client │──────│ Push Delivery   │
│ User Mapping    │      │ User Resolution │      │ Device Registry │
│ Permission UI   │      │ Logging         │      │ Analytics       │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Configuration

### Backend Environment Variables

Add to your `.env` file:

```env
# OneSignal Configuration
ONESIGNAL_APP_ID=030f6cda-43f7-47d6-9843-2d54f4df8b9e
ONESIGNAL_REST_API_KEY=your-rest-api-key-from-onesignal-dashboard
```

To get your REST API Key:
1. Log in to OneSignal Dashboard
2. Go to Settings → Keys & IDs
3. Copy the "REST API Key"

### Frontend Configuration

The OneSignal SDK is initialized in `index.html` with the App ID:

```html
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "030f6cda-43f7-47d6-9843-2d54f4df8b9e",
      notifyButton: { enable: false },
      allowLocalhostAsSecureOrigin: true,
    });
  });
</script>
```

## User Mapping (External User ID)

When a user logs in, their user ID is automatically set as the OneSignal external_id via the `AuthContext`:

```typescript
// On login
setExternalUserId(user.id, user.role);

// On logout
removeExternalUserId();
```

This enables targeted notifications to specific users.

## Frontend Usage

### Using the useOneSignal Hook

```typescript
import { useOneSignal } from '@/hooks/useOneSignal';

function MyComponent() {
  const {
    isInitialized,
    isSubscribed,
    permission,
    isSupported,
    requestPermission,
    setExternalUserId,
    removeExternalUserId,
    optIn,
    optOut,
    addTags,
    removeTags,
  } = useOneSignal();

  // Request permission
  const handleSubscribe = async () => {
    const success = await requestPermission();
    if (success) {
      console.log('User subscribed!');
    }
  };

  // Add custom tags for targeting
  const addUserTags = async () => {
    await addTags({
      city: 'Mumbai',
      bloodGroup: 'O+',
    });
  };

  return (
    <div>
      <p>Push Supported: {isSupported ? 'Yes' : 'No'}</p>
      <p>Subscribed: {isSubscribed ? 'Yes' : 'No'}</p>
      <button onClick={handleSubscribe}>Enable Notifications</button>
    </div>
  );
}
```

## Backend API Endpoints

### OneSignal Direct API (`/api/onesignal`)

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/onesignal/status` | GET | Admin | Check OneSignal configuration status |
| `/onesignal/test` | POST | Admin | Send test notification to self |
| `/onesignal/send/user` | POST | Admin | Send to single user by external ID |
| `/onesignal/send/users` | POST | Admin | Send to multiple users by external IDs |
| `/onesignal/send/role` | POST | SuperAdmin | Send to all users of a role |
| `/onesignal/send/broadcast` | POST | SuperAdmin | Broadcast to all subscribed users |
| `/onesignal/notification/:id` | GET | Admin | Get notification delivery status |

### Notification Center API (`/api/notification-center`)

The existing Notification Center now uses OneSignal for delivery:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/notification-center/send/test` | POST | Send test notification |
| `/notification-center/send/template` | POST | Send template-based notification |
| `/notification-center/send/custom` | POST | Send custom notification |
| `/notification-center/logs` | GET | Get notification history |

## SuperAdmin Dashboard Usage

### Accessing Notification Center

1. Log in as SuperAdmin
2. Navigate to **Admin Dashboard** → **Notifications** in the sidebar

### Sending a Test Notification

1. Click "Send Test to Myself" button in the header
2. A browser notification should appear

### Sending Template Notifications

1. Go to "Send Notification" tab
2. Click "Use Template"
3. Select a template from the dropdown
4. Fill in any required variables
5. Select target role (or "All Users")
6. Optionally apply filters
7. Click "Preview Target Count" to see how many users will receive
8. Click "Send Notification"

### Sending Custom Notifications

1. Go to "Send Notification" tab
2. Click "Custom Message"
3. Enter title (required)
4. Enter message body (required)
5. Optionally add a click URL
6. Select target role
7. Click "Send Notification"

### Role-Based Targeting

You can target notifications by role:
- **All Users**: Sends to everyone
- **Regular Users**: App users only
- **Admins**: Admin users only
- **SuperAdmins**: SuperAdmin users only
- **Police**: Police users only
- **Hospitals**: Hospital users only

### Filtering Options

When targeting a specific role, additional filters appear:

**For Regular Users:**
- Blood Group
- City
- State
- Active Status
- Verified Status
- Accident Alerts Enabled

**For Police:**
- Jurisdiction
- Station Name
- City/State
- On Duty Status

**For Hospitals:**
- Hospital Type (Government/Private)
- Specialization
- City/State
- On Duty Status

## OneSignal REST API Payloads

### Send to External User IDs

```json
POST https://onesignal.com/api/v1/notifications
{
  "app_id": "030f6cda-43f7-47d6-9843-2d54f4df8b9e",
  "include_aliases": {
    "external_id": ["user_id_1", "user_id_2"]
  },
  "target_channel": "push",
  "headings": { "en": "Notification Title" },
  "contents": { "en": "Notification body message" },
  "chrome_web_icon": "/android-chrome-192x192.png",
  "url": "/dashboard"
}
```

### Send by Tag (Role-Based)

```json
POST https://onesignal.com/api/v1/notifications
{
  "app_id": "030f6cda-43f7-47d6-9843-2d54f4df8b9e",
  "filters": [
    { "field": "tag", "key": "role", "relation": "=", "value": "police" }
  ],
  "headings": { "en": "Alert for Police" },
  "contents": { "en": "New emergency alert in your area" }
}
```

### Broadcast to All

```json
POST https://onesignal.com/api/v1/notifications
{
  "app_id": "030f6cda-43f7-47d6-9843-2d54f4df8b9e",
  "included_segments": ["Subscribed Users"],
  "headings": { "en": "System Announcement" },
  "contents": { "en": "Important update for all users" }
}
```

## Troubleshooting

### Notifications Not Appearing

1. **Check browser permissions**: Ensure notifications are not blocked
2. **Check subscription status**: Use the `useOneSignal` hook to verify `isSubscribed`
3. **Check OneSignal Dashboard**: View delivery reports in OneSignal
4. **Check backend logs**: Look for OneSignal API errors

### User Not Receiving Targeted Notifications

1. **Verify external_id is set**: Check browser console for "[OneSignal] External user ID set" log
2. **Verify user is subscribed**: User must have granted notification permission
3. **Check user ID format**: Ensure the user ID matches exactly

### Service Worker Issues

1. The service worker file must be at `/OneSignalSDKWorker.js` in the public folder
2. Clear browser cache and service workers if issues persist
3. Check browser DevTools → Application → Service Workers

## Security Considerations

- **REST API Key**: Never expose in frontend code; only use in backend
- **App ID**: Safe to expose in frontend (public identifier)
- **User Targeting**: Validated server-side before sending
- **Rate Limiting**: OneSignal has built-in rate limits

## Files Modified/Created

### Frontend
- `public/OneSignalSDKWorker.js` - Service worker
- `index.html` - SDK initialization
- `src/hooks/useOneSignal.ts` - React hook
- `src/contexts/AuthContext.tsx` - User mapping on login/logout
- `src/services/api.ts` - API endpoints

### Backend
- `src/onesignal/` - New module
  - `onesignal.module.ts`
  - `onesignal.service.ts`
  - `onesignal.controller.ts`
  - `schemas/onesignal-user.schema.ts`
  - `schemas/onesignal-notification-log.schema.ts`
  - `dto/send-notification.dto.ts`
- `src/notification-center/notification-center.service.ts` - Updated to use OneSignal
- `src/app.module.ts` - Added OneSignalModule
- `.env.example` - Added OneSignal config
