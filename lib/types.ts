// Type definitions matching Go backend schema

export interface User {
  id: string;
  phone_number: string;
  name: string;
  vehicle_type?: string;
}

// Go Backend Station State Types
export interface Location {
  lat: number;
  lng: number;
}

export interface Inventory {
  charged: number;
  uncharged: number;
  total_slots: number;
}

export interface Queue {
  length: number;
  avg_wait_time_min: number;
}

export interface Charger {
  id: string;
  status: 'OK' | 'FAULT' | 'OFFLINE';
  temperature?: number;
  battery_age_days?: number;
  charge_cycles?: number;
}

export interface ErrorLog {
  code: string;
  charger_id?: string;
  timestamp: string;
  message: string;
}

export interface StationState {
  station_id: string;
  timestamp: string;
  location: Location;
  inventory: Inventory;
  queue: Queue;
  chargers: Charger[];
  error_logs: ErrorLog[];
}

// Frontend derived interface
export interface Station extends StationState {
  name: string;
  demand?: 'high' | 'medium' | 'low';
  rating?: number;
  address?: string;
}

export interface RerouteSuggestion {
  suggested_station_id: string;
  reason: string;
  confidence: number;
  estimated_time_minutes: number;
  wait_time_minutes: number;
  total_time_minutes: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface StationFeedback {
  station_id: string;
  rating: number;
  comment: string;
  wait_time_actual: number;
  timestamp?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface StationStatus {
  status: 'busy' | 'medium' | 'available';
  color: string;
}

export const getStationStatus = (station: Station): StationStatus => {
  const chargedCount = station.inventory.charged;
  const totalSlots = station.inventory.total_slots;
  const utilizationRate = chargedCount / totalSlots;
  const queueLength = station.queue.length;
  const avgWaitTime = station.queue.avg_wait_time_min;
  
  // Determine demand based on queue and utilization
  const isBusy = queueLength > 2 || (utilizationRate < 0.3 && queueLength > 0);
  const isMedium = queueLength === 1 || (utilizationRate >= 0.3 && utilizationRate < 0.7);
  
  if (isBusy) {
    return { status: 'busy', color: '#ef4444' };
  }
  if (isMedium) {
    return { status: 'medium', color: '#f59e0b' };
  }
  return { status: 'available', color: '#00d084' };
};

export const calculateDemand = (station: Station): 'high' | 'medium' | 'low' => {
  const utilizationRate = station.inventory.charged / station.inventory.total_slots;
  const queueLength = station.queue.length;
  
  if (queueLength > 2 || utilizationRate < 0.2) return 'high';
  if (queueLength === 1 || (utilizationRate >= 0.2 && utilizationRate < 0.6)) return 'medium';
  return 'low';
};
