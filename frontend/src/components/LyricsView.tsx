import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface LyricsViewProps {
  songUrl: string;
  onBackClick: () => void;
}

const LyricsView: React.FC<LyricsViewProps> = ({ songUrl, onBackClick }) => {
  const [lyrics, setLyrics] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingAI, setProcessingAI] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [songInfo, setSongInfo] = useState<{ title: string; artist: string }>({
    title: '',
    artist: '',
  });

  useEffect(() => {
    const fetchLyrics = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await axios.get(
          `/api/get_lyrics?url=${encodeURIComponent(songUrl)}`
        );

        setLyrics(response.data.lyrics);

        // Extrair informações da música da URL
        const urlParts = songUrl.split('/');
        const titlePart = urlParts[urlParts.length - 1]
          .replace('-lyrics', '')
          .replace(/-/g, ' ');

        // Tenta extrair artista e título
        const matches = titlePart.match(/([^-]+)\s+([^-]+.*)/);
        if (matches && matches.length > 2) {
          setSongInfo({
            artist: matches[1].trim(),
            title: matches[2].trim(),
          });
        } else {
          setSongInfo({
            artist: 'Artista',
            title: titlePart,
          });
        }
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

  const handleTranslate = async () => {
    if (processingAI) return;

    setProcessingAI(true);
    setIsExplaining(false);

    try {
      const response = await axios.post('/api/translate', { lyrics });
      setTranslation(response.data.translation);
    } catch (error) {
      console.error('Erro ao traduzir:', error);
      setTranslation('Erro ao traduzir a letra. Por favor, tente novamente.');
    } finally {
      setProcessingAI(false);
    }
  };

  const handleExplain = async () => {
    if (processingAI) return;

    setProcessingAI(true);
    setIsExplaining(true);

    try {
      const response = await axios.post('/api/explain', { lyrics });
      setTranslation(response.data.explanation);
    } catch (error) {
      console.error('Erro ao explicar:', error);
      setTranslation(
        'Erro ao gerar explicação da letra. Por favor, tente novamente.'
      );
    } finally {
      setProcessingAI(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: '#242424',
        }}
      >
        <div
          className="loading-spinner"
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            borderTop: '4px solid #646cff',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
          }}
        ></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div>Carregando letra...</div>
        <button
          onClick={onBackClick}
          style={{
            background: 'none',
            border: '1px solid #666',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '16px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Voltar à lista
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: '#242424',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>😕</div>
        <div style={{ fontSize: '18px', marginBottom: '16px' }}>{error}</div>
        <button
          onClick={onBackClick}
          style={{
            background: '#464646',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#555';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#464646';
          }}
        >
          Voltar à lista
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: '#242424',
        minHeight: '100vh',
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px',
          borderBottom: '1px solid #333',
          paddingBottom: '16px',
        }}
      >
        <button
          onClick={onBackClick}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: '#aaa',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#aaa';
          }}
        >
          ←
        </button>
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '26px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {songInfo.title}
          </h1>
          <p
            style={{
              margin: '4px 0 0 0',
              color: '#aaa',
              fontSize: '16px',
            }}
          >
            {songInfo.artist}
          </p>
        </div>
      </div>

      {/* Botões de ação em container centralizado */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '32px',
        }}
      >
        <button
          onClick={handleTranslate}
          disabled={processingAI}
          style={{
            padding: '12px 24px',
            backgroundColor: !isExplaining && translation ? '#646cff' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: processingAI ? 'wait' : 'pointer',
            opacity: processingAI ? 0.7 : 1,
            transition: 'all 0.2s',
            fontSize: '15px',
            fontWeight: 'bold',
          }}
          onMouseEnter={(e) => {
            if (!processingAI && (!translation || isExplaining)) {
              e.currentTarget.style.backgroundColor = '#444';
            }
          }}
          onMouseLeave={(e) => {
            if (!processingAI && (!translation || isExplaining)) {
              e.currentTarget.style.backgroundColor = '#333';
            }
          }}
        >
          {processingAI && !isExplaining ? 'Traduzindo...' : 'Traduzir'}
        </button>
        <button
          onClick={handleExplain}
          disabled={processingAI}
          style={{
            padding: '12px 24px',
            backgroundColor: isExplaining ? '#646cff' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: processingAI ? 'wait' : 'pointer',
            opacity: processingAI ? 0.7 : 1,
            transition: 'all 0.2s',
            fontSize: '15px',
            fontWeight: 'bold',
          }}
          onMouseEnter={(e) => {
            if (!processingAI && (!translation || !isExplaining)) {
              e.currentTarget.style.backgroundColor = '#444';
            }
          }}
          onMouseLeave={(e) => {
            if (!processingAI && (!translation || !isExplaining)) {
              e.currentTarget.style.backgroundColor = '#333';
            }
          }}
        >
          {processingAI && isExplaining ? 'Analisando...' : 'Explicar Letra'}
        </button>
      </div>

      {/* Layout de duas colunas com sombras e melhor espaçamento */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: translation || processingAI ? '1fr 1fr' : '1fr',
          gap: '32px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Coluna da letra original */}
        <div
          style={{
            backgroundColor: '#333',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.5s ease-out',
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: '20px',
              color: '#eee',
              fontSize: '22px',
              borderBottom: '1px solid #444',
              paddingBottom: '10px',
            }}
          >
            Letra Original
          </h2>
          <div
            style={{
              maxHeight: 'calc(100vh - 280px)',
              overflowY: 'auto',
              paddingRight: '16px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#555 #333',
            }}
            className="custom-scrollbar"
          >
            <style>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #333;
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #555;
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #666;
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: '16px',
                lineHeight: '1.8',
                margin: 0,
                color: '#ddd',
              }}
            >
              {lyrics || 'Nenhuma letra disponível'}
            </pre>
          </div>
        </div>

        {/* Coluna da tradução/explicação */}
        {translation ? (
          <div
            style={{
              backgroundColor: '#333',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
              animation: 'fadeIn 0.5s ease-out',
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: '20px',
                color: '#eee',
                fontSize: '22px',
                borderBottom: '1px solid #444',
                paddingBottom: '10px',
              }}
            >
              {isExplaining ? 'Explicação' : 'Tradução'}
            </h2>
            <div
              style={{
                maxHeight: 'calc(100vh - 280px)',
                overflowY: 'auto',
                paddingRight: '16px',
              }}
              className="custom-scrollbar"
            >
              {isExplaining ? (
                <div
                  className="markdown-content"
                  style={{
                    color: '#ddd',
                    fontSize: '16px',
                    lineHeight: '1.8',
                  }}
                >
                  <ReactMarkdown>{translation}</ReactMarkdown>
                  <style>{`
                    .markdown-content h1, 
                    .markdown-content h2, 
                    .markdown-content h3 {
                      color: #fff;
                      margin-top: 24px;
                      margin-bottom: 16px;
                    }
                    .markdown-content h1 { font-size: 22px; }
                    .markdown-content h2 { font-size: 20px; }
                    .markdown-content h3 { font-size: 18px; }
                    .markdown-content p { margin-bottom: 16px; }
                    .markdown-content strong { color: #fff; }
                    .markdown-content blockquote {
                      border-left: 3px solid #646cff;
                      padding-left: 16px;
                      margin-left: 0;
                      color: #bbb;
                      font-style: italic;
                    }
                    .markdown-content ul, .markdown-content ol {
                      padding-left: 24px;
                    }
                    .markdown-content li {
                      margin-bottom: 8px;
                    }
                    .markdown-content code {
                      background: #444;
                      padding: 2px 5px;
                      border-radius: 4px;
                      font-family: monospace;
                    }
                  `}</style>
                </div>
              ) : (
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '16px',
                    lineHeight: '1.8',
                    margin: 0,
                    color: '#ddd',
                  }}
                >
                  {translation}
                </pre>
              )}
            </div>
          </div>
        ) : (
          processingAI && (
            <div
              style={{
                backgroundColor: '#333',
                borderRadius: '12px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                animation: 'fadeIn 0.5s ease-out',
              }}
            >
              <div
                className="loading-spinner"
                style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  borderTop: '4px solid #646cff',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '20px',
                }}
              ></div>
              <p style={{ fontSize: '16px', color: '#ddd' }}>
                {isExplaining
                  ? 'A IA está analisando a letra...'
                  : 'A IA está traduzindo a letra...'}
              </p>
              <p
                style={{
                  fontSize: '14px',
                  color: '#999',
                  marginTop: '12px',
                  textAlign: 'center',
                }}
              >
                Isso pode levar alguns segundos, dependendo do tamanho da letra.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default LyricsView;
