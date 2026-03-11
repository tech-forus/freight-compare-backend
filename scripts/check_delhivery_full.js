import mongoose from 'mongoose';

const MONGO_DB_URL = "mongodb+srv://ForusELectric:BadeDevs%409123@foruscluster.6guqi8k.mongodb.net/";

async function checkDelhiveryFull() {
  await mongoose.connect(MONGO_DB_URL);
  const db = mongoose.connection;
  
  const pubCollection = db.collection('transporters');
  const pd = await pubCollection.findOne({ companyName: /Delhivery/i });
  if (pd) {
    console.log("Delhivery (public) Found:", pd.companyName);
    console.log("price rate:", JSON.stringify(pd.priceData?.priceRate, null, 2));
  } else {
    console.log("Not found in transporters");
  }
  
  await mongoose.disconnect();
}

checkDelhiveryFull().catch(console.error);
