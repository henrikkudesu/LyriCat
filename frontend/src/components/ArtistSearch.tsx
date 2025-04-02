import React, { useState, useCallback, useEffect } from 'react';
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
  onSearchSubmit: (term: string) => void;
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
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isVerySmall, setIsVerySmall] = useState<boolean>(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsVerySmall(window.innerWidth <= 400);
    };

    // Verificar inicialmente
    checkScreenSize();

    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

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
    <div
      style={{
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto',
        padding: isMobile ? '0 16px' : '0',
      }}
    >
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
          placeholder={
            isVerySmall ? 'Nome do artista' : 'Digite o nome do artista'
          }
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            border: 'none',
            padding: isMobile ? '10px 12px' : '10px 16px',
            fontSize: isMobile ? '15px' : '16px',
            backgroundColor: 'transparent',
            color: 'white',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: isVerySmall
              ? '10px 12px'
              : isMobile
              ? '10px 14px'
              : '10px 16px',
            border: 'none',
            backgroundColor: '#646cff',
            fontSize: isMobile ? '15px' : '16px',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            color: 'white',
            whiteSpace: 'nowrap',
            minWidth: isVerySmall ? '64px' : '80px',
            flexShrink: 0,
            flexBasis: isVerySmall ? '64px' : '80px',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {loading ? (
            isVerySmall ? (
              '...'
            ) : (
              'Buscando...'
            )
          ) : isVerySmall ? (
            <span
              style={{
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '18px',
                lineHeight: 1,
                height: '18px',
                width: '18px',
              }}
            >
              🔍
            </span>
          ) : (
            'Buscar'
          )}
        </button>
      </div>

      {error && (
        <p
          style={{
            color: '#ff6b6b',
            marginTop: '12px',
            fontSize: isMobile ? '14px' : '16px',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default ArtistSearch;
