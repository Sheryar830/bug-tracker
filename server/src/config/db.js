const mongoose = require("mongoose");

const connectDB = async () => {
  try {
 
    await mongoose.connect(process.env.MONGODB_URI, {
    
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
    console.log("Mongo connected to DB:", mongoose.connection.name);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
