/**
 * Vendor Rating Model
 *
 * Stores individual user ratings for vendors with 5-parameter breakdown.
 * Each rating captures: priceSupport, deliveryTime, tracking, salesSupport, damageLoss
 *
 * NOTE: Currently allows multiple ratings per user per vendor (development phase).
 * TODO: In future, add unique constraint on { vendorId, userId, isTemporaryVendor }
 *       to allow only one rating per user per vendor.
 */

import mongoose from "mongoose";

const vendorRatingSchema = new mongoose.Schema(
  {
    // Reference to the vendor being rated
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Whether this is a temporary transporter (tied-up vendor) or regular transporter
    isTemporaryVendor: {
      type: Boolean,
      required: true,
      default: false,
    },

    // User who submitted the rating (optional for now, can be added later)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customers",
      default: null,
    },

    // Individual parameter ratings (1-5 scale, all required)
    ratings: {
      priceSupport: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      deliveryTime: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      tracking: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      salesSupport: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      damageLoss: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
    },

    // Calculated overall rating (average of 5 parameters)
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Optional comment from the user
    comment: {
      type: String,
      maxlength: 500,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
vendorRatingSchema.index({ vendorId: 1, isTemporaryVendor: 1 });
vendorRatingSchema.index({ createdAt: -1 });

// TODO: Uncomment this in future to enforce one rating per user per vendor
// vendorRatingSchema.index(
//   { vendorId: 1, userId: 1, isTemporaryVendor: 1 },
//   { unique: true, sparse: true }
// );

export default mongoose.model("vendorRatings", vendorRatingSchema);
