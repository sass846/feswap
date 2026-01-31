# SwapHub - Project Summary

## What Has Been Built

A **production-ready mobile-first driver application** for battery swap station operations with real-time updates and AI-powered routing.

### Architecture

```
Frontend (Next.js 16 + React 19)
    ↓ REST + WebSocket
Golang Backend (Event-Driven)
    ├→ Redis Pub/Sub (Events)
    ├→ LangGraph (AI/ML - Black Box)
    └→ PostgreSQL (User/Feedback Data)
```

## Core Features Implemented

### 1. Authentication System
- **Login/Signup**: Phone number + password authentication
- **Backend-First**: All auth handled by Golang backend
- **JWT Tokens**: Secure token-based session management
- **Persistent Sessions**: Tokens stored in localStorage with auto-logout

### 2. Real-Time Station Map
- **Mapbox GL Integration**: Full-featured map rendering
- **Color-Coded Markers**: 
  - 🟢 Green (low demand, good inventory)
  - 🟠 Orange (medium demand)
  - 🔴 Red (high demand, low inventory)
- **WebSocket Updates**: Live station state changes
- **Geolocation**: Auto-center map on driver location
- **Touch-Optimized**: 48px+ touch targets for mobile

### 3. Station Details Popup
- **Real-time Inventory**: Charged/uncharged battery counts
- **Queue Monitoring**: Current queue length and avg wait time
- **Charger Status**: Individual charger diagnostics
  - Status: OK, FAULT, OFFLINE
  - Temperature monitoring
  - Battery age and charge cycles
- **Error Logs**: Recent system errors and alerts
- **Demand Calculation**: Auto-computed from utilization + queue

### 4. AI-Powered Reroute Suggestions
- **LangGraph Integration**: AI-driven routing decisions
- **Smart Suggestions**: Consider travel time + wait time
- **Confidence Scores**: Show AI confidence (0-1)
- **Visual Alerts**: Prominent notification when better options available
- **Accept/Dismiss**: Driver can accept reroute or stay

### 5. Station Chatbot
- **LangGraph-Powered**: AI Q&A about station state
- **Context-Aware**: Has access to inventory, queue, errors
- **Natural Language**: Drivers ask questions in plain text
- **Streaming Responses**: Real-time chat experience

### 6. User Feedback System
- **Post-Visit Ratings**: 1-5 star rating
- **Comments**: Text feedback for model training
- **Wait Time Tracking**: Record actual vs expected wait times
- **Backend Integration**: Feedback sent to Golang backend

### 7. Design & UX
- **Mobile-First**: Optimized for drivers on-the-go
- **Large Typography**: 16px+ body text
- **Color System**: 
  - Navy #0f172a (primary)
  - Coral #ff6b35 (accent)
  - Emerald #00d084 (success)
  - Amber #f59e0b (warning)
  - Red #ef4444 (error)
- **Non-Tech-Savvy UX**: Simple, clear interface
- **Dark Mode Support**: Automatic theme detection

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Maps**: Mapbox GL JS
- **State**: React hooks + context
- **Real-Time**: WebSocket with exponential backoff

### Backend Integration
- **REST API**: Fetch API with retry logic
- **WebSocket**: Custom `WebSocketManager` class
- **Error Handling**: Custom `APIError` class
- **Type Safety**: Full TypeScript types matching Go schema

## File Structure

```
/app
  /map
    layout.tsx          - Protected route wrapper
    page.tsx            - Main map interface
  /context
    auth-context.tsx    - Auth state & JWT management
  /page.tsx             - Login/Signup page
  /layout.tsx           - Root layout with AuthProvider
  /globals.css          - Design tokens & theme

/components
  map-component.tsx              - Mapbox with markers
  station-details-popup.tsx      - Station info modal
  station-chatbot.tsx            - LangGraph Q&A
  reroute-suggestion.tsx         - Smart routing alert
  station-feedback-dialog.tsx    - Rating/feedback form
  map-header.tsx                 - Driver profile
  error-boundary.tsx             - Error handling
  empty-state.tsx                - No stations UI
  loading-overlay.tsx            - Loading state

/lib
  api.ts                         - API utilities + WebSocketManager
  types.ts                       - Go backend types
  utils.ts                       - Helpers

/config
  package.json                   - Dependencies
  tsconfig.json                  - TypeScript config
  next.config.mjs                - Next.js config

/docs
  README.md                      - Project overview
  SETUP_GUIDE.md                 - Development setup
  GO_BACKEND_INTEGRATION.md      - Backend contract
  ENV_SETUP.md                   - Environment variables
  PROJECT_SUMMARY.md             - This file
```

## Key Components Deep Dive

### WebSocketManager (`/lib/api.ts`)
- **Automatic Reconnection**: Exponential backoff (max 5 attempts)
- **Event Subscription**: Subscribe to multiple event types
- **Authentication**: Sends JWT token on connect
- **Debug Logging**: `[v0]` prefixed console logs
- **Type-Safe**: Full TypeScript support

### Station Demand Calculation
```typescript
const utilizationRate = charged / total_slots;

if (queue.length > 2 || (utilizationRate < 0.3 && queue.length > 0))
  return 'high';    // RED
if (queue.length === 1 || (utilizationRate >= 0.3 && utilizationRate < 0.7))
  return 'medium';  // ORANGE
return 'low';       // GREEN
```

### Auth Flow
```
Driver enters phone + password
    ↓
Frontend sends to /api/v1/auth/login
    ↓
Backend validates credentials
    ↓
Backend returns JWT token + user object
    ↓
Frontend stores token in localStorage
    ↓
Frontend connects WebSocket with token
    ↓
Driver sees map with real-time updates
```

## Real-Time Update Flow

```
1. IoT Device → Golang Backend (station state)
2. Backend → Redis: Publish "station.state" event
3. Backend Worker: Consume event
4. Worker → LangGraph: Send for AI processing
5. LangGraph → Worker: Return routing suggestions
6. Worker → Redis: Publish "langgraph.action"
7. WebSocket Hub: Subscribe to both channels
8. WebSocket Hub → Connected Clients: Broadcast updates
9. Frontend: Receive & update markers
10. Drivers see real-time station status changes
```

## Performance Optimizations

- **Marker Clustering**: Mapbox GL reduces markers at low zoom
- **Event Filtering**: Backend only broadcasts state changes
- **WebSocket Reconnection**: Automatic recovery from disconnections
- **Lazy Loading**: Components load on-demand
- **Type Safety**: Compile-time error detection

## Security Features

- **JWT Authentication**: Secure token-based auth
- **HTTPS Ready**: WebSocket WSS support
- **Token Expiry**: Tokens should expire server-side
- **No Hardcoded Secrets**: All keys in environment variables
- **Input Validation**: TypeScript validation on all inputs

## Environment Variables

### Required
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox public token
- `NEXT_PUBLIC_API_BASE_URL` - Golang backend URL

### Optional
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (auto-detected if not set)

## Development Commands

```bash
npm install              # Install dependencies
npm run dev             # Start dev server (http://localhost:3000)
npm run build           # Production build
npm start               # Start production server
npm run lint            # Lint code
```

## Deployment Checklist

- [ ] Golang backend running with Redis
- [ ] All required environment variables set
- [ ] Mapbox token configured and restricted
- [ ] WebSocket endpoint accessible from frontend domain
- [ ] CORS headers configured if needed
- [ ] SSL certificates for wss:// connection
- [ ] LangGraph service integrated
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Error tracking configured (Sentry/etc)

## Known Limitations

1. **Mock Data**: Frontend has fallback mock data for development
2. **No Offline Mode**: Requires backend connection
3. **WebSocket Polling**: Real-time updates only via WebSocket
4. **Geolocation**: Requires browser permission
5. **Mapbox Free Tier**: 25K map loads/month limit

## Future Enhancements

- [ ] Offline map cache
- [ ] Push notifications for station alerts
- [ ] Driver performance metrics dashboard
- [ ] Multi-language support
- [ ] Voice commands for hands-free operation
- [ ] Favorite stations for quick access
- [ ] Trip history and statistics
- [ ] Social sharing of ratings

## Testing Strategy

### Unit Tests
- API utility functions
- Type validation
- Demand calculation logic

### Integration Tests
- WebSocket connection flow
- Auth flow
- Station data fetching

### E2E Tests
- User login journey
- Station selection
- Reroute acceptance
- Feedback submission

## Debugging

Enable debug logs in browser console (already included):
```javascript
// Look for [v0] prefixed logs
[v0] WebSocket connected
[v0] Station updated: station_1
[v0] Received action: reroute
```

## Support & Documentation

- **README.md** - Project overview and quick start
- **SETUP_GUIDE.md** - Development environment setup
- **GO_BACKEND_INTEGRATION.md** - Backend API contract
- **This file** - Project architecture and features

## License

Internal use only

## Version

- Frontend: v1.0.0
- API Contract: v1
- Compatible with: Golang event-driven backend + LangGraph
