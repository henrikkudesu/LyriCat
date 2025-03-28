from flask import Flask
from api import app as api_routes
from api.routes import limiter  # Importar o limiter

app = Flask(__name__)
app.register_blueprint(api_routes)
limiter.init_app(app)  # Inicializar com a aplicação principal

if __name__ == "__main__":
    app.run(debug=True)