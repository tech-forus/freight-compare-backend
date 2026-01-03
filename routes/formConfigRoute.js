import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { isSuperAdmin } from "../middleware/superAdminMiddleware.js";
import {
    getFormConfig,
    getFullFormConfig,
    updateField,
    deleteField,
    restoreField,
    getChangeHistory,
} from "../controllers/formConfigController.js";

const router = express.Router();

// Public route - Get form config (for Add Vendor page)
// Returns only visible fields
router.get("/:pageId", getFormConfig);

// Admin routes - require authentication + super admin
router.get("/:pageId/full", verifyToken, isSuperAdmin, getFullFormConfig);
router.get("/:pageId/history", verifyToken, isSuperAdmin, getChangeHistory);
router.put("/:pageId/field/:fieldId", verifyToken, isSuperAdmin, updateField);
router.delete("/:pageId/field/:fieldId", verifyToken, isSuperAdmin, deleteField);
router.post("/:pageId/field/:fieldId/restore", verifyToken, isSuperAdmin, restoreField);

export default router;
