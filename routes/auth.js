const express = require('express');
const router = express.Router();
const User = require('../models/user');
const axios = require('axios');

// Generate OTP route
router.post('/generate-otp', async (req, res) => {
  const { mobileNumber } = req.body;

  // Generate a random OTP (e.g., a 6-digit number)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save the generated OTP to the user's document in MongoDB
  try {
    const user = await User.findOne({ mobileNumber });
    if (user) {
      user.otp = otp;
      await user.save();
    } else {
      const newUser = new User({
        mobileNumber,
        otp,
      });
      await newUser.save();
    }
  } catch (error) {
    console.error('Error saving OTP to MongoDB:', error);
    return res.status(500).send('Error generating OTP');
  }

  // Send the OTP via Kerala (Kaleyra)
  try {
    const keralaApiKey = 'A0053b1de6596b8cde023611227e07ae2';
    const senderId = 'KLRHXA';
    const message = `Your OTP is: ${otp}`;
    const to = mobileNumber;

    const keralaResponse = await axios.post('https://api.kaleyra.io/v1/HXIN1707324291IN/messages', {
      to,
      body: message,
      from: senderId,
    }, {
      headers: {
        Authorization: `Bearer ${keralaApiKey}`,
      },
    });

    console.log('Kerala (Kaleyra) Response:', keralaResponse.data);

    return res.status(200).send('OTP generated and sent');
  } catch (error) {
    console.error('Error sending OTP via Kerala (Kaleyra):', error);
    return res.status(500).send('Error generating OTP');
  }
});

// Verify OTP route
router.post('/verify-otp', async (req, res) => {
  const { mobileNumber, otp } = req.body;

  try {
    const user = await User.findOne({ mobileNumber });

    if (!user || user.otp !== otp) {
      return res.status(400).send('Invalid OTP');
    }

    // Clear the OTP after successful verification
    user.otp = '';
    await user.save();

    return res.status(200).send('OTP verified');
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).send('Error verifying OTP');
  }
});

module.exports = router;
