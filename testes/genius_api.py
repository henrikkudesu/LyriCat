import os
import requests
import unicodedata
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv()

# Configuração do Genius
GENIUS_API_TOKEN = os.getenv("GENIUS_API_TOKEN")
GENIUS_BASE_URL = "https://api.genius.com"

def normalize_term(term):
    """Normaliza o termo de busca removendo espaços extras, acentos e convertendo para minúsculas."""
    term = term.strip().lower()
    # Remover acentos
    term = unicodedata.normalize("NFD", term)
    term = "".join(char for char in term if unicodedata.category(char) != "Mn")
    return term

def search_genius(term):
    """Busca músicas no Genius usando a API e retorna os links das músicas encontradas."""
    headers = {"Authorization": f"Bearer {GENIUS_API_TOKEN}"}
    search_url = f"{GENIUS_BASE_URL}/search"
    params = {"q": term}  # Termo de busca (nome da música ou artista)
    
    response = requests.get(search_url, headers=headers, params=params)
    
    if response.status_code == 200:
        hits = response.json().get("response", {}).get("hits", [])
        if not hits:
            print("Nenhum resultado encontrado na API do Genius.")
            return []
        
        # Filtrar e ordenar os resultados
        filtered_hits = filter_results(hits, term)
        sorted_hits = sort_results_by_relevance(filtered_hits, term)
        
        # Extrair links das músicas
        song_links = []
        for hit in sorted_hits:
            song_title = hit["result"]["title"]
            artist_name = hit["result"]["primary_artist"]["name"]
            song_url = hit["result"]["url"]
            song_links.append({"title": song_title, "artist": artist_name, "url": song_url})
        
        return song_links
    else:
        print(f"Erro na API do Genius: {response.status_code} - {response.text}")
        return []

def filter_results(hits, term):
    """Filtra os resultados para exibir apenas os mais relevantes."""
    term = normalize_term(term)
    filtered_hits = []
    for hit in hits:
        song_title = normalize_term(hit["result"]["title"])
        artist_name = normalize_term(hit["result"]["primary_artist"]["name"])
        if term in song_title or term in artist_name:
            filtered_hits.append(hit)
    return filtered_hits

def sort_results_by_relevance(hits, term):
    """Ordena os resultados por relevância."""
    term = normalize_term(term)
    for hit in hits:
        hit["relevance"] = 0
        song_title = normalize_term(hit["result"]["title"])
        artist_name = normalize_term(hit["result"]["primary_artist"]["name"])
        if term in song_title:
            hit["relevance"] += 2  # Maior peso para correspondência no título
        if term in artist_name:
            hit["relevance"] += 1  # Menor peso para correspondência no artista
    return sorted(hits, key=lambda x: x["relevance"], reverse=True)

def fetch_lyrics_from_url(url):
    """Extrai a letra completa da página do Genius."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, "html.parser")
        # Tentar encontrar a letra na classe "Lyrics__Container"
        lyrics_divs = soup.find_all("div", class_="Lyrics__Container-sc-926d9e10-1")
        if lyrics_divs:
            lyrics = "\n".join(div.get_text(separator="\n") for div in lyrics_divs)
            return lyrics.strip()
        print("Não foi possível encontrar a letra na página.")
        return None
    else:
        print(f"Erro ao acessar a página do Genius: {response.status_code}")
        return None

# Exemplo de uso
if __name__ == "__main__":
    term = input("Digite o termo de busca (nome da música ou artista): ")
    print(f"Buscando por: {term}")
    song_links = search_genius(term)
    
    if song_links:
        print(f"Resultados encontrados ({len(song_links)}):")
        for i, song in enumerate(song_links, 1):
            print(f"{i}. {song['title']} - {song['artist']} ({song['url']})")
        
        # Perguntar ao usuário qual música deseja extrair
        choice = int(input("Escolha o número da música para extrair a letra: "))
        if 1 <= choice <= len(song_links):
            lyrics = fetch_lyrics_from_url(song_links[choice - 1]["url"])
            if lyrics:
                print("\nLetra da música:\n")
                print(lyrics)
            else:
                print("Não foi possível extrair a letra.")
        else:
            print("Escolha inválida.")
    else:
        print("Nenhum resultado encontrado.")