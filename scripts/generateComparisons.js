import dotenv from 'dotenv';
dotenv.config();
import connectDatabase from '../db/db.js';
import { calculatePrice } from '../controllers/transportController.js';

// mock bypassed

async function run() {
  await connectDatabase();
  console.log("DB Connected.");

  // Need to load UTSF manually just like index.js
  const utsfService = (await import('../services/utsfService.js')).default;
  await utsfService.loadFromMongoDB();

  const destinations = ["400001", "700001", "600001", "500001", "380001"];
  
  // All possible optional charges from CalculatorPage.tsx:
  // "docket", "fuel", "fov", "handling", "appt" (Mandatory)
  // "dacc", "green", "misc", "insurance", "cod", "topay", "hamali", "cheque"
  const allOptional = ["docket", "fuel", "fov", "handling", "appt", "dacc", "green", "misc", "insurance", "cod", "topay", "hamali", "cheque"];
  const none = []; // only base
  
  const results = {};

  for (const dest of destinations) {
    console.log(`\n--- Fetching UTSF for 110020 to ${dest} ---`);
    const allVendors = utsfService.getAllTransporters();
    const resAll = utsfService.calculatePricesForRoute(allVendors, "110020", dest, 50, 50000, allOptional);
    const resNone = utsfService.calculatePricesForRoute(allVendors, "110020", dest, 50, 50000, none);
    
    results[dest] = {
      all: resAll || [],
      none: resNone || []
    };
  }

  import('fs').then(fs => {
    fs.writeFileSync('./comparison_results.json', JSON.stringify(results, null, 2));
    console.log("Written to comparison_results.json");
    process.exit(0);
  });
}

run();
