// Import Mongoose library to interact with MongoDB
const mongoose = require("mongoose");

// Define the schema for the Calculator data model
const CalculatorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, // References the user who owns the calculator
  name: { type: String, required: true }, // The name of the calculator
  data: { type: Object, required: true }, // The actual calculator data (stored as an object)
  createdAt: { type: Date, default: Date.now } // Automatically records when the calculator was created
});

// Export the Calculator model so it can be used in other files
module.exports = mongoose.model("Calculator", CalculatorSchema);
