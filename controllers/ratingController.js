/**
 * Rating Controller
 *
 * Handles vendor rating submission and retrieval.
 * Updates vendor's aggregated ratings after each new rating.
 */

import mongoose from "mongoose";
import VendorRating from "../model/vendorRatingModel.js";
import TemporaryTransporter from "../model/temporaryTransporterModel.js";
import Transporter from "../model/transporterModel.js";

/**
 * Submit a new rating for a vendor
 *
 * POST /api/ratings/submit
 *
 * Body:
 * {
 *   vendorId: string (ObjectId),
 *   isTemporaryVendor: boolean,
 *   ratings: {
 *     priceSupport: number (1-5),
 *     deliveryTime: number (1-5),
 *     tracking: number (1-5),
 *     salesSupport: number (1-5),
 *     damageLoss: number (1-5)
 *   },
 *   comment?: string,
 *   overallRating: number (1-5)
 * }
 */
export const submitRating = async (req, res) => {
  try {
    const { vendorId, isTemporaryVendor, ratings, comment, overallRating } = req.body;

    // Validate required fields
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required",
      });
    }

    if (!ratings) {
      return res.status(400).json({
        success: false,
        message: "Ratings are required",
      });
    }

    // Validate all rating parameters are present and valid
    const requiredParams = ["priceSupport", "deliveryTime", "tracking", "salesSupport", "damageLoss"];
    for (const param of requiredParams) {
      const value = ratings[param];
      if (typeof value !== "number" || value < 1 || value > 5) {
        return res.status(400).json({
          success: false,
          message: `Invalid rating for ${param}. Must be a number between 1 and 5.`,
        });
      }
    }

    // Validate vendorId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID format",
      });
    }

    // Calculate overall rating if not provided
    const calculatedOverall =
      overallRating ||
      (ratings.priceSupport +
        ratings.deliveryTime +
        ratings.tracking +
        ratings.salesSupport +
        ratings.damageLoss) /
        5;

    // Create new rating document
    const newRating = new VendorRating({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      isTemporaryVendor: Boolean(isTemporaryVendor),
      ratings: {
        priceSupport: ratings.priceSupport,
        deliveryTime: ratings.deliveryTime,
        tracking: ratings.tracking,
        salesSupport: ratings.salesSupport,
        damageLoss: ratings.damageLoss,
      },
      overallRating: Math.round(calculatedOverall * 10) / 10,
      comment: comment || null,
      // TODO: Add userId when authentication is required
      // userId: req.user?._id || null,
    });

    await newRating.save();

    // Update vendor's aggregated ratings
    const newOverallRating = await updateVendorAggregatedRatings(
      vendorId,
      Boolean(isTemporaryVendor)
    );

    console.log(
      `[Rating] New rating submitted for vendor ${vendorId} (temporary: ${isTemporaryVendor}). New overall: ${newOverallRating}`
    );

    return res.status(201).json({
      success: true,
      message: "Rating submitted successfully",
      newOverallRating,
      ratingId: newRating._id,
    });
  } catch (error) {
    console.error("[Rating] Error submitting rating:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit rating. Please try again.",
      error: error.message,
    });
  }
};

/**
 * Get all ratings for a vendor (paginated)
 *
 * GET /api/ratings/vendor/:vendorId?isTemporary=true&page=1&limit=10
 */
export const getVendorRatings = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { isTemporary = "false", page = "1", limit = "10" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID format",
      });
    }

    const isTemporaryVendor = isTemporary === "true";
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {
      vendorId: new mongoose.Types.ObjectId(vendorId),
      isTemporaryVendor,
    };

    const [ratings, total] = await Promise.all([
      VendorRating.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      VendorRating.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      ratings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[Rating] Error fetching ratings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ratings",
      error: error.message,
    });
  }
};

/**
 * Get rating summary for a vendor (aggregated averages)
 *
 * GET /api/ratings/summary/:vendorId?isTemporary=true
 */
export const getVendorRatingSummary = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { isTemporary = "false" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID format",
      });
    }

    const isTemporaryVendor = isTemporary === "true";

    const aggregation = await VendorRating.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          isTemporaryVendor,
        },
      },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          avgOverall: { $avg: "$overallRating" },
          avgPriceSupport: { $avg: "$ratings.priceSupport" },
          avgDeliveryTime: { $avg: "$ratings.deliveryTime" },
          avgTracking: { $avg: "$ratings.tracking" },
          avgSalesSupport: { $avg: "$ratings.salesSupport" },
          avgDamageLoss: { $avg: "$ratings.damageLoss" },
        },
      },
    ]);

    if (!aggregation.length) {
      return res.status(200).json({
        success: true,
        summary: {
          totalRatings: 0,
          overallRating: 0,
          parameters: {
            priceSupport: { average: 0, count: 0 },
            deliveryTime: { average: 0, count: 0 },
            tracking: { average: 0, count: 0 },
            salesSupport: { average: 0, count: 0 },
            damageLoss: { average: 0, count: 0 },
          },
        },
      });
    }

    const data = aggregation[0];

    return res.status(200).json({
      success: true,
      summary: {
        totalRatings: data.totalRatings,
        overallRating: Math.round(data.avgOverall * 10) / 10,
        parameters: {
          priceSupport: {
            average: Math.round(data.avgPriceSupport * 10) / 10,
            count: data.totalRatings,
          },
          deliveryTime: {
            average: Math.round(data.avgDeliveryTime * 10) / 10,
            count: data.totalRatings,
          },
          tracking: {
            average: Math.round(data.avgTracking * 10) / 10,
            count: data.totalRatings,
          },
          salesSupport: {
            average: Math.round(data.avgSalesSupport * 10) / 10,
            count: data.totalRatings,
          },
          damageLoss: {
            average: Math.round(data.avgDamageLoss * 10) / 10,
            count: data.totalRatings,
          },
        },
      },
    });
  } catch (error) {
    console.error("[Rating] Error fetching rating summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch rating summary",
      error: error.message,
    });
  }
};

/**
 * Update vendor's aggregated ratings after a new rating is submitted
 *
 * Calculates new averages for each parameter and updates the vendor document.
 *
 * @param {string} vendorId - The vendor's ObjectId
 * @param {boolean} isTemporaryVendor - Whether this is a temporary transporter
 * @returns {number} The new overall rating
 */
async function updateVendorAggregatedRatings(vendorId, isTemporaryVendor) {
  try {
    // Aggregate all ratings for this vendor
    const aggregation = await VendorRating.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          isTemporaryVendor,
        },
      },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          avgOverall: { $avg: "$overallRating" },
          avgPriceSupport: { $avg: "$ratings.priceSupport" },
          avgDeliveryTime: { $avg: "$ratings.deliveryTime" },
          avgTracking: { $avg: "$ratings.tracking" },
          avgSalesSupport: { $avg: "$ratings.salesSupport" },
          avgDamageLoss: { $avg: "$ratings.damageLoss" },
        },
      },
    ]);

    if (!aggregation.length) {
      return 0;
    }

    const data = aggregation[0];
    const newOverallRating = Math.round(data.avgOverall * 10) / 10;

    // Update the appropriate vendor collection
    const updateData = {
      rating: newOverallRating,
      vendorRatings: {
        priceSupport: Math.round(data.avgPriceSupport * 10) / 10,
        deliveryTime: Math.round(data.avgDeliveryTime * 10) / 10,
        tracking: Math.round(data.avgTracking * 10) / 10,
        salesSupport: Math.round(data.avgSalesSupport * 10) / 10,
        damageLoss: Math.round(data.avgDamageLoss * 10) / 10,
      },
      totalRatings: data.totalRatings,
    };

    if (isTemporaryVendor) {
      await TemporaryTransporter.findByIdAndUpdate(vendorId, updateData);
    } else {
      // For regular transporters, only update rating (they don't have vendorRatings field)
      await Transporter.findByIdAndUpdate(vendorId, { rating: newOverallRating });
    }

    console.log(
      `[Rating] Updated vendor ${vendorId} ratings: overall=${newOverallRating}, total=${data.totalRatings}`
    );

    return newOverallRating;
  } catch (error) {
    console.error("[Rating] Error updating vendor aggregated ratings:", error);
    throw error;
  }
}
