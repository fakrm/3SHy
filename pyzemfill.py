import pandas as pd
import os
import re
from datetime import datetime

def fill_empty_date_cells(input_file, output_file):
    """
    This script identifies columns with 'Date' in the header and fills empty date cells 
    with dates based on the year specified in the column header.
    
    Args:
        input_file: Path to the input CSV/TSV file
        output_file: Path to save the processed file
    
    Returns:
        Tuple: (result message, list of found date columns)
    """
    print(f"Processing file: {input_file}")
    
    found_date_columns = []
    
    try:
        # Read the file - auto-detect separator
        # First, let's peek at the file to determine the separator
        with open(input_file, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
            
        # Determine separator
        if '\t' in first_line:
            separator = '\t'
            print("Detected tab-separated file")
        elif ',' in first_line:
            separator = ','
            print("Detected comma-separated file")
        else:
            separator = '\t'  # Default to tab
            print("Using tab as default separator")

        # Read the CSV file with proper header detection
        df = pd.read_csv(input_file, sep=separator, encoding='utf-8')
        print(f"Successfully read file. Shape: {df.shape}")
        print(f"Columns found: {list(df.columns)}")
        
        # Find all date columns and extract years from headers
        date_column_info = []  # List of tuples: (column_name, extracted_year)
        time_column_mapping = {}  # Maps date column name to its corresponding time column name
        
        def extract_year_from_header(header_name):
            """Extract year from column header"""
            # Look for 4-digit year in the header
            year_match = re.search(r'20\d{2}', str(header_name))
            if year_match:
                return int(year_match.group())
            # Default to current year if no year found in header
            return datetime.now().year
        
        for i, col_name in enumerate(df.columns):
            # Check if column name contains 'Date' (case insensitive)
            if isinstance(col_name, str) and re.search(r'Date\d*', col_name, re.IGNORECASE):
                extracted_year = extract_year_from_header(col_name)
                date_column_info.append((col_name, extracted_year))
                found_date_columns.append(col_name)
                print(f"Found date column: '{col_name}' -> Year: {extracted_year}")
                
                # Look for corresponding time column
                # Check if the next column is a time column
                if i + 1 < len(df.columns):
                    next_col_name = df.columns[i + 1]
                    if isinstance(next_col_name, str) and re.search(r'Time', next_col_name, re.IGNORECASE):
                        time_column_mapping[col_name] = next_col_name
                        print(f"  -> Found corresponding time column: '{next_col_name}'")
        
        if not date_column_info:
            print("No date columns found in headers. Searching for date patterns in data...")
            
            # Alternative: look for columns that contain date-like values
            date_patterns = [
                re.compile(r'^\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}$'),  # YYYY.MM.DD, YYYY-MM-DD, YYYY/MM/DD
                re.compile(r'^\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}$'),  # MM.DD.YYYY, DD.MM.YYYY etc.
                re.compile(r'^\d{2}-[A-Za-z]{3}$'),                # DD-MMM (like 01-Jan)
            ]
            
            def is_date_like(value):
                if pd.isna(value) or not isinstance(value, str):
                    return False
                value = str(value).strip()
                return any(pattern.match(value) for pattern in date_patterns)
            
            # Check each column for date-like content
            for i, col_name in enumerate(df.columns):
                # Sample first 10 non-null values
                sample_values = df[col_name].dropna().head(10)
                date_count = sum(1 for val in sample_values if is_date_like(val))
                
                if date_count >= 2:  # At least 2 date-like values
                    extracted_year = extract_year_from_header(col_name)
                    date_column_info.append((col_name, extracted_year))
                    found_date_columns.append(col_name)
                    print(f"Identified '{col_name}' as date column -> Year: {extracted_year}")
        
        if not date_column_info:
            print("No date columns identified. File will be saved without modifications.")
            df.to_csv(output_file, sep=separator, index=False)
            return "No date columns found. File saved without modifications.", found_date_columns
        
        print(f"\nFound date columns: {[col for col, year in date_column_info]}")
        
        def parse_and_correct_date(date_value, target_year):
            """Parse a date and correct its year to match the target year"""
            if pd.isna(date_value) or not str(date_value).strip():
                return None
                
            date_str = str(date_value).strip()
            
            # Try different date formats
            date_formats = [
                '%Y-%m-%d', '%Y/%m/%d', '%Y.%m.%d',  # YYYY-MM-DD formats
                '%d-%m-%Y', '%d/%m/%Y', '%d.%m.%Y',  # DD-MM-YYYY formats
                '%m-%d-%Y', '%m/%d/%Y', '%m.%d.%Y',  # MM-DD-YYYY formats
                '%d-%b-%Y', '%d %b %Y',              # DD-MMM-YYYY formats
                '%d-%b', '%d %b',                    # DD-MMM formats (no year)
            ]
            
            for fmt in date_formats:
                try:
                    parsed_date = datetime.strptime(date_str, fmt)
                    # Replace year with target year
                    corrected_date = parsed_date.replace(year=2024)
                    return corrected_date.strftime('%Y-%m-%d')
                except ValueError:
                    continue
            
            # If no format matched, return original value
            print(f"    Warning: Could not parse date '{date_str}' - keeping original")
            return date_str
        
        def generate_date_for_row(row_idx, target_year, base_date_pattern=None):
            """Generate a date for an empty cell based on row position and target year"""
            if base_date_pattern:
                # Try to use the base pattern but with target year
                try:
                    base_parsed = datetime.strptime(base_date_pattern, '%Y-%m-%d')
                    # Keep the same month and day, but use target year
                    new_date = base_parsed.replace(year=target_year)
                    #return new_date.strftime('%Y-%m-%d')
                    return new_date.replace(year=2024).strftime('%Y-%m-%d')
                except:
                    pass
            
            # Default: generate date based on row index (simple progression)
            # Start from January 1st of target year and add days
            try:
                start_date = datetime(target_year, 1, 1)
                # Add row index as days (with some modulo to prevent going beyond year)
                days_to_add = row_idx % 365
                new_date = start_date.replace(month=1, day=1)
                # Simple month progression: each row gets next day in January, then February, etc.
                month = min(12, 1 + (row_idx // 31))
                day = min(31, 1 + (row_idx % 31))
                try:
                    new_date = datetime(target_year, month, day)
                except ValueError:
                    # Handle invalid dates (like Feb 31st) by using end of month
                    if month == 2 and day > 28:
                        day = 28
                    new_date = datetime(target_year, month, day)
                
                #return new_date.strftime('%Y-%m-%d')
                return new_date.replace(year=2024).strftime('%Y-%m-%d')
            except:
                return f"{target_year}-01-01"
        
        def is_end_of_day_time(time_value):
            """Check if time value indicates end of day (23:XX)"""
            if pd.isna(time_value):
                return False
            time_str = str(time_value).strip()
            # Check for 23:XX format or just "23"
            is_end_time = (time_str.startswith('23:') or 
                          time_str == '23' or 
                          time_str.startswith('23.'))
            
            if is_end_time:
                print(f"    🕐 Found 23:XX time ({time_str}) - will stop insertion after this point")
            
            return is_end_time
        
        # Process each date column
        total_cells_modified = 0
        total_cells_corrected = 0
        MAX_EMPTY_CELLS = 25  # Limit for consecutive empty cells
        
        for col_name, target_year in date_column_info:
            print(f"\nProcessing date column: '{col_name}' (Target Year: {target_year})")
            last_valid_pattern = None
            last_valid_time = None
            cells_modified = 0
            cells_corrected = 0
            consecutive_empty_count = 0
            stopped_early = False
            stopped_by_time = False
            
            # Check if this date column has a corresponding time column
            time_col_name = time_column_mapping.get(col_name)
            if time_col_name:
                print(f"  Using time column: '{time_col_name}' for time validation")
            
            # Get the column data
            column_data = df[col_name]
            time_column_data = df[time_col_name] if time_col_name else None
            
            for row_idx in range(len(column_data)):
                current_value = column_data.iloc[row_idx]
                current_time = time_column_data.iloc[row_idx] if time_column_data is not None else None
                
                # Check if current cell has a valid date (not empty/null)
                if pd.notna(current_value) and str(current_value).strip():
                    original_date = str(current_value).strip()
                    
                    # Parse and correct the date to use target year
                    corrected_date = parse_and_correct_date(original_date, target_year)
                    
                    if corrected_date and corrected_date != original_date:
                        df.at[row_idx, col_name] = corrected_date
                        cells_corrected += 1
                        print(f"  Row {row_idx+1}: Corrected '{original_date}' -> '{corrected_date}'")
                    
                    # Update the last valid pattern for empty cell filling
                    if corrected_date:
                        last_valid_pattern = corrected_date
                    last_valid_time = current_time
                    consecutive_empty_count = 0  # Reset empty cell counter
                    
                elif last_valid_pattern is not None:
                    # Empty cell found - check time constraint first
                    if time_col_name and is_end_of_day_time(last_valid_time):
                        print(f"  Row {row_idx+1}: Last valid time was 23:XX - stopping date fill to prevent overflow")
                        print(f"  Stopping fill process for column '{col_name}' due to end-of-day time constraint")
                        stopped_by_time = True
                        break
                    
                    # Check consecutive empty cells limit
                    consecutive_empty_count += 1
                    if consecutive_empty_count > MAX_EMPTY_CELLS:
                        print(f"  Row {row_idx+1}: Reached limit of {MAX_EMPTY_CELLS} consecutive empty cells.")
                        print(f"  Stopping fill process for column '{col_name}' - no more dates found.")
                        stopped_early = True
                        break
                    
                    # Generate appropriate date for this row
                    new_date = generate_date_for_row(row_idx, target_year, last_valid_pattern)
                    df.at[row_idx, col_name] = new_date
                    cells_modified += 1
                    
                    if cells_modified <= 5:  # Limit console output
                        print(f"  Row {row_idx+1}: Filled empty cell with '{new_date}' (empty count: {consecutive_empty_count})")
                    elif cells_modified == 6:
                        print(f"  ... (continuing to fill cells with {target_year} dates, watching constraints...)")
            
            if stopped_early:
                print(f"  ⚠️  Column '{col_name}' processing stopped early due to {MAX_EMPTY_CELLS}+ consecutive empty cells")
            elif stopped_by_time:
                print(f"  🕐 Column '{col_name}' processing stopped due to end-of-day time constraint (23:XX)")
            
            print(f"  Cells corrected in '{col_name}': {cells_corrected}")
            print(f"  Empty cells filled in '{col_name}': {cells_modified}")
            total_cells_modified += cells_modified
            total_cells_corrected += cells_corrected
        
        # Save the processed file
        df.to_csv(output_file, sep=separator, index=False)
        
        print(f"\n" + "="*50)
        print(f"Processing completed successfully!")
        print(f"Total cells filled: {total_cells_modified}")
        print(f"Total cells corrected: {total_cells_corrected}")
        print(f"Date columns processed: {len(found_date_columns)}")
        print(f"Output saved to: {output_file}")
        
        return f"Successfully processed {len(found_date_columns)} date columns. Filled {total_cells_modified} cells, corrected {total_cells_corrected} cells.", found_date_columns
    
    except Exception as e:
        import traceback
        print("Error occurred during processing:")
        traceback.print_exc()
        return f"Error processing file: {str(e)}", found_date_columns

def print_date_column_summary(date_columns):
    """Helper function to print a summary of found date columns"""
    print("\n" + "="*30)
    print("DATE COLUMNS SUMMARY")
    print("="*30)
    if date_columns:
        for i, col_name in enumerate(date_columns):
            print(f"{i+1}. {col_name}")
    else:
        print("No date columns found.")
    print("="*30)

# Main execution
if __name__ == "__main__":
   
    input_file = r"D:\saxion\sss\food.csv"
    output_file = os.path.join(os.path.dirname(input_file), "food1.csv")
    
    print("🗓️  DATE COLUMN FILL TOOL (HEADER-BASED YEAR) 🗓️")
    print("="*60)
    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}")
    print("="*60)
    
    # Process the file
    result_message, date_columns = fill_empty_date_cells(input_file, output_file)
    
    # Print results
    print(f"\n📋 RESULT: {result_message}")
    print_date_column_summary(date_columns)
    
    # Save date columns list to file
    if date_columns:
        date_columns_file = os.path.join(os.path.dirname(input_file), "found_date_columns.txt")
        with open(date_columns_file, 'w', encoding='utf-8') as f:
            f.write("Date Columns Found:\n")
            f.write("="*20 + "\n")
            for i, col_name in enumerate(date_columns):
                f.write(f"{i+1}. {col_name}\n")
        print(f"📁 Date columns list saved to: {date_columns_file}")
    
    print(f"\n✅ Processing complete! Check your output file: {output_file}")