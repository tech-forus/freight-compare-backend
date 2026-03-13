import usertransporterrelationshipModel from '../model/usertransporterrelationshipModel.js';
import transporterModel from '../model/transporterModel.js';
import temporaryTransporterModel from '../model/temporaryTransporterModel.js';
import utsfService from './utsfService.js';

class VendorRegistryService {
  /**
   * Loads all UTSF vendors and enriches them with customer ownership.
   * @param {string} customerId - Logged-in customer ID
   * @returns {Array} List of enriched vendor objects { transporter, isCustomerVendor, source }
   */
  async getCandidateVendors(customerId) {
    if (!customerId) return [];

    // 1. Get all system vendors loaded in memory by UTSF
    const allUtsfVendors = utsfService.getAllTransporters();

    // 2. Load relationships for the current customer
    const [relationships, tempTransporters] = await Promise.all([
      usertransporterrelationshipModel.find({ customerID: customerId }).lean(),
      temporaryTransporterModel.find({ customerID: customerId, isSystemVendor: true }).select('systemVendorId').lean()
    ]);

    // The userTransporterRelationship associates customerId with transporterId (which is the MongoDB _id of transporters collection)
    const relationshipTransporterIds = new Set(relationships.map(r => String(r.transporterId)));

    // To robustly identify system vendors, we map transporter MongoDB _ids to systemVendorIds
    const systemTransporters = await transporterModel.find({}).select('_id systemVendorId').lean();
    
    // Sometimes a relationship is established against a transporter _id that represents a system vendor.
    // Let's populate the customerVendorIds set with both the _id and the systemVendorId (if any).
    const customerVendorIds = new Set();
    
    // Add IDs from transitions/legacy relationships
    for (const tId of relationshipTransporterIds) {
      customerVendorIds.add(String(tId));
    }

    // Add systemVendorIds from temporaryTransporterModel (where "Add System Vendor" stores them)
    tempTransporters.forEach(t => {
      if (t.systemVendorId) {
        customerVendorIds.add(String(t.systemVendorId));
      }
    });
    
    // Also add the systemVendorId mapping
    systemTransporters.forEach(t => {
      if (relationshipTransporterIds.has(String(t._id))) {
        if (t.systemVendorId) {
          customerVendorIds.add(String(t.systemVendorId));
        }
        // Also map just in case vendor id corresponds to MongoDB _id
        customerVendorIds.add(String(t._id));
      }
    });

    // 3. Attach metadata to candidate vendors
    const enrichedVendors = allUtsfVendors.map(vendor => {
      // vendor.id is the UTSF meta.id (which typically matches systemVendorId or the transporter _id)
      // vendor.customerID is populated if the vendor was explicitly created by the customer as a custom vendor
      
      const isCustomerVendor = 
        customerVendorIds.has(String(vendor.id)) || 
        (vendor.customerID && String(vendor.customerID) === String(customerId));

      return {
        transporter: vendor,
        isCustomerVendor: !!isCustomerVendor,
        source: isCustomerVendor ? 'customer' : 'system'
      };
    });

    return enrichedVendors;
  }
}

export default new VendorRegistryService();
