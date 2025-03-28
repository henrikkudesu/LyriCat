from flask import request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from .genius_api import get_artist_id, get_artist_songs, fetch_lyrics_from_url
from .spotify_api import search_artist_info, get_artist_top_tracks
from .config import API_TIMEOUT
from . import app
import os
import requests
import hashlib
import json
import time
from pathlib import Path
from google import genai
from google.genai import types

# Configuração do Limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Configurações de cache
CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)
TRANSLATE_CACHE_FILE = CACHE_DIR / "translate_cache.json"
EXPLAIN_CACHE_FILE = CACHE_DIR / "explain_cache.json"
LYRICS_CACHE_FILE = CACHE_DIR / "lyrics_cache.json"
SPOTIFY_CACHE_FILE = CACHE_DIR / "spotify_cache.json"
ARTIST_SEARCH_CACHE_FILE = CACHE_DIR / "artist_search_cache.json"
ENHANCED_SEARCH_CACHE_FILE = CACHE_DIR / "enhanced_search_cache.json"

CACHE_EXPIRY = {
    "translate": 60 * 24 * 60 * 60,  # 60 dias
    "explain": 60 * 24 * 60 * 60,    # 60 dias
    "lyrics": 30 * 24 * 60 * 60,     # 30 dias
    "artist": 7 * 24 * 60 * 60,      # 7 dias
    "spotify": 3 * 24 * 60 * 60,     # 3 dias
    "enhanced": 3 * 24 * 60 * 60     # 3 dias
}

# Funções auxiliares para cache
def load_file_cache(file_path):
    if file_path.exists():
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Erro ao carregar cache: {e}")
    return {}

def save_file_cache(cache_data, file_path):
    try:
        file_path.parent.mkdir(exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Erro ao salvar cache: {e}")

# Carregar caches do disco
translate_file_cache = load_file_cache(TRANSLATE_CACHE_FILE)
explain_file_cache = load_file_cache(EXPLAIN_CACHE_FILE)
lyrics_file_cache = load_file_cache(LYRICS_CACHE_FILE)
spotify_file_cache = load_file_cache(SPOTIFY_CACHE_FILE)
artist_search_cache = load_file_cache(ARTIST_SEARCH_CACHE_FILE)
enhanced_search_cache = load_file_cache(ENHANCED_SEARCH_CACHE_FILE)

# Função para gerar hash
def generate_hash(value):
    return hashlib.md5(value.encode()).hexdigest()

# Função para formatar respostas
def format_response(success, payload=None, error=None):
    """
    Se success=True, envia o payload diretamente; caso contrário, envia uma mensagem de erro.
    """
    if success:
        return jsonify(payload)
    else:
        return jsonify({"error": error})

# Função para limpar caches antigos
def clean_old_cache_entries():
    now = time.time()
    caches = [
        (translate_file_cache, TRANSLATE_CACHE_FILE, "translate"),
        (explain_file_cache, EXPLAIN_CACHE_FILE, "explain"),
        (lyrics_file_cache, LYRICS_CACHE_FILE, "lyrics"),
        (spotify_file_cache, SPOTIFY_CACHE_FILE, "spotify"),
        (artist_search_cache, ARTIST_SEARCH_CACHE_FILE, "artist"),
        (enhanced_search_cache, ENHANCED_SEARCH_CACHE_FILE, "enhanced")
    ]
    for cache_dict, cache_file, cache_type in caches:
        if not cache_dict:
            continue
        keys_to_remove = []
        expiry = CACHE_EXPIRY.get(cache_type, 30 * 24 * 60 * 60)
        for key, value in cache_dict.items():
            if now - value.get('timestamp', 0) > expiry:
                keys_to_remove.append(key)
        for key in keys_to_remove:
            del cache_dict[key]
        save_file_cache(cache_dict, cache_file)

# Executar limpeza de cache no início
clean_old_cache_entries()

# Funções para chamadas de API com timeout
def safe_get_artist_id(artist_name):
    try:
        return get_artist_id(artist_name)
    except Exception as e:
        print(f"Erro ao buscar ID do artista: {e}")
        return None

def safe_get_artist_songs(artist_id, per_page=50):
    try:
        return get_artist_songs(artist_id, per_page=per_page)
    except Exception as e:
        print(f"Erro ao buscar músicas do artista {artist_id}: {e}")
        return None

def safe_search_artist_info(artist_name):
    try:
        return search_artist_info(artist_name)
    except Exception as e:
        print(f"Erro ao buscar informações do Spotify: {e}")
        return None

# Função para processar músicas
def process_songs(songs):
    return [
        {
            "title": song["title"],
            "url": song["url"],
            "image_url": song.get("song_art_image_url") or song.get("header_image_url") or ""
        }
        for song in songs
    ]

# Rotas da API
@app.route("/artist_info", methods=["GET"])
@limiter.limit("10 per minute")
def get_artist_info():
    artist_name = request.args.get("artist")
    if not artist_name:
        return format_response(False, error="O parâmetro 'artist' é obrigatório."), 400

    artist_hash = generate_hash(artist_name)
    cached_info = spotify_file_cache.get(artist_hash)
    if cached_info:
        return format_response(True, data=cached_info["data"])

    artist_info = safe_search_artist_info(artist_name)
    if not artist_info:
        return format_response(False, error="Artista não encontrado no Spotify."), 404

    spotify_file_cache[artist_hash] = {"data": artist_info, "timestamp": time.time()}
    save_file_cache(spotify_file_cache, SPOTIFY_CACHE_FILE)

    return format_response(True, data=artist_info)

@app.route("/enhanced_search", methods=["GET"])
@limiter.limit("10 per minute")
def enhanced_search():
    artist_name = request.args.get("artist")
    if not artist_name:
        return format_response(False, error="O parâmetro 'artist' é obrigatório."), 400

    artist_hash = generate_hash(artist_name)
    cached_result = enhanced_search_cache.get(artist_hash)
    if cached_result:
        return format_response(True, cached_result["data"])

    try:
        spotify_info = safe_search_artist_info(artist_name)
        if not spotify_info:
            return format_response(False, error="Artista não encontrado no Spotify."), 404

        spotify_top_tracks = get_artist_top_tracks(spotify_info["id"])
        if not spotify_top_tracks:
            spotify_top_tracks = []

        genius_id = safe_get_artist_id(artist_name)
        genius_songs = []
        if genius_id:
            genius_songs = safe_get_artist_songs(genius_id)

        processed_genius_songs = process_songs(genius_songs)

        result = {
            "artist": artist_name,
            "spotify_info": spotify_info,
            "spotify_top_tracks": spotify_top_tracks,
            "genius_songs": processed_genius_songs,
        }

        enhanced_search_cache[artist_hash] = {"data": result, "timestamp": time.time()}
        save_file_cache(enhanced_search_cache, ENHANCED_SEARCH_CACHE_FILE)

        return format_response(True, result)
    except Exception as e:
        print(f"Erro inesperado na rota /enhanced_search: {e}")
        return format_response(False, error="Erro interno no servidor."), 500

@app.route("/search_artist", methods=["GET"])
@limiter.limit("10 per minute")
def search_artist():
    artist_name = request.args.get("artist")
    if not artist_name:
        return format_response(False, error="O parâmetro 'artist' é obrigatório."), 400

    try:
        artist_hash = generate_hash(artist_name)
        cached_result = artist_search_cache.get(artist_hash)
        if cached_result:
            if "songs" in cached_result["data"] and isinstance(cached_result["data"]["songs"], list):
                return format_response(True, cached_result["data"])
            else:
                print(f"Cache inconsistente para o artista {artist_name}, ignorando cache.")

        # Buscar ID do artista no Genius
        genius_id = safe_get_artist_id(artist_name)
        if not genius_id:
            # Se não encontrar no Genius, retorne resultado vazio em vez de 404
            result = {"artist": artist_name, "songs": []}
            artist_search_cache[artist_hash] = {"data": result, "timestamp": time.time()}
            save_file_cache(artist_search_cache, ARTIST_SEARCH_CACHE_FILE)
            return format_response(True, result)

        songs = safe_get_artist_songs(genius_id)
        if not songs or not isinstance(songs, list):
            return format_response(False, error="Nenhuma música encontrada para este artista."), 404

        processed_songs = process_songs(songs)
        if not processed_songs:
            return format_response(False, error="Erro ao processar as músicas do artista."), 500

        result = {"artist": artist_name, "songs": processed_songs}

        artist_search_cache[artist_hash] = {"data": result, "timestamp": time.time()}
        save_file_cache(artist_search_cache, ARTIST_SEARCH_CACHE_FILE)

        return format_response(True, result)
    except Exception as e:
        print(f"Erro inesperado na rota /search_artist: {e}")
        return format_response(False, error="Erro interno no servidor."), 500

@app.route("/get_lyrics", methods=["GET"])
@limiter.limit("10 per minute")
def get_lyrics():
    url = request.args.get("url")
    if not url:
        return format_response(False, error="O parâmetro 'url' é obrigatório."), 400

    url_hash = generate_hash(url)
    cached_lyrics = lyrics_file_cache.get(url_hash)
    if cached_lyrics:
        return format_response(True, {"lyrics": cached_lyrics["data"], "cached": True})

    try:
        lyrics = fetch_lyrics_from_url(url)
        if not lyrics:
            return format_response(False, error="Não foi possível encontrar a letra da música."), 404

        lyrics_file_cache[url_hash] = {"data": lyrics, "timestamp": time.time()}
        save_file_cache(lyrics_file_cache, LYRICS_CACHE_FILE)

        return format_response(True, {"lyrics": lyrics, "cached": False})
    except Exception as e:
        print(f"Erro inesperado na rota /get_lyrics: {e}")
        return format_response(False, error=f"Erro ao buscar a letra: {str(e)}"), 500
    
    # Nova função auxiliar para chamar o modelo Gemini
from google import genai
from google.genai import types

# Adicione essas importações no topo do arquivo

# ...

# Substitua a função call_gemini_model por esta implementação correta
def call_gemini_model(prompt, model):
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise Exception("Gemini API key não configurada.")
    
    # Inicializar o cliente Gemini
    client = genai.Client(api_key=gemini_api_key)
    
    # Preparar o conteúdo para a requisição
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        ),
    ]
    
    # Configurar a resposta
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
    )
    
    # Fazer a chamada e retornar o resultado
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=generate_content_config,
    )
    
    return response.text

# Rota para tradução usando o modelo Gemini
@app.route("/translate", methods=["POST"])
def translate():
    data = request.get_json()
    if not data or "lyrics" not in data:
        return format_response(False, error="A propriedade 'lyrics' é obrigatória."), 400

    lyrics = data["lyrics"]
    try:
        prompt = f"Traduza a seguinte letra para o Português:\n\n{lyrics}"
        translation = call_gemini_model(prompt, model="gemini-2.0-flash-thinking-exp-01-21")
        return format_response(True, {"translation": translation})
    except Exception as e:
        print(f"Erro ao traduzir: {e}")
        return format_response(False, error=f"Erro ao traduzir: {str(e)}"), 500

# Rota para explicação usando o modelo Gemini
@app.route("/explain", methods=["POST"])
def explain():
    data = request.get_json()
    if not data or "lyrics" not in data:
        return format_response(False, error="A propriedade 'lyrics' é obrigatória."), 400

    lyrics = data["lyrics"]
    try:
        prompt = f"Explique o significado e a mensagem da seguinte letra:\n\n{lyrics}"
        explanation = call_gemini_model(prompt, model="gemini-2.0-flash-thinking-exp-01-21")
        return format_response(True, {"explanation": explanation})
    except Exception as e:
        print(f"Erro ao explicar: {e}")
        return format_response(False, error=f"Erro ao explicar: {str(e)}"), 500