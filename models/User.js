// Import Mongoose library to define schema and interact with MongoDB
const mongoose = require('mongoose');

// Define the schema for the User data model
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }, // User's email address (must be unique)
    username: { type: String, required: true, unique: true }, // User's chosen username (must be unique)
    password: { type: String, required: true }, // User's password (stored as a hash)
    income: { type: Number, default: 0 }, // Optional field to store user's income
    expenses: [{ category: String, amount: Number }] // Array of expense entries with category and amount
});

// Export the User model to use it throughout the application
module.exports = mongoose.model('User', UserSchema);
