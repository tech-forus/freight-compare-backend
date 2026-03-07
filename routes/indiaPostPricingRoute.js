import express from 'express';
import {
    getIndiaPostPricing,
    getAllIndiaPostPricing,
    addIndiaPostPricing,
    updateIndiaPostPricing,
    deleteIndiaPostPricing
} from '../controllers/indiaPostPricingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/isAdminMiddleware.js';

const router = express.Router();

// Public route — used by the freight calculator
router.get('/pricing', getIndiaPostPricing);

// Admin routes — require authentication + admin role
router.get('/admin/all', protect, isAdmin, getAllIndiaPostPricing);
router.post('/admin/add', protect, isAdmin, addIndiaPostPricing);
router.put('/admin/:id', protect, isAdmin, updateIndiaPostPricing);
router.delete('/admin/:id', protect, isAdmin, deleteIndiaPostPricing);

export default router;
