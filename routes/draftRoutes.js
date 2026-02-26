import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Standard auth middleware used in the app
import {
    getVendorDrafts,
    saveVendorDraft,
    deleteVendorDraft,
} from "../controllers/draftController.js";

const router = express.Router();

router.use(protect);

router.route("/vendor")
    .get(getVendorDrafts)
    .post(saveVendorDraft);

router.route("/vendor/:id")
    .delete(deleteVendorDraft);

export default router;
