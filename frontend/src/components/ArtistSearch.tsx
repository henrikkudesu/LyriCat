import React, { useState, useCallback } from 'react';
import axios from 'axios';

interface Song {
  title: string;
  url: string;
  image_url?: string;
}

interface ArtistSearchProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearchStart: () => void;
  onSongsFetched: (songs: Song[]) => void;
  onSearchSubmit: (term: string) => void; // Novo callback para notificar que a busca foi submetida
}

const ArtistSearch: React.FC<ArtistSearchProps> = ({
  searchTerm,
  onSearchTermChange,
  onSearchStart,
  onSongsFetched,
  onSearchSubmit,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;

    // Notificar o componente pai que a busca foi submetida
    onSearchSubmit(searchTerm);

    try {
      setLoading(true);
      setError('');
      onSearchStart(); // Notifica o componente pai que a busca iniciou

      const response = await axios.get(
        `/api/search_artist?artist=${encodeURIComponent(searchTerm)}`
      );
      onSongsFetched(response.data.songs);
    } catch (err) {
      console.error('Error searching artist:', err);
      setError('Artista não encontrado ou erro na busca.');
      onSongsFetched([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, onSearchStart, onSongsFetched, onSearchSubmit]);

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
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
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
            color: 'white',
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
