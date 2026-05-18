const mongoose = require("mongoose");

/**
 * Employee Schema
 * Stores all HR-tracked performance data for each employee.
 * performanceScore is validated between 0 and 100.
 * Email must be unique — duplicate inserts return error code 11000.
 */
const EmployeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Work email is required"],
      unique: true,          // triggers duplicate-key error (code 11000) on conflict
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      enum: {
        values: ["Development", "Design", "Marketing", "Sales", "HR", "Finance", "Operations", "Management", "Other"],
        message: "{VALUE} is not a recognised department",
      },
    },
    skills: {
      type: [String],
      default: [],
      // Trim whitespace from every skill string before saving
      set: (arr) => arr.map((s) => s.trim()).filter(Boolean),
    },
    performanceScore: {
      type: Number,
      required: [true, "Performance score is required"],
      min: [0, "Performance score cannot be below 0"],
      max: [100, "Performance score cannot exceed 100"],
    },
    experience: {
      type: Number,
      required: [true, "Years of experience is required"],
      min: [0, "Experience cannot be negative"],
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

module.exports = mongoose.model("Employee", EmployeeSchema);
