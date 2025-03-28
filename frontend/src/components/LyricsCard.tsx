import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LyricsCardProps {
  songUrl: string;
}

const LyricsCard: React.FC<LyricsCardProps> = ({ songUrl }) => {
  const [lyrics, setLyrics] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchLyrics = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await axios.get(
          `/api/get_lyrics?url=${encodeURIComponent(songUrl)}`
        );

        setLyrics(response.data.lyrics);
      } catch (err) {
        console.error('Error fetching lyrics:', err);
        setError('Não foi possível carregar a letra da música.');
      } finally {
        setLoading(false);
      }
    };

    if (songUrl) {
      fetchLyrics();
    }
  }, [songUrl]);

  if (loading) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#333',
          borderRadius: '8px',
        }}
      >
        <p>Carregando letra...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#333',
          borderRadius: '8px',
        }}
      >
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#333',
        borderRadius: '8px',
        maxHeight: '600px',
        overflowY: 'auto',
      }}
    >
      <h2>Letra da Música</h2>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          textAlign: 'left',
          fontFamily: 'inherit',
          fontSize: '1rem',
        }}
      >
        {lyrics || 'Nenhuma letra disponível'}
      </pre>
    </div>
  );
};

export default LyricsCard;
