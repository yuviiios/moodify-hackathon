require('dotenv').config(); // This loads the keys from your .env file
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// This function gets a temporary access token from Spotify
const getSpotifyToken = async () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const response = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    },
  });
  return response.data.access_token;
};

// The updated /api/playlist route
app.get('/api/playlist', async (req, res) => {
  // We'll use a hardcoded mood for now. Later, this will come from the AI.
  const mood = 'happy'; 
  
  try {
    const token = await getSpotifyToken(); // Get the temporary token

    // Ask Spotify for song recommendations based on the mood
    const apiResponse = await axios.get(`https://api.spotify.com/v1/recommendations`, { // <-- This line is now fixed
      headers: { 'Authorization': `Bearer ${token}` },
      params: {
        seed_genres: "pop,happy,summer",
        target_valence: 0.8, // Valence is Spotify's measure for happiness
        target_energy: 0.8
      }
    });

    // Simplify the response for the frontend
    const simplifiedPlaylist = apiResponse.data.tracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        albumArt: track.album.images[0]?.url,
        previewUrl: track.preview_url
    }));
    res.json({ playlist: simplifiedPlaylist });

  } catch (error) {
    console.log(error);
    console.error('Error fetching from Spotify:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch playlist from Spotify' });
  }
});

app.listen(PORT, () => {
  console.log(`🎵 Backend server is running on http://localhost:${PORT}`);
});