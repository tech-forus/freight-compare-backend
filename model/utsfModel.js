import mongoose from "mongoose";

/**
 * UTSF Model - Universal Transporter Save Format
 *
 * Stores UTSF files in MongoDB for persistence and sync.
 * Mirrors the UTSF 2.0 schema structure.
 */

const utsfSchema = new mongoose.Schema({
  // UTSF Version
  version: {
    type: String,
    required: true,
    default: "2.0"
  },

  generatedAt: {
    type: Date,
    default: Date.now
  },

  sourceFormat: {
    type: String,
    enum: ["mongodb", "manual", "imported", "webapp"],
    default: "mongodb"
  },

  // Meta Information
  meta: {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    companyName: {
      type: String,
      required: true,
      index: true
    },
    vendorCode: String,
    customerID: String,
    transporterType: {
      type: String,
      enum: ["regular", "temporary"],
      default: "regular"
    },
    transportMode: {
      type: String,
      enum: ["LTL", "FTL", "PTL", "AIR", "RAIL", "road", "air", "rail", "ship"],
      default: "LTL"
    },
    gstNo: String,
    address: String,
    state: String,
    city: String,
    pincode: String,
    rating: {
      type: Number,
      default: 4.0,
      min: 0,
      max: 5
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved"
    },
    createdAt: Date,
    updatedAt: Date,
    // v3.0 Governance Headers
    created: {
      by: { type: String, default: 'UNKNOWN' },
      at: { type: Date, default: Date.now },
      source: { type: String, enum: ['FE', 'Python', 'Admin', 'SYSTEM_REPAIR_BOT', 'UNKNOWN'], default: 'UNKNOWN' }
    },
    version: { type: String, default: '3.0.0' },
    updateCount: { type: Number, default: 0 }
  },

  // v3.0 Audit Trail
  updates: [{
    timestamp: { type: Date, default: Date.now },
    editorId: { type: String, required: true },
    reason: { type: String, default: '' },
    changeSummary: { type: String, default: '' },
    snapshot: { type: String, default: null }
  }],

  // v3.0 Zone Overrides (pincode -> transporter's zone when it differs from master)
  zoneOverrides: {
    type: Map,
    of: String,
    default: {}
  },

  // Pricing Information
  pricing: {
    priceRate: {
      minWeight: { type: Number, default: 0 },
      docketCharges: { type: Number, default: 0 },
      fuel: { type: Number, default: 0 },
      divisor: { type: Number, default: 5000 },
      kFactor: { type: Number, default: 5000 },
      minCharges: { type: Number, default: 0 },
      greenTax: { type: Number, default: 0 },
      daccCharges: { type: Number, default: 0 },
      miscCharges: { type: Number, default: 0 },

      rovCharges: {
        v: { type: Number, default: 0 }, // variable %
        f: { type: Number, default: 0 }  // fixed
      },
      insuranceCharges: {
        v: { type: Number, default: 0 },
        f: { type: Number, default: 0 }
      },
      odaCharges: {
        v: { type: Number, default: 0 },
        f: { type: Number, default: 0 }
      },
      codCharges: {
        v: { type: Number, default: 0 },
        f: { type: Number, default: 0 }
      },
      prepaidCharges: {
        v: { type: Number, default: 0 },
        f: { type: Number, default: 0 }
      },
      topayCharges: {
        v: { type: Number, default: 0 },
        f: { type: Number, default: 0 }
      },
      handlingCharges: {
        v: { type: Number, default: 0 },
        f: { type: Number, default: 0 },
        thresholdWeight: { type: Number, default: 0 }
      },
      fmCharges: {
        v: { type: Number, default: 0 },
        f: { type: Number, default: 0 }
      },
      appointmentCharges: {
        v: { type: Number, default: 0 },
        f: { type: Number, default: 0 }
      },
      invoiceValueCharges: {
        v: { type: Number, default: 0 },
        f: { type: Number, default: 0 }
      }
    },

    // Zone rates: Map of Maps (origin -> dest -> rate)
    zoneRates: {
      type: Map,
      of: {
        type: Map,
        of: Number
      },
      required: true
    }
  },

  // Serviceability per zone
  serviceability: {
    type: Map,
    of: {
      mode: {
        type: String,
        enum: ["FULL_ZONE", "FULL_MINUS_EXCEPTIONS", "FULL_MINUS_EXCEPT", "ONLY_SERVED", "NOT_SERVED"],
        required: true
      },
      totalInZone: { type: Number, default: 0 },
      servedCount: { type: Number, default: 0 },
      coveragePercent: { type: Number, default: 0 },

      // For FULL_MINUS_EXCEPTIONS mode
      exceptRanges: [[Number]], // Array of [start, end]
      exceptSingles: [Number],

      // For ONLY_SERVED mode
      servedRanges: [[Number]],
      servedSingles: [Number]
    }
  },

  // ODA information per zone
  oda: {
    type: Map,
    of: {
      odaRanges: [[Number]],
      odaSingles: [Number],
      odaCount: { type: Number, default: 0 }
    }
  },

  // Zone discrepancies (vendor zone != master zone)
  zoneDiscrepancies: {
    totalMismatched: { type: Number, default: 0 },
    remaps: [{
      vendorZone: String,
      masterZone: String,
      count: { type: Number, default: 0 },
      ranges: [{ s: Number, e: Number }],
      singles: [Number]
    }]
  },

  // Statistics
  stats: {
    totalPincodes: { type: Number, default: 0 },
    totalZones: { type: Number, default: 0 },
    odaCount: { type: Number, default: 0 },
    coverageByRegion: {
      North: { type: Number, default: 0 },
      South: { type: Number, default: 0 },
      East: { type: Number, default: 0 },
      West: { type: Number, default: 0 },
      Central: { type: Number, default: 0 },
      "North East": { type: Number, default: 0 },
      Special: { type: Number, default: 0 }
    },
    avgCoveragePercent: { type: Number, default: 0 },
    dataCompleteness: { type: Number, default: 100 },
    zoneDiscrepancyCount: { type: Number, default: 0 },
    complianceScore: { type: Number, default: 1.0, min: 0, max: 1 }
  }
}, {
  timestamps: true,
  strict: false // Allow additional fields for future UTSF schema extensions
});

// Indexes for fast queries
// Indexes already defined in schema via `index: true` on meta.id and meta.companyName
utsfSchema.index({ "meta.transporterType": 1 });
utsfSchema.index({ "meta.approvalStatus": 1 });
utsfSchema.index({ "meta.isVerified": 1 });

// Virtual for quick access to company name
utsfSchema.virtual("companyName").get(function () {
  return this.meta?.companyName;
});

// Virtual for quick access to transporter ID
utsfSchema.virtual("transporterId").get(function () {
  return this.meta?.id;
});

// Method to convert to plain UTSF JSON (for file export)
utsfSchema.methods.toUTSF = function () {
  const obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;

  // Convert Maps to plain objects for JSON serialization
  if (obj.pricing?.zoneRates) {
    const zoneRatesObj = {};
    for (const [originZone, destMap] of Object.entries(obj.pricing.zoneRates)) {
      zoneRatesObj[originZone] = {};
      for (const [destZone, rate] of Object.entries(destMap)) {
        zoneRatesObj[originZone][destZone] = rate;
      }
    }
    obj.pricing.zoneRates = zoneRatesObj;
  }

  // Convert serviceability Map
  if (obj.serviceability) {
    const serviceObj = {};
    for (const [zone, data] of Object.entries(obj.serviceability)) {
      serviceObj[zone] = data;
    }
    obj.serviceability = serviceObj;
  }

  // Convert ODA Map
  if (obj.oda) {
    const odaObj = {};
    for (const [zone, data] of Object.entries(obj.oda)) {
      odaObj[zone] = data;
    }
    obj.oda = odaObj;
  }

  return obj;
};

// Static method to import from UTSF JSON
utsfSchema.statics.fromUTSF = function (utsfData) {
  return new this(utsfData);
};

// Static method to find by transporter ID (meta.id)
utsfSchema.statics.findByTransporterId = function (transporterId) {
  return this.findOne({ "meta.id": transporterId });
};

// Static method to find by company name (case-insensitive)
utsfSchema.statics.findByCompanyName = function (companyName) {
  return this.find({
    "meta.companyName": new RegExp(companyName, "i")
  });
};

export default mongoose.model("utsf", utsfSchema);
