import React, { useState, useEffect } from 'react';
import ArtistSearch from './components/ArtistSearch';
import SongList from './components/SongList';
import LyricsView from './components/LyricsView';
import ArtistInfo from './components/ArtistInfo';
import catGuitarLogo from './assets/cat-guitar.png';
import axios from 'axios';

interface Song {
  title: string;
  url: string;
  image_url?: string;
}

const App: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongUrl, setSelectedSongUrl] = useState<string>('');
  const [currentArtist, setCurrentArtist] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Carregar buscas recentes do localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    // Função para verificar e atualizar o estado conforme o tamanho da tela
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Verificar inicialmente
    checkIsMobile();

    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const handleBackToList = () => {
    setSelectedSongUrl('');
  };

  const handleArtistSearch = (artist: string, songs: Song[]) => {
    setSongs(songs);
    setCurrentArtist(artist);
    setIsLoading(false);

    // Adicionar à lista de buscas recentes
    if (artist && !recentSearches.includes(artist)) {
      const updatedSearches = [artist, ...recentSearches.slice(0, 4)];
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    }
  };

  const handleSearchStart = () => {
    setIsLoading(true);
  };

  const handleRecentSearchClick = (search: string) => {
    // Atualizar o termo de busca
    setSearchTerm(search);

    // Iniciar o carregamento
    setIsLoading(true);

    // Fazer a requisição diretamente
    axios
      .get(`/api/search_artist?artist=${encodeURIComponent(search)}`)
      .then((response) => {
        // Atualizar o estado com os resultados
        setSongs(response.data.songs || []);
        setCurrentArtist(search);
        setIsLoading(false);

        // Atualizar buscas recentes se necessário
        if (search && !recentSearches.includes(search)) {
          const updatedSearches = [search, ...recentSearches.slice(0, 4)];
          setRecentSearches(updatedSearches);
          localStorage.setItem(
            'recentSearches',
            JSON.stringify(updatedSearches)
          );
        }
      })
      .catch((err) => {
        console.error('Error searching artist:', err);
        setIsLoading(false);
        setSongs([]);
      });
  };

  const isViewingLyrics = !!selectedSongUrl;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #121212 0%, #2a2a2a 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Conteúdo principal que cresce para empurrar o footer para baixo */}
      <div style={{ flex: '1 0 auto' }}>
        {!isViewingLyrics ? (
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: isMobile ? '16px' : '20px',
              animation: 'fadeIn 0.5s ease-in-out',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: isMobile ? '30px' : '40px',
                gap: '16px',
                padding: isMobile ? '16px 0' : '20px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <img
                src={catGuitarLogo}
                alt="Logo LyriCat"
                style={{
                  height: isMobile ? '70px' : '80px',
                  filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))',
                  transition: 'transform 0.3s',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = 'scale(1.05)')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = 'scale(1)')
                }
                onClick={() => {
                  setSearchTerm('');
                  setSongs([]);
                  setCurrentArtist('');
                }}
              />
              <h1
                style={{
                  margin: 0,
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 800,
                  background:
                    'linear-gradient(90deg, #9D50BB 0%, #6E48AA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: isMobile ? '2rem' : '2.5rem',
                }}
              >
                LyriCat
              </h1>
            </div>

            <div
              style={{
                background: 'rgba(0,0,0,0.2)',
                padding: isMobile ? '20px' : '24px',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                marginBottom: isMobile ? '24px' : '30px',
              }}
            >
              <ArtistSearch
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onSearchStart={handleSearchStart}
                onSongsFetched={(songs) =>
                  handleArtistSearch(searchTerm, songs)
                }
                onSearchSubmit={(term) => {
                  // Atualizar o título da página para refletir a pesquisa
                  document.title = term
                    ? `${term} - LyriCat`
                    : 'LyriCat - Busca de Letras';

                  // Opcional: atualizar URL para permitir compartilhamento
                  const url = new URL(window.location.href);
                  if (term) {
                    url.searchParams.set('q', term);
                  } else {
                    url.searchParams.delete('q');
                  }
                  window.history.pushState({}, '', url);
                }}
              />

              {/* Sempre mostrar as buscas recentes */}
              {recentSearches.length > 0 && (
                <div
                  style={{
                    marginTop: '16px',
                    textAlign: isMobile ? 'center' : 'left',
                  }}
                >
                  <p
                    style={{
                      fontSize: '14px',
                      opacity: 0.7,
                      marginBottom: isMobile ? '12px' : '8px',
                    }}
                  >
                    Buscas recentes:
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      justifyContent: isMobile ? 'center' : 'flex-start',
                    }}
                  >
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleRecentSearchClick(search)}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          borderRadius: '16px',
                          padding: '6px 12px',
                          fontSize: '13px',
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(255,255,255,0.2)')
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(255,255,255,0.1)')
                        }
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isLoading ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: isMobile ? '30px' : '40px',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(255,255,255,0.2)',
                    borderTop: '3px solid rgba(255,255,255,0.8)',
                    borderRadius: '50%',
                    margin: '0 auto 20px',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <p>Buscando músicas...</p>
              </div>
            ) : (
              <>
                {currentArtist && songs.length > 0 && (
                  <ArtistInfo artistName={currentArtist} />
                )}

                {songs.length > 0 ? (
                  <div
                    style={{
                      marginTop: isMobile ? '24px' : '32px',
                      background: 'rgba(0,0,0,0.2)',
                      padding: isMobile ? '20px' : '24px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }}
                  >
                    <SongList songs={songs} onSelectSong={setSelectedSongUrl} />
                  </div>
                ) : (
                  !isLoading && (
                    <div
                      style={{
                        textAlign: 'center',
                        marginTop: isMobile ? '60px' : '80px',
                        color: 'rgba(255,255,255,0.6)',
                        padding: isMobile ? '40px 16px' : '60px 20px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                      }}
                    >
                      <p style={{ fontSize: isMobile ? '16px' : '18px' }}>
                        Digite o nome de um artista para buscar suas músicas.
                      </p>
                      <p
                        style={{
                          fontSize: isMobile ? '13px' : '14px',
                          marginTop: '10px',
                          opacity: 0.7,
                        }}
                      >
                        Explore letras, descubra significados e aprofunde-se nas
                        suas músicas favoritas.
                      </p>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        ) : (
          <LyricsView
            songUrl={selectedSongUrl}
            onBackClick={handleBackToList}
          />
        )}
      </div>

      {/* Footer responsivo */}
      <footer
        style={{
          width: '100%',
          padding: isMobile ? '16px 12px' : '16px 0',
          textAlign: 'center',
          fontSize: isMobile ? '13px' : '14px',
          color: 'rgba(255,255,255,0.6)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)',
          flexShrink: 0,
          marginTop: 'auto', // Isso garante que o footer fique sempre na parte inferior
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '10px' : '8px',
          }}
        >
          <span>Desenvolvido por Leonardo Nascimento</span>
          <a
            href="https://github.com/henrikkudesu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#646cff',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#868eff')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#646cff')}
          >
            <svg
              height={isMobile ? '18' : '20'}
              width={isMobile ? '18' : '20'}
              viewBox="0 0 16 16"
              style={{ fill: 'currentColor' }}
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            henrikkudesu
          </a>
        </div>
      </footer>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default App;
