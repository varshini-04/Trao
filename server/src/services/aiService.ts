import Groq from 'groq-sdk';
import { IBudgetBreakdown, IHotel, IDay, IPackingItem, IWeatherGuide } from '../models/Trip';

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
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('GROQ_API_KEY is not defined. Using mock trip data.');
    if (isGibberish(destination)) {
      throw new InvalidDestinationError('Invalid destination. Please enter a real city, region, or country.');
    }
    return generateMockTrip(destination, numDays, budgetType, interests);
  }

  try {
    const groq = new Groq({ apiKey });

    const prompt = `
      First, verify if the destination "${destination}" is a real, geographically valid city, region, or country.
      If it is NOT valid (e.g. gibberish, random letters like "abc" or "jhszbj", fictional places, or non-existent entities), you MUST immediately return only this JSON object and nothing else:
      {
        "status": "error",
        "message": "Invalid destination. Please enter a real city, region, or country."
      }

      If the destination is valid, generate a comprehensive, personalized travel plan for a trip to "${destination}".
      Details of the trip:
      - Duration: ${numDays} days
      - Budget Profile: ${budgetType} (Low: backpacker, Medium: comfortable/mid-tier, High: luxury/premium)
      - Interests: ${interests.join(', ')}

      The response must be in valid JSON format matching this exact schema structure:
      {
        "estimatedBudget": {
          "currencyCode": "string",
          "currencySymbol": "string",
          "flights": number,
          "accommodation": number,
          "food": number,
          "activities": number,
          "totalCost": number
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

      Strict guidelines:
      1. Dynamic Currency Matching & Localized Costs: You MUST automatically detect the official currency of the destination "${destination}" and calculate all estimated costs (flights, accommodation, food, activities, totalCost) in that local currency (e.g. Japanese Yen [JPY, ¥] for Japan, Euros [EUR, €] for France/Italy/etc., British Pounds [GBP, £] for UK, Indian Rupees [INR, ₹] for India, Australian Dollars [AUD, A$] for Australia, Canadian Dollars [CAD, C$] for Canada, etc.). You must return the appropriate currencyCode (3-letter ISO code) and currencySymbol in the JSON payload.
      2. Budget breakdown must realistically align with the budget type "${budgetType}", the target destination "${destination}", and be scaled correctly to the target currency's magnitude (e.g., total cost in Yen for JPY, Pounds for GBP, etc.).
      3. Itinerary activities must be detailed, exciting, and specifically tailored to the interests: "${interests.join(', ')}".
      4. Hotel suggestions must feature 3 distinct options matching: 1 Budget Friendly, 1 Mid Range, and 1 Luxury.
      5. Create a smart packing list of 6-10 items tailored to the destination climate, trip duration, and interests. Include items in proper categories.
      6. Include a weather guide with a brief summary, estimated temperature in Celsius, and rain probability.
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

    return parsedData as AITripOutput;
  } catch (error: any) {
    if (error instanceof InvalidDestinationError) {
      throw error;
    }
    console.error('Error generating AI itinerary via Groq:', error);
    const errMsg = error?.message || String(error);
    if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('exhausted')) {
      throw new Error('Groq AI API rate limit or capacity exceeded. Please try again in a few minutes.');
    }
    throw new Error(`AI Travel Planner Service Error: ${errMsg}`);
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

    const parsedData = JSON.parse(responseText.trim()) as IDay;
    return parsedData;
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
