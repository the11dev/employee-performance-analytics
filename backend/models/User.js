const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Schema — for HR/Admin authentication.
 * Passwords are stored as bcrypt hashes (never plaintext).
 * The pre-save hook hashes the password only when it has been modified
 * to avoid re-hashing on unrelated document updates.
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "hr"],
      default: "hr",
    },
  },
  { timestamps: true }
);

// Hash password before every save — only if it was actually changed
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Salt rounds = 10 is the industry-standard balance of security vs. speed
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/**
 * Instance method to compare a plain-text attempt against the stored hash.
 * bcrypt.compare is timing-safe and prevents timing attacks.
 */
UserSchema.methods.comparePassword = async function (attempt) {
  return bcrypt.compare(attempt, this.password);
};

module.exports = mongoose.model("User", UserSchema);
