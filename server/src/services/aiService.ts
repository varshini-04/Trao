import Groq from 'groq-sdk';
import { z } from 'zod';
import { IBudgetBreakdown, IHotel, IDay, IPackingItem, IWeatherGuide } from '../models/Trip';

// Strict validation schemas using Zod as the data contract with bulletproof fallbacks
export const ActivitySchema = z.object({
  activityId: z.string(),
  time: z.string().transform(val => {
    const lower = val.toLowerCase();
    if (lower.includes('morn')) return 'Morning';
    if (lower.includes('afternoon') || lower.includes('noon') || lower.includes('day')) return 'Afternoon';
    return 'Evening';
  }),
  title: z.string(),
  description: z.string(),
  location: z.string().default('N/A').catch('N/A'),
  costEstimate: z.string().default('Free').catch('Free')
});

export const DaySchema = z.object({
  dayNumber: z.number(),
  activities: z.array(ActivitySchema)
});

export const BudgetSchema = z.object({
  flights: z.number(),
  accommodation: z.number(),
  food: z.number(),
  activities: z.number(),
  totalCost: z.number(),
  currencyCode: z.string().optional(),
  currencySymbol: z.string().optional()
});

export const HotelSchema = z.object({
  name: z.string(),
  type: z.string().default('Mid Range').catch('Mid Range'),
  description: z.string(),
  rating: z.number().optional().default(4.0).catch(4.0)
});

export const PackingItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  category: z.string().default('Miscellaneous').catch('Miscellaneous'),
  checked: z.boolean().default(false).catch(false)
});

export const WeatherGuideSchema = z.object({
  summary: z.string(),
  averageTempCelsius: z.number().catch(22),
  precipitationChance: z.number().catch(15)
});

export const TripSchema = z.object({
  _budgetReasoning: z.string().optional(),
  estimatedBudget: BudgetSchema,
  hotels: z.array(HotelSchema),
  itinerary: z.array(DaySchema),
  packingList: z.array(PackingItemSchema),
  weatherGuide: WeatherGuideSchema.optional()
});

const getApiKey = () => process.env.GROQ_API_KEY || '';
const MODEL_NAME = 'llama-3.3-70b-versatile'; // Standard smart model on Groq

const getCurrencyForDestination = (destination: string) => {
  const dest = destination.toLowerCase().trim();
  if (dest.includes('japan') || dest.includes('tokyo') || dest.includes('kyoto') || dest.includes('osaka')) {
    return { code: 'JPY', symbol: '¥', multiplier: 150 };
  }
  if (dest.includes('uk') || dest.includes('london') || dest.includes('united kingdom') || dest.includes('england') || dest.includes('gbp')) {
    return { code: 'GBP', symbol: '£', multiplier: 0.8 };
  }
  if (dest.includes('france') || dest.includes('paris') || dest.includes('germany') || dest.includes('italy') || dest.includes('rome') || dest.includes('spain') || dest.includes('europe') || dest.includes('euro')) {
    return { code: 'EUR', symbol: '€', multiplier: 0.95 };
  }
  if (dest.includes('india') || dest.includes('delhi') || dest.includes('mumbai') || dest.includes('bangalore') || dest.includes('inr')) {
    return { code: 'INR', symbol: '₹', multiplier: 83 };
  }
  if (dest.includes('canada') || dest.includes('toronto') || dest.includes('vancouver')) {
    return { code: 'CAD', symbol: 'C$', multiplier: 1.35 };
  }
  if (dest.includes('australia') || dest.includes('sydney') || dest.includes('melbourne')) {
    return { code: 'AUD', symbol: 'A$', multiplier: 1.5 };
  }
  // Default to USD
  return { code: 'USD', symbol: '$', multiplier: 1 };
};

// Fallback Mock Data Generator in case API key is missing or error occurs
const generateMockTrip = (
  destination: string,
  numDays: number,
  budgetType: 'Low' | 'Medium' | 'High',
  interests: string[]
) => {
  const { code, symbol, multiplier } = getCurrencyForDestination(destination);
  const baseCost = (budgetType === 'Low' ? 100 : budgetType === 'Medium' ? 250 : 600) * multiplier;
  const flightCost = (budgetType === 'Low' ? 300 : budgetType === 'Medium' ? 600 : 1200) * multiplier;
  const accommodationCost = baseCost * numDays * 0.8;
  const foodCost = baseCost * numDays * 0.3;
  const activitiesCost = baseCost * numDays * 0.4;
  const totalCost = Math.round(flightCost + accommodationCost + foodCost + activitiesCost);

  const hotels: IHotel[] = [
    {
      name: `${destination} Cozy Inn`,
      type: 'Budget Friendly',
      description: 'Affordable, clean, close to public transport.',
      rating: 4.2
    },
    {
      name: `${destination} Plaza & Suites`,
      type: 'Mid Range',
      description: 'Modern amenities, great breakfast, central location.',
      rating: 4.5
    },
    {
      name: `${destination} Grand Resort & Spa`,
      type: 'Luxury',
      description: 'Five-star luxurious stay with premium spa services and fine dining.',
      rating: 4.8
    }
  ];

  const packingList: IPackingItem[] = [
    { itemId: 'pack-1', name: 'Passport & Identity Cards', category: 'Documents', checked: false },
    { itemId: 'pack-2', name: 'Boarding Pass & Booking Receipts', category: 'Documents', checked: false },
    { itemId: 'pack-3', name: 'Comfortable Walking Shoes', category: 'Clothing', checked: false },
    { itemId: 'pack-4', name: 'Universal Travel Adapter', category: 'Electronics', checked: false },
    { itemId: 'pack-5', name: 'Toothbrush & Toiletries Kit', category: 'Toiletries', checked: false },
  ];

  if (interests.includes('Adventure')) {
    packingList.push({ itemId: 'pack-adv', name: 'Hiking Gear & Outdoor Clothes', category: 'Clothing', checked: false });
  }
  if (interests.includes('Food')) {
    packingList.push({ itemId: 'pack-food', name: 'Digestive Enzymes / Antacids', category: 'Miscellaneous', checked: false });
  }

  const itinerary: IDay[] = [];
  const interestPhrases = interests.length > 0 ? interests.join(' and ') : 'general sightseeing';

  for (let i = 1; i <= numDays; i++) {
    itinerary.push({
      dayNumber: i,
      activities: [
        {
          activityId: `act-${i}-1`,
          time: 'Morning',
          title: `Explore ${destination} Landmark`,
          description: `Kickstart the trip with a historic visit related to ${interestPhrases}.`,
          location: `${destination} Old Town`,
          costEstimate: budgetType === 'Low' ? 'Free' : '$20'
        },
        {
          activityId: `act-${i}-2`,
          time: 'Afternoon',
          title: `Local Culinary Tasting`,
          description: `Enjoy typical delicacies at a popular local marketplace.`,
          location: `Downtown ${destination}`,
          costEstimate: budgetType === 'Low' ? '$10' : '$35'
        },
        {
          activityId: `act-${i}-3`,
          time: 'Evening',
          title: `Sunset Walk & Nightlife`,
          description: `Unwind by walking through the scenic districts or viewing a performance.`,
          location: `${destination} Promenade`,
          costEstimate: budgetType === 'Low' ? 'Free' : '$50'
        }
      ]
    });
  }

  const weatherGuide: IWeatherGuide = {
    summary: `Generally pleasant in ${destination}. Perfect for enjoying the local ${interestPhrases}.`,
    averageTempCelsius: 22,
    precipitationChance: 15
  };

  return {
    estimatedBudget: {
      flights: Math.round(flightCost),
      accommodation: Math.round(accommodationCost),
      food: Math.round(foodCost),
      activities: Math.round(activitiesCost),
      totalCost,
      currencyCode: code,
      currencySymbol: symbol
    },
    hotels,
    itinerary,
    packingList,
    weatherGuide
  };
};

interface AITripOutput {
  estimatedBudget: IBudgetBreakdown;
  hotels: IHotel[];
  itinerary: IDay[];
  packingList: IPackingItem[];
  weatherGuide: IWeatherGuide;
  _budgetReasoning?: string;
}

export class InvalidDestinationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDestinationError';
  }
}

const isGibberish = (str: string): boolean => {
  const clean = str.trim().toLowerCase();
  if (clean.length < 3) return true;
  const popularMock = ['tokyo', 'paris', 'new york', 'bali', 'london', 'rome', 'kyoto', 'japan', 'france', 'usa', 'indonesia', 'uk', 'italy'];
  if (popularMock.some(m => clean.includes(m))) return false;
  const hasVowels = /[aeiouy]/i.test(clean);
  if (!hasVowels) return true;
  if (/^[bcdfghjklmnpqrstvwxz]+$/i.test(clean)) return true;
  return false;
};

export const validateDestinationAI = async (destination: string): Promise<boolean> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return !isGibberish(destination);
  }

  try {
    const groq = new Groq({ apiKey });
    const prompt = `
      Verify if the destination "${destination}" is a real, geographically valid city, region, or country.
      Respond with ONLY a JSON object:
      {
        "valid": boolean
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a travel validation agent. You check if location names exist in the real world. Respond ONLY with JSON { "valid": true } or { "valid": false }.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: MODEL_NAME,
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText) return false;
    const parsed = JSON.parse(responseText.trim());
    return !!parsed.valid;
  } catch (error) {
    console.error('Error validating destination via LLM:', error);
    return !isGibberish(destination);
  }
};

export const generateAITrip = async (
  destination: string,
  numDays: number,
  budgetType: 'Low' | 'Medium' | 'High',
  interests: string[]
): Promise<AITripOutput> => {
  // Edge Case 3: Reject Extremes in Trip Parameters (1 to 7 Days maximum for security & stability)
  if (numDays < 1 || numDays > 7) {
    throw new Error("App supports 1-7 day itineraries for optimal performance");
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('GROQ_API_KEY is not defined. Using mock trip data.');
    if (isGibberish(destination)) {
      throw new InvalidDestinationError('Invalid destination. Please enter a real city, region, or country.');
    }
    return generateMockTrip(destination, numDays, budgetType, interests);
  }

  // 1. Fetch Real Weather Data (The Tool Step)
  let lat = 35.6762;  // Tokyo default lat
  let lon = 139.6503; // Tokyo default lon
  let isWeatherLive = false;

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (geoRes.ok) {
      const geoData = (await geoRes.json()) as any;
      if (geoData.results && geoData.results.length > 0) {
        lat = geoData.results[0].latitude;
        lon = geoData.results[0].longitude;
      }
    }
  } catch (err) {
    console.warn(`Geocoding failed for destination: ${destination}. Falling back to default coordinates.`, err);
  }

  let realTemp = 22; // default fallback temperature
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const weatherRes = await fetch(weatherUrl);
    if (weatherRes.ok) {
      const weatherData = (await weatherRes.json()) as any;
      if (weatherData.current_weather && typeof weatherData.current_weather.temperature === 'number') {
        realTemp = weatherData.current_weather.temperature;
        isWeatherLive = true;
      }
    }
  } catch (err) {
    console.warn(`Weather fetch failed for lat: ${lat}, lon: ${lon}. Falling back to default temperature: ${realTemp}`, err);
  }

  // Edge Case 4: Clear fallback message passed to the prompt if live weather is unreachable
  const weatherContext = isWeatherLive
    ? `ENVIRONMENT CONTEXT: The actual, live real-time weather at the destination right now is exactly ${realTemp}°C. You MUST set the \`averageTempCelsius\` in the JSON response to exactly ${realTemp}. Furthermore, you must customize the \`packingList\` and activity descriptions to perfectly suit a current temperature of ${realTemp}°C.`
    : `ENVIRONMENT CONTEXT: Live real-time weather is currently unreachable, using a baseline seasonal average temperature of exactly ${realTemp}°C. You MUST set the \`averageTempCelsius\` in the JSON response to exactly ${realTemp}. Furthermore, you must customize the \`packingList\` and activity descriptions to perfectly suit a temperature of ${realTemp}°C.`;

  try {
    const groq = new Groq({ apiKey });

    const prompt = `
  You are an elite, highly structured travel planner agent. 
  
  ${weatherContext}

  Generate a comprehensive, personalized travel plan for a trip to "${destination}".
  
  Trip Parameters:
  - Duration: ${numDays} days
  - Budget Profile: ${budgetType} (Low: Frugal/Backpacker, Medium: Comfortable/Standard, High: Luxury/Premium)
  - Core Interests: ${interests.join(', ')}

  CRITICAL DIRECTIVE: You must calculate all costs in the official local currency of "${destination}".

  The response MUST be valid JSON matching this EXACT schema:
  {
    "_budgetReasoning": "string (Briefly show your math. State the local currency, estimate daily hotel cost, daily food cost, flights, and multiply by ${numDays} days to prove the totalCost)",
    "estimatedBudget": {
      "currencyCode": "string (3-letter ISO)",
      "currencySymbol": "string",
      "flights": number,
      "accommodation": number,
      "food": number,
      "activities": number,
      "totalCost": number (Must exactly equal flights + accommodation + food + activities)
    },
    "hotels": [
      { "name": "string", "type": "Budget Friendly | Mid Range | Luxury", "description": "string", "rating": number }
    ],
    "itinerary": [
      {
        "dayNumber": number,
        "activities": [
          { "activityId": "string", "time": "Morning | Afternoon | Evening", "title": "string", "description": "string", "location": "string", "costEstimate": "string" }
        ]
      }
    ],
    "packingList": [
      { "itemId": "string", "name": "string", "category": "Clothing | Toiletries | Electronics | Documents | Miscellaneous", "checked": false }
    ],
    "weatherGuide": {
      "summary": "string",
      "averageTempCelsius": number,
      "precipitationChance": number
    }
  }

  Strict Guidelines:
  1. No Markdown formatting outside the JSON object. 
  2. The itinerary activities MUST strictly cater to the user's Core Interests: ${interests.join(', ')}.
  3. Ensure exactly 3 hotel options (1 Budget, 1 Mid Range, 1 Luxury).
  4. IMMERSIVE STORYTELLING FOR ACTIVITY DESCRIPTIONS:
     - Write all activity descriptions in the style of a luxury travel concierge or a high-end travel magazine.
     - Descriptions MUST NOT be generic (e.g., avoid "Walk around the park").
     - Descriptions must be immersive, sensory, and highly specific (e.g., "Stroll through the shaded avenues of Ueno Park, stopping to sample matcha from a local vendor before entering the National Museum").
     - Each activity description MUST be exactly 2-3 sentences long and include a practical travel tip (e.g., "Best to arrive 15 minutes early to secure a window seat").
  5. COST ESTIMATION DIRECTIVE (Edge Case 1):
     - For free activities, set the \`costEstimate\` field to a clear string like 'Free' or '0 [Currency Label]'. Ensure your backend schemas tolerate this gracefully.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner agent. Before generating anything, you must validate if the destination is a real, geographically valid place. If invalid, stop and return the structured JSON error response. You only respond with valid JSON matching the requested structures.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: MODEL_NAME,
      response_format: { type: 'json_object' },
      temperature: 0.2
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Groq returned empty response');
    }

    const parsedData = JSON.parse(responseText.trim());
    if (parsedData.status === 'error') {
      throw new InvalidDestinationError(parsedData.message || 'Invalid destination. Please enter a real city, region, or country.');
    }

    try {
      const validatedTrip = TripSchema.parse(parsedData);
      return validatedTrip as AITripOutput;
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        console.error('Zod Validation Failure for Trip Itinerary Generation:', JSON.stringify(zodError.errors, null, 2));
        throw new Error(`AI generated response failed schema validation: ${zodError.message}`);
      }
      throw zodError;
    }
  } catch (error: any) {
    if (error instanceof InvalidDestinationError) {
      throw error;
    }
    console.error('Error generating AI itinerary via Groq:', error);
    const errMsg = error?.message || String(error);
    
    // Edge Case 5: Map API rate limits or general server issues to a clean, user-friendly message
    if (
      errMsg.includes('429') || 
      errMsg.toLowerCase().includes('quota') || 
      errMsg.toLowerCase().includes('rate limit') || 
      errMsg.toLowerCase().includes('exhausted')
    ) {
      throw new Error('Our AI planners are currently busy. Please wait a moment and try again!');
    }
    
    throw new Error('Our AI planners are currently busy. Please wait a moment and try again!');
  }
};

export const regenerateAIDay = async (
  destination: string,
  dayNumber: number,
  interests: string[],
  budgetType: 'Low' | 'Medium' | 'High',
  customInstructions: string,
  existingDayActivities: any[]
): Promise<IDay> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('GROQ_API_KEY is not defined. Using mock day regeneration.');
    return {
      dayNumber,
      activities: [
        {
          activityId: `reg-${dayNumber}-1`,
          time: 'Morning',
          title: `Modified Morning Activity`,
          description: `Custom activities for Day ${dayNumber} reflecting instructions: "${customInstructions}".`,
          location: `${destination} Center`,
          costEstimate: '$15'
        },
        {
          activityId: `reg-${dayNumber}-2`,
          time: 'Afternoon',
          title: `Modified Afternoon Activity`,
          description: `Adventure or leisure customized activity according to: "${customInstructions}".`,
          location: `${destination} Outskirts`,
          costEstimate: '$25'
        },
        {
          activityId: `reg-${dayNumber}-3`,
          time: 'Evening',
          title: `Modified Evening Activity`,
          description: `A relaxing evening activity matching request: "${customInstructions}".`,
          location: `${destination}`,
          costEstimate: 'Free'
        }
      ]
    };
  }

  try {
    const groq = new Groq({ apiKey });

    const prompt = `
      We are regenerating Day ${dayNumber} of an itinerary for a trip to "${destination}".
      The overall trip interests are: ${interests.join(', ')} and budget level is: ${budgetType}.
      The user's current activities for Day ${dayNumber} are:
      ${JSON.stringify(existingDayActivities, null, 2)}

      The user requests the following modification / regeneration instructions for Day ${dayNumber}:
      "${customInstructions}"

      Generate a revised Day ${dayNumber} itinerary. Make sure to adhere to the requested changes.
      The output must be a valid JSON matching this schema:
      {
        "dayNumber": number,
        "activities": [
          { "activityId": "string", "time": "Morning | Afternoon | Evening", "title": "string", "description": "string", "location": "string", "costEstimate": "string" }
        ]
      }

      Strict Guidelines:
      1. IMMERSIVE STORYTELLING FOR ACTIVITY DESCRIPTIONS:
         - Write all activity descriptions in the style of a luxury travel concierge or a high-end travel magazine.
         - Descriptions MUST NOT be generic.
         - Descriptions must be immersive, sensory, and highly specific (e.g., "Stroll through the shaded avenues of Ueno Park, stopping to sample matcha from a local vendor before entering the National Museum").
         - Each activity description MUST be exactly 2-3 sentences long and include a practical travel tip (e.g., "Best to arrive 15 minutes early to secure a window seat").
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner agent. You only respond with JSON matching the requested structure.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: MODEL_NAME,
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Groq returned empty response for day regeneration');
    }

    const parsedData = JSON.parse(responseText.trim());
    try {
      const validatedDay = DaySchema.parse(parsedData);
      return validatedDay;
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        console.error('Zod Validation Failure for Day Regeneration:', JSON.stringify(zodError.errors, null, 2));
        throw new Error(`AI generated day failed schema validation: ${zodError.message}`);
      }
      throw zodError;
    }
  } catch (error: any) {
    console.error('Error regenerating AI day via Groq:', error);
    const errMsg = error?.message || String(error);
    if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('exhausted')) {
      throw new Error('Groq AI API rate limit or capacity exceeded. Please try again in a few minutes.');
    }
    // Simple fallback
    return {
      dayNumber,
      activities: existingDayActivities.map((act, idx) => ({
        ...act,
        title: `Regenerated: ${act.title}`,
        description: `Adjusted activity based on request: "${customInstructions}". ${act.description}`
      }))
    };
  }
};
