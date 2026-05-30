import { Request, Response, NextFunction } from 'express';
import { Trip } from '../models/Trip';
import { generateAITrip, regenerateAIDay, InvalidDestinationError, validateDestinationAI } from '../services/aiService';
import { RequestWithUser } from '../middleware/auth';

export const createTrip = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const { destination, numDays, budgetType, interests } = req.body;

    if (!destination || !numDays || !budgetType) {
      return res.status(400).json({ message: 'Destination, numDays, and budgetType are required.' });
    }

    const daysCount = parseInt(numDays, 10);
    if (isNaN(daysCount) || daysCount < 1 || daysCount > 15) {
      return res.status(400).json({ message: 'Number of days must be between 1 and 15.' });
    }

    // Call AI Service to generate itinerary
    const aiData = await generateAITrip(
      destination,
      daysCount,
      budgetType as 'Low' | 'Medium' | 'High',
      interests || []
    );

    // Save to Database with user isolation
    const newTrip = await Trip.create({
      userId: req.user.id,
      destination,
      numDays: daysCount,
      budgetType,
      interests: interests || [],
      ...aiData
    });

    res.status(201).json({
      message: 'Trip itinerary generated successfully',
      trip: newTrip
    });
  } catch (error) {
    if (error instanceof InvalidDestinationError) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const getTrips = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    // Strict data isolation
    const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ trips });
  } catch (error) {
    next(error);
  }
};

export const getTripById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    // Strict user check
    if (trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this trip.' });
    }

    res.status(200).json({ trip });
  } catch (error) {
    next(error);
  }
};

export const updateTrip = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    // Strict authorization
    if (trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this trip.' });
    }

    const { itinerary, packingList } = req.body;

    if (itinerary) trip.itinerary = itinerary;
    if (packingList) trip.packingList = packingList;

    await trip.save();

    res.status(200).json({
      message: 'Trip updated successfully',
      trip
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTrip = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    // Strict authorization
    if (trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this trip.' });
    }

    await Trip.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Trip deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const regenerateTripDay = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const { dayNumber, instructions } = req.body;

    if (!dayNumber || !instructions) {
      return res.status(400).json({ message: 'dayNumber and instructions are required.' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    // Strict authorization
    if (trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this trip.' });
    }

    const dayNum = parseInt(dayNumber, 10);
    const dayToUpdateIndex = trip.itinerary.findIndex(d => d.dayNumber === dayNum);
    if (dayToUpdateIndex === -1) {
      return res.status(400).json({ message: `Day ${dayNumber} does not exist in the itinerary.` });
    }

    const existingDayActivities = trip.itinerary[dayToUpdateIndex].activities;

    // Call AI to generate new day activities
    const regeneratedDay = await regenerateAIDay(
      trip.destination,
      dayNum,
      trip.interests,
      trip.budgetType,
      instructions,
      existingDayActivities
    );

    // Update in itinerary
    trip.itinerary[dayToUpdateIndex].activities = regeneratedDay.activities;
    
    // Save to Database
    await trip.save();

    res.status(200).json({
      message: `Day ${dayNumber} regenerated successfully`,
      trip
    });
  } catch (error) {
    next(error);
  }
};

export const validateDestination = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { destination } = req.body;
    if (!destination) {
      return res.status(400).json({ message: 'Destination is required.' });
    }

    const isValid = await validateDestinationAI(destination);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid destination. Please enter a real city, region, or country.' });
    }

    res.status(200).json({ valid: true });
  } catch (error) {
    next(error);
  }
};
