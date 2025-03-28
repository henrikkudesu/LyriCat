# Projeto: Busca e Análise de Letras de Músicas 🎵

Este projeto é uma aplicação web que permite aos usuários buscar informações sobre artistas, visualizar letras de músicas, traduzi-las para o português e obter explicações detalhadas sobre o significado das letras. Ele combina uma API backend em Python com um frontend moderno em React para oferecer uma experiência rica e interativa.

## Funcionalidades Principais

- **Busca de Artistas**: Pesquise informações detalhadas sobre artistas usando a API do Spotify.
- **Letras de Músicas**: Visualize letras de músicas obtidas do Genius.
- **Tradução**: Traduza letras de músicas para o português usando o modelo Gemini.
- **Explicação**: Obtenha explicações detalhadas sobre o significado das letras.
- **Cache Inteligente**: Reduza chamadas desnecessárias às APIs externas com um sistema de cache eficiente.

---

## Tecnologias Utilizadas

### Backend

- **Linguagem**: Python
- **Framework**: Flask
- **APIs Externas**:
  - Spotify API (para informações de artistas e músicas)
  - Genius API (para busca e letras de músicas)
  - Google Gemini API (para tradução e explicação de letras)
- **Bibliotecas**:
  - `requests`: Para chamadas HTTP.
  - `dotenv`: Para gerenciamento de variáveis de ambiente.
  - `BeautifulSoup`: Para extração de letras diretamente de páginas HTML.
  - `Flask-Limiter`: Para limitar o número de requisições por usuário.
  - `hashlib` e `json`: Para manipulação de cache.

### Frontend

- **Linguagem**: TypeScript
- **Framework**: React
- **Ferramentas**:
  - **Vite**: Para desenvolvimento rápido e eficiente.
  - **ReactMarkdown**: Para renderizar explicações e traduções em formato Markdown.
  - **Axios**: Para comunicação com a API backend.
- **Estilização**:
  - Estilos inline e customizados para uma interface moderna e responsiva.

### Infraestrutura

- **Gerenciamento de Dependências**:
  - Backend: `pip` e `requirements.txt`
  - Frontend: `npm` e `package.json`
- **Cache**:
  - Arquivos JSON para armazenar dados temporários, como letras, traduções e explicações.
