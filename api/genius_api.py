import os
import requests
import time
import unicodedata
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from .config import API_TIMEOUT, headers
import re

# Carregar variáveis do .env
load_dotenv()

# Configuração do Genius
GENIUS_API_TOKEN = os.getenv("GENIUS_API_TOKEN")
GENIUS_BASE_URL = "https://api.genius.com"

def normalize_term(term):
    """Normaliza o termo de busca removendo espaços extras, acentos e convertendo para minúsculas."""
    term = term.strip().lower()
    term = unicodedata.normalize("NFD", term)
    term = "".join(char for char in term if unicodedata.category(char) != "Mn")
    return term

def get_artist_id(artist_name):
    """Busca o ID do artista no Genius com maior flexibilidade."""
    headers = {"Authorization": f"Bearer {GENIUS_API_TOKEN}"}
    search_url = f"{GENIUS_BASE_URL}/search"
    params = {"q": artist_name}
    
    try:
        response = requests.get(search_url, headers=headers, params=params, timeout=API_TIMEOUT)
        if response.status_code == 200:
            hits = response.json().get("response", {}).get("hits", [])
            
            # Log para depuração - mais detalhado
            print(f"Resultados da API para '{artist_name}': {len(hits)} hits encontrados")
            
            # Primeiro, tenta encontrar correspondência exata com o nome do artista
            normalized_search = normalize_term(artist_name)
            for hit in hits:
                result = hit.get("result", {})
                artist = result.get("primary_artist", {})
                artist_name_from_api = artist.get("name", "")
                normalized_api_name = normalize_term(artist_name_from_api)
                
                # Verificar correspondência exata ou parcial
                if (normalized_search == normalized_api_name or 
                    normalized_search in normalized_api_name or 
                    normalized_api_name in normalized_search):
                    
                    print(f"Correspondência encontrada: '{artist_name_from_api}' (ID: {artist.get('id')})")
                    return artist.get("id")
            
            # Se não encontrou correspondência, pega o primeiro resultado se for relacionado
            if hits and artist_name.lower() in hits[0].get("result", {}).get("full_title", "").lower():
                first_hit = hits[0].get("result", {}).get("primary_artist", {})
                print(f"Usando melhor correspondência: '{first_hit.get('name')}' (ID: {first_hit.get('id')})")
                return first_hit.get("id")
                
            # Alternativa: usar o primeiro resultado de qualquer forma (opcional, com aviso)
            if hits:
                first_hit = hits[0].get("result", {}).get("primary_artist", {})
                print(f"AVISO: Usando resultado aproximado: '{first_hit.get('name')}' (ID: {first_hit.get('id')})")
                return first_hit.get("id")
                
            print(f"Nenhum artista encontrado para '{artist_name}'")
        else:
            print(f"Erro na API: Status {response.status_code}")
    except Exception as e:
        print(f"Erro ao buscar artista '{artist_name}': {str(e)}")
    
    return None

def get_artist_songs(artist_id, per_page=50, max_songs=100):
    """Obtém músicas de um artista com maior robustez e limites configuráveis."""
    headers = {"Authorization": f"Bearer {GENIUS_API_TOKEN}"}
    url = f"{GENIUS_BASE_URL}/artists/{artist_id}/songs"
    params = {
        "sort": "popularity", 
        "per_page": per_page
    }
    
    all_songs = []
    next_page = 1
    retries = 3
    
    try:
        # Loop para paginação e retentativas
        while next_page and len(all_songs) < max_songs:
            params["page"] = next_page
            
            # Retentativas em caso de falha temporária
            for attempt in range(retries):
                try:
                    print(f"Buscando página {next_page} de músicas para artista {artist_id}...")
                    response = requests.get(
                        url, 
                        headers=headers, 
                        params=params, 
                        timeout=API_TIMEOUT
                    )
                    response.raise_for_status()  # Lança exceção para códigos de erro HTTP
                    break
                except (requests.exceptions.RequestException, ConnectionError) as e:
                    if attempt < retries - 1:
                        wait_time = 2 ** attempt  # Backoff exponencial
                        print(f"Tentativa {attempt+1} falhou: {e}. Aguardando {wait_time}s...")
                        time.sleep(wait_time)
                    else:
                        raise
            
            if response.status_code != 200:
                print(f"Erro na API Genius: {response.status_code} - {response.text}")
                return all_songs if all_songs else None
                
            data = response.json()
            page_songs = data.get("response", {}).get("songs", [])
            
            if not page_songs:
                break
                
            # Adicionar apenas músicas primárias do artista (não participações)
            for song in page_songs:
                primary_artist = song.get("primary_artist", {})
                if primary_artist.get("id") == artist_id:
                    all_songs.append(song)
                    
                # Limitar número total de músicas
                if len(all_songs) >= max_songs:
                    break
            
            # Verificar se há próxima página
            next_page = data.get("response", {}).get("next_page")
        
        print(f"Recuperadas {len(all_songs)} músicas primárias para o artista {artist_id}")
        return all_songs
    except Exception as e:
        print(f"Erro ao buscar músicas do artista {artist_id}: {e}")
        # Retornar as músicas que já conseguimos obter, mesmo com erro
        return all_songs if all_songs else None

def is_valid_lyrics_container(div):
    """
    Retorna True se nenhuma das classes do div corresponde a um cabeçalho de letra.
    """
    classes = div.get("class", [])
    for cls in classes:
        if re.search(r'LyricsHeader', cls):
            return False
    return True

def fetch_lyrics_from_url(url):
    """Extrai a letra completa da página do Genius, evitando headers indesejados."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/91.0.4472.124 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Tenta primeiro com data-lyrics-container
        lyrics_divs = soup.find_all("div", attrs={"data-lyrics-container": "true"})
        
        # Caso não encontre, usa seletor CSS com filtragem via função auxiliar
        if not lyrics_divs:
            lyrics_divs = soup.select("div[class^='Lyrics__Container-']")
            lyrics_divs = [div for div in lyrics_divs if is_valid_lyrics_container(div)]
        
        if lyrics_divs:
            lyrics = "\n".join(div.get_text(separator="\n") for div in lyrics_divs)
            return lyrics.strip()
    return None

# Essa função busca  pela tag Lyrics__Container-sc-e3d9a1f6-1, um valor fixo, porém, aparentemente ela é dinâmica e muda de tempos em tempos. A função acima obtém a tag correta.
#def fetch_lyrics_from_url(url):
#    """Extrai a letra completa da página do Genius."""
#    headers = {
#        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
#    }
#    response = requests.get(url, headers=headers)
#    if response.status_code == 200:
#        soup = BeautifulSoup(response.text, "html.parser")
#        lyrics_divs = soup.find_all("div", class_="Lyrics__Container-sc-e3d9a1f6-1")
#        if lyrics_divs:
#            lyrics = "\n".join(div.get_text(separator="\n") for div in lyrics_divs)
#            return lyrics.strip()
#    return None