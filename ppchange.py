
import mysql.connector





#In this part you can check the data in DB
#

# Connect to the database
conn = mysql.connector.connect(
    host='127.0.0.1',      
    user='root',
    password='Smartss2025',
    database='ssshy',
    auth_plugin='mysql_native_password',
     charset='utf8'
)

cursor = conn.cursor()


cursor.execute("SELECT * FROM zem ")

# Fetch all rows
rows = cursor.fetchall()

# Print rows to console
if rows:
    for row in rows:

        print(row)


# Clean up
cursor.close()
conn.close()
