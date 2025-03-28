import unicodedata

def normalize_term(term):
    """Normaliza o termo de busca removendo espaços extras, acentos e convertendo para minúsculas."""
    term = term.strip().lower()
    term = unicodedata.normalize("NFD", term)
    term = "".join(char for char in term if unicodedata.category(char) != "Mn")
    return term