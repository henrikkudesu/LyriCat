import React, { useState } from 'react';
import ArtistSearch from './components/ArtistSearch';
import SongList from './components/SongList';
import LyricsView from './components/LyricsView';
import ArtistInfo from './components/ArtistInfo';

interface Song {
  title: string;
  url: string;
  image_url?: string;
}

const App: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongUrl, setSelectedSongUrl] = useState<string>('');
  const [currentArtist, setCurrentArtist] = useState<string>('');

  const handleBackToList = () => {
    setSelectedSongUrl('');
  };

  const handleArtistSearch = (artist: string, songs: Song[]) => {
    setSongs(songs);
    setCurrentArtist(artist);
  };

  // Modo de visualização de letra em tela cheia ou lista de músicas
  const isViewingLyrics = !!selectedSongUrl;

  return (
    <div style={{ minHeight: '100vh', width: '100%' }}>
      {!isViewingLyrics ? (
        // Visualização da lista de músicas
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>
            Busca de Letras de Músicas
          </h1>

          <ArtistSearch
            onSongsFetched={(songs) =>
              handleArtistSearch(
                // O componente ArtistSearch precisa ser modificado para passar o nome do artista
                // junto com as músicas. Aqui estou assumindo que artist é o valor do input
                // mas você pode precisar adaptar esta linha
                (
                  document.querySelector(
                    'input[type="text"]'
                  ) as HTMLInputElement
                )?.value || '',
                songs
              )
            }
          />

          {currentArtist && songs.length > 0 && (
            <ArtistInfo artistName={currentArtist} />
          )}

          {songs.length > 0 ? (
            <div style={{ marginTop: '32px' }}>
              <SongList songs={songs} onSelectSong={setSelectedSongUrl} />
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                marginTop: '80px',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <p>Digite o nome de um artista para buscar suas músicas.</p>
            </div>
          )}
        </div>
      ) : (
        // Visualização da letra em tela cheia
        <LyricsView songUrl={selectedSongUrl} onBackClick={handleBackToList} />
      )}
    </div>
  );
};

export default App;
