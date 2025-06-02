from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import mysql.connector
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import time
import csv
from config import DB_CONFIG, EMAIL_CONFIG, SERVER_CONFIG


# Store verification tokens (in a real application, this should be in a database)
verification_tokens = {}  # {token: {'username': username, 'email': email, 'password': password, 'timestamp': timestamp}}

class MyHandler(BaseHTTPRequestHandler):

    # Send verification email
    def _send_verification_email(self, email, token):
        try:
            # Create verification link
            verification_link = f'http://localhost:8000/verify?token={token}'
            
            # Set up the email
            msg = MIMEMultipart()
            msg['From'] = EMAIL_CONFIG['user']
            msg['To'] = email
            msg['Subject'] = 'Email Verification'
            
            # Email body
            body = f'''
            <html>
            <body>
                <h2>Verify Your Email</h2>
                <p>Thank you for signing up. Please click the link below to verify your email address:</p>
                <p><a href="{verification_link}">Verify Email</a></p>
                <p>This link will expire in 24 hours.</p>
            </body>
            </html>
            '''
            
            msg.attach(MIMEText(body, 'html'))
            
            
            server = smtplib.SMTP(EMAIL_CONFIG['host'], EMAIL_CONFIG['port'])
            server.starttls()
            server.login(EMAIL_CONFIG['user'], EMAIL_CONFIG['password'])
            server.send_message(msg)
            server.quit()
            
            print(f"Verification email sent to {email}")
            return True
        except Exception as e:
            print(f"Error sending verification email: {e}")
            return False

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

                conn = mysql.connector.connect(**DB_CONFIG)
                   
            
                
                # Check if username or email already exists
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, email))
                if cursor.fetchone():
                    self.send_response(409) 
                    self.send_header('Content-type', 'text/plain')
                    self.end_headers()
                    self.wfile.write(b'Username or email already exists')
                    cursor.close()
                    conn.close()
                    return
                
                # Generate verification token
                token = secrets.token_urlsafe(32)
                current_time = time.time()
                
                # Store token with user data
                verification_tokens[token] = {
                    'username': username,
                    'email': email,
                    'password': password,
                    'timestamp': current_time
                }
                
                # Send verification email
                email_sent = self._send_verification_email(email, token)
                
                if email_sent:
                    # Send response indicating verification email was sent
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    with open(os.path.join("templates", "verification_sent.html"), "r", encoding="utf-8") as file:
                       response = file.read()
                    self.wfile.write(response.encode())
                else:
                    # Error sending email
                    self.send_response(500)
                    self.send_header('Content-type', 'text/plain')
                    self.end_headers()
                    self.wfile.write(b'Error sending verification email')
                
                cursor.close()
                conn.close()

            elif self.path == '/login':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length).decode('utf-8')
                data = parse_qs(post_data)

                username = data.get('username', [''])[0]
                password = data.get('password', [''])[0]

                conn = mysql.connector.connect(**DB_CONFIG)
            
            
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users WHERE username=%s AND password=%s", (username, password))
                result = cursor.fetchone()
                
                if result:
                    # Check if user is verified
                    cursor.execute("SELECT is_verified FROM users WHERE username=%s", (username,))
                    verification_result = cursor.fetchone()
                    
                    if verification_result and verification_result[0] == 1:
                        # On successful login, generate data.js file with user data
                        self._generate_data_js(username, cursor)
                        cursor.close()
                        conn.close()
                        
                        # Login successful - redirect to dashboard
                        self.send_response(302)
                        self.send_header('Location', '/templates/databasedata.html')
                        self.end_headers()
                    else:
                        # User not verified
                        cursor.close()
                        conn.close()
                        
                        self.send_response(401)
                        self.send_header('Content-type', 'text/plain')
                        self.end_headers()
                        self.wfile.write(b'Please verify your email before logging in.')
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
    



    # Handle GET requests
    def do_GET(self):
        try:
            # Parse the URL and query parameters
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            
            # Handle email verification
            if path == '/verify':
                # Parse query parameters
                query = parse_qs(parsed_url.query)
                token = query.get('token', [''])[0]
                
                if not token or token not in verification_tokens:
                    self.send_response(400)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    response = '''
                    <html>
                    <body>
                        <h2>Invalid Verification Link</h2>
                        <p>The verification link is invalid or has expired.</p>
                        <p><a href="/templates/signup.html">Sign Up Again</a></p>
                    </body>
                    </html>
                    '''
                    self.wfile.write(response.encode())
                    return
                
                # Check if token is expired (24 hours)
                user_data = verification_tokens[token]
                current_time = time.time()
                if current_time - user_data['timestamp'] > 24 * 60 * 60:
                    # Token expired
                    del verification_tokens[token]
                    self.send_response(400)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    response = '''
                    <html>
                    <body>
                        <h2>Verification Link Expired</h2>
                        <p>The verification link has expired. Please sign up again.</p>
                        <p><a href="/templates/signup.html">Sign Up Again</a></p>
                    </body>
                    </html>
                    '''
                    self.wfile.write(response.encode())
                    return
                
                # Valid token, register the user
                username = user_data['username']
                email = user_data['email']
                password = user_data['password']
                
                conn = mysql.connector.connect(**DB_CONFIG)
                   
                
                cursor = conn.cursor()
                
                # Add is_verified column if it doesn't exist
                try:
                    cursor.execute("SHOW COLUMNS FROM users LIKE 'is_verified'")
                    if not cursor.fetchone():
                        cursor.execute("ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0")
                        conn.commit()
                except Exception as e:
                    print(f"Error checking/adding is_verified column: {e}")
                
                # Insert new user with verified status
                cursor.execute("INSERT INTO users (username, email, password, is_verified) VALUES (%s, %s, %s, 1)", 
                              (username, email, password))
                conn.commit()
                
                # Clean up the token
                del verification_tokens[token]
                
                cursor.close()
                conn.close()
                
                # Redirect to login page with leading slash
                self.send_response(302)
                self.send_header('Location', '/templates/login.html')
                self.end_headers()
                return
            
            # Default route
            if path == '/' or path == '/index.html':
                self.path = '/templates/login.html'
                
            # Get file path
            file_path = self.path[1:]  # Remove leading '/'
            
            # Handle HTML files
            if file_path.endswith('.html'):
                try:
                    # Use os.path.join for safer path handling
                    with open(file_path, 'rb') as f:
                        self.send_response(200)
                        self.send_header('Content-type', 'text/html')
                        self.end_headers()
                        self.wfile.write(f.read())
                except FileNotFoundError:
                    print(f"HTML file not found: {file_path}")
                    self.send_response(404)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    self.wfile.write(b"File not found")
                    
            # Handle CSS files
            elif file_path.startswith('css/') and file_path.endswith('.css'):
                try:
                    with open(file_path, 'rb') as f:
                        self.send_response(200)
                        self.send_header('Content-type', 'text/css')
                        self.end_headers()
                        self.wfile.write(f.read())
                except FileNotFoundError:
                    print(f"CSS file not found: {file_path}")
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
                    print(f"JS file not found: {file_path}")
                    self.send_response(404)
                    self.end_headers()
            
            else:
                print(f"Unhandled path: {self.path}")
                self.send_response(404)
                self.end_headers()




        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Server error: {str(e)}".encode())
            print("⚠️ Server exception (GET):", e)
            

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
            #js_file_path = os.path.join(os.getcwd(), 'data.js')  # Full path for writing to file
            js_file_path = os.path.join('js', 'data.js')
            with open(js_file_path, 'w') as f:
                f.write(f"const tableData = {json.dumps(js_data, indent=2)};\n")
                f.write("console.log('Data loaded:', tableData);\n")  

        except Exception as e:
            print(f"Error generating data.js: {e}")




# Start the server
def run(server_class=HTTPServer, handler_class=MyHandler):
    server_address = (SERVER_CONFIG['host'], SERVER_CONFIG['port'])
    httpd = server_class(server_address, handler_class)
    print(f'🚀 Server running on http://localhost:{SERVER_CONFIG["port"]}')
    httpd.serve_forever()

if __name__ == '__main__':
    run()