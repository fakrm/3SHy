import mysql.connector
import json

def get_db_data(query, db_config):
    """
    Execute a SQL query and return the results as JSON for JavaScript
    """
    try:
        # Connect to the database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)  # Use dictionary=True to get column names
        
        # Execute the query
        cursor.execute(query)
        
        # Get column names
        columns = [column[0] for column in cursor.description]
        
        # Fetch all rows
        rows = cursor.fetchall()
        
        # Close connection
        cursor.close()
        conn.close()
        
        # Extract table name from query (simple approach)
        table_name = query.split("FROM")[1].split()[0].strip() if "FROM" in query.upper() else "Data"
        
        # Prepare data for JavaScript
        js_data = {
            "tableName": table_name,
            "columns": columns,
            "rows": []
        }
        
        # Convert rows to array format for JavaScript
        for row in rows:
            row_array = [row[column] for column in columns]
            js_data["rows"].append(row_array)
        
        # Convert to JavaScript code
        js_code = f"const tableData = {json.dumps(js_data, default=str)};"
        
        return js_code
        
    except mysql.connector.Error as err:
        return f"const tableData = {{tableName: 'Error', columns: ['Error'], rows: [['{err}']]}};"

# Example usage
if __name__ == "__main__":
    # Database configuration
    db_config = {
        'host': '127.0.0.1',
        'user': 'root',
        'password': '13551379@Fa',
        'database': 'ssshy',
        'auth_plugin': 'mysql_native_password'
    }
    
    # The query (this could be any table)
    query = "SELECT * FROM parties"
    
    # Generate JavaScript code
    js_data = get_db_data(query, db_config)
    
    # Output the JavaScript code to a file
    with open("data.js", "w") as f:
        f.write(js_data)
    
    print("JavaScript data file generated successfully!")