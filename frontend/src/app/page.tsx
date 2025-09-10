import { useState } from 'react';

export default function Home() {
  const [mood, setMood] = useState('');

  const handleGetPlaylist = () => {
    // We will connect this to the backend later
    if (!mood) {
      alert('Please tell us how you are feeling!');
      return;
    }
    console.log('User mood:', mood);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="text-center w-full max-w-lg">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Moodify
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          Tell us your mood. We'll craft the perfect playlist.
        </p>

        <div className="mt-12">
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="How are you feeling right now?"
            className="w-full px-6 py-4 text-lg text-white bg-gray-800 border-2 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
          <button
            onClick={handleGetPlaylist}
            className="w-full mt-6 px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:opacity-90 transition-opacity"
          >
            Generate Playlist 🎵
          </button>
        </div>
      </div>
    </main>
  );
}