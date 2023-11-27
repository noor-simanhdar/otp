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

// Generate OTP route
app.post('/generate-otp', async (req, res) => {
  const { mobileNumber, email } = req.body;

  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Save the OTP to the user's document in MongoDB
    let user = await User.findOne({ mobileNumber });
    if (!user) {
      user = new User({ mobileNumber });
    }
    user.otp = otp;
    await user.save();

    // Send the OTP via Kerala (Kaleyra) SMS API
    const keralaApiKey = process.env.KAREYLA_API_KEY;
    const senderId = process.env.KAREYLA_SENDER_ID;
    const message = `Your OTP is: ${otp}`;
    const kareylaResponse = await axios.post(
      ' https://api.kaleyra.io/v1/HXIN1707324291IN/verify',
      { 
        flow_id: "9bf29f6c-d373-4b72-872c-c83901eaf22b",
        to:{
          mobile : mobileNumber
} ,
        // type:otpsend ,
        // sender:senderId ,
        // body: `Your OTP code is: ${otp}` ,
        // callback:"https://webhook.site/89b43b12-b889-4f66-8ebf-3379b4b3345c" ,
        // template_id:templete
       },
        { headers: 
                { 
                  'api-key': keralaApiKey,
                  'Content-Type': 'application/x-www-form-urlencoded' ,
                // 'Authorization': `Bearer ${keralaApiKey}`
              } }
    );

    // Check the response from Kerala (Kaleyra)
    console.log('Kerala (Kaleyra) Response:', kareylaResponse.data.data);

    res.status(200).send('OTP generated and sent');
  } catch (error) {
    // Log the specific error message
    console.error('Error generating OTP:', error);
    res.status(500).send('Error generating OTP');
  }
});

// Verify OTP route
app.post('/verify-otp', async (req, res) => {
  const { otp } = req.body;

  try {
    // Find the user in MongoDB based on the mobile number
    const user = await User.findOne({ mobileNumber });

    // Check if the user and OTP exist
    if (user && user.otp === otp) {
      // OTP is valid, perform verification with Kerala API
      const keralaApiKey = process.env.KAREYLA_API_KEY;
      const otp = process.env.KAREYLA_API_KEY

      const keralaResponse = await axios.post(
        // 'https://api.kaleyra.io/v1/HXIN1707324291IN/verify',
        'https://api.kaleyra.io/v1/HXIN1707324291IN/verify/validate' ,
        {
          // flow_id: "9bf29f6c-d373-4b72-872c-c83901eaf22b",
          // to: { mobile: mobileNumber },
          otp: otpverify,
          verify_id: ""
        },
        {
          headers: {
            'api-key': keralaApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      // Check the response from Kerala (Kaleyra) for verification
      console.log('Kerala (Kaleyra) Verification Response:', keralaResponse);

      if (keralaResponse.data.data.status === 'approved') {
        res.status(200).send('OTP verified successfully');
      } else {
        res.status(400).send('Invalid OTP');
      }
    } else {
      // Invalid OTP or user not found
      res.status(400).send('Invalid OTP');
    }
  } catch (error) {
    // Log the specific error message
    console.error('Error verifying OTP:', error);
    res.status(500).send('Error verifying OTP');
  }
});


// curl --location --request POST 'https://api.kaleyra.io/v1/<SID>/verify/validate' \
// --header 'Content-Type: <CONTENT_TYPE>' \
// --header 'api-key: <API_KEY>' \
// --data-raw '{
//                "verify_id": "<VERIFY_ID>",
//                "otp": "<OTP>"
//              }'


// server.js

// const express = require('express');
// const bodyParser = require('body-parser');
// const axios = require('axios');

// const app = express();
// const port = 3000;
// const keraylaApiKey = process.env.KERALA_API_KEY;
// const senderId = process.env.KERALA_SENDER_ID;
// const templete = process.env.KERALA_TEMPLETE
// const otpsend = process.env.KERALA_TYPE

// app.use(bodyParser.json());

// // Temporary storage for OTPs (In a real-world scenario, you would use a database)
// const otpStorage = {};

// app.post('/api/send-otp', async (req, res) => {
//   const { mobile } = req.body;

//   try {
//     // Generate a random 4-digit OTP
//     const otp = Math.floor(1000 + Math.random() * 9000);

//     // Save the OTP in temporary storage
//     otpStorage[mobile] = otp;

//     // Send OTP to the provided mobile number
//     await sendOtpToKerayla(mobile, otp);

//     res.json({ success: true, message: 'OTP sent successfully' });
//   } catch (error) {
//     console.error('Error sending OTP:', error.message);
//     res.status(500).json({ success: false, message: 'Failed to send OTP' });
//   }
// });

// app.post('/api/verify-otp', (req, res) => {
//   const { mobile, otp } = req.body;

//   // Retrieve the saved OTP from temporary storage
//   const storedOtp = otpStorage[mobile];

//   if (otp && storedOtp && otp === storedOtp) {
//     res.json({ success: true, message: 'OTP verification successful' });
//   } else {
//     res.status(401).json({ success: false, message: 'Invalid OTP' });
//   }
// });

// async function sendOtpToKerayla(mobile, otp) {
//   const keraylaApiUrl = 'https://api.kaleyra.io/v1/HXIN1707324291IN/messages';

//   return axios.post(
//     keraylaApiUrl,
//     { to:mobile ,
//       type:otpsend ,
//       sender:senderId ,
//       body: `Your OTP code is: ${otp}` ,
//       callback:"https://webhook.site/89b43b12-b889-4f66-8ebf-3379b4b3345c" ,
//       template_id:templete },
//     { headers: 
//       { 
//         'api-key': "A0053b1de6596b8cde023611227e07ae2",
//         'Content-Type': 'application/x-www-form-urlencoded' ,
//       // 'Authorization': `Bearer ${keraylaApiKey}`
//     } }
//   );
// }

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
