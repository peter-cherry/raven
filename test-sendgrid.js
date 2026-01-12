// Quick test to verify SendGrid API key
// Run: node test-sendgrid.js

const https = require('https');

const SENDGRID_API_KEY = 'PASTE_YOUR_SENDGRID_API_KEY_HERE'; // Replace with your key
const FROM_EMAIL = 'peter@raven-search.com';
const TO_EMAIL = 'peter@raven-search.com'; // Send test email to yourself

const data = JSON.stringify({
  personalizations: [{
    to: [{ email: TO_EMAIL }],
    subject: 'SendGrid Test Email'
  }],
  from: { email: FROM_EMAIL },
  content: [{
    type: 'text/plain',
    value: 'If you receive this, your SendGrid API key is working correctly!'
  }]
});

const options = {
  hostname: 'api.sendgrid.com',
  path: '/v3/mail/send',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  res.on('data', (d) => {
    if (d.length > 0) {
      console.log('Response:', d.toString());
    }
  });

  if (res.statusCode === 202) {
    console.log('✅ SUCCESS! Email sent. Check your inbox.');
  } else {
    console.log('❌ FAILED! Check the error above.');
  }
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(data);
req.end();
