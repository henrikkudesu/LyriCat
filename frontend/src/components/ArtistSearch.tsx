import React, { useState } from 'react';
import axios from 'axios';

interface Song {
  title: string;
  url: string;
}

interface ArtistSearchProps {
  onSongsFetched: (songs: Song[]) => void;
}

const ArtistSearch: React.FC<ArtistSearchProps> = ({ onSongsFetched }) => {
  const [artist, setArtist] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSearch = async () => {
    if (!artist.trim()) return;

    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        `/api/search_artist?artist=${encodeURIComponent(artist)}`
      );
      onSongsFetched(response.data.songs);
    } catch (err) {
      setError('Artista não encontrado ou erro na busca.');
      onSongsFetched([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          backgroundColor: '#333',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <input
          type="text"
          placeholder="Digite o nome do artista"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            border: 'none',
            padding: '10px 16px',
            fontSize: '16px',
            backgroundColor: 'transparent',
            color: 'white',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '10px 16px',
            border: 'none',
            backgroundColor: '#646cff',
            fontSize: '16px',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && <p style={{ color: '#ff6b6b', marginTop: '12px' }}>{error}</p>}
    </div>
  );
};

export default ArtistSearch;
