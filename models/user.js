const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true },
  otp: { type: String },
  verifyId: { type: String }
});

module.exports = mongoose.model('User', userSchema);
