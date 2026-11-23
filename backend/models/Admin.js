const mongoose = require('mongoose');

// Schema for admin authentication
const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
