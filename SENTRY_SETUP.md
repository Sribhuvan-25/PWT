# Sentry Crash Reporting Setup

This project is configured to use Sentry for crash reporting and error monitoring in production. Sentry is **optional** and the app will work fine without it.

## Why Sentry?

- Automatic crash reporting in production
- Error tracking and stack traces
- User context for debugging
- Breadcrumb tracking for better error context
- Performance monitoring

## Setup Instructions

### 1. Create a Sentry Account

1. Go to [https://sentry.io](https://sentry.io) and sign up for a free account
2. Create a new project:
   - Choose **React Native** as the platform
   - Name it (e.g., "Poker Tracker")

### 2. Get Your DSN

1. After creating the project, you'll see a DSN (Data Source Name)
2. It looks like: `https://[key]@[organization].ingest.sentry.io/[project-id]`
3. Copy this DSN

### 3. Add DSN to Your Project

1. Open your `.env` file
2. Find the line: `EXPO_PUBLIC_SENTRY_DSN=`
3. Paste your DSN after the `=`:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
   ```

### 4. Restart Your App

```bash
npm start
```

That's it! Sentry is now configured and will:
- Track crashes in production builds
- Report errors logged via `logger.error()`
- Report warnings logged via `logger.warn()`
- Track user context (user ID and email)
- Capture breadcrumbs for better debugging

## Testing Sentry

To test if Sentry is working:

1. Make a production build of your app
2. Trigger an error in the app
3. Check your Sentry dashboard to see the error report

Note: Sentry is **disabled in development** by default to avoid cluttering your error reports with development issues.

## Disabling Sentry

To disable Sentry, simply leave the `EXPO_PUBLIC_SENTRY_DSN` empty in your `.env` file:

```
EXPO_PUBLIC_SENTRY_DSN=
```

The app will detect this and skip Sentry initialization.

## What Gets Reported

The logger utility automatically sends to Sentry:

- **Errors**: All `logger.error()` calls
- **Warnings**: All `logger.warn()` calls
- **Breadcrumbs**: All `logger.breadcrumb()` calls (for context)
- **User Context**: User ID and email when logged in
- **Stack Traces**: Automatically attached to errors

Note: `logger.log()`, `logger.info()`, and `logger.debug()` are **NOT** sent to Sentry and only appear in development console.

## Privacy

Sentry reports include:
- Error messages and stack traces
- User ID and email (for authenticated users)
- Device and app information
- Breadcrumbs (user actions leading to errors)

No sensitive data (passwords, tokens, etc.) should be logged via the logger utility.
