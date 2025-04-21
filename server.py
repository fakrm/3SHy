from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs
import mysql.connector
import json
import os

class MyHandler(BaseHTTPRequestHandler):

    # Handle POST requests
    def do_POST(self):
        try:
            if self.path == '/signup':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length).decode('utf-8')
                data = parse_qs(post_data)

                username = data.get('username', [''])[0]
                email = data.get('email', [''])[0]
                password = data.get('password', [''])[0]

                # Basic validation
                if not username or not email or not password:
                    self.send_response(400)
                    self.send_header('Content-type', 'text/plain')
                    self.end_headers()
                    self.wfile.write(b'All fields are required')
                    return

                conn = mysql.connector.connect(
                   host='127.0.0.1',      
                   user='root',
                   password='13551379@Fa',
                   database='ssshy',
                   auth_plugin='mysql_native_password'
                )
                
                # Check if username already exists
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
                if cursor.fetchone():
                    self.send_response(409)  # 409 Conflict
                    self.send_header('Content-type', 'text/plain')
                    self.end_headers()
                    self.wfile.write(b'Username already exists')
                    cursor.close()
                    conn.close()
                    return
                
                # Insert new user
                cursor.execute("INSERT INTO users (username, email, password) VALUES (%s, %s, %s)", 
                              (username, email, password))
                conn.commit()
                cursor.close()
                conn.close()

                # Redirect to login page after successful signup
                self.send_response(302)
                self.send_header('Location', '/login.html')
                self.end_headers()

            elif self.path == '/login':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length).decode('utf-8')
                data = parse_qs(post_data)

                username = data.get('username', [''])[0]
                password = data.get('password', [''])[0]

                conn = mysql.connector.connect(
                    host='127.0.0.1',
                    user='root',
                    password='13551379@Fa',
                    database='ssshy',
                    auth_plugin='mysql_native_password'
                )
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users WHERE username=%s AND password=%s", (username, password))
                result = cursor.fetchone()
                
                if result:
                    # On successful login, generate data.js file with user data
                    self._generate_data_js(username, cursor)
                    cursor.close()
                    conn.close()
                    
                    # Login successful - redirect to dashboard
                    self.send_response(302)
                    self.send_header('Location', '/databasedata.html')
                    self.end_headers()
                else:
                    cursor.close()
                    conn.close()
                    
                    # Login failed
                    self.send_response(401)
                    self.send_header('Content-type', 'text/plain')
                    self.end_headers()
                    self.wfile.write(b'Login failed. Invalid username or password.')

            else:
                self.send_response(404)
                self.end_headers()

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Server error: {str(e)}".encode())
            print("⚠️ Server exception:", e)

    # Generate data.js file for the dashboard
    def _generate_data_js(self, username, cursor):
        try:
            # Get all tables in the database
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            # Create a dictionary to hold all the tables and their data
            all_tables_data = {}

            for table in tables:
                table_name = table[0]
                
                # Get table structure (columns)
                cursor.execute(f"DESCRIBE {table_name}")
                columns = [row[0] for row in cursor.fetchall()]
                
                # Get all data from the table
                cursor.execute(f"SELECT * FROM {table_name}")
                rows = cursor.fetchall()
                
                # Convert data to serializable format (strings)
                rows_data = []
                for row in rows:
                    row_data = []
                    for cell in row:
                        if isinstance(cell, (bytes, bytearray)):
                            cell = cell.decode('utf-8', errors='replace')
                        row_data.append(str(cell))
                    rows_data.append(row_data)
                
                # Add the table data to the dictionary
                all_tables_data[table_name] = {
                    'columns': columns,
                    'rows': rows_data
                }

            # Create JavaScript data object with all tables
            js_data = {
                'username': username,
                'allTablesData': all_tables_data
            }
            
            # Write to data.js file with JavaScript-compatible syntax
            js_file_path = os.path.join(os.getcwd(), 'data.js')  # Full path for writing to file
            
            with open(js_file_path, 'w') as f:
                f.write(f"const tableData = {json.dumps(js_data, indent=2)};\n")
                f.write("console.log('Data loaded:', tableData);\n")  # Optional: Log data for debugging purposes

        except Exception as e:
            print(f"Error generating data.js: {e}")

    # Handle GET requests
    def do_GET(self):
        try:
            # Default route
            if self.path == '/' or self.path == '/index.html':
                self.path = '/login.html'
                
            # Get file path
            file_path = self.path[1:]  # Remove leading '/'
            
            # Handle HTML files
            if file_path.endswith('.html'):
                try:
                    with open(file_path, 'rb') as f:
                        self.send_response(200)
                        self.send_header('Content-type', 'text/html')
                        self.end_headers()
                        self.wfile.write(f.read())
                except FileNotFoundError:
                    self.send_response(404)
                    self.end_headers()
                    
            # Handle CSS files
            elif file_path.startswith('css/') and file_path.endswith('.css'):
                try:
                    with open(file_path, 'rb') as f:
                        self.send_response(200)
                        self.send_header('Content-type', 'text/css')
                        self.end_headers()
                        self.wfile.write(f.read())
                except FileNotFoundError:
                    self.send_response(404)
                    self.end_headers()
                    
            # Handle JavaScript files
            elif file_path.endswith('.js'):
                try:
                    with open(file_path, 'rb') as f:
                        self.send_response(200)
                        self.send_header('Content-type', 'application/javascript')
                        self.end_headers()
                        self.wfile.write(f.read())
                except FileNotFoundError:
                    self.send_response(404)
                    self.end_headers()
            
            else:
                self.send_response(404)
                self.end_headers()

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Server error: {str(e)}".encode())
            print("⚠️ Server exception (GET):", e)

# Start the server
def run(server_class=HTTPServer, handler_class=MyHandler):
    server_address = ('', 8000)  # Serve on localhost:8000
    httpd = server_class(server_address, handler_class)
    print('🚀 Server running on http://localhost:8000')
    httpd.serve_forever()

if __name__ == '__main__':
    run()
