require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Route modules
const authRouter = require("./routes/auth");
const employeesRouter = require("./routes/employees");
const aiRouter = require("./routes/ai");

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json()); // parse incoming JSON request bodies

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);           // Public — signup & login
app.use("/api/employees", employeesRouter); // Protected — employee CRUD
app.use("/api/ai", aiRouter);               // Protected — AI recommendations

// Health-check endpoint — useful for Render deployment verification
app.get("/", (req, res) => {
  res.json({
    message: "Employee Performance Analytics API is running ✅",
    version: "2.0.0",
    endpoints: ["/api/auth", "/api/employees", "/api/ai"],
  });
});

// ─── Global Error Handling Middleware ─────────────────────────────────────────
// Catches any errors passed via next(err) from route handlers.
// Must have exactly 4 parameters for Express to treat it as an error handler.
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ─── MongoDB + Server Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
