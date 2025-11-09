import http.server
import socketserver
import sqlite3
import json
import os
from urllib.parse import urlparse, parse_qs

# Configuration du serveur
PORT = 8000
WEB_DIR = 'agenda_web' # Le dossier contenant index.html, style.css, script.js
DB_PATH = 'agenda.db'

class AgendaHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Change le répertoire de base pour servir les fichiers statiques
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_POST(self):
        # Gère l'ajout d'événement via l'API
        if self.path == '/api/add_event':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            event_data = json.loads(post_data)
            
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("INSERT INTO events (date, time, title, category) VALUES (?, ?, ?, ?)",
                           (event_data['date'], event_data['time'], event_data['title'], event_data['category']))
            conn.commit()
            conn.close()
            
            self.send_response(200)
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
        else:
            super().do_POST()

    def do_GET(self):
        # Gère la récupération des événements via l'API
        if self.path == '/api/get_events':
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT id, date, time, title, category FROM events")
            events = cursor.fetchall()
            conn.close()
            
            event_list = [{"id": e[0], "date": e[1], "time": e[2], "title": e[3], "category": e[4]} for e in events]
            
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(event_list).encode('utf-8'))
        else:
            # Sert les fichiers HTML/CSS/JS normaux
            super().do_GET()
    
    def do_DELETE(self):
        # Gère la suppression d'événement via l'API
        if self.path.startswith('/api/delete_event'):
            query_params = parse_qs(urlparse(self.path).query)
            event_id = query_params.get('id', [None])[0]

            if event_id:
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))
                conn.commit()
                conn.close()
                self.send_response(200)
            else:
                self.send_response(400)
            self.end_headers()

def setup_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

if __name__ == "__main__":
    setup_database()
    # Utilise socketserver.TCPServer pour un meilleur contrôle
    with socketserver.TCPServer(("", PORT), AgendaHandler) as httpd:
        print(f"Serveur démarré sur http://localhost:{PORT}/")
        print(f"Accédez à l'application dans votre navigateur via cette adresse.")
        httpd.serve_forever()


