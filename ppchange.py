import pandas as pd
from datetime import datetime
import mysql.connector


# # Function to convert date from dd/mm/yyyy format to yyyy-mm-dd
# def convert_date_format(date_str):
#     try:
#         if pd.isna(date_str):
#             return date_str
#         # Convert from dd/mm/yyyy to yyyy-mm-dd format
#         return datetime.strptime(date_str, '%d/%m/%Y').strftime('%Y/%m/%d')
#     except ValueError:
#         return date_str  # Return original if invalid format

# # Function to convert decimal values with commas to periods
# def convert_decimal_format(decimal_str):
#     if pd.isna(decimal_str):
#         return decimal_str
#     if isinstance(decimal_str, str):
#         return decimal_str.replace(',', '.')
#     return decimal_str

# # Load the CSV file into a pandas DataFrame
# file_path = r'D:\saxion\sss\newbbfr.csv'  # Replace with your CSV file path
# df = pd.read_csv(file_path, delimiter=';')

# # Count missing values before transformations
# missing_values_before = df.isna().sum()

# # Track original values for comparison
# original_date_values = df['date'].copy()
# original_capacity_values = df['available_capacity'].copy()

# # Convert the 'date' column to yyyy-mm-dd format
# df['date'] = df['date'].apply(convert_date_format)

# # Convert decimal columns that use commas to use periods
# df['available_capacity'] = df['available_capacity'].apply(convert_decimal_format)

# # Count affected rows (rows that were modified)
# date_affected = (df['date'] != original_date_values).sum()
# capacity_affected = (df['available_capacity'] != original_capacity_values).sum()

# # Count missing values after transformations
# missing_values_after = df.isna().sum()

# # Save the modified DataFrame to a new CSV file
# output_path = r'D:\saxion\sss\mysql_ready_bb1frcs4.csv'
# df.to_csv(output_path, index=False, sep=';')

# # Display summary of the transformations
# print(f"Data transformation complete. Output saved to: {output_path}")
# print("\nAffected Rows:")
# print(f"- Date column: {date_affected} rows modified ({date_affected/len(df):.2%} of total)")
# print(f"- Available capacity column: {capacity_affected} rows modified ({capacity_affected/len(df):.2%} of total)")

# print("\nMissing Values (Before):")
# for column, count in missing_values_before.items():
#     print(f"- {column}: {count} missing values ({count/len(df):.2%} of total)")

# print("\nMissing Values (After):")
# for column, count in missing_values_after.items():
#     print(f"- {column}: {count} missing values ({count/len(df):.2%} of total)")

# print(f"\nTotal rows processed: {len(df)}")





# Connect to the database
conn = mysql.connector.connect(
    host='127.0.0.1',      
    user='root',
    password='13551379@Fa',
    database='ssshy',
    auth_plugin='mysql_native_password',
     charset='utf8'
)

cursor = conn.cursor()


cursor.execute("SELECT * FROM fieten LIMIT 10")

# Fetch all rows
rows = cursor.fetchall()

# Print rows to console
if rows:
    for row in rows:

        print(row)


# Clean up
cursor.close()
conn.close()
