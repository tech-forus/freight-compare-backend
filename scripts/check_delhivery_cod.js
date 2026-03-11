import mongoose from 'mongoose';

const MONGO_DB_URL = "mongodb+srv://ForusELectric:BadeDevs%409123@foruscluster.6guqi8k.mongodb.net/";

async function checkDelhivery() {
  await mongoose.connect(MONGO_DB_URL);
  const db = mongoose.connection;
  
  // check temporary transporters
  const tucCollection = db.collection('temporarytransporters');
  const d = await tucCollection.findOne({ companyName: /Delhivery/i });
  if (d) {
    console.log("Delhivery (tied-up) Found:", d.companyName);
    console.log("- codCharges:", JSON.stringify(d.prices?.priceRate?.codCharges));
    console.log("- docketCharges:", d.prices?.priceRate?.docketCharges);
  } else {
    console.log("Not found in temporarytransporters");
  }
  
  const pubCollection = db.collection('transporters');
  const pd = await pubCollection.findOne({ companyName: /Delhivery/i });
  if (pd) {
    console.log("Delhivery (public) Found:", pd.companyName);
    console.log("- codCharges:", JSON.stringify(pd.priceData?.priceRate?.codCharges));
  } else {
    console.log("Not found in transporters");
  }
  
  await mongoose.disconnect();
}

checkDelhivery().catch(console.error);
