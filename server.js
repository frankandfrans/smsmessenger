const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const PAGE_ID = '210175288809';
const ACCESS_TOKEN = 'EAAUHRrIZCMu8BO9kZCHq4AnfUpT6E0mdpIR68q7N8ZCDuZBJljjZCEZBm91V1aXZCp71jjMZA5YaBFe1aHEFoU8ZATxk93TlRWFcNpkLUemfFNdOB7B8pOL42mTKDboEpmEqGXVIQzgoN7WNiBxDOSCezYFyb5WB7zCMdmMgJPwhwgK7SiA5DaWzGeZCoZD';

const app = express();

app.use((req, res, next) => {
  res.header('Cache-Control', 'no-store');
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.use(express.static(__dirname));

app.get('/fb-posts', async (req, res) => {
  try {
    const url = `https://graph.facebook.com/v22.0/${PAGE_ID}/posts?fields=message,attachments{subattachments{media},media}&limit=10&access_token=${ACCESS_TOKEN}`;

    const fbRes = await fetch(url);

    if (!fbRes.ok) {
      const errText = await fbRes.text();
      console.error("⛔ Facebook API Error:", errText);
      return res.status(500).json({ error: 'Facebook API Error', details: errText });
    }

    const json = await fbRes.json();
    const posts = json.data
      ?.filter(p => p.message && p.message.includes('#hookedonfandf') && p.message.includes('#fishingreport'))
      .slice(0, 1)
      .map(p => {
        const images = [];
        const attach = p.attachments?.data[0];
        if (attach?.subattachments) {
          attach.subattachments.data.forEach(s => {
            images.push(s.media.image.src);
          });
        } else if (attach?.media) {
          images.push(attach.media.image.src);
        }
        return { text: p.message, images };
      });

    res.json(posts);
  } catch (err) {
    console.error("🔥 Unhandled error:", err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
