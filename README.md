# SwapHub - Battery Station Driver App

A mobile-first driver application for battery swap station operations with real-time updates, AI-powered routing, and intelligent reroute suggestions. The frontend connects to a Golang event-driven backend with LangGraph integration.

## Features

- **Real-Time Station Map**: Mapbox GL with WebSocket-driven color-coded markers
- **Live Station Updates**: Inventory, charger status, and queue monitoring in real-time
- **AI-Powered Routing**: LangGraph-driven intelligent reroute suggestions with confidence scores
- **Smart Demand Calculation**: Automatic status calculation from queue length and utilization rates
- **Station Details**: Complete charger diagnostics, error logs, and operational metrics
- **AI Chatbot**: Query station state via LangGraph with natural language processing
- **User Feedback**: Post-visit ratings and comments for model training
- **Driver Authentication**: JWT-based secure authentication with backend
- **Mobile-Optimized**: Designed for non-tech-savvy drivers with 48px+ touch targets

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19
- **Maps**: Mapbox GL JS
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **Real-Time**: WebSockets with exponential backoff reconnection
- **Backend**: Go with event-driven architecture + LangGraph (black box)

## Color System

The app uses a modern, accessible color palette:
- **Primary**: Deep Navy (#0F172A) - Primary text and buttons
- **Accent**: Coral Orange (#FF6B35) - Call-to-action and highlights
- **Success**: Emerald Green (#00D084) - Low demand, good inventory
- **Warning**: Amber (#F59E0B) - Medium demand
- **Destructive**: Red (#EF4444) - High demand, low inventory

## Station Status Indicators

Markers are color-coded based on demand and inventory:
- **Green**: Low demand + decent inventory ✅ Ideal option
- **Orange**: Medium demand or moderate inventory ⚠️ Check wait times
- **Red**: High demand + low inventory ⏰ Consider alternative stations

## Getting Started

### Prerequisites

1. **Mapbox Account**: Get your token from [mapbox.com](https://mapbox.com)
2. **LangGraph Backend**: Your backend API serving station data and AI features
3. **Node.js 18+**: For local development

### Environment Variables

Set up these environment variables in your `.env.local`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  # or your backend URL
```

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd swaph

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Backend Architecture

```
IoT Stations → Golang Backend (Event Bus + Workers) → LangGraph (AI)
                        ↓
                    WebSocket Hub → Frontend (Real-time updates)
```

The Golang backend uses:
- **Event Bus (Redis)**: Publishes station state and LangGraph actions
- **Workers**: Consume events and route through LangGraph for AI decisions
- **WebSocket Hub**: Streams real-time updates to connected drivers
- **LangGraph**: Black box AI service for routing, vision, and decision-making

## API Contract

### Authentication Endpoints (v1)

**POST /api/v1/auth/login**
```json
{
  "phone_number": "+1234567890",
  "password": "password"
}
```
Response: `{ "token": "jwt_token", "user": { "id", "phone_number", "name", "vehicle_type" } }`

**POST /api/v1/auth/signup**
```json
{
  "phone_number": "+1234567890",
  "password": "password",
  "name": "Driver Name",
  "vehicle_type": "vehicle_type"
}
```
Response: Same as login

### Station Data Endpoints (v1)

**GET /api/v1/stations?latitude=40.7128&longitude=-74.0060&radius=15**
- Authorization: Bearer token
- Returns: Array of `StationState` objects

**GET /api/v1/stations/:station_id**
- Authorization: Bearer token
- Returns: Single `StationState` with all charger details

Response schema:
```json
{
  "station_id": "station_1",
  "timestamp": "2025-01-31T10:30:00Z",
  "location": { "lat": 40.758, "lng": -73.9855 },
  "inventory": {
    "charged": 3,
    "uncharged": 2,
    "total_slots": 8
  },
  "queue": {
    "length": 2,
    "avg_wait_time_min": 5.5
  },
  "chargers": [
    {
      "id": "charger_1",
      "status": "OK|FAULT|OFFLINE",
      "temperature": 45.2,
      "battery_age_days": 180,
      "charge_cycles": 250
    }
  ],
  "error_logs": [
    {
      "code": "TEMP_HIGH",
      "charger_id": "charger_2",
      "timestamp": "2025-01-31T10:25:00Z",
      "message": "Temperature exceeded threshold"
    }
  ]
}
```

### AI Routing Endpoint (v1)

**POST /api/v1/stations/:station_id/reroute-suggestion**
- Authorization: Bearer token
- Input:
```json
{
  "current_lat": 40.7128,
  "current_lng": -74.0060
}
```
- Response (from LangGraph via backend):
```json
{
  "suggested_station_id": "station_2",
  "reason": "Lower utilization expected",
  "confidence": 0.87,
  "estimated_time_minutes": 10,
  "wait_time_minutes": 5,
  "total_time_minutes": 15
}
```

### Feedback Endpoint (v1)

**POST /api/v1/feedback**
```json
{
  "station_id": "station_1",
  "rating": 4,
  "comment": "Fast and efficient",
  "wait_time_actual": 12,
  "timestamp": "2025-01-31T10:30:00Z"
}
```

### WebSocket Connection

**WS /ws**
- Initial auth message: `{ "type": "auth", "data": { "token": "jwt_token" } }`
- Exponential backoff reconnection (max 5 attempts)

**Received Events:**

1. **Station State Updates** (from IoT devices via event bus)
```json
{
  "type": "station.state",
  "data": {
    "station_id": "station_1",
    "timestamp": "2025-01-31T10:30:00Z",
    "location": { ... },
    "inventory": { ... },
    "queue": { ... },
    "chargers": [ ... ],
    "error_logs": [ ... ]
  }
}
```

2. **LangGraph Actions** (AI-generated decisions)
```json
{
  "type": "langgraph.action",
  "data": {
    "type": "reroute|ticket|rebalance",
    "station_id": "station_1",
    "confidence": 0.85,
    "reasoning": "High demand detected, alternative available",
    "metadata": {
      "target_station": "station_2",
      "num_drivers": 3,
      "estimated_time": 10,
      "wait_time": 5
    }
  }
}
```

3. **Frontend Updates** (misc notifications)
```json
{
  "type": "frontend.update",
  "data": { "message": "..." }
}
```

## Project Structure

```
/app
  /map              # Map page and routes
  /context          # Auth context and state
  /page.tsx         # Login/signup page
  /layout.tsx       # Root layout with providers

/components
  map-component.tsx              # Main map rendering
  station-details-popup.tsx      # Station info card
  station-chatbot.tsx            # AI chatbot interface
  reroute-suggestion.tsx         # Smart routing UI
  station-feedback-dialog.tsx    # User feedback form
  map-header.tsx                 # Header with user info
  error-boundary.tsx             # Error handling
  empty-state.tsx                # No stations UI
  loading-overlay.tsx            # Loading indicator

/lib
  api.ts             # API utilities
  types.ts           # TypeScript types
  utils.ts           # Helper functions
```

## Mobile Optimization

- Touch targets are 48px minimum for easy interaction
- Large, readable fonts (16px+ for body text)
- Simplified UI with clear visual hierarchy
- Location-based map centering
- Responsive grid layouts that work on all screen sizes

## Development

### Debug Mode

The app includes console logging for debugging. Look for `[v0]` prefixed logs in the browser console.

### Testing API Integration

Use the provided mock data in development:
- Station markers appear with realistic demand/inventory data
- Chatbot has sample responses for testing
- Feedback submission is logged to console

## Deployment

Deploy to Vercel for the best Next.js experience:

```bash
npm run build
# Deploy using Vercel CLI or GitHub
```

## Browser Support

- iOS Safari 12+
- Android Chrome 90+
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## Accessibility

- ARIA labels on all interactive elements
- Screen reader support for station information
- High contrast colors for readability
- Keyboard navigation support

## Development Guide

### Local Development

1. Start Golang backend with Redis:
```bash
# Ensure Redis is running
redis-server

# Start Go backend
go run cmd/main.go
```

2. Run frontend:
```bash
npm run dev
```

3. Frontend connects to `http://localhost:8000` by default

### Environment Variables

```env
# Required - Mapbox token for map rendering
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Required - Golang backend URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Optional - WebSocket URL (auto-detected if not set)
# NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Testing WebSocket Connection

The app includes debug logging. Check browser console for `[v0]` prefixed logs:
```
[v0] WebSocket connected
[v0] Received station state for: station_1
[v0] LangGraph action: reroute
```

### Demand Calculation

Station status is computed from Go backend `StationState`:
```typescript
const utilizationRate = charged / total_slots;

if (queue.length > 2 || (utilizationRate < 0.3 && queue.length > 0)) 
  return 'high';  // RED
if (queue.length === 1 || (utilizationRate >= 0.3 && utilizationRate < 0.7))
  return 'medium'; // ORANGE
return 'low';      // GREEN
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Map not loading** | Check Mapbox token in env vars, verify domain whitelisting in Mapbox dashboard |
| **WebSocket not connecting** | Ensure Go backend is running, check `NEXT_PUBLIC_API_BASE_URL`, verify Redis |
| **No real-time updates** | Check WebSocket tab in DevTools, verify `station.state` events from event bus |
| **Reroute suggestions not appearing** | Verify LangGraph backend is processing events, check `langgraph.action` in WebSocket |
| **Auth token issues** | Clear browser localStorage, verify JWT format from backend |
| **Geolocation not working** | Use HTTPS in production, check browser location permissions |

## File Overview

- **api.ts**: `WebSocketManager` class handles reconnection with exponential backoff
- **types.ts**: Go backend schema types matching Golang structs
- **map/page.tsx**: Subscribes to WebSocket events and updates station markers
- **station-details-popup.tsx**: Displays charger status and error logs from station state

## License

Internal use only

## Support

For issues or questions, contact the development team.
