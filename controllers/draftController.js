import VendorDraft from "../model/VendorDraft.js";

// @desc    Get all drafts for a user
// @route   GET /api/drafts/vendor
// @access  Private (Assume req.user or req.customer is set by auth middleware)
export const getVendorDrafts = async (req, res) => {
    try {
        const customerId = req.customer?._id || req.user?._id;

        if (!customerId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Missing customer ID" });
        }

        const drafts = await VendorDraft.find({ customerId }).sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: drafts });
    } catch (error) {
        console.error("Error in getVendorDrafts:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Save or update a vendor draft
// @route   POST /api/drafts/vendor
// @access  Private
export const saveVendorDraft = async (req, res) => {
    try {
        const customerId = req.customer?._id || req.user?._id;
        if (!customerId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Missing customer ID" });
        }

        const { draftId, draftName, payload } = req.body;

        // If draftId is provided, try to update existing
        if (draftId) {
            const existingDraft = await VendorDraft.findOne({ _id: draftId, customerId });
            if (existingDraft) {
                existingDraft.draftName = draftName || existingDraft.draftName;
                existingDraft.payload = payload;
                await existingDraft.save();
                return res.status(200).json({ success: true, data: existingDraft, message: "Draft updated successfully." });
            }
        }

        // Checking the limit (Max 2 per user)
        const existingDrafts = await VendorDraft.find({ customerId }).sort({ updatedAt: 1 }); // Oldest first

        if (existingDrafts.length >= 2) {
            // Delete the oldest draft to make room
            const oldestDraftId = existingDrafts[0]._id;
            await VendorDraft.findByIdAndDelete(oldestDraftId);
            console.log(`Deleted oldest draft ${oldestDraftId} for customer ${customerId} to enforce limit.`);
        }

        // Create new draft
        const newDraft = new VendorDraft({
            customerId,
            draftName: draftName || "Unknown Vendor",
            payload: payload || {},
        });

        await newDraft.save();
        return res.status(201).json({ success: true, data: newDraft, message: "Draft saved successfully." });

    } catch (error) {
        console.error("Error in saveVendorDraft:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Delete a vendor draft
// @route   DELETE /api/drafts/vendor/:id
// @access  Private
export const deleteVendorDraft = async (req, res) => {
    try {
        const customerId = req.customer?._id || req.user?._id;
        if (!customerId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Missing customer ID" });
        }

        const { id } = req.params;

        const draft = await VendorDraft.findOne({ _id: id, customerId });
        if (!draft) {
            return res.status(404).json({ success: false, message: "Draft not found or unauthorized to delete." });
        }

        await VendorDraft.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Draft deleted successfully." });
    } catch (error) {
        console.error("Error in deleteVendorDraft:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
