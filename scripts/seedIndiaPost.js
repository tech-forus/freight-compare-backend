/**
 * Seeds the IndiaPostPricing collection with rate data.
 * Rates based on India Post Speed Post / Business Parcel pricing.
 * Runs automatically on server startup if collection is empty.
 */
import IndiaPostPricing from '../model/indiaPostPricingModel.js';

const INDIA_POST_RATES = [
  {
    weightRange: { min: 0, max: 0.5 },
    pricing: [
      { distanceRange: { min: 0, max: 200 },    price: 35  },
      { distanceRange: { min: 201, max: 500 },   price: 50  },
      { distanceRange: { min: 501, max: 1000 },  price: 65  },
      { distanceRange: { min: 1001, max: 2000 }, price: 80  },
      { distanceRange: { min: 2001, max: 10000 },price: 95  },
    ],
  },
  {
    weightRange: { min: 0.5, max: 1 },
    pricing: [
      { distanceRange: { min: 0, max: 200 },    price: 50  },
      { distanceRange: { min: 201, max: 500 },   price: 70  },
      { distanceRange: { min: 501, max: 1000 },  price: 90  },
      { distanceRange: { min: 1001, max: 2000 }, price: 110 },
      { distanceRange: { min: 2001, max: 10000 },price: 130 },
    ],
  },
  {
    weightRange: { min: 1, max: 2 },
    pricing: [
      { distanceRange: { min: 0, max: 200 },    price: 80  },
      { distanceRange: { min: 201, max: 500 },   price: 110 },
      { distanceRange: { min: 501, max: 1000 },  price: 140 },
      { distanceRange: { min: 1001, max: 2000 }, price: 170 },
      { distanceRange: { min: 2001, max: 10000 },price: 200 },
    ],
  },
  {
    weightRange: { min: 2, max: 5 },
    pricing: [
      { distanceRange: { min: 0, max: 200 },    price: 150 },
      { distanceRange: { min: 201, max: 500 },   price: 200 },
      { distanceRange: { min: 501, max: 1000 },  price: 260 },
      { distanceRange: { min: 1001, max: 2000 }, price: 320 },
      { distanceRange: { min: 2001, max: 10000 },price: 380 },
    ],
  },
  {
    weightRange: { min: 5, max: 10 },
    pricing: [
      { distanceRange: { min: 0, max: 200 },    price: 280 },
      { distanceRange: { min: 201, max: 500 },   price: 370 },
      { distanceRange: { min: 501, max: 1000 },  price: 470 },
      { distanceRange: { min: 1001, max: 2000 }, price: 580 },
      { distanceRange: { min: 2001, max: 10000 },price: 690 },
    ],
  },
  {
    weightRange: { min: 10, max: 20 },
    pricing: [
      { distanceRange: { min: 0, max: 200 },    price: 500  },
      { distanceRange: { min: 201, max: 500 },   price: 650  },
      { distanceRange: { min: 501, max: 1000 },  price: 820  },
      { distanceRange: { min: 1001, max: 2000 }, price: 1000 },
      { distanceRange: { min: 2001, max: 10000 },price: 1200 },
    ],
  },
  {
    weightRange: { min: 20, max: 50 },
    pricing: [
      { distanceRange: { min: 0, max: 200 },    price: 1100 },
      { distanceRange: { min: 201, max: 500 },   price: 1450 },
      { distanceRange: { min: 501, max: 1000 },  price: 1850 },
      { distanceRange: { min: 1001, max: 2000 }, price: 2300 },
      { distanceRange: { min: 2001, max: 10000 },price: 2800 },
    ],
  },
];

export async function seedIndiaPostPricingIfEmpty() {
  try {
    const count = await IndiaPostPricing.countDocuments();
    if (count > 0) return; // Already seeded

    await IndiaPostPricing.insertMany(INDIA_POST_RATES);
    console.log(`[IndiaPost] Seeded ${INDIA_POST_RATES.length} pricing slabs`);
  } catch (err) {
    console.error('[IndiaPost] Failed to seed pricing:', err.message);
  }
}
