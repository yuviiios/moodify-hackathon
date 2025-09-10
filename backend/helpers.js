// helpers.js - Moodify Backend Helper Functions
// Save this file as: backend/helpers.js

// Core mood to Spotify audio features mapping
const MOOD_MAPPINGS = {
  happy: {
    valence: 0.8,     // High positivity
    energy: 0.7,      // Moderately energetic
    danceability: 0.6,
    tempo: { min: 110, max: 140 },
    genres: ['pop', 'indie-pop', 'funk', 'disco'],
    market: 'US',
    limit: 20
  },
  
  sad: {
    valence: 0.2,     // Low positivity
    energy: 0.3,      // Low energy
    danceability: 0.2,
    tempo: { min: 60, max: 90 },
    genres: ['acoustic', 'indie-folk', 'singer-songwriter', 'ambient'],
    market: 'US',
    limit: 20
  },
  
  angry: {
    valence: 0.3,     // Low-medium positivity
    energy: 0.9,      // Very high energy
    danceability: 0.4,
    tempo: { min: 120, max: 180 },
    genres: ['rock', 'metal', 'punk', 'hardcore'],
    market: 'US',
    limit: 20
  },
  
  calm: {
    valence: 0.5,     // Neutral positivity
    energy: 0.2,      // Very low energy
    danceability: 0.3,
    tempo: { min: 50, max: 80 },
    genres: ['ambient', 'chill', 'lo-fi', 'classical'],
    market: 'US',
    limit: 20
  },
  
  excited: {
    valence: 0.9,     // Very high positivity
    energy: 0.9,      // Very high energy
    danceability: 0.8,
    tempo: { min: 120, max: 160 },
    genres: ['dance', 'electronic', 'party', 'house'],
    market: 'US',
    limit: 20
  },
  
  stressed: {
    valence: 0.6,     // Medium-high positivity (soothing)
    energy: 0.3,      // Low energy (calming)
    danceability: 0.2,
    tempo: { min: 60, max: 100 },
    genres: ['chill', 'lo-fi', 'ambient', 'meditation'],
    market: 'US',
    limit: 20
  },
  
  neutral: {
    valence: 0.5,     // Neutral
    energy: 0.5,      // Moderate
    danceability: 0.5,
    tempo: { min: 90, max: 120 },
    genres: ['indie', 'alternative', 'folk'],
    market: 'US',
    limit: 20
  }
};

// Helper function to build Spotify recommendations API parameters
function buildSpotifyParams(mood, confidence = 0.8) {
  const mapping = MOOD_MAPPINGS[mood.toLowerCase()];
  
  if (!mapping) {
    console.warn(`Unknown mood: ${mood}. Using neutral mapping.`);
    return MOOD_MAPPINGS.neutral;
  }
  
  // Adjust parameters based on confidence level
  const adjustedMapping = { ...mapping };
  
  if (confidence < 0.6) {
    // Lower confidence = more neutral values
    adjustedMapping.valence = (mapping.valence + 0.5) / 2;
    adjustedMapping.energy = (mapping.energy + 0.5) / 2;
  }
  
  return adjustedMapping;
}

// Function to make Spotify recommendations API call
async function getPlaylistForMood(spotifyToken, mood, confidence = 0.8) {
  const params = buildSpotifyParams(mood, confidence);
  
  // Build query string for Spotify API
  const queryParams = new URLSearchParams({
    limit: params.limit,
    market: params.market,
    seed_genres: params.genres.slice(0, 5).join(','), // Max 5 genres
    target_valence: params.valence,
    target_energy: params.energy,
    target_danceability: params.danceability,
    min_tempo: params.tempo.min,
    max_tempo: params.tempo.max
  });
  
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/recommendations?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      mood,
      confidence,
      tracks: data.tracks,
      total: data.tracks.length
    };
    
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
}

// Typing speed to stress level detector
function analyzeTypingStress(keystrokeTimings) {
  if (!keystrokeTimings || keystrokeTimings.length < 10) {
    return { stressed: false, wpm: 0, confidence: 0 };
  }
  
  // Calculate WPM from keystroke intervals
  const avgInterval = keystrokeTimings.reduce((a, b) => a + b, 0) / keystrokeTimings.length;
  const wpm = Math.round(12000 / avgInterval); // Rough WPM calculation
  
  // Detect stress patterns
  const variance = keystrokeTimings.reduce((sum, interval) => {
    return sum + Math.pow(interval - avgInterval, 2);
  }, 0) / keystrokeTimings.length;
  
  const isErratic = variance > (avgInterval * 0.5); // High variance = erratic typing
  const isFast = wpm > 80; // Very fast typing
  
  const stressed = (isErratic && isFast) || wpm > 120;
  const confidence = Math.min((variance / avgInterval) + (wpm / 100), 1);
  
  return {
    stressed,
    wpm,
    confidence: Math.round(confidence * 100) / 100,
    variance: Math.round(variance)
  };
}

// Combine face emotion + typing stress for final mood
function combineMoodSources(faceEmotion, typingData) {
  const { emotion: faceMood, confidence: faceConfidence } = faceEmotion;
  const { stressed, confidence: typingConfidence } = typingData;
  
  // If typing indicates stress, override with stressed mood
  if (stressed && typingConfidence > 0.6) {
    return {
      finalMood: 'stressed',
      confidence: Math.max(typingConfidence, faceConfidence * 0.7),
      sources: {
        face: { mood: faceMood, weight: 0.3 },
        typing: { stressed: true, weight: 0.7 }
      }
    };
  }
  
  // Otherwise, use face emotion as primary
  return {
    finalMood: faceMood,
    confidence: faceConfidence,
    sources: {
      face: { mood: faceMood, weight: 0.8 },
      typing: { stressed: false, weight: 0.2 }
    }
  };
}

// Express.js route creator for your backend
function createMoodifyRoutes(app, spotifyService) {
  // Main endpoint: analyze mood and return playlist
  app.post('/api/moodify', async (req, res) => {
    try {
      const { 
        faceEmotion,        // { emotion: 'happy', confidence: 0.8 }
        keystrokeTimings,   // [120, 150, 90, ...] (ms intervals)
        spotifyToken 
      } = req.body;
      
      console.log('Received moodify request:', {
        faceEmotion,
        keystrokeCount: keystrokeTimings?.length || 0,
        hasSpotifyToken: !!spotifyToken
      });
      
      // Analyze typing stress
      const typingData = analyzeTypingStress(keystrokeTimings || []);
      console.log('Typing analysis:', typingData);
      
      // Combine both sources for final mood
      const moodAnalysis = combineMoodSources(faceEmotion, typingData);
      console.log('Final mood analysis:', moodAnalysis);
      
      // Try to get real Spotify playlist if service is available
      let playlist;
      if (spotifyService) {
        try {
          playlist = await spotifyService.getRecommendationsByMood(
            moodAnalysis.finalMood, 
            moodAnalysis.confidence,
            spotifyToken
          );
        } catch (error) {
          console.error('Spotify service error, using mock:', error.message);
          playlist = createMockPlaylist(moodAnalysis.finalMood);
          playlist.mock = true;
        }
      } else {
        // Fallback to mock playlist
        playlist = createMockPlaylist(moodAnalysis.finalMood);
        playlist.mock = true;
      }
      
      res.json({
        success: true,
        analysis: moodAnalysis,
        playlist,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Moodify API error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  // Create playlist endpoint (for logged-in users)
  app.post('/api/create-playlist', async (req, res) => {
    try {
      const { userToken, mood, tracks } = req.body;
      
      if (!userToken) {
        return res.status(401).json({ error: 'User token required' });
      }
      
      if (!spotifyService) {
        return res.status(503).json({ error: 'Spotify service not available' });
      }
      
      const userProfile = await spotifyService.getUserProfile(userToken);
      const playlistName = `Moodify: ${mood.charAt(0).toUpperCase() + mood.slice(1)} Vibes`;
      const description = `Curated by Moodify based on your ${mood} mood 🎵`;
      
      const playlist = await spotifyService.createPlaylist(
        userToken,
        userProfile.id,
        playlistName,
        tracks,
        description
      );
      
      res.json({
        success: true,
        playlist,
        message: 'Playlist created successfully!'
      });
      
    } catch (error) {
      console.error('Create playlist error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  // Direct recommendations endpoint (simpler version)
  app.post('/api/recommendations', async (req, res) => {
    try {
      const { mood, confidence = 0.8, userToken } = req.body;
      
      if (!mood) {
        return res.status(400).json({ error: 'Mood is required' });
      }
      
      console.log(`Getting recommendations for mood: ${mood}`);
      
      let playlist;
      if (spotifyService) {
        try {
          playlist = await spotifyService.getRecommendationsByMood(mood, confidence, userToken);
        } catch (error) {
          console.error('Spotify service error:', error.message);
          playlist = createMockPlaylist(mood);
          playlist.mock = true;
        }
      } else {
        playlist = createMockPlaylist(mood);
        playlist.mock = true;
      }
      
      res.json({
        success: true,
        mood,
        confidence,
        playlist,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Recommendations API error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'moodify-backend',
      spotify_available: !!spotifyService,
      timestamp: new Date().toISOString()
    });
  });
}

// Create mock playlist for demo purposes
function createMockPlaylist(mood) {
  const mockTracks = {
    happy: [
      {
        id: '1',
        name: 'Happy',
        artists: [{ name: 'Pharrell Williams' }],
        album: { images: [{ url: 'https://via.placeholder.com/300x300/FFD700/000000?text=😊' }] },
        preview_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
      },
      {
        id: '2',
        name: 'Good as Hell',
        artists: [{ name: 'Lizzo' }],
        album: { images: [{ url: 'https://via.placeholder.com/300x300/FF69B4/000000?text=🎉' }] },
        preview_url: null
      }
    ],
    sad: [
      {
        id: '3',
        name: 'Someone Like You',
        artists: [{ name: 'Adele' }],
        album: { images: [{ url: 'https://via.placeholder.com/300x300/4169E1/FFFFFF?text=😢' }] },
        preview_url: null
      }
    ],
    stressed: [
      {
        id: '4',
        name: 'Weightless',
        artists: [{ name: 'Marconi Union' }],
        album: { images: [{ url: 'https://via.placeholder.com/300x300/98FB98/000000?text=🧘' }] },
        preview_url: null
      }
    ],
    calm: [
      {
        id: '5',
        name: 'Claire de Lune',
        artists: [{ name: 'Claude Debussy' }],
        album: { images: [{ url: 'https://via.placeholder.com/300x300/E6E6FA/000000?text=🌙' }] },
        preview_url: null
      }
    ]
  };
  
  const tracks = mockTracks[mood] || mockTracks.happy;
  
  return {
    mood,
    tracks,
    total: tracks.length
  };
}

// Export all functions
module.exports = {
  MOOD_MAPPINGS,
  buildSpotifyParams,
  getPlaylistForMood,
  analyzeTypingStress,
  combineMoodSources,
  createMoodifyRoutes,
  createMockPlaylist
};