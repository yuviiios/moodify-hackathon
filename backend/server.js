const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/api/mood', (req, res) => {
  res.json({ mood: 'happy', source: 'mock' });
});

app.get('/api/playlist', (req, res) => {
  res.json({ playlist: [{ track: "Mock Song 1" }, { track: "Mock Song 2" }] });
});

app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));