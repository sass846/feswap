# Developer Checklist

Use this checklist to ensure the frontend is properly integrated with your Golang backend.

---

## Pre-Integration Checks

### Environment Setup
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn available (`npm --version`)
- [ ] Git configured
- [ ] Code editor ready (VS Code recommended)

### Backend Prerequisites
- [ ] Golang backend written
- [ ] Redis server running
- [ ] PostgreSQL or database setup
- [ ] LangGraph service accessible
- [ ] Backend running on `http://localhost:8000`

### Mapbox Setup
- [ ] Mapbox account created
- [ ] Public token generated
- [ ] Domain restrictions added (if production)
- [ ] Billing enabled (if needed for production)

---

## Integration Checklist

### 1. API Endpoints Implemented

**Authentication** (`/api/v1`)
- [ ] `POST /auth/login` returns `{ token, user: { id, phone_number, name, vehicle_type } }`
- [ ] `POST /auth/signup` returns same as login
- [ ] Bearer token authentication works
- [ ] Invalid credentials return proper errors

**Stations** (`/api/v1`)
- [ ] `GET /stations?latitude=X&longitude=Y&radius=Z` returns array of StationState
- [ ] `GET /stations/:id` returns single StationState
- [ ] Response includes: station_id, timestamp, location, inventory, queue, chargers, error_logs
- [ ] Filters by latitude/longitude/radius work correctly

**AI Routing** (`/api/v1`)
- [ ] `POST /stations/:id/reroute-suggestion` with { current_lat, current_lng }
- [ ] Returns: suggested_station_id, reason, confidence, estimated_time_minutes, wait_time_minutes, total_time_minutes
- [ ] Calls LangGraph backend
- [ ] Includes confidence scores (0-1)

**Feedback** (`/api/v1`)
- [ ] `POST /feedback` accepts { station_id, rating, comment, wait_time_actual, timestamp }
- [ ] Stores feedback for model training
- [ ] Returns 200 OK on success

### 2. WebSocket Implementation

**Connection** (`/ws`)
- [ ] WebSocket endpoint accessible at `/ws`
- [ ] Accepts first message with auth: `{ type: "auth", data: { token: "jwt_token" } }`
- [ ] Connection persists after auth
- [ ] Can handle multiple concurrent connections

**Station State Events**
- [ ] Publishes to Redis channel: `station.state`
- [ ] Broadcasts to WebSocket with type: "station.state"
- [ ] Includes full StationState object
- [ ] Sends on any inventory/queue/charger change

**LangGraph Action Events**
- [ ] Publishes to Redis channel: `langgraph.action`
- [ ] Worker processes station.state through LangGraph
- [ ] Broadcasts actions to WebSocket with type: "langgraph.action"
- [ ] Includes action type, station_id, confidence, reasoning, metadata

**Message Format**
- [ ] All messages are JSON
- [ ] Format: `{ "type": "message_type", "data": {...} }`
- [ ] No message size limits issues
- [ ] Handles multiple rapid messages

### 3. Redis Event Bus

- [ ] Redis running and accessible
- [ ] `station.state` channel set up
- [ ] `langgraph.action` channel set up
- [ ] Pub/Sub working correctly
- [ ] Messages persisting/queuing properly

### 4. LangGraph Integration

- [ ] LangGraph service running
- [ ] Backend can call LangGraph API
- [ ] Receives routing suggestions with confidence
- [ ] Handles timeouts gracefully
- [ ] Returns reasoning for debugging

### 5. Authentication & Security

- [ ] JWT tokens generated correctly
- [ ] Tokens expire after configured time
- [ ] Refresh token logic implemented (optional)
- [ ] CORS headers set correctly
- [ ] HTTPS in production
- [ ] WSS (secure WebSocket) in production

---

## Local Testing

### Test 1: Authentication Flow
- [ ] Start backend: `go run cmd/main.go`
- [ ] Start frontend: `npm run dev`
- [ ] Navigate to `http://localhost:3000`
- [ ] Login page loads
- [ ] Enter credentials
- [ ] Authentication succeeds
- [ ] Redirects to map page
- [ ] Token stored in localStorage

### Test 2: Map Loading
- [ ] Map appears on screen
- [ ] Mapbox logo visible
- [ ] Current location centered (or default NYC)
- [ ] Map controls work (zoom, pan)
- [ ] No console errors

### Test 3: Station Markers
- [ ] Markers appear on map
- [ ] Markers have correct colors (red/orange/green)
- [ ] Hover shows station name
- [ ] Click opens details popup
- [ ] Markers update in real-time

### Test 4: WebSocket Connection
- [ ] Open DevTools → Network tab
- [ ] Refresh map page
- [ ] Find `/ws` connection
- [ ] Status should be "101 Switching Protocols"
- [ ] Click "Messages" tab
- [ ] See incoming `station.state` messages
- [ ] See `langgraph.action` messages (if any)

### Test 5: Station Details
- [ ] Click on a station marker
- [ ] Popup opens showing:
  - [ ] Station ID
  - [ ] Inventory levels (charged/uncharged)
  - [ ] Queue length
  - [ ] Average wait time
  - [ ] Charger status (OK/FAULT/OFFLINE)
  - [ ] Error logs (if any)
- [ ] All data matches backend

### Test 6: Reroute Suggestions
- [ ] Select a station (with high demand)
- [ ] Check if reroute suggestion appears
- [ ] Shows alternative station
- [ ] Shows total time estimate
- [ ] Can click "Accept" or "Dismiss"
- [ ] Accepting changes selected station

### Test 7: Feedback Submission
- [ ] Click feedback button (in details popup)
- [ ] Rating modal opens
- [ ] Can rate 1-5 stars
- [ ] Can enter comment
- [ ] Can submit feedback
- [ ] Feedback appears in backend database

### Test 8: Logout
- [ ] Click profile menu
- [ ] Click logout
- [ ] Token removed from localStorage
- [ ] Redirects to login page
- [ ] WebSocket disconnects

---

## API Testing (curl commands)

### Test Authentication
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+1234567890","password":"password"}'
```

### Test Stations
```bash
curl -X GET "http://localhost:8000/api/v1/stations?latitude=40.7128&longitude=-74.0060&radius=15" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Reroute
```bash
curl -X POST http://localhost:8000/api/v1/stations/station_1/reroute-suggestion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"current_lat":40.7128,"current_lng":-74.0060}'
```

### Test WebSocket (wscat)
```bash
# Install: npm install -g wscat
wscat -c ws://localhost:8000/ws

# Send auth message:
{"type":"auth","data":{"token":"YOUR_JWT_TOKEN"}}

# Should receive station.state and langgraph.action messages
```

---

## Frontend Configuration

### Environment Variables
- [ ] `.env.local` file created
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` set
- [ ] `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` for local dev
- [ ] Variables are accessible in browser console (check with `process.env`)

### Debugging
- [ ] Console shows `[v0]` prefixed logs
- [ ] DevTools Network tab shows API calls
- [ ] DevTools Console shows any errors
- [ ] DevTools WebSocket tab shows messages

---

## Common Issues to Fix

### "API error: 404 or 500"
- [ ] Verify endpoint paths match exactly
- [ ] Check request method (POST vs GET)
- [ ] Check request body format
- [ ] Check backend is returning proper JSON

### "WebSocket not connecting"
- [ ] Verify `/ws` endpoint exists
- [ ] Check backend is listening on WebSocket port
- [ ] Check CORS headers if different domain
- [ ] Check firewall/network policies

### "No real-time updates"
- [ ] Verify Redis is running
- [ ] Check event bus channels are publishing
- [ ] Verify WebSocket hub is subscribed
- [ ] Check DevTools WebSocket messages

### "Wrong data format"
- [ ] Compare backend response to TypeScript types in `/lib/types.ts`
- [ ] Ensure all required fields are present
- [ ] Check field names match exactly (case-sensitive)
- [ ] Verify timestamps are ISO 8601 format

---

## Production Deployment

### Before Going Live
- [ ] All environment variables set in Vercel
- [ ] Backend API URL updated to production
- [ ] Mapbox token restricted to production domain
- [ ] SSL/HTTPS enabled
- [ ] WebSocket WSS (secure) enabled
- [ ] CORS headers configured
- [ ] Database backups configured
- [ ] Error tracking (Sentry) configured
- [ ] Monitoring alerts set up
- [ ] Rate limiting configured
- [ ] Load testing completed

### Vercel Deployment
- [ ] Code pushed to GitHub
- [ ] Vercel project connected
- [ ] Environment variables added:
  - [ ] `NEXT_PUBLIC_MAPBOX_TOKEN`
  - [ ] `NEXT_PUBLIC_API_BASE_URL` (production URL)
- [ ] Build succeeds
- [ ] Tests pass
- [ ] Deployed successfully
- [ ] Custom domain configured (if needed)

### Post-Deployment
- [ ] Test login on production
- [ ] Verify map loads
- [ ] Check WebSocket connection
- [ ] Monitor error logs
- [ ] Test all features
- [ ] Verify performance

---

## Performance Checklist

- [ ] Map renders within 2 seconds
- [ ] Station list loads within 1 second
- [ ] WebSocket reconnects automatically
- [ ] No memory leaks after 30 min usage
- [ ] Large station lists (100+) handled smoothly
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] CSS minified
- [ ] JavaScript minified

---

## Security Checklist

- [ ] No hardcoded secrets in code
- [ ] JWT tokens have expiry
- [ ] HTTPS/WSS in production
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] No SQL injection vulnerabilities
- [ ] Rate limiting configured
- [ ] XSS protection enabled
- [ ] CSRF tokens if applicable
- [ ] Regular dependency updates

---

## Monitoring & Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor API response times
- [ ] Check WebSocket connection rate

### Weekly
- [ ] Review user feedback data
- [ ] Check performance metrics
- [ ] Update dependencies if needed

### Monthly
- [ ] Review security logs
- [ ] Check uptime statistics
- [ ] Plan feature improvements

---

## Sign-Off

- [ ] **Frontend Developer**: All components working
- [ ] **Backend Developer**: All endpoints working
- [ ] **DevOps**: Infrastructure configured
- [ ] **QA**: All tests passing
- [ ] **Product**: Features validated
- [ ] **Ready to Deploy**: Yes/No

---

Use this checklist before each release to ensure quality and reliability!
