import os
import requests
import base64
from urllib.parse import quote
import time

# Credenciais da API do Spotify
CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

# Cache do token para não precisar fazer requisição a cada chamada
token_cache = {
    "access_token": None,
    "expires_at": 0
}

def get_spotify_token():
    """Obtém ou renova o token de acesso à API do Spotify."""
    # Se o token ainda é válido, retorna-o
    current_time = int(time.time())
    if token_cache["access_token"] and token_cache["expires_at"] > current_time:
        return token_cache["access_token"]
    
    # Caso contrário, solicita um novo token
    auth_string = f"{CLIENT_ID}:{CLIENT_SECRET}"
    auth_bytes = auth_string.encode("utf-8")
    auth_base64 = base64.b64encode(auth_bytes).decode("utf-8")
    
    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": f"Basic {auth_base64}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}
    
    response = requests.post(url, headers=headers, data=data)
    
    if response.status_code == 200:
        json_result = response.json()
        token_cache["access_token"] = json_result["access_token"]
        token_cache["expires_at"] = current_time + json_result["expires_in"] - 60  # Com margem de segurança
        return token_cache["access_token"]
    else:
        print(f"Erro ao obter token do Spotify: {response.status_code}")
        return None

def search_artist_info(artist_name):
    """Busca informações detalhadas sobre um artista."""
    token = get_spotify_token()
    if not token:
        return None
    
    url = f"https://api.spotify.com/v1/search?q={quote(artist_name)}&type=artist&limit=1"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        json_result = response.json()
        if json_result["artists"]["items"]:
            artist = json_result["artists"]["items"][0]
            return {
                "id": artist["id"],
                "name": artist["name"],
                "popularity": artist["popularity"],
                "genres": artist["genres"],
                "followers": artist["followers"]["total"],
                "image_url": artist["images"][0]["url"] if artist["images"] else None
            }
    
    return None

def get_artist_top_tracks(artist_id, country="BR"):
    """Busca as músicas mais populares de um artista."""
    token = get_spotify_token()
    if not token:
        return None
    
    url = f"https://api.spotify.com/v1/artists/{artist_id}/top-tracks?country={country}"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        json_result = response.json()
        tracks = []
        
        for track in json_result["tracks"]:
            tracks.append({
                "id": track["id"],
                "name": track["name"],
                "popularity": track["popularity"],
                "preview_url": track["preview_url"],
                "album_name": track["album"]["name"],
                "album_image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
                "release_date": track["album"]["release_date"],
                "spotify_url": track["external_urls"]["spotify"]
            })
        
        return tracks
    
    return None

def search_track(track_name, artist_name=None):
    """Busca informações sobre uma música específica, opcionalmente filtrando por artista."""
    token = get_spotify_token()
    if not token:
        return None
    
    query = track_name
    if artist_name:
        query = f"track:{track_name} artist:{artist_name}"
    
    url = f"https://api.spotify.com/v1/search?q={quote(query)}&type=track&limit=5"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        json_result = response.json()
        tracks = []
        
        for track in json_result["tracks"]["items"]:
            tracks.append({
                "id": track["id"],
                "name": track["name"],
                "artists": [artist["name"] for artist in track["artists"]],
                "popularity": track["popularity"],
                "preview_url": track["preview_url"],
                "album_name": track["album"]["name"],
                "album_image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
                "release_date": track["album"]["release_date"],
                "spotify_url": track["external_urls"]["spotify"]
            })
        
        return tracks
    
    return None