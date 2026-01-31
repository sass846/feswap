# Go Backend Integration Guide

This document describes how to integrate the SwapHub frontend with your Golang event-driven backend.

## Architecture Overview

```
IoT Devices (Stations)
    ↓
Golang Backend (Ingestion Service)
    ↓
Redis Event Bus (pub/sub)
    ├→ LangGraph Worker (AI Processing)
    ├→ Frontend WebSocket Hub (Real-time streaming)
    └→ Analytics Workers
    
Frontend (SwapHub Driver App) ←WebSocket→ Golang Backend
```

## Frontend Expectations

### 1. HTTP REST Endpoints (v1)

All endpoints should be prefixed with `/api/v1` and use Bearer token authentication.

#### Authentication

```go
POST /api/v1/auth/login
Content-Type: application/json

{
  "phone_number": "+1234567890",
  "password": "password"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "user": {
    "id": "user_uuid",
    "phone_number": "+1234567890",
    "name": "John Doe",
    "vehicle_type": "truck"
  }
}
```

```go
POST /api/v1/auth/signup
Content-Type: application/json

{
  "phone_number": "+1234567890",
  "password": "password",
  "name": "John Doe",
  "vehicle_type": "truck"
}

Response 200: Same as login
```

#### Station Queries

```go
GET /api/v1/stations?latitude=40.7128&longitude=-74.0060&radius=15
Authorization: Bearer <token>

Response 200:
[
  {
    "station_id": "station_uuid",
    "timestamp": "2025-01-31T10:30:00Z",
    "location": {
      "lat": 40.7580,
      "lng": -73.9855
    },
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
        "id": "charger_uuid",
        "status": "OK",
        "temperature": 45.2,
        "battery_age_days": 180,
        "charge_cycles": 250
      }
    ],
    "error_logs": [
      {
        "code": "TEMP_HIGH",
        "charger_id": "charger_uuid",
        "timestamp": "2025-01-31T10:25:00Z",
        "message": "Temperature exceeded threshold"
      }
    ]
  }
]
```

```go
GET /api/v1/stations/:station_id
Authorization: Bearer <token>

Response 200: Single StationState object (same schema as above)
```

#### AI Routing (LangGraph Integration)

```go
POST /api/v1/stations/:station_id/reroute-suggestion
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_lat": 40.7128,
  "current_lng": -74.0060
}

Response 200:
{
  "suggested_station_id": "station_uuid",
  "reason": "Lower utilization expected",
  "confidence": 0.87,
  "estimated_time_minutes": 10,
  "wait_time_minutes": 5,
  "total_time_minutes": 15
}
```

**Note**: This endpoint should:
1. Call your LangGraph service with current station state
2. Include context: current driver location, target station, nearby alternatives
3. Return confidence score (0-1) for the suggestion
4. Include reasoning for debugging

#### Feedback Collection

```go
POST /api/v1/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "station_id": "station_uuid",
  "rating": 4,
  "comment": "Fast and efficient service",
  "wait_time_actual": 12,
  "timestamp": "2025-01-31T10:30:00Z"
}

Response 200:
{ "status": "accepted" }
```

**Note**: Feedback should be stored for model training and sent to LangGraph for continuous improvement.

### 2. WebSocket Connection

The frontend connects to `/ws` and maintains a persistent connection for real-time updates.

#### Connection Flow

1. **Frontend connects** to `/ws`
2. **Frontend sends auth** message with JWT token
3. **Backend subscribes** frontend to Redis channels
4. **Backend broadcasts** station state and action updates

#### WebSocket Message Format

All messages are JSON with `type` and `data` fields:

```json
{
  "type": "message_type",
  "data": { ... }
}
```

#### Auth Message (Client → Server)

```json
{
  "type": "auth",
  "data": {
    "token": "jwt_token_here"
  }
}
```

Response: No immediate response, but connection is authenticated.

#### Station State Updates (Server → Client)

Broadcast when station state changes (from IoT devices):

```json
{
  "type": "station.state",
  "data": {
    "station_id": "station_uuid",
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
    "chargers": [ ... ],
    "error_logs": [ ... ]
  }
}
```

#### LangGraph Actions (Server → Client)

Broadcast when LangGraph generates an action:

```json
{
  "type": "langgraph.action",
  "data": {
    "type": "reroute",
    "station_id": "station_uuid",
    "confidence": 0.85,
    "reasoning": "High demand detected, alternative station has lower wait time",
    "metadata": {
      "target_station": "station_2_uuid",
      "num_drivers": 3,
      "estimated_time": 10,
      "wait_time": 5
    }
  }
}
```

Valid action types:
- `reroute`: Suggest alternative station (for drivers)
- `ticket`: Create maintenance ticket (internal)
- `rebalance`: Trigger battery rebalancing (internal)

### 3. Event Bus Integration

Your Golang backend should:

1. **Ingest** station IoT data → `/api/v1/stations/:id/state` (from devices)
2. **Publish** to Redis: `station.state` channel
3. **Worker** consumes from Redis and calls LangGraph
4. **Worker** publishes LangGraph response to `langgraph.action` channel
5. **WebSocket Hub** subscribes to both channels and broadcasts to connected clients

Example flow:

```go
// Ingestion Service
func (s *IngestionService) IngestStationState(ctx Context) {
  var state StationState
  ctx.Bind(&state)
  
  // Publish to Redis
  s.eventBus.Publish("station.state", state)
}

// Worker (separate goroutine)
func (w *Worker) ProcessStationEvents() {
  w.eventBus.Subscribe("station.state", func(data []byte) {
    var state StationState
    json.Unmarshal(data, &state)
    
    // Call LangGraph
    action := w.langgraphClient.Process(state)
    
    // Publish action
    w.eventBus.Publish("langgraph.action", action)
  })
}

// WebSocket Hub
func (h *Hub) Run() {
  go h.eventBus.Subscribe("station.state", func(data []byte) {
    h.broadcast <- WebSocketMessage{
      Type: "station.state",
      Data: data,
    }
  })
  
  go h.eventBus.Subscribe("langgraph.action", func(data []byte) {
    h.broadcast <- WebSocketMessage{
      Type: "langgraph.action",
      Data: data,
    }
  })
}
```

## Frontend Code

The frontend includes helpers for this integration:

### WebSocketManager

Located in `/lib/api.ts`, handles:
- Connection and authentication
- Automatic reconnection with exponential backoff
- Event subscription and unsubscription
- Debug logging

```typescript
import { WebSocketManager } from '@/lib/api';

// Create manager with token
const ws = new WebSocketManager(token);

// Connect
await ws.connect();

// Subscribe to events
ws.subscribe('station.state', (data) => {
  console.log('Station updated:', data);
});

// Send messages
ws.send('chat', { message: 'Hello' });

// Cleanup
ws.disconnect();
```

### Type Definitions

All types are in `/lib/types.ts` matching your Go structs:
- `StationState` - Full station telemetry
- `Inventory` - Battery counts
- `Queue` - Wait time data
- `Charger` - Individual charger status
- `ErrorLog` - Error events

## Testing Integration

### Manual WebSocket Testing

Use the browser DevTools or wscat:

```bash
# Connect to WebSocket
wscat -c ws://localhost:8000/ws

# Send auth message
{"type":"auth","data":{"token":"your_jwt_token"}}

# You should start receiving station.state and langgraph.action messages
```

### Frontend Network Tab

Open browser DevTools → Network → WS tab:
- Should see `/ws` connection as "101 Switching Protocols"
- Check "Messages" tab for incoming broadcasts
- Green checkmark = connected and receiving

### Debug Logs

Frontend logs with `[v0]` prefix:
```
[v0] WebSocket connected
[v0] Station updated: station_1
[v0] Received action: reroute
```

## Common Issues

### WebSocket Connection Fails

**Problem**: Frontend can't connect to `/ws`
**Solution**:
- Ensure backend is listening on correct port/host
- Check `NEXT_PUBLIC_API_BASE_URL` environment variable
- Verify CORS headers if different domain
- Check firewall/network policies

### No Real-Time Updates

**Problem**: WebSocket connected but no messages
**Solution**:
- Verify Redis is running and pub/sub working
- Check station state is being published to Redis
- Verify worker is consuming and processing events
- Check WebSocket hub subscribes to correct channels

### High Latency

**Problem**: Updates take too long
**Solution**:
- Reduce polling interval in frontend (currently 30-60s)
- Check Redis throughput
- Profile LangGraph API response time
- Consider caching static station data

### Memory Leaks

**Problem**: Frontend memory grows over time
**Solution**:
- Ensure WebSocket unsubscribe is called on cleanup
- Check station data array isn't growing unbounded
- Use React DevTools Profiler to find leaks

## Performance Tuning

### Frontend Optimizations

1. **Marker Clustering**: Mapbox clustering reduces marker count
2. **Update Batching**: Group station updates before re-render
3. **Lazy Loading**: Load chatbot messages on demand

### Backend Optimizations

1. **Event Filtering**: Only broadcast state changes, not duplicates
2. **GeoHash Indexing**: Fast spatial queries for nearby stations
3. **LangGraph Caching**: Cache routing decisions for similar scenarios

## Deployment Checklist

- [ ] Golang backend deployed with Redis
- [ ] JWT tokens configured and working
- [ ] WebSocket endpoint accessible from frontend domain
- [ ] CORS headers configured (if different domain)
- [ ] LangGraph service connected to backend
- [ ] Event bus (Redis) configured for pub/sub
- [ ] SSL certificates for secure WebSocket (wss://)
- [ ] Environment variables set in Vercel
- [ ] Database backups for feedback data
- [ ] Monitoring alerts for WebSocket disconnections
