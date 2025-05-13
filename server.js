require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

const allowedOrigins = ['https://hatteras-island.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.static('public'));

const BIGCOMMERCE_STORE_HASH = process.env.BIGCOMMERCE_STORE_HASH;
const BIGCOMMERCE_ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;

app.post('/save-sms-signup', async (req, res) => {
  console.log('Received a signup submission!');
  const { first_name, email, phone } = req.body;
  console.log('Form data:', { first_name, email, phone });

  try {
    const response = await fetch(`https://api.bigcommerce.com/stores/${BIGCOMMERCE_STORE_HASH}/v3/customers`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': BIGCOMMERCE_ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        customers: [{
          first_name: first_name,
          email: email,
          phone: phone,
          accepts_marketing: true,
          custom_fields: [
            { name: 'sms_opt_in', value: 'yes' }
          ]
        }]
      })
    });

    const text = await response.text();
console.log('BigCommerce API Response:', text);

try {
  const result = JSON.parse(text);
  res.status(200).send({ message: 'Customer saved!', result });
} catch (e) {
  res.status(500).send({ error: 'Failed to parse BigCommerce response', raw: text });
}
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to save customer' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
