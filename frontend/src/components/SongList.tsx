import React, { useState, useEffect } from 'react';

interface Song {
  title: string;
  url: string;
  image_url?: string;
}

interface SongListProps {
  songs: Song[];
  onSelectSong: (url: string) => void;
}

const SongList: React.FC<SongListProps> = ({ songs, onSelectSong }) => {
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadMore = () => {
    setVisibleCount((prev) => prev + 12);
  };

  // Filtrar músicas com base no termo de pesquisa
  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleSongs = filteredSongs.slice(0, visibleCount);
  const hasMoreSongs = visibleCount < filteredSongs.length;

  // Extrair o nome do artista da URL da música
  const getArtistName = (songTitle: string): string => {
    const parts = songTitle.split('-');
    return parts.length > 1 ? parts[0].trim() : 'Artista';
  };

  // Extrair o título da música
  const getSongTitle = (songTitle: string): string => {
    const parts = songTitle.split('-');
    return parts.length > 1 ? parts.slice(1).join('-').trim() : songTitle;
  };

  // Lidar com erros de carregamento de imagem
  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  // Resetar visibleCount quando o termo de pesquisa muda
  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm]);

  return (
    <div className="songs-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2>Músicas Encontradas</h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#444',
            borderRadius: '20px',
            padding: '8px 16px',
            width: '240px',
          }}
        >
          <span style={{ marginRight: '8px', opacity: 0.7 }}>🔍</span>
          <input
            type="text"
            placeholder="Filtrar músicas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              width: '100%',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '0 4px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredSongs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            margin: '40px 0',
            color: '#aaa',
          }}
        >
          {searchTerm ? (
            <p>Nenhuma música encontrada para "{searchTerm}"</p>
          ) : (
            <p>Nenhuma música disponível</p>
          )}
        </div>
      ) : (
        <div
          className="song-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          {visibleSongs.map((song, index) => (
            <div
              key={index}
              className="song-card"
              style={{
                backgroundColor: '#333',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                height: '100%',
                transform: hoveredIndex === index ? 'translateY(-5px)' : 'none',
                boxShadow:
                  hoveredIndex === index
                    ? '0 8px 16px rgba(0,0,0,0.3)'
                    : '0 4px 12px rgba(0,0,0,0.2)',
              }}
              onClick={() => onSelectSong(song.url)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="song-image"
                style={{
                  height: '160px',
                  backgroundColor: '#555',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundImage:
                    song.image_url && !imageErrors[index]
                      ? `url(${song.image_url})`
                      : 'none',
                }}
              >
                {(!song.image_url || imageErrors[index]) && (
                  <div style={{ fontSize: '48px', opacity: 0.6 }}>🎵</div>
                )}
                {song.image_url && !imageErrors[index] && (
                  <img
                    src={song.image_url}
                    alt={`Capa de ${song.title}`}
                    style={{ display: 'none' }}
                    onError={() => handleImageError(index)}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '4px 8px',
                    borderTopLeftRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  Ver letra
                </div>
              </div>
              <div className="song-info" style={{ padding: '16px' }}>
                <h4
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {getSongTitle(song.title)}
                </h4>
                <p
                  style={{
                    margin: '0',
                    fontSize: '14px',
                    color: '#aaa',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {getArtistName(song.title)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMoreSongs && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '32px 0 16px',
          }}
        >
          <button
            onClick={loadMore}
            style={{
              padding: '10px 24px',
              backgroundColor: '#464646',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#555')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#464646')
            }
          >
            Carregar mais ({filteredSongs.length - visibleCount} restantes)
          </button>
        </div>
      )}
    </div>
  );
};

export default SongList;
