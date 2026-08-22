const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("FATAL ERROR: MONGODB_URI is missing in environment variables!");
    }

    // FIX: Prevents deprecation warnings from Mongoose 7+ regarding strictQuery
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas Connected Successfully');
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed:', error.message, '\n');
    process.exit(1);
  }
};

module.exports = connectDB;