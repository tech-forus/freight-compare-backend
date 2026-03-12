import mongoose from 'mongoose';

const indiaPostPricingSchema = new mongoose.Schema({
  weightRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  pricing: [{
    distanceRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true }
    },
    price: { type: Number, required: true }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

indiaPostPricingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find pricing by weight and distance
// Returns null if no matching slab exists (e.g., weight exceeds India Post limits)
indiaPostPricingSchema.statics.findPricing = async function(weight, distance) {
  // 1. Find the weight slab
  // We sort by max weight to get the smallest slab that can contain the weight
  const weightSlabs = await this.find({
    'weightRange.max': { $gte: weight }
  }).sort({ 'weightRange.max': 1 }); // Sort ascending by max weight

  if (!weightSlabs || weightSlabs.length === 0) {
    // No slab covers this weight — India Post doesn't handle it (e.g., 632kg)
    console.log(`[IndiaPost] No pricing slab for weight ${weight}kg — skipping vendor`);
    return null;
  }

  // Usually the first one is the closest match
  // we also ensure weight >= min, but if they define slabs 0-2, 2.1-5, etc, it helps
  const slab = weightSlabs.find(s => s.weightRange.min <= weight && s.weightRange.max >= weight) || weightSlabs[0];

  // 2. Find the distance pricing
  const pricing = slab.pricing.find(p =>
    p.distanceRange.min <= distance && p.distanceRange.max >= distance
  );

  if (!pricing) {
    // Find the fallback max distance range if distance exceeds maximum defined bracket
    const maxDistancePricing = slab.pricing.reduce((prev, current) =>
      (prev && prev.distanceRange.max > current.distanceRange.max) ? prev : current
    , null);

    if (maxDistancePricing && distance > maxDistancePricing.distanceRange.max) {
      console.log(`IndiaPost: distance ${distance} exceeds max defined. Using max distance bracket.`);
      return {
        matchedWeight: weight,
        matchedDistance: maxDistancePricing.distanceRange.max,
        price: maxDistancePricing.price,
        isMaxDistanceFallback: true
      };
    }
    // No distance slab matches
    console.log(`[IndiaPost] No pricing for distance ${distance}km in weight slab ${slab.weightRange.min}-${slab.weightRange.max}kg — skipping vendor`);
    return null;
  }

  return {
    matchedWeight: weight,
    matchedDistance: distance,
    price: pricing.price,
    slab: {
      weightRange: slab.weightRange,
      distanceRange: pricing.distanceRange
    }
  };
};

export default mongoose.model('IndiaPostPricing', indiaPostPricingSchema);
