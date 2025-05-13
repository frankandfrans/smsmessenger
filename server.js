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
    res.status(200).send({ message: 'Customer saved!' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Signup failed' });
  }
});

app.post('/unsubscribe', async (req, res) => {
  const { email } = req.body;

  try {
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

    const customer = lookupData.data[0];

    const updatedCustomerArray = [
      {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company || "",
        notes: customer.notes || "",
        tax_exempt_category: customer.tax_exempt_category || "",
        accepts_marketing: customer.accepts_marketing,
        accepts_product_review_abandoned_cart_emails: false
      }
    ];

    const update = await fetch(`https://api.bigcommerce.com/stores/${BIGCOMMERCE_STORE_HASH}/v3/customers`, {
      method: 'PUT',
      headers: {
        'X-Auth-Token': BIGCOMMERCE_ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updatedCustomerArray)
    });

    const updateText = await update.text();
    console.log('Final unsubscribe response:', updateText);

    try {
      const parsed = JSON.parse(updateText);
      res.status(200).send({ message: 'Customer unsubscribed.', parsed });
    } catch (parseError) {
      console.error('Failed to parse unsubscribe response:', updateText);
      res.status(500).send({ error: 'Unexpected response', body: updateText });
    }

  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Unsubscribe failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});