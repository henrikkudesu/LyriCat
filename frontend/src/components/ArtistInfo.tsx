import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ArtistInfoProps {
  artistName: string;
}

interface SpotifyArtist {
  id: string;
  name: string;
  image_url: string;
  genres: string[];
  popularity: number;
  followers: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  album_name: string;
  album_image: string;
  preview_url: string | null;
  spotify_url: string;
}

const ArtistInfo: React.FC<ArtistInfoProps> = ({ artistName }) => {
  const [artistInfo, setArtistInfo] = useState<SpotifyArtist | null>(null);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [error, setError] = useState('');
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  useEffect(() => {
    if (!artistName) return;

    let isMounted = true;

    const fetchArtistInfo = async () => {
      try {
        setLoading(true);
        setLoadingTracks(true); // Ativar loading das tracks
        setError('');

        // Fazer solicitação à nossa API melhorada
        const response = await axios.get(
          `/api/enhanced_search?artist=${encodeURIComponent(artistName)}`
        );

        if (!isMounted) return;

        if (response.data.spotify_info) {
          setArtistInfo(response.data.spotify_info);
        }

        if (response.data.spotify_top_tracks) {
          setTopTracks(response.data.spotify_top_tracks);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Erro ao buscar informações do artista:', err);
        setError(
          'Não foi possível obter informações do Spotify para este artista.'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingTracks(false); // Desativar loading das tracks quando terminar
        }
      }
    };

    fetchArtistInfo();

    // Cleanup function para evitar memory leaks
    return () => {
      isMounted = false;
    };
  }, [artistName]);

  const handlePlayPreview = (trackId: string, previewUrl: string | null) => {
    if (!previewUrl) return;

    if (playingTrack === trackId) {
      // Parar a reprodução
      const audioElement = document.getElementById(
        'preview-audio'
      ) as HTMLAudioElement;
      audioElement.pause();
      setPlayingTrack(null);
    } else {
      // Iniciar nova reprodução
      const audioElement = document.getElementById(
        'preview-audio'
      ) as HTMLAudioElement;
      audioElement.src = previewUrl;
      audioElement.play().catch((error) => {
        console.error('Erro ao reproduzir áudio:', error);
      });
      setPlayingTrack(trackId);
    }
  };

  // Spinner de carregamento
  const LoadingSpinner = () => (
    <div
      className="loading-spinner"
      style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        borderTop: '4px solid #646cff',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px auto',
      }}
    ></div>
  );

  if (loading) {
    return (
      <div
        style={{
          marginTop: '40px',
          marginBottom: '32px',
          background: '#333',
          borderRadius: '12px',
          padding: '32px 24px',
          textAlign: 'center',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        }}
      >
        <LoadingSpinner />
        <div>
          <p style={{ fontSize: '16px', margin: 0 }}>
            Carregando perfil e recomendações do artista...
          </p>
          <p style={{ fontSize: '14px', color: '#aaa', margin: '8px 0 0 0' }}>
            Buscando informações no Spotify
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return null; // Não exibir nada se houver erro
  }

  if (!artistInfo) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: '40px',
        marginBottom: '32px',
        background: '#333',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '24px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {artistInfo.image_url ? (
          <img
            src={artistInfo.image_url}
            alt={artistInfo.name}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '60px',
              objectFit: 'cover',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            }}
            loading="eager"
          />
        ) : (
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '60px',
              background: '#444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              color: '#aaa',
            }}
          >
            🎵
          </div>
        )}
        <div style={{ flex: '1', minWidth: '170px' }}>
          {' '}
          {/* Garante espaço mínimo */}
          <h2
            style={{ margin: '0 0 8px 0', fontSize: 'clamp(20px, 5vw, 28px)' }}
          >
            {' '}
            {/* Fonte responsiva */}
            {artistInfo.name}
          </h2>
          <p
            style={{
              margin: '0 0 8px 0',
              color: '#aaa',
              fontSize: 'clamp(12px, 3vw, 14px)',
            }}
          >
            {artistInfo.genres && artistInfo.genres.length > 0
              ? artistInfo.genres.slice(0, 3).join(', ')
              : 'Gênero não disponível'}
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap', // Permite quebra em mobile
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: 'clamp(12px, 3vw, 14px)', // Fonte responsiva
              }}
            >
              <span>👥</span>
              <span>
                {artistInfo.followers
                  ? artistInfo.followers.toLocaleString()
                  : 0}{' '}
                seguidores
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: 'clamp(12px, 3vw, 14px)', // Fonte responsiva
              }}
            >
              <span>🔥</span>
              <span>Popularidade: {artistInfo.popularity || 0}/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Área das músicas - com estado de carregamento */}
      {loadingTracks ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <LoadingSpinner />
          <p>Carregando músicas populares...</p>
        </div>
      ) : topTracks.length > 0 ? (
        <div>
          <h3
            style={{
              marginBottom: '16px',
              borderBottom: '1px solid #444',
              paddingBottom: '8px',
            }}
          >
            Músicas populares no Spotify
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              justifyContent: 'center', // Centraliza os cards
              justifyItems: 'center', // Centraliza cada item individual
            }}
          >
            {topTracks.slice(0, 6).map((track) => (
              <div
                key={track.id}
                style={{
                  background: '#444',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: track.preview_url ? 'pointer' : 'default',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  transform:
                    playingTrack === track.id ? 'translateY(-5px)' : 'none',
                  width: '100%', // Garantir largura correta mesmo quando centralizado
                  maxWidth: '150px', // Limitar largura máxima
                }}
                onClick={() =>
                  track.preview_url &&
                  handlePlayPreview(track.id, track.preview_url)
                }
                onMouseEnter={(e) => {
                  if (track.preview_url) {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow =
                      '0 6px 12px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (playingTrack !== track.id) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow =
                      '0 4px 8px rgba(0,0,0,0.2)';
                  }
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={track.album_image}
                    alt={track.name}
                    style={{
                      width: '100%',
                      height: '150px', // Reduzido para ficar mais compacto
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: '10px' }}>
                  <div
                    style={{
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: '14px',
                    }}
                  >
                    {track.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#aaa',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.album_name}
                  </div>
                </div>

                {/* Apenas o botão do Spotify */}
                {track.spotify_url && (
                  <a
                    href={track.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'center',
                      padding: '8px 0',
                      fontSize: '12px',
                      color: '#1DB954', // Cor do Spotify
                      textDecoration: 'none',
                      background: '#333',
                      transition: 'background 0.2s',
                      borderTop: '1px solid #555',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#3a3a3a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#333';
                    }}
                  >
                    Spotify
                  </a>
                )}
              </div>
            ))}
          </div>
          <audio
            id="preview-audio"
            onEnded={() => setPlayingTrack(null)}
          ></audio>

          {/* Rodapé com link para página do artista no Spotify */}
          {artistInfo && (
            <div
              style={{
                marginTop: '24px',
                textAlign: 'center',
                padding: '12px',
                borderTop: '1px solid #444',
              }}
            >
              <a
                href={`https://open.spotify.com/artist/${artistInfo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#1DB954',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: '#333',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#3a3a3a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#333';
                }}
              >
                <svg height="16" width="16" viewBox="0 0 24 24" fill="#1DB954">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Ver artista completo no Spotify
              </a>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: '#aaa',
            borderTop: '1px solid #444',
            marginTop: '20px',
          }}
        >
          Não foi possível carregar músicas do Spotify para este artista.
        </div>
      )}
    </div>
  );
};

export default ArtistInfo;
