from flask import Blueprint

# Criar o Blueprint para as rotas da API
app = Blueprint("api", __name__)

# Importar as rotas para registrá-las no Blueprint
from . import routes