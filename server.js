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

// Sign-up route
app.post('/save-sms-signup', async (req, res) => {
  const { first_name, last_name, email, phone } = req.body;

  try {
    const response = await fetch(`https://api.bigcommerce.com/stores/${BIGCOMMERCE_STORE_HASH}/v3/customers`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': BIGCOMMERCE_ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify([
        {
          first_name,
          last_name,
          email,
          phone,
          accepts_marketing: true,
          accepts_product_review_abandoned_cart_emails: true,
          custom_fields: [
            { name: 'sms_opt_in', value: 'yes' }
          ]
        }
      ])
    });

    const text = await response.text();
    console.log('Sign-up response:', text);

    const result = JSON.parse(text);
    res.status(200).send({ message: 'Customer saved!', result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Signup failed' });
  }
});

// Unsubscribe route
app.post('/unsubscribe', async (req, res) => {
  const { email } = req.body;

  try {
    // Lookup customer ID by email
    const lookup = await fetch(`https://api.bigcommerce.com/stores/${BIGCOMMERCE_STORE_HASH}/v3/customers?email:in=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': BIGCOMMERCE_ACCESS_TOKEN,
        'Accept': 'application/json'
      }
    });

    const lookupData = await lookup.json();
    if (!lookupData.data || lookupData.data.length === 0) {
      return res.status(404).send({ error: 'Customer not found' });
    }

    const customerId = lookupData.data[0].id;

    // Update to opt out of abandoned cart and product review emails
    const update = await fetch(`https://api.bigcommerce.com/stores/${BIGCOMMERCE_STORE_HASH}/v3/customers/${customerId}`, {
      method: 'PUT',
      headers: {
        'X-Auth-Token': BIGCOMMERCE_ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        accepts_product_review_abandoned_cart_emails: false
      })
    });

    const updateResponse = await update.json();
    console.log('Unsubscribe response:', updateResponse);
    res.status(200).send({ message: 'Customer unsubscribed.' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Unsubscribe failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});