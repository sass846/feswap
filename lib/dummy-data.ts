import type { User, Station } from '@/lib/types';

// Dummy users for demo purposes
export const DUMMY_USERS: Record<string, { password: string; user: User }> = {
  '+11234567890': {
    password: 'password123',
    user: {
      id: 'user_001',
      phone_number: '+11234567890',
      name: 'John Doe',
      vehicle_type: 'electric',
    },
  },
  '+19876543210': {
    password: 'demo123',
    user: {
      id: 'user_002',
      phone_number: '+19876543210',
      name: 'Jane Smith',
      vehicle_type: 'scooter',
    },
  },
};

// Dummy stations data
export const DUMMY_STATIONS: Station[] = [
  {
    station_id: 'station_001',
    name: 'Downtown Hub',
    address: '123 Main St, Downtown',
    timestamp: new Date().toISOString(),
    location: {
      lat: 40.7128,
      lng: -74.0060,
    },
    inventory: {
      charged: 8,
      uncharged: 4,
      total_slots: 12,
    },
    queue: {
      length: 2,
      avg_wait_time_min: 5,
    },
    chargers: [
      { id: 'charger_001', status: 'OK', temperature: 35 },
      { id: 'charger_002', status: 'OK', temperature: 34 },
      { id: 'charger_003', status: 'OK', temperature: 36 },
      { id: 'charger_004', status: 'FAULT', temperature: 45 },
    ],
    error_logs: [],
    demand: 'medium',
    rating: 4.5,
  },
  {
    station_id: 'station_002',
    name: 'Central Park Station',
    address: '500 Park Ave, Central Park',
    timestamp: new Date().toISOString(),
    location: {
      lat: 40.7850,
      lng: -73.9740,
    },
    inventory: {
      charged: 10,
      uncharged: 2,
      total_slots: 12,
    },
    queue: {
      length: 0,
      avg_wait_time_min: 0,
    },
    chargers: [
      { id: 'charger_005', status: 'OK', temperature: 32 },
      { id: 'charger_006', status: 'OK', temperature: 33 },
      { id: 'charger_007', status: 'OK', temperature: 31 },
      { id: 'charger_008', status: 'OK', temperature: 34 },
    ],
    error_logs: [],
    demand: 'low',
    rating: 4.8,
  },
  {
    station_id: 'station_003',
    name: 'Airport Terminal Hub',
    address: '2000 Terminal Rd, Airport',
    timestamp: new Date().toISOString(),
    location: {
      lat: 40.6413,
      lng: -73.7781,
    },
    inventory: {
      charged: 4,
      uncharged: 8,
      total_slots: 12,
    },
    queue: {
      length: 5,
      avg_wait_time_min: 12,
    },
    chargers: [
      { id: 'charger_009', status: 'OK', temperature: 38 },
      { id: 'charger_010', status: 'OK', temperature: 40 },
      { id: 'charger_011', status: 'FAULT', temperature: 50 },
      { id: 'charger_012', status: 'OFFLINE', temperature: 25 },
    ],
    error_logs: [
      {
        code: 'TEMP_HIGH',
        charger_id: 'charger_011',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        message: 'Temperature warning on charger 11',
      },
    ],
    demand: 'high',
    rating: 3.9,
  },
  {
    station_id: 'station_004',
    name: 'Tech District Station',
    address: '888 Innovation Blvd, Tech District',
    timestamp: new Date().toISOString(),
    location: {
      lat: 40.7489,
      lng: -73.9680,
    },
    inventory: {
      charged: 11,
      uncharged: 1,
      total_slots: 12,
    },
    queue: {
      length: 1,
      avg_wait_time_min: 3,
    },
    chargers: [
      { id: 'charger_013', status: 'OK', temperature: 33 },
      { id: 'charger_014', status: 'OK', temperature: 32 },
      { id: 'charger_015', status: 'OK', temperature: 34 },
      { id: 'charger_016', status: 'OK', temperature: 33 },
    ],
    error_logs: [],
    demand: 'low',
    rating: 4.6,
  },
  {
    station_id: 'station_005',
    name: 'Shopping Mall Center',
    address: '450 Retail Plaza, Mall District',
    timestamp: new Date().toISOString(),
    location: {
      lat: 40.7505,
      lng: -73.9972,
    },
    inventory: {
      charged: 6,
      uncharged: 6,
      total_slots: 12,
    },
    queue: {
      length: 3,
      avg_wait_time_min: 8,
    },
    chargers: [
      { id: 'charger_017', status: 'OK', temperature: 35 },
      { id: 'charger_018', status: 'OK', temperature: 36 },
      { id: 'charger_019', status: 'OK', temperature: 35 },
      { id: 'charger_020', status: 'OK', temperature: 37 },
    ],
    error_logs: [],
    demand: 'medium',
    rating: 4.2,
  },
];

// Mock authentication with any credentials (for demo)
export function validateDummyLogin(phone: string, password: string): User | null {
  // Allow either predefined credentials or any input for demo
  const user = DUMMY_USERS[phone];
  
  if (user && user.password === password) {
    return user.user;
  }
  
  // For demo purposes, allow any phone/password combination
  // In real app, this would be removed
  if (phone && password) {
    return {
      id: `user_${Date.now()}`,
      phone_number: phone,
      name: phone.replace(/\D/g, '').slice(-4) || 'User',
      vehicle_type: 'electric',
    };
  }
  
  return null;
}

// Generate mock token
export function generateMockToken(): string {
  return `dummy_token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Get all dummy stations
export function getAllStations(): Station[] {
  return DUMMY_STATIONS;
}

// Get station by ID
export function getStationById(id: string): Station | undefined {
  return DUMMY_STATIONS.find((s) => s.station_id === id);
}

// Simulate real-time station updates
export function getUpdatedStationState(stationId: string): Station | undefined {
  const station = getStationById(stationId);
  if (!station) return undefined;

  // Add some variance to simulate real-time changes
  return {
    ...station,
    timestamp: new Date().toISOString(),
    inventory: {
      ...station.inventory,
      charged: Math.max(0, station.inventory.charged + (Math.random() > 0.5 ? 1 : -1)),
    },
    queue: {
      ...station.queue,
      length: Math.max(0, station.queue.length + (Math.random() > 0.5 ? 1 : -1)),
    },
  };
}
