import { create } from 'zustand';
import apiRequest from '../lib/api';

export interface IActivity {
  activityId: string;
  time: string;
  title: string;
  description: string;
  location?: string;
  costEstimate?: string;
}

export interface IDay {
  dayNumber: number;
  activities: IActivity[];
}

export interface IHotel {
  name: string;
  type: string;
  description: string;
  rating?: number;
}

export interface IBudgetBreakdown {
  flights: number;
  accommodation: number;
  food: number;
  activities: number;
  totalCost: number;
  currencyCode?: string;
  currencySymbol?: string;
}

export interface IPackingItem {
  itemId: string;
  name: string;
  category: string;
  checked: boolean;
}

export interface IWeatherGuide {
  summary: string;
  averageTempCelsius: number;
  precipitationChance: number;
}

export interface ITrip {
  _id: string;
  destination: string;
  numDays: number;
  budgetType: 'Low' | 'Medium' | 'High';
  interests: string[];
  estimatedBudget: IBudgetBreakdown;
  hotels: IHotel[];
  itinerary: IDay[];
  packingList: IPackingItem[];
  weatherGuide?: IWeatherGuide;
  createdAt: string;
  updatedAt: string;
}

interface TravelState {
  trips: ITrip[];
  activeTrip: ITrip | null;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;

  fetchTrips: () => Promise<void>;
  fetchTripById: (id: string) => Promise<ITrip>;
  generateTrip: (data: { destination: string; numDays: number; budgetType: string; interests: string[] }) => Promise<ITrip>;
  deleteTrip: (id: string) => Promise<void>;
  togglePackingItem: (tripId: string, itemId: string) => Promise<void>;
  regenerateDay: (tripId: string, dayNumber: number, instructions: string) => Promise<void>;
  updateItinerary: (tripId: string, itinerary: IDay[]) => Promise<void>;
  clearError: () => void;
  validateDestination: (destination: string) => Promise<void>;
}

export const useTravelStore = create<TravelState>((set, get) => ({
  trips: [],
  activeTrip: null,
  isLoading: false,
  isActionLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<{ trips: ITrip[] }>('/trips');
      set({ trips: res.trips, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch trips', isLoading: false });
    }
  },

  fetchTripById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<{ trip: ITrip }>(`/trips/${id}`);
      set({ activeTrip: res.trip, isLoading: false });
      return res.trip;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch trip details', isLoading: false });
      throw err;
    }
  },

  generateTrip: async (formData) => {
    set({ isActionLoading: true, error: null });
    try {
      const res = await apiRequest<{ trip: ITrip }>('/trips', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      set((state) => ({
        trips: [res.trip, ...state.trips],
        activeTrip: res.trip,
        isActionLoading: false,
      }));
      return res.trip;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to generate itinerary', isActionLoading: false });
      throw err;
    }
  },

  deleteTrip: async (id) => {
    set({ isActionLoading: true, error: null });
    try {
      await apiRequest(`/trips/${id}`, { method: 'DELETE' });
      set((state) => ({
        trips: state.trips.filter((t) => t._id !== id),
        activeTrip: state.activeTrip?._id === id ? null : state.activeTrip,
        isActionLoading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete trip', isActionLoading: false });
      throw err;
    }
  },

  togglePackingItem: async (tripId, itemId) => {
    const { activeTrip } = get();
    if (!activeTrip) return;

    // Optimistically update
    const updatedPackingList = activeTrip.packingList.map((item) =>
      item.itemId === itemId ? { ...item, checked: !item.checked } : item
    );

    const backupTrip = { ...activeTrip };
    set({
      activeTrip: { ...activeTrip, packingList: updatedPackingList },
    });

    try {
      const res = await apiRequest<{ trip: ITrip }>(`/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify({ packingList: updatedPackingList }),
      });
      set({ activeTrip: res.trip });
    } catch (err) {
      // Revert if error
      set({ activeTrip: backupTrip, error: 'Failed to update item status' });
    }
  },

  regenerateDay: async (tripId, dayNumber, instructions) => {
    set({ isActionLoading: true, error: null });
    try {
      const res = await apiRequest<{ trip: ITrip }>(`/trips/${tripId}/regenerate-day`, {
        method: 'POST',
        body: JSON.stringify({ dayNumber, instructions }),
      });
      set({ activeTrip: res.trip, isActionLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to regenerate day', isActionLoading: false });
      throw err;
    }
  },

  updateItinerary: async (tripId, updatedItinerary) => {
    const { activeTrip } = get();
    if (!activeTrip) return;

    // Optimistically update
    const backupTrip = { ...activeTrip };
    set({
      activeTrip: { ...activeTrip, itinerary: updatedItinerary },
    });

    try {
      const res = await apiRequest<{ trip: ITrip }>(`/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify({ itinerary: updatedItinerary }),
      });
      set({ activeTrip: res.trip });
    } catch (err) {
      set({ activeTrip: backupTrip, error: 'Failed to update itinerary' });
      throw err;
    }
  },

  validateDestination: async (destination) => {
    set({ isActionLoading: true, error: null });
    try {
      await apiRequest('/trips/validate-destination', {
        method: 'POST',
        body: JSON.stringify({ destination }),
      });
      set({ isActionLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Invalid destination', isActionLoading: false });
      throw err;
    }
  },
}));
