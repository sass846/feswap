# SwapHub Setup Guide

Complete setup guide for the SwapHub driver application with Golang backend integration.

## 1. Prerequisites

### Frontend Requirements
- Node.js 18+ or later
- npm or yarn package manager
- Mapbox account (free tier works for development)

### Backend Requirements
- Golang 1.21+
- Redis server (for event bus)
- LangGraph service running
- PostgreSQL or database for user/feedback storage

## 2. Frontend Setup

### 2.1 Mapbox Configuration

1. Create account at [mapbox.com](https://mapbox.com)
2. Go to Account → Tokens
3. Copy your default **public token**
4. In Mapbox dashboard, restrict token to your domain:
   - **URL Restrictions**: Add `https://yourdomain.com/*`
   - **Scopes**: Select "Maps: Styles:Read" and "Maps:Tiles:Read"

**Billing**: Free tier includes 25,000 map loads/month. Enable billing for production.

### 2.2 Environment Variables

Create `.env.local` in project root:

```env
# REQUIRED - Mapbox token for map rendering
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNreXo...

# REQUIRED - Golang backend URL (includes port)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# OPTIONAL - WebSocket URL (auto-detected if not set)
# NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 2.3 Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
   - `NEXT_PUBLIC_API_BASE_URL` (your production backend URL)
4. Deploy

**Important**: Ensure backend API is accessible from Vercel (configure firewall rules if needed)

## 3. Golang Backend Setup

### 3.1 Environment Setup

Ensure your Golang backend provides:

**REST Endpoints (v1 API):**
```
POST   /api/v1/auth/login              # Phone + password
POST   /api/v1/auth/signup             # Phone + password + name
GET    /api/v1/stations                # Query: lat, lng, radius
GET    /api/v1/stations/:id            # Single station state
POST   /api/v1/stations/:id/reroute-suggestion  # Get AI routing
POST   /api/v1/feedback                # Submit user feedback
```

**WebSocket:**
```
WS /ws                                 # Real-time updates
```

### 3.2 Redis Configuration

Backend must publish to Redis channels:
- `station.state` - Station telemetry updates from IoT devices
- `langgraph.action` - AI actions from LangGraph

Frontend automatically subscribes via WebSocket.

### 3.3 LangGraph Integration

Backend worker should:
1. Consume `station.state` events from Redis
2. Send state + context to LangGraph API
3. Publish responses to `langgraph.action` channel
4. Include: reroute suggestions, confidence scores, reasoning

### 3.4 Authentication

- Use JWT tokens (Bearer authentication)
- Include token in all API requests
- Frontend stores token in localStorage
- Tokens expire and should be refreshable

## 4. Local Development

### 4.1 Start Backend (Redis + Go)

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Golang backend
go run cmd/main.go
# Backend should be running on http://localhost:8000
```

### 4.2 Start Frontend

```bash
# Terminal 3: Install and run Next.js
npm install
npm run dev

# Open browser to http://localhost:3000
```

## 5. Backend Integration

### Expected Backend Endpoints

Your LangGraph backend should implement:

```
Authentication:
  POST /auth/login         - Driver login
  POST /auth/signup        - Driver registration

Stations:
  GET /stations            - List nearby stations
  GET /stations/{id}       - Get station details

Routing:
  POST /reroute-suggestion - Get AI routing suggestions

AI Chat:
  WS /chat                 - WebSocket for station chatbot

Feedback:
  POST /feedback           - Submit user feedback
```

### Testing Backend Connection

1. Start your backend server
2. Set `NEXT_PUBLIC_API_BASE_URL` to match your backend URL
3. Open browser dev tools (F12)
4. Try logging in - check Network tab for API calls
5. Look for `[v0]` debug logs in Console

## 6. Development Workflow

### Key Commands

```bash
npm run dev       # Start dev server (port 3000)
npm run build     # Build for production
npm run start     # Run production build
npm run lint      # Run linter
```

### Debugging

The app includes console logging:
```javascript
// Look for logs like this in browser console:
console.log("[v0] API call starting with params:", params)
console.log("[v0] Station data received:", stations)
```

### Mock Data

During development, the map uses mock station data if API is unavailable:
- 5 sample stations with varying demand/inventory
- Realistic wait times and battery availability
- Color-coded markers based on demand

## 7. Component Structure

Key components and their purpose:

```
/components
├── map-component.tsx          # Mapbox GL wrapper, marker rendering
├── station-details-popup.tsx  # Station info card displayed on marker click
├── station-chatbot.tsx        # AI chat interface for station queries
├── reroute-suggestion.tsx     # Smart routing suggestion UI
├── station-feedback-dialog.tsx # Post-visit rating/feedback form
├── map-header.tsx             # Header with user profile & logout
├── error-boundary.tsx         # Error handling & recovery UI
└── empty-state.tsx            # UI for "no stations found"
```

## 8. Styling & Design System

### Colors

The app uses a custom color system defined in `globals.css`:
- Primary (Navy): `#0F172A`
- Accent (Coral): `#FF6B35`
- Success (Green): `#00D084`
- Warning (Amber): `#F59E0B`
- Destructive (Red): `#EF4444`

### Tailwind CSS

All components use Tailwind v4 with custom design tokens. No arbitrary values should be used.

## 9. Mobile Optimization

### Testing on Mobile

```bash
# Get your local IP
ipconfig getifaddr en0  # macOS
hostname -I             # Linux

# Access from phone on same network
http://<YOUR_IP>:3000
```

### Key Mobile Features
- Touch target size: 48px minimum
- Responsive map sizing
- Location-based centering
- Large readable fonts
- Bottom sheet modals for station details

## 10. Deployment

### Deploy to Vercel

```bash
npm i -g vercel

# First deployment
vercel

# Follow prompts to connect GitHub repo and add env vars
```

### Environment Variables on Vercel

1. Go to Vercel dashboard
2. Select your project
3. Settings → Environment Variables
4. Add `NEXT_PUBLIC_MAPBOX_TOKEN`
5. Add `NEXT_PUBLIC_API_BASE_URL`

### Production Checklist

- [ ] Mapbox token is production-ready
- [ ] Backend API URL points to production server
- [ ] Error logging is set up
- [ ] Analytics/monitoring configured
- [ ] Mobile tested on iOS and Android
- [ ] Auth tokens are properly stored
- [ ] CORS enabled on backend

## 11. Troubleshooting

### Map Not Loading

```
Problem: Blank map area
Solution:
1. Check browser console for errors
2. Verify NEXT_PUBLIC_MAPBOX_TOKEN is set
3. Try accessing mapbox.com directly to test token
4. Check browser DevTools Network tab
```

### API Calls Failing

```
Problem: "Cannot reach API"
Solution:
1. Verify NEXT_PUBLIC_API_BASE_URL is correct
2. Check backend is running (curl http://localhost:8000/health)
3. Check CORS headers on backend
4. Review browser Network tab requests
5. Check auth token is being sent
```

### Location Not Working

```
Problem: Map doesn't center on user location
Solution:
1. Ensure HTTPS or localhost (required for location API)
2. Grant location permission in browser
3. Check browser location settings
4. Try disabling VPN/proxy
```

## 12. Performance Optimization

### Tips

- Lazy load station details
- Cache map tiles with service worker
- Compress images
- Minimize bundle size

### Monitoring

- Use Vercel Analytics to track page loads
- Monitor API response times
- Track user interactions with Mapbox events
- Log errors for debugging

## 13. Security Considerations

- Never commit `.env.local`
- Rotate API tokens regularly
- Use HTTPS in production
- Validate all user input on backend
- Implement rate limiting on backend
- Use secure session storage (not localStorage)

## 14. Support & Resources

- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 15. Next Steps

1. Clone the repository
2. Set up environment variables
3. Run `npm install && npm run dev`
4. Configure your backend endpoints
5. Test the authentication flow
6. Deploy to Vercel

Happy coding!
