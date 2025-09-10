'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMusic, FaHistory, FaTimes, FaCamera, FaPlay, FaPause, FaShare, FaHeart, FaRobot, FaRandom, FaUser } from 'react-icons/fa';

// --- TYPE DEFINITIONS ---
type Track = {
  id: string;
  track: string;
  artist: string;
  album: string;
  duration: string;
  genre: string;
};

type PlaylistHistory = {
  mood: string;
  timestamp: string;
  tracks: Track[];
};

type EmotionData = {
  emotion: string;
  confidence: number;
};

const moodSuggestions = [
  { mood: 'Happy', emoji: '😊' }, { mood: 'Sad', emoji: '😢' }, { mood: 'Energetic', emoji: '⚡' },
  { mood: 'Relaxed', emoji: '😌' }, { mood: 'Romantic', emoji: '💖' }, { mood: 'Chill', emoji: '🌊' },
  { mood: 'Motivated', emoji: '🔥' }, { mood: 'Nostalgic', emoji: '🌅' }, { mood: 'Focused', emoji: '🎯' },
];

// --- COMPONENT START ---
export default function MoodifyApp() {
  // --- STATE MANAGEMENT ---
  const [mood, setMood] = useState('');
  const [playlist, setPlaylist] = useState<Track[]>([]);
  // FIX: Initialize state with default values, not localStorage
  const [history, setHistory] = useState<PlaylistHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filteredSuggestions, setFilteredSuggestions] = useState<typeof moodSuggestions>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [showCamera, setShowCamera] = useState(false);
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [particleStyles, setParticleStyles] = useState<React.CSSProperties[]>([]);

  // FIX: Initialize state with default values
  const [streak, setStreak] = useState<number>(0);
  const [lastMoodDate, setLastMoodDate] = useState<string | null>(null);

  // --- CLIENT-SIDE HYDRATION FROM LOCALSTORAGE ---
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('moodify_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
      const savedStreak = localStorage.getItem('moodify_streak');
      if (savedStreak) {
        setStreak(Number(savedStreak));
      }
      const savedLastDate = localStorage.getItem('moodify_last_date');
      if (savedLastDate) {
        setLastMoodDate(savedLastDate);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);


  // --- HYDRATION ERROR FIX & PARTICLE GENERATION ---
  useEffect(() => {
    const newStyles = Array.from({ length: 15 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 5 + 5}s`,
      animationDelay: `${Math.random() * 5}s`,
    }));
    setParticleStyles(newStyles);
  }, []);

  // persist history and streak locally
  useEffect(() => { localStorage.setItem('moodify_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('moodify_streak', String(streak)); }, [streak]);
  useEffect(() => { if (lastMoodDate) localStorage.setItem('moodify_last_date', lastMoodDate); }, [lastMoodDate]);

  // --- NOTIFICATION HANDLER ---
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // --- MOCK API & AI FUNCTIONS ---
  const sampleTracks: Track[] = [
      { id: '1', track: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', genre: 'Pop' },
      { id: '2', track: 'As It Was', artist: 'Harry Styles', album: "Harry's House", duration: '2:47', genre: 'Pop' },
      { id: '3', track: 'Take on Me', artist: 'a-ha', album: 'Hunting High and Low', duration: '3:45', genre: 'Synth-pop' },
      { id: '4', track: 'Mr. Brightside', artist: 'The Killers', album: 'Hot Fuss', duration: '3:42', genre: 'Alternative Rock' },
      { id: '5', track: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: '5:55', genre: 'Rock' },
      { id: '6', track: 'Hotel California', artist: 'Eagles', album: 'Hotel California', duration: '6:30', genre: 'Rock' },
      { id: '7', track: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', duration: '5:01', genre: 'Grunge' },
      { id: '8', track: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', duration: '4:54', genre: 'Pop' },
  ];

  const handleGetPlaylist = async (currentMood: string) => {
    if (!currentMood) {
      setToastMessage('Please enter a mood to begin.');
      return;
    }
    setIsLoading(true);
    setPlaylist([]);
    setEmotionData(null);

    await new Promise(resolve => setTimeout(resolve, 900));

    // Simple "mood -> filter" mock
    const filtered = sampleTracks.filter((_, i) => (i % (currentMood.length % 3 + 1)) !== 0).slice(0,6);
    const mockTracks = filtered.length ? filtered : sampleTracks.slice(0,6);

    setPlaylist(mockTracks);
    const newHistoryItem: PlaylistHistory = { mood: currentMood, timestamp: new Date().toLocaleString(), tracks: mockTracks };
    setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));

    // update streak
    const today = new Date().toISOString().slice(0,10);
    if (lastMoodDate !== today) {
        if (lastMoodDate) {
            const prev = new Date(lastMoodDate);
            const diff = (new Date(today).getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
            setStreak(diff === 1 ? s => s + 1 : 1);
        } else {
            setStreak(1);
        }
        setLastMoodDate(today);
    }

    setIsLoading(false);
    setToastMessage('Playlist ready — enjoy!');
  };
  
  const handleSurpriseMe = () => {
    const randomMood = moodSuggestions[Math.floor(Math.random() * moodSuggestions.length)].mood;
    setMood(randomMood);
    handleGetPlaylist(randomMood);
  };
  
  // --- CAMERA & AI DETECTION ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      setToastMessage('Camera access denied.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const detectEmotionFromVideo = useCallback(() => {
    const emotions = ['Happy', 'Relaxed', 'Surprised', 'Focused'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const detectedData = { emotion: randomEmotion, confidence: Math.random() * 0.3 + 0.7 };
    setEmotionData(detectedData);
    setMood(randomEmotion);
    handleGetPlaylist(randomEmotion);
    stopCamera();
  }, [handleGetPlaylist, stopCamera]);

  // --- EVENT HANDLERS ---
  const handleMoodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMood(value);
    if (value) {
      setFilteredSuggestions(moodSuggestions.filter(s => s.mood.toLowerCase().startsWith(value.toLowerCase())));
    } else {
      setFilteredSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: typeof moodSuggestions[0]) => {
    setMood(suggestion.mood);
    setFilteredSuggestions([]);
    handleGetPlaylist(suggestion.mood);
  };
  
  const toggleFavorite = (trackId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(trackId)) newFavorites.delete(trackId);
    else newFavorites.add(trackId);
    setFavorites(newFavorites);
    setToastMessage(newFavorites.has(trackId) ? 'Added to favorites' : 'Removed from favorites');
  };
  
  const sharePlaylist = () => {
    navigator.clipboard.writeText(window.location.href);
    setToastMessage('Link copied to clipboard!');
  };

  // mini-player controls (mock playback)
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let t: any;
    if (isPlaying && currentlyPlaying) {
      t = setInterval(() => setProgress(p => Math.min(100, p + 2)), 1000);
    } else if (!isPlaying) {
        clearInterval(t);
    }
    return () => clearInterval(t);
  }, [isPlaying, currentlyPlaying]);

  useEffect(() => { if (progress >= 100) { setIsPlaying(false); setProgress(0); } }, [progress]);

  const playPause = () => {
    if (!currentlyPlaying && playlist.length) setCurrentlyPlaying(playlist[0].id);
    setIsPlaying(p => !p);
  };

  const skipNext = () => {
    if (!currentlyPlaying) return;
    const idx = playlist.findIndex(t => t.id === currentlyPlaying);
    const next = playlist[(idx + 1) % playlist.length];
    setCurrentlyPlaying(next?.id || null);
    setProgress(0);
    setIsPlaying(true);
  };

  const playTrack = (trackId: string) => {
    setCurrentlyPlaying(trackId);
    setIsPlaying(true);
    setProgress(0);
  };

  // Export playlist as M3U
  const exportM3U = () => {
    if (!playlist.length) { setToastMessage('No playlist to export'); return; }
    // FIX: Use backticks for template literals
    const lines = ['#EXTM3U', ...playlist.map(t => `#EXTINF:${t.duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0)},${t.artist} - ${t.track}`), ...playlist.map(t => `${t.track} - ${t.artist}`)];
    const blob = new Blob([lines.join('\n')], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${mood || 'moodify'}-playlist.m3u`; a.click(); URL.revokeObjectURL(url);
    setToastMessage('Exported .m3u file');
  };

  // Mood analytics: counts for small bar chart
  const moodCounts = history.reduce<Record<string, number>>((acc, item) => { acc[item.mood] = (acc[item.mood] || 0) + 1; return acc; }, {});
  const topMoods = Object.entries(moodCounts).sort((a,b) => b[1]-a[1]).slice(0,5);

  const moodColor = (m: string) => {
    const map: Record<string,string> = { Happy: '#FACC15', Sad: '#60A5FA', Energetic: '#FB923C', Relaxed: '#34D399', Romantic: '#F472B6', Chill: '#60A5FA', Motivated: '#F97316', Nostalgic: '#F59E0B', Focused: '#7C3AED' };
    return map[m] || '#94A3B8';
  };

  // --- RENDER ---
  return (
    <main className="bg-[#0b0b0b] text-white min-h-screen font-sans p-4 sm:p-8 relative overflow-x-hidden pb-28">
      <div className="absolute inset-0 pointer-events-none opacity-10">
        {particleStyles.map((style, i) => (
          <div key={i} className="absolute w-1 h-1 bg-green-500 rounded-full animate-pulse" style={style} />
        ))}
      </div>
      
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#282828] text-white px-6 py-3 rounded-full shadow-lg z-50">
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Image src="/logo.png" alt="Moodify Logo" width={50} height={50} />
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Moodify</h1>
          </div>
          <p className="text-gray-400 text-sm">Your personal AI DJ — now with streaks, mini-player and analytics.</p>
        </motion.header>

        <div className="mb-6 relative">
          <input type="text" value={mood} onChange={handleMoodChange} placeholder="How are you feeling today?" className="w-full px-5 py-3 text-lg bg-[#171717] border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1DB954] transition-all" disabled={isLoading} />
          {filteredSuggestions.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute w-full mt-2 bg-[#171717] rounded-lg shadow-lg z-20 overflow-hidden">
              {filteredSuggestions.map(s => (<div key={s.mood} onClick={() => handleSuggestionClick(s)} className="px-5 py-3 hover:bg-[#262626] cursor-pointer flex items-center gap-3"><span className="text-xl">{s.emoji}</span><span>{s.mood}</span></div>))}
            </motion.div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleGetPlaylist(mood)} className="px-8 py-3 text-base font-bold text-black bg-[#1DB954] rounded-full hover:bg-[#1ED760] transition-colors disabled:opacity-50 flex items-center gap-2" disabled={isLoading}><FaMusic /> Create Playlist</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startCamera} className="px-6 py-3 text-base font-bold bg-[#171717] rounded-full hover:bg-[#262626] transition-colors flex items-center gap-2"><FaCamera/> Detect Face</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSurpriseMe} className="px-6 py-3 text-base font-bold bg-[#171717] rounded-full hover:bg-[#262626] transition-colors flex items-center gap-2"><FaRandom/> Surprise Me</motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#181818] p-4 rounded-lg flex flex-col items-start gap-2"><p className="text-sm text-gray-400">Current Streak</p><p className="text-2xl font-bold">{streak} 🔥</p><p className="text-xs text-gray-400">Keep generating playlists daily to grow your streak.</p></div>
          <div className="bg-[#181818] p-4 rounded-lg col-span-2">
            <div className="flex justify-between items-center mb-3"><p className="text-sm text-gray-400">Mood Insights</p><button onClick={() => { setHistory([]); localStorage.removeItem('moodify_history'); setToastMessage('History cleared'); }} className="text-xs text-gray-400 hover:text-white">Clear</button></div>
            {topMoods.length > 0 ? (
              <div className="space-y-2">
                {topMoods.map(([m,c]) => (
                  <div key={m} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: moodColor(m) }} />
                    <div className="flex-grow">
                      <div className="w-full bg-[#0f0f0f] rounded-full h-2 overflow-hidden">
                        <div style={{ width: `${Math.min(100, (c / (history.length || 1)) * 100)}%`, backgroundColor: moodColor(m) }} className="h-2 rounded-full" />
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">{c}</div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-gray-500 text-sm">No mood data yet — generate a playlist to start insights.</p>)}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (<motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="space-y-2 bg-[#181818] p-6 rounded-lg">{[...Array(5)].map((_, i) => (<div key={i} className="flex items-center gap-4 p-4 animate-pulse"><div className="w-8 h-8 bg-[#282828] rounded"></div><div className="flex-grow space-y-2"><div className="w-3/5 h-4 bg-[#282828] rounded"></div><div className="w-2/5 h-3 bg-[#282828] rounded"></div></div><div className="w-1/6 h-4 bg-[#282828] rounded"></div><div className="w-10 h-4 bg-[#282828] rounded"></div></div>))}</div></motion.div>) : 
          playlist.length > 0 ? (<motion.div key="playlist" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-[#181818] p-6 rounded-lg shadow-lg"><div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4"><div><h2 className="text-2xl font-bold">Your "{mood}" Playlist</h2><p className="text-sm text-gray-400">{playlist.length} songs • {playlist.map(t => t.artist).slice(0,3).join(', ')}{playlist.length > 3 ? '...' : ''}</p></div><div className="flex items-center gap-3"><button onClick={sharePlaylist} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><FaShare/> Share</button><button onClick={exportM3U} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">Export</button></div></div><div className="space-y-2"><div className="grid grid-cols-[2rem,1fr,1fr,auto] gap-4 px-4 text-gray-400 uppercase text-sm font-light border-b border-gray-700 pb-2"><span>#</span> <span>Title</span> <span>Album</span> <FaHeart/></div>{playlist.map((track, index) => (<div key={track.id} className="grid grid-cols-[2rem,1fr,1fr,auto] gap-4 items-center p-4 rounded-md hover:bg-[#262626] transition-colors group"><div className="flex items-center justify-center text-gray-400"><span className="group-hover:hidden">{index + 1}</span><button onClick={() => playTrack(track.id)} className="hidden group-hover:block">{currentlyPlaying === track.id && isPlaying ? <FaPause/> : <FaPlay/>}</button></div><div><p className="font-medium text-white truncate">{track.track}</p><p className="text-gray-400 text-sm truncate">{track.artist}</p></div><p className="text-gray-400 text-sm truncate">{track.album}</p><button onClick={() => toggleFavorite(track.id)} className={`transition-colors ${favorites.has(track.id) ? 'text-green-500' : 'text-gray-600 hover:text-white'}`}><FaHeart/></button></div>))}</div></motion.div>) : null}
        </AnimatePresence>

        <AnimatePresence>
        {showCamera && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-[#282828] rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-700"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold flex items-center gap-2"><FaRobot/> AI Emotion Detection</h3><button onClick={stopCamera} className="p-2 rounded-full hover:bg-gray-700"><FaTimes /></button></div><video ref={videoRef} autoPlay muted className="w-full h-64 bg-black rounded-lg mb-4"/><button onClick={detectEmotionFromVideo} className="w-full py-3 bg-[#1DB954] text-black font-bold rounded-lg hover:bg-[#1ED760] transition-colors">Analyze Emotion</button></motion.div></motion.div>)}
        </AnimatePresence>
        
        <AnimatePresence>
        {showHistory && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex justify-end z-50"><motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="bg-[#181818] w-full max-w-md h-full shadow-2xl border-l border-gray-700 flex flex-col"><div className="p-6 border-b border-gray-700 flex justify-between items-center"><h3 className="text-2xl font-bold">History</h3><button onClick={() => setShowHistory(false)} className="p-2 rounded-full hover:bg-gray-700"><FaTimes /></button></div><div className="flex-grow p-6 overflow-y-auto">{history.length > 0 ? (<div className="space-y-4">{history.map((item, index) => (<div key={index} className="bg-[#262626] p-4 rounded-lg cursor-pointer hover:bg-[#333333]" onClick={() => { setMood(item.mood); setPlaylist(item.tracks); setShowHistory(false); }}><p className="font-bold">{item.mood} <span className="text-xs ml-2 text-gray-400">{item.timestamp}</span></p><p className="text-sm text-gray-500 mt-2">{item.tracks.length} songs</p></div>))}</div>) : (<div className="text-center text-gray-500 h-full flex flex-col justify-center items-center"><FaHistory className="text-5xl mb-4"/><p>No playlists generated yet.</p></div>)}</div></motion.div></motion.div>)}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {playlist.length > 0 && (
          <motion.div initial={{ y: "120%" }} animate={{ y: 0 }} exit={{ y: "120%"}} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed bottom-20 left-0 right-0 mx-auto max-w-4xl px-4 z-40">
            <div className="bg-[#131313] border border-gray-800 rounded-xl p-3 flex items-center gap-4 shadow-lg">
              <div className="w-12 h-12 bg-[#222] rounded flex items-center justify-center text-xl">🎧</div>
              <div className="flex-grow"><div className="flex justify-between items-center"><div><div className="text-sm font-medium">{(playlist.find(t=>t.id===currentlyPlaying)?.track) || (playlist[0]?.track) || 'Nothing Playing'}</div><div className="text-xs text-gray-400">{(playlist.find(t=>t.id===currentlyPlaying)?.artist) || (playlist[0]?.artist) || ''}</div></div><div className="flex items-center gap-3"><button onClick={() => { setIsPlaying(false); setCurrentlyPlaying(null); setProgress(0); }} className="p-2 rounded-full hover:bg-gray-700"><FaTimes/></button><button onClick={playPause} className="p-2 rounded-full bg-[#1DB954] text-black"><FaPlay style={{ display: isPlaying ? 'none' : 'inline' }} /><FaPause style={{ display: isPlaying ? 'inline' : 'none' }} /></button><button onClick={skipNext} className="p-2 rounded-full hover:bg-gray-700"><FaMusic/></button></div></div><div className="w-full bg-[#0f0f0f] h-2 rounded-full mt-3 overflow-hidden"><div style={{ width: `${progress}%` }} className="h-2 rounded-full bg-[#1DB954]" /></div></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-0 left-0 w-full bg-[#0b0b0b] border-t border-gray-800 flex justify-around items-center py-2 z-40">
        <button className="flex flex-col items-center text-gray-400 hover:text-white text-xs gap-1" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><FaMusic className="text-xl"/><span>Home</span></button>
        <button className="flex flex-col items-center text-gray-400 hover:text-white text-xs gap-1" onClick={() => { setToastMessage('Favorites opened (mock)'); }}><FaHeart className="text-xl"/><span>Favorites</span></button>
        {/* --- MODIFIED FOOTER --- */}
        <button className="flex flex-col items-center text-gray-400 hover:text-white text-xs gap-1" onClick={() => setShowHistory(true)}><FaHistory className="text-xl"/><span>History</span></button>
        <button className="flex flex-col items-center text-gray-400 hover:text-white text-xs gap-1" onClick={() => { setToastMessage('Profile (mock)'); }}><FaUser className="text-xl"/><span>Profile</span></button>
      </footer>
    </main>
  );
}