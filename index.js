// app.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const bodyParser = require('body-parser');
const User = require('./models/user');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const dbURI = process.env.MONGODB_URI;
const keraylaApiKey = process.env.KERALA_API_KEY;
const senderId = process.env.KERALA_SENDER_ID;
const templete = process.env.KERALA_TEMPLETE
const otpsend = process.env.KAREYLA_TYPE

// const headers = {
//   'api-key': 'A0053b1de6596b8cde023611227e07ae2',
// }

// const data = {
//   to: '+918983487775',
//   sender: '<FROM_NUMBER>',
//   body: '<MESSAGE>',
//   type: 'OTP',
// }
mongoose.connect(dbURI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/generate-otp', async (req, res) => {
  const { mobileNumber, email } = req.body;

  try {
    // // Fetch the user from MongoDB or create a new user if not found
    let user = await User.findOne({ mobileNumber });
    if (!user) {
      user = new User({ mobileNumber });
    }

    // Send the OTP via Kerala (Kaleyra) SMS API
    const keralaApiKey = process.env.KAREYLA_API_KEY;
    const kareylaResponse = await axios.post(
      'https://api.kaleyra.io/v1/HXIN1707324291IN/verify',
      {
        flow_id: "9bf29f6c-d373-4b72-872c-c83901eaf22b",
        to: {
          mobile: mobileNumber
        }
      },
      {
        headers: {
          'api-key': keralaApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    // Check the response from Kerala (Kaleyra) and extract verify_id
    const verifyId = kareylaResponse.data.data.verify_id;

    // Save verify_id to the user document in MongoDB
    user.verifyId = verifyId;
    await user.save();

    console.log('Kerala (Kaleyra) Response:', kareylaResponse.data.data);

    // res.status(200).send('OTP generated and sent');
    res.status(200).json({ success: true, message: 'OTP generated and sent' });

  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({ success: false, message: 'Error generating OTP' });

    // res.status(500).send('Error generating OTP');
  }
});

// Import your User model or adjust the import path
app.post('/verify-otp', async (req, res) => {
  const { otp, mobileNumber } = req.body;

  try {
    // Assuming you have a User model with a method to find a user by mobile number
    const user = await User.findOne({ mobileNumber });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
  
    console.log("verifyId:", user.verifyId);
  const id = user.verifyId
   
    const keralaResponse = await axios.post(
      'https://api.kaleyra.io/v1/HXIN1707324291IN/verify/validate',
      {
        otp: otp,
        verify_id: id, // Use the stored verifyId from the user document
      },
      {
        headers: {
          'api-key': 'A0053b1de6596b8cde023611227e07ae2',
          'Content-Type': 'application/json',
        },
      }
    );

    // Handle keralaResponse as needed
    res.status(200).json({ success: true, message: 'OTP verification successful' });
  } catch (error) {
    // Handle errors, e.g., log the error or send an error response
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// app.post('/verify-otp', async (req, res) => {
//   const { otp, mobileNumber } = req.body;

//   try {
//     // Find the user in MongoDB based on the mobileNumber
//     const user = await User.findOne({ mobileNumber });

//     // Check if the user exists and if the verifyId matches
//     if (user && user.otp === otp && user.verifyId) {
//       // Perform verification with Kerala API using the provided OTP and verifyId
//       const keralaApiKey = process.env.KAREYLA_API_KEY;

//       const keralaResponse = await axios.post(
//         'https://api.kaleyra.io/v1/HXIN1707324291IN/verify/validate',
//         {
//           otp: otp,
//           verify_id: user.verifyId, // Use the stored verifyId from the user document
//         },
//         {
//           headers: {
//             'api-key': keralaApiKey,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       // Check the response from Kerala (Kaleyra) for verification
//       console.log('Kerala (Kaleyra) Verification Response:', keralaResponse.data);

//       if (keralaResponse.data.status === 'approved') {
//         // Clear the OTP and verifyId after successful verification
//         user.otp = null;
//         user.verifyId = null;
//         await user.save();

//         res.status(200).send('OTP verified successfully');
//       } else {
//         res.status(400).send('Invalid OTP');
//       }
//     } else {
//       // Invalid OTP, user not found, or no verifyId
//       res.status(400).send('Invalid OTP or user not found');
//     }
//   } catch (error) {
//     // Log the specific error message
//     console.error('Error verifying OTP:', error);
//     res.status(500).send('Error verifying OTP');
//   }
// });
