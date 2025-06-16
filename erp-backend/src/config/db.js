const mongoose = require('mongoose');

// This function connects to the MongoDB database.
const connectDB = async () => {
  try {
    // It uses the connection string from your .env file.
    await mongoose.connect(process.env.MONGODB_URI);
    
    // If successful, it prints a success message.
    console.log('✅ MongoDB Connected Successfully...');

  } catch (err) {
    // If it fails, it prints an error and stops the application.
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

// Export the function so app.js can use it.
module.exports = connectDB;