# Environment Variables Setup Guide

This is a step-by-step guide to set up the required environment variables for the SwapHub battery swap station driver app.

## Required Environment Variables

### 1. Mapbox Token (Required for Maps)
- **Variable**: `NEXT_PUBLIC_MAPBOX_TOKEN`
- **Description**: Your Mapbox GL JS token for rendering interactive maps
- **How to Get**:
  1. Go to [mapbox.com](https://mapbox.com)
  2. Create a free account or sign in
  3. Go to your account dashboard
  4. Under "Tokens", click "Create a token"
  5. Name it something like "SwapHub"
  6. Make sure "Public" scope is enabled
  7. Copy the token
- **Value Example**: `pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNrZ...`

### 2. Backend API URL (Required)
- **Variable**: `NEXT_PUBLIC_API_BASE_URL`
- **Description**: Your LangGraph backend API server URL
- **Default**: `http://localhost:8000`
- **Value Example**: 
  - Development: `http://localhost:8000`
  - Production: `https://api.yourdomain.com`

## How to Add Environment Variables

### In Vercel Dashboard (for Deployment)
1. Go to your Vercel project
2. Click "Settings" → "Environment Variables"
3. Add each variable with its value
4. Make sure public variables have `NEXT_PUBLIC_` prefix
5. Redeploy your app

### For Local Development
Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Then restart your dev server:
```bash
npm run dev
```

## Backend API Endpoints

Your LangGraph backend should provide these endpoints:

### Authentication
- `POST /auth/login` - Login with phone and password
- `POST /auth/signup` - Create new driver account

### Stations
- `GET /stations?latitude=X&longitude=Y&radius=Z` - Get nearby stations
- `GET /stations/{id}` - Get station details

### Routing & Suggestions
- `POST /reroute-suggestion` - Get AI-powered route suggestions

### Chat
- `POST /chat` - AI chatbot for station queries (WebSocket ready)

### Feedback
- `POST /feedback` - Submit driver feedback

## Troubleshooting

### Map not showing?
- Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set correctly
- Check browser console for CORS errors
- Ensure Mapbox token is public scope

### API calls failing?
- Verify `NEXT_PUBLIC_API_BASE_URL` is correct
- Check if your backend is running
- Look for CORS policy errors

### Auth not working?
- Verify backend endpoints are responding
- Check network tab in browser dev tools
- Ensure user credentials are correct

## Security Notes

- Never commit `.env.local` to git (add to `.gitignore`)
- Use public tokens only for Mapbox (prefixed with `pk.`)
- Keep private tokens secure in your backend
- For production, always use HTTPS URLs
