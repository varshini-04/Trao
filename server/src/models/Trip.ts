import { Schema, model, Document, Types } from 'mongoose';

export interface IActivity {
  activityId: string;
  time: string; // e.g., "Morning", "Afternoon", "Evening"
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
  type: 'Budget Friendly' | 'Mid Range' | 'Luxury' | string;
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
  category: 'Clothing' | 'Toiletries' | 'Electronics' | 'Documents' | 'Miscellaneous' | string;
  checked: boolean;
}

export interface IWeatherGuide {
  summary: string;
  averageTempCelsius: number;
  precipitationChance: number;
}

export interface ITrip extends Document {
  userId: Types.ObjectId;
  destination: string;
  numDays: number;
  budgetType: 'Low' | 'Medium' | 'High';
  interests: string[];
  estimatedBudget: IBudgetBreakdown;
  hotels: IHotel[];
  itinerary: IDay[];
  packingList: IPackingItem[];
  weatherGuide?: IWeatherGuide;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>({
  activityId: { type: String, required: true },
  time: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String },
  costEstimate: { type: String }
});

const daySchema = new Schema<IDay>({
  dayNumber: { type: Number, required: true },
  activities: [activitySchema]
});

const hotelSchema = new Schema<IHotel>({
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  rating: { type: Number }
});

const budgetSchema = new Schema<IBudgetBreakdown>({
  flights: { type: Number, required: true },
  accommodation: { type: Number, required: true },
  food: { type: Number, required: true },
  activities: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  currencyCode: { type: String },
  currencySymbol: { type: String }
});

const packingItemSchema = new Schema<IPackingItem>({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  checked: { type: Boolean, default: false }
});

const weatherGuideSchema = new Schema<IWeatherGuide>({
  summary: { type: String, required: true },
  averageTempCelsius: { type: Number, required: true },
  precipitationChance: { type: Number, required: true }
});

const tripSchema = new Schema<ITrip>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true
    },
    numDays: {
      type: Number,
      required: [true, 'Number of days is required'],
      min: [1, 'Must be at least 1 day']
    },
    budgetType: {
      type: String,
      required: [true, 'Budget type is required'],
      enum: ['Low', 'Medium', 'High']
    },
    interests: {
      type: [String],
      default: []
    },
    estimatedBudget: {
      type: budgetSchema,
      required: true
    },
    hotels: {
      type: [hotelSchema],
      default: []
    },
    itinerary: {
      type: [daySchema],
      default: []
    },
    packingList: {
      type: [packingItemSchema],
      default: []
    },
    weatherGuide: {
      type: weatherGuideSchema
    }
  },
  {
    timestamps: true
  }
);

export const Trip = model<ITrip>('Trip', tripSchema);
