# SwapHub - Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites

- Node.js 18+
- Mapbox token ([get one free](https://mapbox.com))
- Golang backend running on `http://localhost:8000`

## 1. Clone & Install

```bash
git clone <repo>
cd swaph
npm install
```

## 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 4. Test Authentication

**Login Page** shows on first load. Enter:
- Phone: `+1234567890`
- Password: `password`

If backend is not running, you'll see an error. Make sure Golang backend is accessible.

## 5. See Real-Time Updates

Once logged in, you should see:
- **Map** with color-coded station markers
- **WebSocket** connection in DevTools (Network → WS tab)
- **Real-time updates** as station state changes from backend

## Key URLs

| Page | URL |
|------|-----|
| Login/Signup | `http://localhost:3000/` |
| Map | `http://localhost:3000/map` |

## Common Issues

### "Failed to load stations"
- Backend not running → Start Golang backend
- Wrong URL → Check `NEXT_PUBLIC_API_BASE_URL`
- CORS error → Verify backend CORS headers

### "Mapbox token invalid"
- Token not set → Add to `.env.local`
- Token expired → Get new one from Mapbox
- Domain not whitelisted → Whitelist in Mapbox dashboard

### "WebSocket connection failed"
- Backend not running → Start Redis + Golang backend
- Wrong backend URL → Verify environment variable
- Firewall blocking → Check network/firewall rules

## File Locations

- **Login/Signup UI**: `/app/page.tsx`
- **Map Interface**: `/app/map/page.tsx`
- **API Integration**: `/lib/api.ts`
- **Type Definitions**: `/lib/types.ts`
- **Auth Context**: `/app/context/auth-context.tsx`

## Useful Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Check code style
npm start          # Start production server
```

## Next Steps

1. **Read the docs**:
   - [README.md](./README.md) - Full overview
   - [GO_BACKEND_INTEGRATION.md](./GO_BACKEND_INTEGRATION.md) - Backend contract
   - [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup

2. **Test features**:
   - Click on station markers
   - Check station details popup
   - Try reroute suggestions
   - Submit feedback

3. **Deploy**:
   - Push to GitHub
   - Connect to Vercel
   - Set environment variables
   - Deploy

## WebSocket Testing

Open DevTools → Network tab:

1. Refresh page and find `/ws` connection
2. Right-click → "Show in DevTools"
3. Click "Messages" tab
4. Watch for real-time `station.state` messages

## Debug Logs

Check browser console for `[v0]` logs:

```
[v0] WebSocket connected
[v0] Station updated: station_1
[v0] Received action: reroute
```

## Need Help?

1. Check error messages in console
2. Read [GO_BACKEND_INTEGRATION.md](./GO_BACKEND_INTEGRATION.md) for backend requirements
3. Verify backend is sending WebSocket messages
4. Check environment variables are set correctly

## What's Next?

- Customize colors in `/app/globals.css`
- Add new features in `/components`
- Update API endpoints in `/lib/api.ts`
- Extend types in `/lib/types.ts`

Happy coding! 🚀
