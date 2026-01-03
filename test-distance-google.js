// Test Google Maps distance calculation
import dotenv from 'dotenv';
import { calculateDistanceBetweenPincode } from './utils/distanceService.js';

dotenv.config();

async function testDistance() {
  console.log('🧪 Testing Google Maps Distance Calculation\n');
  console.log('=' .repeat(60));

  // Test 1: Valid route (Delhi to Bangalore)
  console.log('\n✅ Test 1: Valid Route (Delhi → Bangalore)');
  try {
    const result = await calculateDistanceBetweenPincode('110020', '560060');
    console.log(`   Origin: 110020 (Delhi)`);
    console.log(`   Destination: 560060 (Bangalore)`);
    console.log(`   Distance: ${result.distance}`);
    console.log(`   Distance KM: ${result.distanceKm} km`);
    console.log(`   Estimated Time: ${result.estTime} days`);
    console.log(`   ✓ SUCCESS - Should be ~2100-2200 km`);
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}`);
  }

  // Test 2: Cached result (should be instant)
  console.log('\n✅ Test 2: Cached Result (Same Route)');
  try {
    const start = Date.now();
    const result = await calculateDistanceBetweenPincode('110020', '560060');
    const duration = Date.now() - start;
    console.log(`   Distance: ${result.distance}`);
    console.log(`   Response Time: ${duration}ms`);
    console.log(`   ✓ SUCCESS - Should be <10ms (cached)`);
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}`);
  }

  // Test 3: No road route (Andaman Islands)
  console.log('\n❌ Test 3: No Road Route (Andaman Islands → Delhi)');
  try {
    const result = await calculateDistanceBetweenPincode('744101', '110001');
    console.log(`   ✗ FAILED: Should have thrown NO_ROAD_ROUTE error`);
    console.log(`   Got result: ${result.distance}`);
  } catch (error) {
    if (error.code === 'NO_ROAD_ROUTE') {
      console.log(`   ✓ SUCCESS - Correctly detected no road route`);
      console.log(`   Error: ${error.message}`);
    } else {
      console.log(`   ✗ FAILED: Wrong error - ${error.code}: ${error.message}`);
    }
  }

  // Test 4: Invalid pincode
  console.log('\n❌ Test 4: Invalid Pincode');
  try {
    const result = await calculateDistanceBetweenPincode('999999', '110001');
    console.log(`   ✗ FAILED: Should have thrown PINCODE_NOT_FOUND error`);
  } catch (error) {
    if (error.code === 'PINCODE_NOT_FOUND') {
      console.log(`   ✓ SUCCESS - Correctly detected invalid pincode`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Field: ${error.field}`);
    } else {
      console.log(`   ✗ FAILED: Wrong error - ${error.code}: ${error.message}`);
    }
  }

  // Test 5: API key check
  console.log('\n🔑 Test 5: API Key Configuration');
  if (process.env.GOOGLE_MAP_API_KEY) {
    console.log(`   ✓ API Key is configured (length: ${process.env.GOOGLE_MAP_API_KEY.length})`);
  } else {
    console.log(`   ✗ WARNING: GOOGLE_MAP_API_KEY not set!`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!\n');
}

testDistance().catch(console.error);
