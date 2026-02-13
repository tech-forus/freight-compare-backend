import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import utsfService from '../services/utsfService.js';
import UTSFModel from '../model/utsfModel.js';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for UTSF file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(__dirname, '../data/utsf');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename or generate from transporter ID
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.utsf.json') || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only .utsf.json or .json files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// ==================== GET ROUTES ====================

/**
 * GET /api/utsf/transporters
 * List all UTSF transporters
 */
router.get('/transporters', (req, res) => {
  try {
    const transporters = utsfService.getAllTransporters();

    const summary = transporters.map(t => ({
      id: t.id,
      companyName: t.companyName,
      transporterType: t.transporterType,
      rating: t.rating,
      isVerified: t.isVerified,
      totalPincodes: t.totalPincodes,
      stats: t.stats,
      vendorRatings: t.vendorRatings,
      volumetricConfig: t.volumetricConfig,
      specialZones: t.specialZones,
      zonesServed: Object.keys(t.serviceability)
    }));

    res.json({
      success: true,
      count: summary.length,
      transporters: summary
    });
  } catch (err) {
    console.error('[UTSF API] Error listing transporters:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to list transporters',
      error: err.message
    });
  }
});

/**
 * GET /api/utsf/transporters/:id
 * Get single transporter details
 */
router.get('/transporters/:id', (req, res) => {
  try {
    const { id } = req.params;
    const transporter = utsfService.getTransporterById(id);

    if (!transporter) {
      return res.status(404).json({
        success: false,
        message: `Transporter not found: ${id}`
      });
    }

    res.json({
      success: true,
      transporter: {
        id: transporter.id,
        companyName: transporter.companyName,
        transporterType: transporter.transporterType,
        rating: transporter.rating,
        isVerified: transporter.isVerified,
        totalPincodes: transporter.totalPincodes,
        priceRate: transporter.priceRate,
        zoneRates: transporter.zoneRates,
        serviceability: transporter.serviceability,
        stats: transporter.stats,
        vendorRatings: transporter.vendorRatings,
        volumetricConfig: transporter.volumetricConfig,
        specialZones: transporter.specialZones,
        data: transporter.data
      }
    });
  } catch (err) {
    console.error('[UTSF API] Error getting transporter:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get transporter',
      error: err.message
    });
  }
});

// ==================== POST ROUTES ====================

/**
 * POST /api/utsf/calculate
 * Calculate price using UTSF data
 * Body: { fromPincode, toPincode, weight, dimensions, noofboxes, shipment_details?, invoiceValue? }
 */
router.post('/calculate', (req, res) => {
  try {
    const {
      fromPincode,
      toPincode,
      weight,
      length,
      width,
      height,
      noofboxes,
      shipment_details,
      invoiceValue = 0
    } = req.body;

    if (!fromPincode || !toPincode) {
      return res.status(400).json({
        success: false,
        message: 'fromPincode and toPincode are required'
      });
    }

    // Calculate chargeable weight
    let actualWeight;
    let volumetricWeight = 0;

    if (Array.isArray(shipment_details) && shipment_details.length > 0) {
      actualWeight = shipment_details.reduce((sum, box) => {
        const boxWeight = (box.weight || 0) * (box.count || 0);
        const boxVolWeight = (box.length || 0) * (box.width || 0) * (box.height || 0) * (box.count || 0) / 5000;
        volumetricWeight += boxVolWeight;
        return sum + boxWeight;
      }, 0);
    } else {
      actualWeight = (weight || 0) * (noofboxes || 1);
      volumetricWeight = (length || 0) * (width || 0) * (height || 0) * (noofboxes || 1) / 5000;
    }

    const chargeableWeight = Math.max(actualWeight, volumetricWeight);

    if (chargeableWeight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid weight or dimensions'
      });
    }

    // Calculate prices for all serviceable transporters
    const results = utsfService.calculatePricesForRoute(
      fromPincode,
      toPincode,
      chargeableWeight,
      invoiceValue
    );

    res.json({
      success: true,
      count: results.length,
      chargeableWeight,
      actualWeight,
      volumetricWeight,
      results
    });
  } catch (err) {
    console.error('[UTSF API] Error calculating price:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate price',
      error: err.message
    });
  }
});

/**
 * POST /api/utsf/serviceability
 * Check serviceability for a pincode
 * Body: { pincode, transporterId? }
 */
router.post('/serviceability', (req, res) => {
  try {
    const { pincode, transporterId } = req.body;

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: 'pincode is required'
      });
    }

    if (transporterId) {
      // Check specific transporter
      const transporter = utsfService.getTransporterById(transporterId);
      if (!transporter) {
        return res.status(404).json({
          success: false,
          message: `Transporter not found: ${transporterId}`
        });
      }

      const result = transporter.checkServiceability(pincode);

      return res.json({
        success: true,
        transporterId,
        companyName: transporter.companyName,
        ...result
      });
    }

    // Check all transporters
    const transporters = utsfService.getTransportersForPincode(pincode);

    res.json({
      success: true,
      pincode,
      serviceableCount: transporters.length,
      transporters: transporters.map(t => ({
        id: t.id,
        companyName: t.companyName,
        rating: t.rating,
        isVerified: t.isVerified,
        ...t.checkServiceability(pincode)
      }))
    });
  } catch (err) {
    console.error('[UTSF API] Error checking serviceability:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to check serviceability',
      error: err.message
    });
  }
});

/**
 * POST /api/utsf/upload-json
 * Upload a UTSF file as JSON body (used by frontend AddVendor)
 * Accepts Content-Type: application/json
 */
router.post('/upload-json', async (req, res) => {
  try {
    const utsfData = req.body;

    // Validate UTSF structure
    if (!utsfData || !utsfData.version || !utsfData.meta || !utsfData.pricing) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UTSF format: missing version, meta, or pricing'
      });
    }

    // Generate ID if missing
    if (!utsfData.meta.id) {
      const { randomBytes } = await import('crypto');
      utsfData.meta.id = randomBytes(12).toString('hex');
    }

    // Add to in-memory service
    const transporter = utsfService.addTransporter(utsfData);

    // Save to disk
    const utsfDir = path.resolve(__dirname, '../data/utsf');
    if (!fs.existsSync(utsfDir)) {
      fs.mkdirSync(utsfDir, { recursive: true });
    }
    const filename = `${transporter.id}.utsf.json`;
    const filePath = path.join(utsfDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(utsfData, null, 2), 'utf8');
    console.log(`[UTSF API] Saved to disk: ${filePath}`);

    // Save to MongoDB
    try {
      const existing = await UTSFModel.findByTransporterId(transporter.id);
      if (existing) {
        Object.assign(existing, utsfData);
        await existing.save();
      } else {
        const utsfDoc = UTSFModel.fromUTSF(utsfData);
        await utsfDoc.save();
      }
      console.log(`[UTSF API] Saved to MongoDB: ${transporter.id}`);
    } catch (dbErr) {
      console.error('[UTSF API] MongoDB save failed (non-fatal):', dbErr.message);
    }

    res.json({
      success: true,
      message: 'UTSF uploaded successfully',
      transporter: {
        id: transporter.id,
        companyName: transporter.companyName,
        totalPincodes: transporter.totalPincodes
      }
    });
  } catch (err) {
    console.error('[UTSF API] Error uploading JSON:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to upload UTSF',
      error: err.message
    });
  }
});

/**
 * POST /api/utsf/upload
 * Upload a new UTSF file (multipart/form-data)
 */
router.post('/upload', upload.single('utsfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Read and parse the uploaded file
    const filePath = req.file.path;
    const utsfData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Validate UTSF structure
    if (!utsfData.version || !utsfData.meta || !utsfData.pricing) {
      fs.unlinkSync(filePath); // Delete invalid file
      return res.status(400).json({
        success: false,
        message: 'Invalid UTSF format'
      });
    }

    // Add to service
    const transporter = utsfService.addTransporter(utsfData);

    // Optionally save to MongoDB
    if (req.body.saveToDb === 'true') {
      try {
        const existing = await UTSFModel.findByTransporterId(transporter.id);
        if (existing) {
          // Update existing
          Object.assign(existing, utsfData);
          await existing.save();
        } else {
          // Create new
          const utsfDoc = UTSFModel.fromUTSF(utsfData);
          await utsfDoc.save();
        }
      } catch (dbErr) {
        console.error('[UTSF API] Error saving to MongoDB:', dbErr);
        // Continue anyway - file is uploaded and service loaded
      }
    }

    res.json({
      success: true,
      message: 'UTSF file uploaded successfully',
      transporter: {
        id: transporter.id,
        companyName: transporter.companyName,
        totalPincodes: transporter.totalPincodes
      }
    });
  } catch (err) {
    console.error('[UTSF API] Error uploading file:', err);

    // Clean up file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error('[UTSF API] Error cleaning up file:', cleanupErr);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload UTSF file',
      error: err.message
    });
  }
});

/**
 * GET /api/utsf/compare
 * Compare UTSF vs MongoDB pricing for validation
 * Query: ?transporterId=xxx&fromPincode=xxx&toPincode=xxx&weight=xxx
 */
router.get('/compare', async (req, res) => {
  try {
    const { transporterId, fromPincode, toPincode, weight } = req.query;

    if (!transporterId || !fromPincode || !toPincode || !weight) {
      return res.status(400).json({
        success: false,
        message: 'transporterId, fromPincode, toPincode, and weight are required'
      });
    }

    const chargeableWeight = parseFloat(weight);

    // Get UTSF result
    const utsfTransporter = utsfService.getTransporterById(transporterId);
    if (!utsfTransporter) {
      return res.status(404).json({
        success: false,
        message: `UTSF transporter not found: ${transporterId}`
      });
    }

    const utsfResult = utsfTransporter.calculatePrice(
      fromPincode,
      toPincode,
      chargeableWeight
    );

    // TODO: Add MongoDB comparison when needed
    // For now, just return UTSF result
    res.json({
      success: true,
      comparison: {
        utsf: utsfResult,
        mongodb: null // Implement MongoDB query if needed
      }
    });
  } catch (err) {
    console.error('[UTSF API] Error comparing:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to compare prices',
      error: err.message
    });
  }
});

/**
 * DELETE /api/utsf/transporters/:id
 * Delete a transporter
 */
router.delete('/transporters/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Remove from service
    const deleted = utsfService.removeTransporter(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Transporter not found: ${id}`
      });
    }

    // Remove file if exists
    const filePath = path.resolve(__dirname, `../data/utsf/${id}.utsf.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from MongoDB if exists
    try {
      await UTSFModel.findByTransporterId(id).deleteOne();
    } catch (dbErr) {
      console.error('[UTSF API] Error deleting from MongoDB:', dbErr);
    }

    res.json({
      success: true,
      message: 'Transporter deleted successfully'
    });
  } catch (err) {
    console.error('[UTSF API] Error deleting transporter:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transporter',
      error: err.message
    });
  }
});

/**
 * POST /api/utsf/reload
 * Reload all UTSF files from disk
 */
router.post('/reload', async (req, res) => {
  try {
    const utsfDir = path.resolve(__dirname, '../data/utsf');
    const pincodesPath = path.resolve(__dirname, '../data/pincodes.json');

    // Reload from disk first
    utsfService.reload(utsfDir, pincodesPath);

    // Then load any additional transporters from MongoDB
    const mongoLoaded = await utsfService.loadFromMongoDB();

    res.json({
      success: true,
      message: `UTSF reloaded: ${utsfService.getAllTransporters().length} total (${mongoLoaded} from MongoDB)`,
      count: utsfService.getAllTransporters().length,
      fromMongoDB: mongoLoaded
    });
  } catch (err) {
    console.error('[UTSF API] Error reloading:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to reload UTSF files',
      error: err.message
    });
  }
});

// ==================== HEALTH & GOVERNANCE ROUTES (v3.0) ====================

/**
 * GET /api/utsf/health
 * Get compliance scores and health status for all transporters
 */
router.get('/health', (req, res) => {
  try {
    const transporters = utsfService.getAllTransporters();

    const health = transporters.map(t => ({
      id: t.id,
      companyName: t.companyName,
      complianceScore: t.complianceScore,
      governanceVersion: t.governanceVersion,
      isLegacy: t.isLegacy,
      updateCount: (t.data?.meta?.updateCount || 0),
      zoneOverrideCount: Object.keys(t.zoneOverrides || {}).length,
      totalPincodes: t.totalPincodes,
      zoneMismatchPercent: t.stats?.zoneDiscrepancyCount
        ? Math.round((t.stats.zoneDiscrepancyCount / (t.totalPincodes || 1)) * 100 * 100) / 100
        : 0,
      lastUpdated: t.data?.meta?.updatedAt || t.data?.generatedAt || null,
      updates: (t.updates || []).slice(-5) // Last 5 audit entries
    }));

    // Sort: legacy first, then by compliance ascending
    health.sort((a, b) => {
      if (a.isLegacy !== b.isLegacy) return a.isLegacy ? -1 : 1;
      return a.complianceScore - b.complianceScore;
    });

    const legacyCount = health.filter(h => h.isLegacy).length;
    const lowCompliance = health.filter(h => h.complianceScore < 1.0).length;

    res.json({
      success: true,
      totalTransporters: health.length,
      legacyCount,
      lowComplianceCount: lowCompliance,
      health
    });
  } catch (err) {
    console.error('[UTSF API] Error getting health:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get health data',
      error: err.message
    });
  }
});

/**
 * GET /api/utsf/compare/:id
 * Get side-by-side comparison of UTSF coverage vs Master Pincodes
 */
router.get('/compare/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Dynamic import of the manager script
    const { compare } = await import('../scripts/utsfManager.js');

    const result = compare(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Transporter not found: ${id}`
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('[UTSF API] Error comparing transporter:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to compare transporter',
      error: err.message
    });
  }
});

/**
 * POST /api/utsf/repair/:id
 * Repair a specific transporter's UTSF data
 */
router.post('/repair/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { editorId } = req.body;

    // Dynamic import of the manager script
    const { repair } = await import('../scripts/utsfManager.js');

    const result = repair(id, editorId || 'SYSTEM_REPAIR_BOT');
    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Transporter not found or repair failed: ${id}`
      });
    }

    // Reload the repaired transporter into memory
    const utsfDir = path.resolve(__dirname, '../data/utsf');
    const pincodesPath = path.resolve(__dirname, '../data/pincodes.json');
    utsfService.reload(utsfDir, pincodesPath);

    res.json({
      success: true,
      message: `Repaired: ${result.companyName}`,
      changesMade: result.changesMade,
      complianceScore: result.complianceScore
    });
  } catch (err) {
    console.error('[UTSF API] Error repairing:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to repair transporter',
      error: err.message
    });
  }
});

/**
 * POST /api/utsf/rollback/:id
 * Rollback a transporter to a previous version
 * Body: { versionIndex: number }
 */
router.post('/rollback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { versionIndex } = req.body;

    if (versionIndex === undefined || versionIndex < 0) {
      return res.status(400).json({
        success: false,
        message: 'versionIndex is required and must be >= 0'
      });
    }

    const { rollback } = await import('../scripts/utsfManager.js');

    const result = rollback(id, versionIndex);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Rollback failed for: ${id}`
      });
    }

    // Reload into memory
    const utsfDir = path.resolve(__dirname, '../data/utsf');
    const pincodesPath = path.resolve(__dirname, '../data/pincodes.json');
    utsfService.reload(utsfDir, pincodesPath);

    res.json({
      success: true,
      message: `Rolled back ${result.companyName} to version ${result.rolledBackTo}`,
      result
    });
  } catch (err) {
    console.error('[UTSF API] Error rolling back:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to rollback transporter',
      error: err.message
    });
  }
});

// ==================== NEAREST SERVICEABLE PINCODE ====================

/**
 * GET /api/utsf/nearest-serviceable?pincode=X&fromPincode=Y&customerId=Z
 * Finds the nearest destination pincode (±1..±500) where at least one transporter
 * can produce an actual price quote for the from→to route.
 * Uses calculatePrice() to verify pricing — not just serviceability.
 */
router.get('/nearest-serviceable', (req, res) => {
  try {
    const { pincode, fromPincode, customerId } = req.query;

    if (!pincode || !/^\d{6}$/.test(String(pincode))) {
      return res.status(400).json({
        success: false,
        message: 'A valid 6-digit destination pincode is required'
      });
    }

    // fromPincode is needed to verify pricing for the full route
    if (!fromPincode || !/^\d{6}$/.test(String(fromPincode))) {
      return res.status(400).json({
        success: false,
        message: 'A valid 6-digit origin pincode (fromPincode) is required'
      });
    }

    const basePincode = parseInt(pincode, 10);
    const allTransporters = utsfService.getAllTransporters();

    // Filter to customer's transporters if customerId is provided
    let transporters = allTransporters;
    if (customerId) {
      const customerTransporters = allTransporters.filter(
        t => t.customerID && String(t.customerID) === String(customerId)
      );
      if (customerTransporters.length > 0) {
        transporters = customerTransporters;
      }
    }

    if (transporters.length === 0) {
      return res.json({
        success: false,
        message: 'No UTSF transporters found to search',
        nearestPincode: null
      });
    }

    // Scan ±1 to ±500 in alternating order: +1, -1, +2, -2, ...
    // Use calculatePrice() to VERIFY actual pricing (not just serviceability)
    for (let delta = 1; delta <= 500; delta++) {
      const candidates = [basePincode + delta, basePincode - delta].filter(
        p => p >= 100000 && p <= 999999
      );

      for (const candidatePin of candidates) {
        const pinStr = String(candidatePin);
        const servedBy = [];

        for (const t of transporters) {
          // Actually calculate a price — this checks serviceability + zone pricing
          const result = t.calculatePrice(
            parseInt(fromPincode, 10),
            candidatePin,
            100 // test weight of 100kg
          );

          // If no error field, this transporter can actually price this route
          if (result && !result.error && result.totalCharges > 0) {
            servedBy.push(t.companyName);
          }
        }

        if (servedBy.length > 0) {
          return res.json({
            success: true,
            nearestPincode: pinStr,
            originalPincode: pincode,
            distance: delta,
            servedBy,
            message: `Found priceable pincode ${pinStr} (±${delta} from ${pincode})`
          });
        }
      }
    }

    // Nothing found within ±500
    res.json({
      success: false,
      nearestPincode: null,
      originalPincode: pincode,
      message: 'No priceable pincode found within ±500 range'
    });
  } catch (err) {
    console.error('[UTSF API] Error finding nearest serviceable pincode:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to search for nearest serviceable pincode',
      error: err.message
    });
  }
});

// ==================== USER-SCOPED VENDOR MANAGEMENT ====================

/**
 * GET /api/utsf/my-vendors?customerId=X
 * Returns UTSF transporters linked to a specific customer
 */
router.get('/my-vendors', (req, res) => {
  try {
    const { customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'customerId query parameter is required'
      });
    }

    const allTransporters = utsfService.getAllTransporters();
    const userTransporters = allTransporters
      .filter(t => t.customerID && String(t.customerID) === String(customerId))
      .map(t => ({
        _id: t.id,
        companyName: t.companyName,
        customerID: t.customerID,
        transporterType: t.transporterType,
        rating: t.rating,
        isVerified: t.isVerified,
        totalPincodes: t.totalPincodes,
        integrityMode: t._data?.meta?.integrityMode || 'NONE',
        softExclusions: t.getSoftExclusions().length,
        source: 'UTSF',
        createdAt: t._data?.meta?.created?.at || t._data?.meta?.createdAt || null,
        updatedAt: t._data?.updates?.length > 0
          ? t._data.updates[t._data.updates.length - 1].timestamp
          : null,
        pricing: t._data?.pricing ? {
          priceRate: t._data.pricing.priceRate || {},
          priceChart: t._data.pricing.priceChart || null
        } : null
      }));

    res.json({
      success: true,
      count: userTransporters.length,
      transporters: userTransporters
    });
  } catch (err) {
    console.error('[UTSF API] Error fetching user vendors:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user UTSF vendors',
      error: err.message
    });
  }
});

/**
 * PUT /api/utsf/my-vendors/:id
 * Update a UTSF transporter (only if customerID matches)
 * Body: { customerId, updates: { pricing?, meta? } }
 */
router.put('/my-vendors/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, updates } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'customerId is required in request body'
      });
    }

    // Find the transporter
    const transporter = utsfService.getTransporterById(id);
    if (!transporter) {
      return res.status(404).json({
        success: false,
        message: 'UTSF transporter not found'
      });
    }

    // Ownership check
    if (!transporter.customerID || String(transporter.customerID) !== String(customerId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own UTSF vendors'
      });
    }

    // Read and update the file
    const UTSF_DIR = path.resolve(__dirname, '../data/utsf');
    const filePath = path.join(UTSF_DIR, `${id}.utsf.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'UTSF file not found' });
    }

    const utsfData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Apply allowed updates
    if (updates?.pricing) {
      utsfData.pricing = { ...utsfData.pricing, ...updates.pricing };
    }
    if (updates?.meta) {
      // Only allow safe meta fields
      const safeMeta = ['companyName', 'vendorCode', 'vendorPhone', 'vendorEmail',
        'address', 'state', 'city', 'pincode', 'gstNo'];
      for (const key of safeMeta) {
        if (updates.meta[key] !== undefined) {
          utsfData.meta[key] = updates.meta[key];
        }
      }
    }

    // Audit trail
    utsfData.meta.updateCount = (utsfData.meta.updateCount || 0) + 1;
    if (!utsfData.updates) utsfData.updates = [];
    utsfData.updates.push({
      timestamp: new Date().toISOString(),
      editorId: customerId,
      reason: 'User edit from My Vendors',
      changeSummary: `Updated: ${Object.keys(updates || {}).join(', ')}`,
      snapshot: null
    });

    fs.writeFileSync(filePath, JSON.stringify(utsfData, null, 2), 'utf8');

    // Reload
    utsfService.reloadTransporter(id);

    res.json({
      success: true,
      message: `Updated ${utsfData.meta.companyName}`,
      transporter: {
        _id: id,
        companyName: utsfData.meta.companyName,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[UTSF API] Error updating user vendor:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update UTSF vendor',
      error: err.message
    });
  }
});

/**
 * DELETE /api/utsf/my-vendors/:id
 * Delete a UTSF transporter (only if customerID matches)
 * Body: { customerId }
 */
router.delete('/my-vendors/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'customerId is required in request body'
      });
    }

    // Find the transporter
    const transporter = utsfService.getTransporterById(id);
    if (!transporter) {
      return res.status(404).json({
        success: false,
        message: 'UTSF transporter not found'
      });
    }

    // Ownership check
    if (!transporter.customerID || String(transporter.customerID) !== String(customerId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own UTSF vendors'
      });
    }

    // Delete the file
    const UTSF_DIR = path.resolve(__dirname, '../data/utsf');
    const filePath = path.join(UTSF_DIR, `${id}.utsf.json`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from service
    utsfService.removeTransporter(id);

    // Also remove from MongoDB
    UTSFModel.deleteOne({ transporterId: id }).catch(err => {
      console.error('[UTSF API] MongoDB delete failed (non-fatal):', err.message);
    });

    res.json({
      success: true,
      message: `Deleted ${transporter.companyName}`
    });
  } catch (err) {
    console.error('[UTSF API] Error deleting user vendor:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete UTSF vendor',
      error: err.message
    });
  }
});

export default router;
