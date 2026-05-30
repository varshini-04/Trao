import { Router } from 'express';
import { createTrip, getTrips, getTripById, updateTrip, deleteTrip, regenerateTripDay, validateDestination } from '../controllers/tripController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Protect all trip routes with authentication middleware
router.use(authMiddleware);

router.post('/validate-destination', validateDestination);
router.post('/', createTrip);
router.get('/', getTrips);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);
router.post('/:id/regenerate-day', regenerateTripDay);

export default router;
