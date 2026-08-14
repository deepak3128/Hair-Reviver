const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['owner', 'staff', 'technician'], required: true },
    phone: { type: String, default: '' },
    joined: { type: String, default: '' },
    rating: { type: Number },
    completed: { type: Number },
    onTime: { type: Number }
  },
  { timestamps: true }
);

userSchema.methods.toSafe = function () {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    joined: this.joined,
    rating: this.rating,
    completed: this.completed,
    onTime: this.onTime
  };
};

module.exports = mongoose.model('User', userSchema);
