import mongoose from "mongoose";

const vendorDraftSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "customers", // or 'User', depends on the global usage, here temporaryTransporters uses 'customers'
            required: true,
        },
        draftName: {
            type: String,
            required: true,
            default: "Untitled Draft",
        },
        // We use Schema.Types.Mixed (schemaless) to bypass validation constraints
        // since this is a draft and can be in any incomplete state.
        payload: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
            default: {},
        },
    },
    { timestamps: true, strict: false }
);

// Indexes
vendorDraftSchema.index({ customerId: 1 });

export default mongoose.model("VendorDraft", vendorDraftSchema);
