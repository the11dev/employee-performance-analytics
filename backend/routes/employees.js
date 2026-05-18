const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const { verifyToken } = require("../middleware/auth");

// All employee routes require a valid JWT — apply middleware to every route in this file
router.use(verifyToken);

// ─── POST /api/employees ───────────────────────────────────────────────────────
// Add a new employee. Mongoose schema handles field validation.
// If the email is already in use, MongoDB returns duplicate-key error code 11000.
router.post("/", async (req, res) => {
  try {
    const { name, email, department, skills, performanceScore, experience } = req.body;

    const employee = new Employee({
      name,
      email,
      department,
      skills,
      performanceScore,
      experience,
    });

    await employee.save();
    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    // Duplicate email — surface a friendly message instead of the raw Mongo error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An employee with this email already exists.",
      });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── GET /api/employees ────────────────────────────────────────────────────────
// Fetch all employees, sorted by performance score descending (top performers first).
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find({}).sort({ performanceScore: -1 });
    res.json({ success: true, count: employees.length, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/employees/search ─────────────────────────────────────────────────
// Filter employees by department and/or a name search term.
// Example: GET /api/employees/search?department=Development&name=aman
// Both params are optional; if neither is supplied the full list is returned.
router.get("/search", async (req, res) => {
  try {
    const { department, name } = req.query;
    const filter = {};

    // Case-insensitive exact department match
    if (department) {
      filter.department = new RegExp(`^${department}$`, "i");
    }

    // Partial, case-insensitive name match
    if (name) {
      filter.name = new RegExp(name, "i");
    }

    const employees = await Employee.find(filter).sort({ performanceScore: -1 });
    res.json({ success: true, count: employees.length, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/employees/:id ────────────────────────────────────────────────────
// Retrieve a single employee by their MongoDB ObjectId.
router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/employees/:id ────────────────────────────────────────────────────
// Update any employee fields — most commonly used to adjust performanceScore.
// { new: true } returns the updated document instead of the old one.
router.put("/:id", async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true } // runValidators ensures score stays 0–100
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/employees/:id ─────────────────────────────────────────────────
// Permanently remove an employee record.
router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }
    res.json({ success: true, message: `Employee "${employee.name}" deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
