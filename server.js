const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const path = require("path");
const User = require("./models/User"); // Ensure correct path
const Calculator = require("./models/Calculator");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

//  Serve Static Files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Register Route
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof username !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ msg: "Invalid input data" });
    }

 
    if (!email.trim() || !username.trim() || !password.trim()) {
      return res.status(400).json({ msg: "All fields are required" });
    }
        // Updated email regex to allow more domains
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

 
    if (!emailRegex.test(email)) {
        return res.status(400).json({ msg: "Invalid email format" });
    }


    let existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ msg: "Email already exists" });

    let existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ msg: "Username already exists" });

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ email, username, password: hashedPassword });
    await user.save();

    res.json({ msg: "User registered successfully" });
  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(500).json({ msg: "Internal server error" });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
      console.log("Login request received:", req.body);  // Debugging log

      const { loginInput, password } = req.body;

      if (!loginInput || !password) {
          return res.status(400).json({ msg: "All fields are required" });
      }

      const isEmail = loginInput.includes('@');
      let user;
      if (isEmail) {
          user = await User.findOne({ email: loginInput });
      } else {
          user = await User.findOne({ username: loginInput });
      }

      if (!user) {
          console.log("User not found:", loginInput);
          return res.status(400).json({ msg: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          console.log("Password mismatch for:", loginInput);
          return res.status(400).json({ msg: "Invalid credentials" });
      }

      res.json({ msg: "Login successful", user });
  } catch (err) {
      console.error("Login Error:", err.message);
      res.status(500).json({ msg: "Internal server error" });
  }
});

// Save calculator
app.post("/api/calculators", async (req, res) => {
  try {
    const { userId, name, data } = req.body;
    const calculator = new Calculator({ userId, name, data });
    await calculator.save();
    res.json(calculator);
  } catch (err) {
    res.status(500).json({ msg: "Failed to save calculator" });
  }
});
// Delete calculator
app.delete("/api/calculator/:id", async (req, res) => {
  try {
    const objectId = new mongoose.Types.ObjectId(req.params.id); 
    const deleted = await Calculator.findByIdAndDelete(objectId);
    if (!deleted) {
      return res.status(404).json({ msg: "Calculator not found" });
    }
    res.json({ msg: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete" });
  }
});
// Reset Password Route
app.post("/api/auth/reset-password", async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Current password is incorrect" });

    const isSame = await bcrypt.compare(newPassword, user.password);
if (isSame) return res.status(401).json({ msg: "New password can't be the same as current password." });

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedNewPassword;

    await user.save();
    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err.message);
    res.status(500).json({ msg: "Failed to reset password" });
  }
});
// Get all calculators for a user
app.get("/api/calculators/:userId", async (req, res) => {
  try {
    const calculators = await Calculator.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(calculators);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch calculators" });
  }
});

// Get one calculator
app.get("/api/calculator/:id", async (req, res) => {
  try {
    const calc = await Calculator.findById(req.params.id);
    res.json(calc);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch calculator" });
  }
});

// Update existing calculator
app.put("/api/calculator/:id", async (req, res) => {
  try {
    const { name, data } = req.body;
    const updated = await Calculator.findByIdAndUpdate(
      req.params.id,
      { name, data },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: "Failed to update calculator" });
  }
});




// Serve `index.html` on `/`
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

//Serve Other Pages
app.get("/register.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
