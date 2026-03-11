/**
 * IndiaPost Speed Post pricing — static lookup, no DB required.
 *
 * Pricing model (official India Post structure):
 *   - Base rate covers first 500g, determined by weight tier and distance band
 *   - Each additional 500g (or part) adds a fixed increment per distance band
 *
 * Distance bands: 0–200 km | 201–1000 km | 1001–2000 km | 2001+ km
 * Source: India Post / ClickPost (rates effective through 2025-2026)
 */

// [distanceMin, distanceMax, rate50g, rate200g, rate500g, perExtra500g]
// rate50g  = flat price for ≤50g
// rate200g = flat price for 51–200g
// rate500g = flat price for 201–500g (also the base for heavier weights)
// perExtra500g = added for every 500g (or part) above the first 500g
const BANDS = [
  { min: 0,    max: 200,  rate50g: 35, rate200g: 35, rate500g: 50, per500g: 15 },
  { min: 201,  max: 1000, rate50g: 35, rate200g: 40, rate500g: 60, per500g: 30 },
  { min: 1001, max: 2000, rate50g: 35, rate200g: 60, rate500g: 80, per500g: 40 },
  { min: 2001, max: Infinity, rate50g: 35, rate200g: 70, rate500g: 90, per500g: 50 },
];

// Shipments above this weight won't show IndiaPost as an option
const INDIA_POST_MAX_WEIGHT_KG = 200;

/**
 * Find IndiaPost Speed Post price for given weight (kg) and distance (km).
 * Returns { price } or null if unsupported.
 */
export function findIndiaPostPrice(weight, distance) {
  if (!distance || distance <= 0) return null;
  if (!weight || weight <= 0) return null;
  if (weight > INDIA_POST_MAX_WEIGHT_KG) return null;

  const band = BANDS.find(b => distance >= b.min && distance <= b.max);
  if (!band) return null;

  const weightG = weight * 1000;

  let price;
  if (weightG <= 50) {
    price = band.rate50g;
  } else if (weightG <= 200) {
    price = band.rate200g;
  } else if (weightG <= 500) {
    price = band.rate500g;
  } else {
    // Base covers first 500g; each additional 500g (rounded up) adds per500g
    const extraIncrements = Math.ceil((weightG - 500) / 500);
    price = band.rate500g + extraIncrements * band.per500g;
  }

  return { price };
}
