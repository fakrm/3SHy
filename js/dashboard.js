// Global variables
let allTablesData = {};
let currentTable = '';
let currentView = '15min';
let charts = {};
let currentPage = 1;//start with one
const rowsPerPage = 10;//For raw data

// Load data when page loads
window.onload = function() {
    // Check if tableData exists
    //Table data is all tables in DB in data.js
    if (typeof tableData === 'undefined') {
        console.error("Error: tableData is not defined. Make sure data.js is loaded correctly.");
        return;
    }
    
    // Set username from DB
    document.getElementById('username').textContent = tableData.username;
    
    // Store all tables data
    allTablesData = tableData.allTablesData;
    
    // Populate table menu
    populateTableMenu();
    
    // Select first table by default
    if (Object.keys(allTablesData).length > 0) {
        currentTable = Object.keys(allTablesData)[0];
        loadTableData(currentTable);

    }
    
    // Set up view option buttons
    setupViewButtons();
};

function populateTableMenu() {
    const tableMenu = document.getElementById('tableMenu');
    //Clear 
    tableMenu.innerHTML = '';
    //removed users and parties since the hedaers were correct but the data was not
    const tableNames = Object.keys(allTablesData).filter(tableName => 
        tableName !== 'users' && tableName !== 'parties'
    );
    
    //const tableNames = Object.keys(allTablesData);
    
    tableNames.forEach((tableName, index) => {
        const button = document.createElement('button');
        //Set first name to capital
        button.textContent = tableName.charAt(0).toUpperCase() + tableName.slice(1);
        button.classList.add('table-btn');
        button.dataset.table = tableName;

        console.log("Table names:", tableNames);
        button.onclick = function() {
            switchTable(tableName);
        };
        
        if (tableName === currentTable) {
            button.classList.add('active');
            
        }
        
        tableMenu.appendChild(button);
        
        // Add separator after each button except the last one
        if (index < tableNames.length - 1) {
            const separator = document.createElement('span');
            //separator.textContent = ' | ';
            separator.style.margin = '0 5px';
            tableMenu.appendChild(separator);
        }
    });
}

// Set up view option buttons, color change 
function setupViewButtons() {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            viewButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Set current view
            currentView = this.dataset.view;
            
            // Update view button text for ZEM table
            updateViewButtonText();
            
            // Reload data with new view
            if (currentTable) {
                loadTableData(currentTable);
            }
        });
    });
}

// Update view button text based on current table
function updateViewButtonText() {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        if (button.dataset.view === '15min') {
            if (currentTable === 'zem' || currentTable === 'hotel') {
                button.textContent = 'Hourly';
            } else {
                button.textContent = '15 Min';
            }
        }
         else if (button.dataset.view === 'daily' && (currentTable === 'hotel' || currentTable=== 'zem')) {
           // button.remove();
           button.style.display = 'none';
           
        }
        else {
                button.style.display = ''; // Show for other companies
            }
    });
}

// Switch to a different table
function switchTable(tableName) {
    // Update active button in menu
    const tableButtons = document.querySelectorAll('.table-btn');
    tableButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.table === tableName) {
            btn.classList.add('active');
        }
    });
    
    // Set current table
    currentTable = tableName;
    
    // Update view button text based on new table
    updateViewButtonText();
    
    // Update table name display and make first letter capital, Charat returns the letter at index 0 and then concatinate with the rest of string
    document.getElementById('currentTableName').textContent = tableName.charAt(0).toUpperCase() + tableName.slice(1) + ' Data';
    
    // Update chart title
    document.getElementById('currentChartTitle').textContent = tableName.charAt(0).toUpperCase() + tableName.slice(1) + ' ' + getViewTitle();
    
    // Show raw data from first page
    currentPage = 1;
    
    // Load data for selected table
    loadTableData(tableName);
}

// Get title based on current view and table
function getViewTitle() {
    //Switch state
    switch(currentView) {
        case '15min':
            if (currentTable === 'zem' || currentTable === 'hotel') {
                return 'Hourly Data';
            } else {
                return '15-Minute Interval Data';
            }
        case 'daily':
            return 'Daily Data';
        case 'average':
            return 'Average By Date';
        default:
            return 'Data';
    }
}

// Load data for selected table
function loadTableData(tableName) {
    if (!allTablesData[tableName]) {
        console.error(`Table ${tableName} not found in data`);
        return;
    }
    
    const tableData = allTablesData[tableName];
    
    // Generate table headers
    generateTableHeaders(tableData.columns);
    
    // Based on the selected table name process function will be called
    let processedData;
    if (tableName === 'fr_energy_hubs') {
        processedData = processFacilityData(tableData.rows);
        document.getElementById('intervaloptions').style.display = '';
         document.getElementById('textdate').style.display = '';
         document.getElementById('currentChartTitle').style.display = '';
         document.getElementById('containerch').style.display = '';
    }  else if (tableName === 'chargingplaza1') {
        processedData = processChargingplaza1Data(tableData.rows);
        document.getElementById('intervaloptions').style.display = '';
         document.getElementById('textdate').style.display = '';
         document.getElementById('currentChartTitle').style.display = '';
         document.getElementById('containerch').style.display = '';
    }
    
   
    

    else if (tableName === 'fieten') {
        processedData = processFietenData(tableData.rows);
         document.getElementById('intervaloptions').style.display = '';
         document.getElementById('textdate').style.display = '';
         document.getElementById('currentChartTitle').style.display = '';
        document.getElementById('containerch').style.display = '';
    
    } else if (tableName === 'zem') {
      processedData = processZemData(tableData.rows);
     document.getElementById('intervaloptions').style.display = '';
         document.getElementById('textdate').style.display = '';
          document.getElementById('currentChartTitle').style.display = '';
          document.getElementById('containerch').style.display = '';
      }
      else if (tableName === 'hotel') {
          processedData = processHotelData(tableData.rows);
          document.getElementById('intervaloptions').style.display = '';
          document.getElementById('textdate').style.display = '';
          document.getElementById('currentChartTitle').style.display = '';
          document.getElementById('containerch').style.display = '';
      }
        else if (tableName === 'fastfoodchain') {
        processedData = processfastfoodchainData(tableData.rows);
        document.getElementById('intervaloptions').style.display = '';
         document.getElementById('textdate').style.display = '';
         document.getElementById('currentChartTitle').style.display = '';
         document.getElementById('containerch').style.display = '';
    }

    else if (tableName === 'users' || tableName === 'parties') {//If the selected table was not above
        console.log(`Processing ${tableName} data...`);
        // Generic processing for other tables
          processedData = allTablesData[tableName].rows.map((row, index) => {
            const rowData = {};
            allTablesData[tableName].columns.forEach((col, i) => {
                rowData[col] = row[i];
                console.log(`Row ${index}, Column ${col}: ${row[i]}`);
            });
            return rowData;
        });
        
        document.getElementById('intervaloptions').style.display = 'none';
         document.getElementById('textdate').style.display = 'none';
          document.getElementById('currentChartTitle').style.display = 'none';
         document.getElementById('containerch').style.display = 'none';
         
    
    }
    
    // Populate date filter with this table's dates
    populateDateFilter(processedData, tableName);
    
    // Update table with data
    updateTable(processedData);
    
    // Create or update charts
    createOrUpdateChart(processedData, tableName);
    
    // Update chart title
    document.getElementById('currentChartTitle').textContent = tableName.charAt(0).toUpperCase() + tableName.slice(1) + ' ' + getViewTitle();
}

// Process facility data (FR)
function processFacilityData(rows) {
    return rows.map(row => {
        
        return {
            date: row[0],
      
            time: row[1],
            
            Available_capacity_space: parseFloat(row[2]),
            party_id: row[3]
        };
    });
}
function processChargingplaza1Data(rows) {
    
    return rows.map(row => {
        
        return {
            date: row[0],
      
            time: row[1],
            
            Total_fast_charging: parseFloat(row[2]),
            Total_normal_charging: parseFloat(row[3]),
            party_id: row[4]
        };
    });
}

function processfastfoodchainData(rows) {
   
    
    return rows.map(row => {
        
        return {
            date: row[0],
      
            time: row[1],
            
            Directe: parseFloat(row[2]),
            Heating: parseFloat(row[3]),
            airco: parseFloat(row[4]),
            party_id: row[5]
        };
    });
}

// Process fieten data into structured format
function processFietenData(rows) {
    return rows.map(row => {
        
        return {
            date: row[0],
            time: row[1],
            estimated_energy_consumptionkWh: parseFloat(row[2]),
           
            party_id: row[3]
        };
    });
}

// Process ZEM data into structured format
function processZemData(rows) {
    return rows.map(row => {
        return {
            date: row[0],
            time: row[1],
            energy: parseFloat(row[2]) || 0,
            party_id: row[3]
        };
    });
}

function processHotelData(rows) {
    
    return rows.map(row => {
        return {
            date: row[0],
            time: row[1],
            energy_distributtion: parseFloat(row[2]) || 0,
            party_id: row[3]
        };
    });
}

function populateDateFilter(data, tableName) {
    const dateFilter = document.getElementById('dateFilter');
    
    if (tableName == "users" || tableName == "parties") {
        // Hide the date filter for users and parties tables
        dateFilter.style.display = 'none';
       
        const dateFilterLabel = document.getElementById('dateFilterLabel');
        if (dateFilterLabel) {
            dateFilterLabel.style.display = 'none';
        }
    }
    else {
        // Show the date filter for other tables
        dateFilter.style.display = 'block';
        // Optional: Show the label too
        const dateFilterLabel = document.getElementById('dateFilterLabel');
        if (dateFilterLabel) {
            dateFilterLabel.style.display = 'block';
        }
        
        dateFilter.innerHTML = '<option value="all">All Dates</option>';

        // Map table names to their date field names
        const dateFieldsMap = {
            'fr_energy_hubs': 'date',
             'chargingplaza1': 'date',
            'fieten': 'date',
            'zem': 'date',
            'hotel': 'date',
            'fastfoodchain': 'date',
        };

        // Use the mapped date field, or fallback to 'date'
        const dateField = dateFieldsMap[tableName] || 'date';

        // Extract unique dates from data using the correct field
        const dates = [...new Set(data.map(item => item[dateField]))].sort();

        // Populate the dropdown with unique date options
        dates.forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = date;
            dateFilter.appendChild(option);
        });
          if (tableName === 'fieten' && dates.length > 0) {
            console.log('FIETEN: Setting first date:', dates[0]);
            dateFilter.value = dates[0];
            console.log('FIETEN: Date filter value after setting:', dateFilter.value);
        }
          else if (tableName === 'zem' && dates.length > 0) {
            dateFilter.value = dates[0]; // Set first date as selected
            console.log('zem: Date filter value after setting:', dateFilter.value);
        }
         else if (tableName === 'hotel' && dates.length > 0) {
            dateFilter.value = dates[1]; // Set first date as selected
            console.log('hotel: Date filter value after setting:', dateFilter.value);
        }
          else if (tableName === 'fr_energy_hubs' && dates.length > 0) {
            dateFilter.value = dates[0]; // Set first date as selected
        }
          else if (tableName === 'chargingplaza1' && dates.length > 0) {
            dateFilter.value = dates[0]; // Set first date as selected
        }
        else if (tableName === 'fastfoodchain' && dates.length > 0) {
            dateFilter.value = dates[1]; // Set first date as selected
        }
    }
}

// Update table with data
function updateTable(data) {
      if (currentTable === 'users' || currentTable === 'parties') {
        return data;
    }

    else{
         // Apply date filter
    const filteredData = filterDataByDate(data);
    
    // Update table with filtered data
    displayTableData(filteredData);
    
    // Generate pagination
    generatePagination(Math.ceil(filteredData.length / rowsPerPage));

    }
   
}

// Filter data by selected date
function filterDataByDate(data) {
    const selectedDate = document.getElementById('dateFilter').value;
    
    if (selectedDate === 'all') {
        return data;
    }
    
    // Determine date field based on current table
    let dateField = 'date';
    if (currentTable === 'fieten') {
        dateField = 'date';
    }
    if (currentTable === 'zem') {
        dateField = 'date';
    }
    if (currentTable === 'hotel') {
        dateField = 'date';
    }
    
     if (currentTable === 'chargingplaza1') {
        dateField = 'date';
    }
    if (currentTable === 'fastfoodchain') {
        dateField = 'date';
    }
    return data.filter(item => item[dateField] === selectedDate);
}

// Filter data by date (called from select change)
function filterByDate() {
    if (currentTable) {
        // Get processed data for current table
        let processedData;
        if (currentTable === 'fr_energy_hubs') {
            processedData = processFacilityData(allTablesData[currentTable].rows);
        } 
        else if (currentTable === 'chargingplaza1') {
            processedData = processChargingplaza1Data(allTablesData[currentTable].rows);
        }
        else if (currentTable === 'fastfoodchain') {
            processedData = processfastfoodchainData(allTablesData[currentTable].rows);
        }
        else if (currentTable === 'fieten') {
            processedData = processFietenData(allTablesData[currentTable].rows);
        } else if (currentTable === 'zem') {
            processedData = processZemData(allTablesData[currentTable].rows);
        } 
         else if (currentTable === 'hotel') {
            processedData = processHotelData(allTablesData[currentTable].rows);
        } 
        
        // else if (currentTable === 'users' || currentTable === 'parties') {
        //     processedData = allTablesData[currentTable].rows.map((row, index) => {
        //         const rowData = {};
        //         allTablesData[currentTable].columns.forEach((col, i) => {
        //             rowData[col] = row[i];
        //         });
        //         return rowData;
        //     });
        // }
        
        // Update table with new filter
        updateTable(processedData);
        
        // Update chart with new filter
        createOrUpdateChart(processedData, currentTable);
        
        // Update chart title
        document.getElementById('currentChartTitle').textContent = currentTable.charAt(0).toUpperCase() + currentTable.slice(1) + ' ' + getViewTitle();
    }
}

// Generate table headers
function generateTableHeaders(columns) {
    const headerRow = document.getElementById('tableHeader');
    headerRow.innerHTML = '';
    
    const row = document.createElement('tr');
    
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' ');
        row.appendChild(th);
    });
    
    headerRow.appendChild(row);
}

// Display table data with pagination
function displayTableData(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = data.slice(start, end);
    
    if (pageData.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = Object.keys(data[0] || {}).length || 5;
        td.textContent = "No data found";
        td.style.textAlign = "center";
        tr.appendChild(td);
        tableBody.appendChild(tr);
        return;
    }
    
    pageData.forEach(item => {
        const tr = document.createElement('tr');
        
        // Add all properties to table row
        Object.values(item).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
    });
}

// Generate pagination controls
function generatePagination(pageCount) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (pageCount <= 1) return;
    
    // Previous button
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.onclick = function() {
            currentPage--;
            filterByDate();
        };
        pagination.appendChild(prevButton);
    }
    
    // Page numbers (limit to show 5 pages at a time)
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(pageCount, startPage + maxPages - 1);
    
    // Adjust start page if we're at the end
    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.onclick = function() {
            currentPage = i;
            filterByDate();
        };
        
        if (i === currentPage) {
            button.classList.add('active');
        }
        
        pagination.appendChild(button);
    }
    
    // Next button
    if (currentPage < pageCount) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.onclick = function() {
            currentPage++;
            filterByDate();
        };
        pagination.appendChild(nextButton);
    }
}

// Create or update chart based on current data and view
function createOrUpdateChart(data, tableName) {
    const chartCanvas = document.getElementById('dataChart');
    
    // Destroy existing chart if it exists
    if (charts.dataChart) {
        charts.dataChart.destroy();
    }
    
    // Apply date filter to data first
    const filteredData = filterDataByDate(data);
    
    // Prepare chart data based on view and table
    let chartData;
    if (tableName === 'fr_energy_hubs') {
        chartData = prepareFacilityChartData(filteredData);
    } else if (tableName === 'chargingplaza1') {
        chartData = prepareChargingplaza1ChartData(filteredData);
    } 
    else if (tableName === 'fastfoodchain') {
        chartData = preparefastfoodchainChartData(filteredData);
    } 
    else if (tableName === 'fieten') {
        chartData = prepareFietenChartData(filteredData);
    } else if (tableName === 'zem') {
        chartData = prepareZemChartData(filteredData);
    } 
    else if (tableName === 'hotel') {
        chartData = prepareHotelChartData(filteredData);
    } 
    else {
        // Generic chart data preparation
        chartData = {
            data: {
                labels: ['No data available'],
                datasets: [{
                    label: 'Data',
                    data: [0],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: defaultChartOptions('No Data Available')
        };
    }
    
    // Create chart
    charts.dataChart = new Chart(chartCanvas, {
           type: (currentView === 'daily') ? 'bar' : 'line',
        data: chartData.data,
        options: chartData.options
    });
}
function prepareChargingplaza1ChartData(filteredData) {
    if (filteredData.length === 0) {
        return {
            data: {
                labels: ['No data available'],
                datasets: [{
                    label: 'No data',
                    data: [0],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: defaultChartOptions('No Data')
        };
    }
    
    // Prepare data based on view
    switch(currentView) {
        case '15min':
            return prepare15MinChargingplaza1Chart(filteredData);
        case 'daily':
            return prepareDailyChargingplaza1Chart(filteredData);
        case 'average':
            return prepareAverageChargingplaza1Chart(filteredData);
        default:
            return prepare15MinChargingplaza1Chart(filteredData);
    }
}

function prepare15MinChargingplaza1Chart(data) {
    // Sort data by time
    const sortedData = [...data].sort((a, b) => {
        const timeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
    
    // Group by 15-minute intervals
    const timeDatafast = {};
       const timeDatanormal = {};

    sortedData.forEach(item => {
        const [hours, minutes] = item.time.split(':').map(Number);
        const interval = minutes - (minutes % 15);
        const timeKey = `${hours.toString().padStart(2, '0')}:${interval.toString().padStart(2, '0')}`;
        
        if (!timeDatanormal[timeKey]) {
            timeDatanormal[timeKey] = [];
             timeDatafast[timeKey] = [];
        }
        //change this since has too value
        timeDatafast[timeKey].push(item.Total_fast_charging);
        timeDatanormal[timeKey].push(item.Total_normal_charging);
    });
    
    const times = Object.keys(timeDatafast).sort();
    const capacities = times.map(time => {
        const values = timeDatafast[time];
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    
    const capacitiesn = times.map(time => {
        const values = timeDatanormal[time];
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return {
        data: {
            labels: times,
            datasets: [{
                label: 'Available Capacity Fast (MW)',
                data: capacities,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                tension: 0.3,
               // fill: true
            },{

                 label: 'Available Capacity Normal (MW)',
                data: capacitiesn,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                tension: 0.3,
            }
        ]
        },
        options: defaultChartOptions('15-Minute Interval Capacity')
    };
}


function prepareDailyChargingplaza1Chart(data) {
    const selectedDate = document.getElementById('dateFilter').value;
    
    if (selectedDate !== 'all') {
        // Filter data for the selected date (data is already processed by processFacilityData)
        const selectedDateData = data.filter(item => {
            // Convert MM/DD/YYYY to comparable format
            const itemDate = new Date(item.date);
            const selectedDateObj = new Date(selectedDate);
            
            return itemDate.toDateString() === selectedDateObj.toDateString();
        });

        // Group by hour and sum the values
        const hourlyDatafast = {};
        const hourlyDatanormal = {};

        selectedDateData.forEach(item => {
            // Parse hour from time (HH:MM format)
            const hour = parseInt(item.time.split(':')[0]);
            
            // Initialize hour if it doesn't exist
            if (!hourlyDatafast[hour]) {
                hourlyDatafast[hour] = {
                    hour: hour,
                    total: 0,
                    count: 0 // Track number of 15-min intervals
                };
            }
             if (!hourlyDatanormal[hour]) {
                hourlyDatanormal[hour] = {
                    hour: hour,
                    total: 0,
                    count: 0
                };
            }
            
            // Add the capacity value to the hourly total
            hourlyDatafast[hour].total += item.Total_fast_charging;
            hourlyDatanormal[hour].total += item.Total_normal_charging;
            hourlyDatafast[hour].count += 1;
            hourlyDatanormal[hour].count += 1;
        });

        // Convert to array and sort by hour
        const chartData = Object.values(hourlyDatafast)
            .sort((a, b) => a.hour - b.hour)
            .map(item => ({
                hour: `${item.hour.toString().padStart(2, '0')}:00`,
                total: item.total.toFixed(2), // Round to 2 decimal places
                count: item.count
            }));
             const chartDatanormal = Object.values(hourlyDatanormal)
            .sort((a, b) => a.hour - b.hour)
            .map(item => ({
                hour: `${item.hour.toString().padStart(2, '0')}:00`,
                total: item.total.toFixed(2), // Round to 2 decimal places
                count: item.count
            }));


        // Return the chart configuration
        return {
            type: 'bar', // or 'line' depending on your preference
            data: {
                labels: chartData.map(item => item.hour),
                datasets: [{
                    label: 'Total Available Capacity Fast(Hourly)',
                     data: chartData.map(item => parseFloat((item.total/4).toFixed(2))),
                     backgroundColor: 'rgba(54, 162, 235, 0.2)',
                     borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Total Available Capacity Normal(Hourly)',
                     data: chartDatanormal.map(item => parseFloat((item.total/4).toFixed(2))),
                      backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1

                }
            ]
            },
             options: defaultChartOptions(`Average  Daily Capacity for ${selectedDate}`)
            
        };
    }
    
  
}

function prepareAverageChargingplaza1Chart(data) {
    console.log('=== SELECTED DATE AVERAGE CHART DEBUG ===');
    console.log('Input data:', data);
    console.log('Input data length:', data.length);
    
    // Get user-selected date
    const selectedDate = document.getElementById('dateFilter').value;
    console.log('User selected date:', selectedDate);
    
    if (selectedDate === 'all' || !selectedDate) {
        console.log('❌ No specific date selected');
        return null; // or show error message
    }
    
    console.log(`→ Calculating average for selected date: ${selectedDate}`);
    
    // Filter data for the selected date only
    const selectedDateData = data.filter(item => item.date === selectedDate);
    console.log(`Filtered data for ${selectedDate}:`, selectedDateData);
    console.log(`Found ${selectedDateData.length} records for ${selectedDate}`);
    
    if (selectedDateData.length === 0) {
        console.log('❌ No data found for selected date');
        return null;
    }
    
    // Calculate single average for the selected date
    const capacityValuesfast = selectedDateData.map(item => {
        console.log(`Time: ${item.time}, Capacity: ${item.Total_fast_charging}`);
        return item.Total_fast_charging;
    });

      const capacityValuesnormal = selectedDateData.map(item => {
        console.log(`Time: ${item.time}, Capacity: ${item.Total_normal_charging}`);
        return item.Total_normal_charging;
    });

    const totalCapacityfast = capacityValuesfast.reduce((sum, val) => sum + val, 0);
    const averageCapacityfast = totalCapacityfast / capacityValuesfast.length;
    console.log(`Total capacity for fast charging on ${selectedDate}: ${averageCapacityfast}`);

    const totalCapacitynormal = capacityValuesnormal.reduce((sum, val) => sum + val, 0);
    const averageCapacitynormal = totalCapacitynormal / capacityValuesnormal.length;
    

    // console.log('\n=== CALCULATION RESULTS ===');
    // console.log(`Date: ${selectedDate}`);
    // console.log(`Total data points: ${capacityValues.length}`);
    // console.log(`All capacity values: [${capacityValues.slice(0, 10).join(', ')}${capacityValues.length > 10 ? '...' : ''}]`);
    // console.log(`Total sum: ${totalCapacity}`);
    // console.log(`Average calculation: ${totalCapacity} ÷ ${capacityValues.length} = ${averageCapacity.toFixed(2)} MW`);
    
    // Return chart with single data point
    return {
        type: 'bar', // or 'line' depending on your preference
         
        data: {
            
            labels: [selectedDate,averageCapacityfast], // Single label
            datasets: [{
                label: `Fast Average Capacity for ${selectedDate} (MW)`,
                data: [averageCapacityfast,averageCapacityfast], // Single data point
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                 
                // tension: 0,
               // fill: true
            },
            {
                labels: [selectedDate,averageCapacitynormal], // Single label
                label: `Normal Average Capacity for ${selectedDate} (MW)`,
                data: [averageCapacitynormal,averageCapacitynormal], // Single data point
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                tension: 0,
                 
                // fill: true
            }

        ]

        },
        options: defaultChartOptions(`Average  Daily Capacity for ${selectedDate}`)
    };
}




function preparefastfoodchainChartData(filteredData) {
    if (filteredData.length === 0) {
        return {
            data: {
                labels: ['No data available'],
                datasets: [{
                    label: 'No data',
                    data: [0],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: defaultChartOptions('No Data')
        };
    }
    
    // Prepare data based on view
    switch(currentView) {
        case '15min':
            return prepare15MinfastfoodchainChart(filteredData);
        case 'daily':
            return prepareDailyfastfoodchainChart(filteredData);
        case 'average':
            return prepareAveragefastfoodchainChart(filteredData);
        default:
            return prepare15MinfastfoodchainChart(filteredData);
    }
}

function prepare15MinfastfoodchainChart(data) {
    // Sort data by time
    const sortedData = [...data].sort((a, b) => {
        const timeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
    
    // Group by 15-minute intervals
    const timeDatadirect = {};
       const timeDataheating = {};
       const timeDataairco = {};

    sortedData.forEach(item => {
        const [hours, minutes] = item.time.split(':').map(Number);
        const interval = minutes - (minutes % 15);
        const timeKey = `${hours.toString().padStart(2, '0')}:${interval.toString().padStart(2, '0')}`;
        
       if (!timeDatadirect[timeKey]) {
            timeDatadirect[timeKey] = [];
        }
        if (!timeDataheating[timeKey]) {
            timeDataheating[timeKey] = [];
        }
        if (!timeDataairco[timeKey]) {
            timeDataairco[timeKey] = [];
}
        //change this since has too value
        timeDatadirect[timeKey].push(item.Directe);
        timeDataheating[timeKey].push(item.Heating);
         timeDataairco[timeKey].push(item.airco);
    });
    
    const times = Object.keys(timeDatadirect).sort();

    const direct = times.map(time => {
        const values = timeDatadirect[time];
        return values.reduce((sum, val) => sum + val, 0);
    });

    const heating = times.map(time => {
        const values = timeDataheating[time];
        return values.reduce((sum, val) => sum + val, 0) ;
    });

      const airco = times.map(time => {
        const values = timeDataairco[time];
        return values.reduce((sum, val) => sum + val, 0) ;
    });

    return {
        data: {
            labels: times,
            datasets: [{
                label: 'Direct',
                data: direct,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                tension: 0.3,
               // fill: true
            },{

                 label: '  Heating ',
                data: heating,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                tension: 0.3,
            },{
                label: ' Air Conditioning ',
                data: airco,
                backgroundColor: 'rgba(255, 64, 166, 0.2)',
                borderColor: 'rgb(205, 11, 53)',
                borderWidth: 1,
                tension: 0.3,
            }]
        },
        options: defaultChartOptions('15-Minute Interval ')
    };
}


function prepareDailyfastfoodchainChart(data) {
    //should be added later

    // const selectedDate = document.getElementById('dateFilter').value;
    
    // if (selectedDate !== 'all') {
    //     // Filter data for the selected date (data is already processed by processFacilityData)
    //     const selectedDateData = data.filter(item => {
    //         // Convert MM/DD/YYYY to comparable format
    //         const itemDate = new Date(item.date);
    //         const selectedDateObj = new Date(selectedDate);
            
    //         return itemDate.toDateString() === selectedDateObj.toDateString();
    //     });

    //     // Group by hour and sum the values
    //     const hourlyDatafast = {};
    //     const hourlyDatanormal = {};

    //     selectedDateData.forEach(item => {
    //         // Parse hour from time (HH:MM format)
    //         const hour = parseInt(item.time.split(':')[0]);
            
    //         // Initialize hour if it doesn't exist
    //         if (!hourlyDatafast[hour]) {
    //             hourlyDatafast[hour] = {
    //                 hour: hour,
    //                 total: 0,
    //                 count: 0 // Track number of 15-min intervals
    //             };
    //         }
    //          if (!hourlyDatanormal[hour]) {
    //             hourlyDatanormal[hour] = {
    //                 hour: hour,
    //                 total: 0,
    //                 count: 0
    //             };
    //         }
            
    //         // Add the capacity value to the hourly total
    //         hourlyDatafast[hour].total += item.Total_fast_charging;
    //         hourlyDatanormal[hour].total += item.Total_normal_charging;
    //         hourlyDatafast[hour].count += 1;
    //         hourlyDatanormal[hour].count += 1;
    //     });

    //     // Convert to array and sort by hour
    //     const chartData = Object.values(hourlyDatafast)
    //         .sort((a, b) => a.hour - b.hour)
    //         .map(item => ({
    //             hour: `${item.hour.toString().padStart(2, '0')}:00`,
    //             total: item.total.toFixed(2), // Round to 2 decimal places
    //             count: item.count
    //         }));
    //          const chartDatanormal = Object.values(hourlyDatanormal)
    //         .sort((a, b) => a.hour - b.hour)
    //         .map(item => ({
    //             hour: `${item.hour.toString().padStart(2, '0')}:00`,
    //             total: item.total.toFixed(2), // Round to 2 decimal places
    //             count: item.count
    //         }));


    //     // Return the chart configuration
    //     return {
    //         type: 'bar', // or 'line' depending on your preference
    //         data: {
    //             labels: chartData.map(item => item.hour),
    //             datasets: [{
    //                 label: 'Total Available Capacity Fast(Hourly)',
    //                  data: chartData.map(item => parseFloat((item.total/4).toFixed(2))),
    //                  backgroundColor: 'rgba(54, 162, 235, 0.2)',
    //                  borderColor: 'rgba(54, 162, 235, 1)',
    //                 borderWidth: 1
    //             },
    //             {
    //                 label: 'Total Available Capacity Normal(Hourly)',
    //                  data: chartDatanormal.map(item => parseFloat((item.total/4).toFixed(2))),
    //                   backgroundColor: 'rgba(153, 102, 255, 0.2)',
    //                 borderColor: 'rgba(153, 102, 255, 1)',
    //                 borderWidth: 1

    //             }
    //         ]
    //         },
    //          options: defaultChartOptions(`Average  Daily Capacity for ${selectedDate}`)
            
    //     };
    // }
    
  
}

function prepareAveragefastfoodchainChart(data) {
    //should be added later

    // console.log('=== SELECTED DATE AVERAGE CHART DEBUG ===');
    // console.log('Input data:', data);
    // console.log('Input data length:', data.length);
    
    // // Get user-selected date
    // const selectedDate = document.getElementById('dateFilter').value;
    // console.log('User selected date:', selectedDate);
    
    // if (selectedDate === 'all' || !selectedDate) {
    //     console.log('❌ No specific date selected');
    //     return null; // or show error message
    // }
    
    // console.log(`→ Calculating average for selected date: ${selectedDate}`);
    
    // // Filter data for the selected date only
    // const selectedDateData = data.filter(item => item.date === selectedDate);
    // console.log(`Filtered data for ${selectedDate}:`, selectedDateData);
    // console.log(`Found ${selectedDateData.length} records for ${selectedDate}`);
    
    // if (selectedDateData.length === 0) {
    //     console.log('❌ No data found for selected date');
    //     return null;
    // }
    
    // // Calculate single average for the selected date
    // const capacityValuesfast = selectedDateData.map(item => {
    //     console.log(`Time: ${item.time}, Capacity: ${item.Total_fast_charging}`);
    //     return item.Total_fast_charging;
    // });

    //   const capacityValuesnormal = selectedDateData.map(item => {
    //     console.log(`Time: ${item.time}, Capacity: ${item.Total_normal_charging}`);
    //     return item.Total_normal_charging;
    // });

    // const totalCapacityfast = capacityValuesfast.reduce((sum, val) => sum + val, 0);
    // const averageCapacityfast = totalCapacityfast / capacityValuesfast.length;
    // console.log(`Total capacity for fast charging on ${selectedDate}: ${averageCapacityfast}`);

    // const totalCapacitynormal = capacityValuesnormal.reduce((sum, val) => sum + val, 0);
    // const averageCapacitynormal = totalCapacitynormal / capacityValuesnormal.length;
    

    // // console.log('\n=== CALCULATION RESULTS ===');
    // // console.log(`Date: ${selectedDate}`);
    // // console.log(`Total data points: ${capacityValues.length}`);
    // // console.log(`All capacity values: [${capacityValues.slice(0, 10).join(', ')}${capacityValues.length > 10 ? '...' : ''}]`);
    // // console.log(`Total sum: ${totalCapacity}`);
    // // console.log(`Average calculation: ${totalCapacity} ÷ ${capacityValues.length} = ${averageCapacity.toFixed(2)} MW`);
    
    // // Return chart with single data point
    // return {
    //     type: 'bar', // or 'line' depending on your preference
         
    //     data: {
            
    //         labels: [selectedDate,averageCapacityfast], // Single label
    //         datasets: [{
    //             label: `Fast Average Capacity for ${selectedDate} (MW)`,
    //             data: [averageCapacityfast,averageCapacityfast], // Single data point
    //             backgroundColor: 'rgba(54, 162, 235, 0.2)',
    //             borderColor: 'rgba(54, 162, 235, 1)',
    //             borderWidth: 1,
                 
    //             // tension: 0,
    //            // fill: true
    //         },
    //         {
    //             labels: [selectedDate,averageCapacitynormal], // Single label
    //             label: `Normal Average Capacity for ${selectedDate} (MW)`,
    //             data: [averageCapacitynormal,averageCapacitynormal], // Single data point
    //             backgroundColor: 'rgba(153, 102, 255, 0.2)',
    //                 borderColor: 'rgba(153, 102, 255, 1)',
    //             borderWidth: 1,
    //             tension: 0,
                 
    //             // fill: true
    //         }

    //     ]

    //     },
    //     options: defaultChartOptions(`Average  Daily Capacity for ${selectedDate}`)
    // };
}



// Prepare chart data for facility table
function prepareFacilityChartData(filteredData) {
    if (filteredData.length === 0) {
        return {
            data: {
                labels: ['No data available'],
                datasets: [{
                    label: 'No data',
                    data: [0],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: defaultChartOptions('No Data')
        };
    }
    
    // Prepare data based on view
    switch(currentView) {
        case '15min':
            return prepare15MinFacilityChart(filteredData);
        case 'daily':
            return prepareDailyFacilityChart(filteredData);
        case 'average':
            return prepareAverageFacilityChart(filteredData);
        default:
            return prepare15MinFacilityChart(filteredData);
    }
}

// Prepare 15-minute interval chart for facility data
function prepare15MinFacilityChart(data) {
    // Sort data by time
    const sortedData = [...data].sort((a, b) => {
        const timeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
    
    // Group by 15-minute intervals
    const timeData = {};
    sortedData.forEach(item => {
        const [hours, minutes] = item.time.split(':').map(Number);
        const interval = minutes - (minutes % 15);
        const timeKey = `${hours.toString().padStart(2, '0')}:${interval.toString().padStart(2, '0')}`;
        
        if (!timeData[timeKey]) {
            timeData[timeKey] = [];
        }
        timeData[timeKey].push(item.Available_capacity_space);
    });
    
    // Calculate average for each interval
    const times = Object.keys(timeData).sort();
    const capacities = times.map(time => {
        const values = timeData[time];
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    return {
        data: {
            labels: times,
            datasets: [{
                label: 'Available Capacity (MW)',
                data: capacities,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                tension: 0.3,
               // fill: true
            }]
        },
        options: defaultChartOptions('15-Minute Interval Capacity')
    };
}

// Prepare daily chart for facility data
function prepareDailyFacilityChart(data) {
    const selectedDate = document.getElementById('dateFilter').value;
    
    if (selectedDate !== 'all') {
        // Filter data for the selected date (data is already processed by processFacilityData)
        const selectedDateData = data.filter(item => {
            // Convert MM/DD/YYYY to comparable format
            const itemDate = new Date(item.date);
            const selectedDateObj = new Date(selectedDate);
            
            return itemDate.toDateString() === selectedDateObj.toDateString();
        });

        // Group by hour and sum the values
        const hourlyData = {};
        
        selectedDateData.forEach(item => {
            // Parse hour from time (HH:MM format)
            const hour = parseInt(item.time.split(':')[0]);
            
            // Initialize hour if it doesn't exist
            if (!hourlyData[hour]) {
                hourlyData[hour] = {
                    hour: hour,
                    total: 0,
                    count: 0 // Track number of 15-min intervals
                };
            }
            
            // Add the capacity value to the hourly total
            hourlyData[hour].total += item.Available_capacity_space;
            hourlyData[hour].count += 1;
        });

        // Convert to array and sort by hour
        const chartData = Object.values(hourlyData)
            .sort((a, b) => a.hour - b.hour)
            .map(item => ({
                hour: `${item.hour.toString().padStart(2, '0')}:00`,
                total: item.total.toFixed(2), // Round to 2 decimal places
                count: item.count
            }));

        // Return the chart configuration
        return {
            type: 'bar', // or 'line' depending on your preference
            data: {
                labels: chartData.map(item => item.hour),
                datasets: [{
                    label: 'Total Available Capacity (Hourly)',
                     data: chartData.map(item => parseFloat((item.total/4).toFixed(2))),
                     backgroundColor: 'rgba(54, 162, 235, 0.2)',
                     borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
             options: defaultChartOptions(`Average  Daily Capacity for ${selectedDate}`)
            
        };
    }
    
    // If 'all' is selected, return your original daily chart logic here
    // ... existing daily chart code
}

// // Prepare hourly chart for facility data (for single date)
// function prepareHourlyFacilityChart(data) {
//     // Group by hour
//     const hourlyData = {};
//     data.forEach(item => {
//         const hour = item.time.split(':')[0];
//         if (!hourlyData[hour]) {
//             hourlyData[hour] = [];
//         }
//         hourlyData[hour].push(item.available_capacity);
//     });
    
//     // Calculate average for each hour
//     const hours = Object.keys(hourlyData).sort();
//     const avgCapacities = hours.map(hour => {
//         const values = hourlyData[hour];
//         return values.reduce((sum, val) => sum + val, 0) / values.length;
//     });
    
//     return {
//         data: {
//             labels: hours.map(h => `${h}:00`),
//             datasets: [{
//                 label: 'Hourly Average Capacity (MW)',
//                 data: avgCapacities,
//                 backgroundColor: 'rgba(75, 192, 192, 0.6)',
//                 borderColor: 'rgba(75, 192, 192, 1)',
//                 borderWidth: 1
//             }]
//         },
//         options: defaultChartOptions('Hourly Average Capacity')
//     };
// }

function prepareAverageFacilityChart(data) {
    console.log('=== SELECTED DATE AVERAGE CHART DEBUG ===');
    console.log('Input data:', data);
    console.log('Input data length:', data.length);
    
    // Get user-selected date
    const selectedDate = document.getElementById('dateFilter').value;
    console.log('User selected date:', selectedDate);
    
    if (selectedDate === 'all' || !selectedDate) {
        console.log('❌ No specific date selected');
        return null; // or show error message
    }
    
    console.log(`→ Calculating average for selected date: ${selectedDate}`);
    
    // Filter data for the selected date only
    const selectedDateData = data.filter(item => item.date === selectedDate);
    console.log(`Filtered data for ${selectedDate}:`, selectedDateData);
    console.log(`Found ${selectedDateData.length} records for ${selectedDate}`);
    
    if (selectedDateData.length === 0) {
        console.log('❌ No data found for selected date');
        return null;
    }
    
    // Calculate single average for the selected date
    const capacityValues = selectedDateData.map(item => {
        console.log(`Time: ${item.time}, Capacity: ${item.Available_capacity_space}`);
        return item.Available_capacity_space;
    });
    
    const totalCapacity = capacityValues.reduce((sum, val) => sum + val, 0);
    const averageCapacity = totalCapacity / capacityValues.length;
    
    console.log('\n=== CALCULATION RESULTS ===');
    console.log(`Date: ${selectedDate}`);
    console.log(`Total data points: ${capacityValues.length}`);
    console.log(`All capacity values: [${capacityValues.slice(0, 10).join(', ')}${capacityValues.length > 10 ? '...' : ''}]`);
    console.log(`Total sum: ${totalCapacity}`);
    console.log(`Average calculation: ${totalCapacity} ÷ ${capacityValues.length} = ${averageCapacity.toFixed(2)} MW`);
    
    // Return chart with single data point
    return {
        data: {
            labels: [selectedDate,averageCapacity], // Single label
            datasets: [{
                label: `Average Capacity for ${selectedDate} (MW)`,
                data: [averageCapacity,averageCapacity,averageCapacity,averageCapacity], // Single data point
                 backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                tension: 0,
               // fill: true
            }]

        },
        options: defaultChartOptions(`Average  Daily Capacity for ${selectedDate}`)
    };
}

// Prepare chart data for fieten table
function prepareFietenChartData(filteredData) {
    if (filteredData.length === 0) {
        return {
            data: {
                labels: ['No data available'],
                datasets: [{
                    label: 'No data',
                    data: [0],
                     backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: defaultChartOptions('No Data')
        };
    }
    
    // Prepare data based on view
    switch(currentView) {
        case '15min':
            return prepare15MinFietenChart(filteredData);
        case 'daily':
            return prepareDailyFietenChart(filteredData);
        case 'average':
            return prepareAverageFietenChart(filteredData);
        default:
            return prepare15MinFietenChart(filteredData);
    }
}

function prepareHotelChartData(filteredData) {
    if (filteredData.length === 0) {
        return {
            data: {
                labels: ['No data available'],
                datasets: [{
                    label: 'No data',
                    data: [0],
                     backgroundColor: 'rgba(54, 162, 235, 0.2)',
                     borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: defaultChartOptions('No Data')
        };
    }

    // Prepare data based on view
    let chartConfig = null;
    
    switch(currentView) {
        case '15min': // This is actually hourly for ZEM
            chartConfig = prepareHourlyHotelChart(filteredData);
            break;
        case 'daily':
            chartConfig = prepareDailyHotelChart(filteredData);
            // Handle null return from prepareDailyZemChart
            if (chartConfig === null) {
                return null; // Pass the null up the chain
            }
            break;
        case 'average':
           
                // chartConfig = prepareDailyTotalHotelChart(filteredData);
                chartConfig = prepareAverageHotelChart(filteredData);
            break;

        default:
            chartConfig = prepareHourlyHotelChart(filteredData);
         
            
            break;
    }
    
    return chartConfig;
}




function prepareDailyHotelChart(data) {
    // For single date view, show hourly data instead
    const selectedDate = document.getElementById('dateFilter').value;
    if (!selectedDate) {
        
        return null;
    }
    else if (selectedDate !== 'all' && selectedDate) {
        return prepareHourlyHotelChart(data);
    }
    
    // Group by date
    const dailyData = {};
    data.forEach(item => {
        const date = item.date || 'Unknown';
        if (!dailyData[date]) {
            dailyData[date] = [];
        }
        dailyData[date].push(item.energy_distributtion);
    });
    
    // Calculate average for each date
    const dates = Object.keys(dailyData).sort();
    const avgEnergy = dates.map(date => {
        const values = dailyData[date];
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    return {
        data: {
            labels: dates,
            datasets: [{
                label: 'Average Energy Consumption (kWh)',
                data: avgEnergy,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1

            }]
        },
        options: defaultChartOptions('Daily Average Energy Consumption {') + (selectedDate ? ` for ${selectedDate}` : '')
    };
}

function prepareDailyTotalHotelChart(data, selectedDate) {
    // Filter data for the selected date
    const dayData = data.filter(item => item.date === selectedDate);
    console.log(`Filtered data for ${selectedDate}:`, dayData);

    // if (selectedDate !== 'all') {
    //     return prepareDailyTotalHotelChart(data, selectedDate);
    // }
    
    // Calculate total for the day
    const totalEnergy = dayData.reduce((sum, item) => sum + item.energy_distributtion, 0)/dayData.length; 
    console.log(`Total energy for ${selectedDate}: ${totalEnergy} kWh`);
    
    return {
        type: 'line', 
        data: {
            labels: [selectedDate,totalEnergy],
           // labels: [selectedDate],
            datasets: [{
                label: 'Total Daily Average Energy Consumption',
                data: [totalEnergy, totalEnergy, totalEnergy, totalEnergy], // Repeat to create a line
               backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                fill: false,
                //tension: 0 
            }]
        },
        options: defaultChartOptions(`Avrage Energy Consumption for ${selectedDate}`)
    };
}


function prepareHourlyHotelChart(data) {
    
    // Sort data by time
    const sortedData = [...data].sort((a, b) => {
        const timeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
    
   
    const labels = sortedData.map(item => item.time);
    const energyValues = sortedData.map(item => item.energy_distributtion);
    
    const selectedDate = document.getElementById('dateFilter').value;
    return {
        data: {
            labels: labels,
            datasets: [{
                label: `Energy Consumption `,
                data: energyValues,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                tension: 0.3,
              //  fill: true
            }]
        },
        options: defaultChartOptions(`Hourly Energy Consumption for ${selectedDate}`)
    };
}

function prepareAverageHotelChart(data) {
    // If single date selected, show total energy for that date
    const selectedDate = document.getElementById('dateFilter').value;
    if (selectedDate !== 'all') {
        return prepareDailyTotalHotelChart(data, selectedDate);
    }
}


function prepareHourlyZemChart(data) {
    // Sort data by time
    const sortedData = [...data].sort((a, b) => {
        const timeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
    
   
    const labels = sortedData.map(item => item.time);
    const energyValues = sortedData.map(item => item.energy);
    
    return {
        data: {
            labels: labels,
            datasets: [{
                label: 'Energy Consumption (kWh)',
                data: energyValues,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                tension: 0.3,
              //  fill: true
            }]
        },
        options: defaultChartOptions('Hourly Energy Consumption ')
    };
}




function prepareZemChartData(filteredData) {
    if (filteredData.length === 0) {
        return {
            data: {
                labels: ['No data available'],
                datasets: [{
                    label: 'No data',
                    data: [0],
                     backgroundColor: 'rgba(54, 162, 235, 0.2)',
                     borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: defaultChartOptions('No Data')
        };
    }

    // Prepare data based on view
    let chartConfig = null;
    
    switch(currentView) {
        case '15min': // This is actually hourly for ZEM
            chartConfig = prepareHourlyZemChart(filteredData);
            break;
        case 'daily':
            chartConfig = prepareDailyZemChart(filteredData);
            // Handle null return from prepareDailyZemChart
            if (chartConfig === null) {
                return null; // Pass the null up the chain
            }
            break;
        case 'average':
            chartConfig = prepareAverageZemChart(filteredData);
            break;
        default:
            chartConfig = prepareHourlyZemChart(filteredData);
         
            
            break;
    }
    
    return chartConfig;
}

// Prepare hourly chart for ZEM data (ZEM data is hourly, not 15-minute)
function prepareHourlyZemChart(data) {
    // Sort data by time
    const sortedData = [...data].sort((a, b) => {
        const timeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
    
    // For ZEM, data is already hourly, so just use it directly
    const labels = sortedData.map(item => item.time);
    const energyValues = sortedData.map(item => item.energy);
    
    return {
        data: {
            labels: labels,
            datasets: [{
                label: 'Energy Consumption (kWh)',
                data: energyValues,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                tension: 0.3,
              //  fill: true
            }]
        },
        options: defaultChartOptions('Hourly Energy Consumption ')
    };
}

// Prepare daily chart for ZEM data
function prepareDailyZemChart(data) {
    // For single date view, show hourly data instead
    const selectedDate = document.getElementById('dateFilter').value;
    if (!selectedDate) {
        
        return null;
    }
    else if (selectedDate !== 'all' && selectedDate) {
        return prepareHourlyZemChart(data);
    }
    
    // Group by date
    const dailyData = {};
    data.forEach(item => {
        const date = item.date || 'Unknown';
        if (!dailyData[date]) {
            dailyData[date] = [];
        }
        dailyData[date].push(item.energy);
    });
    
    // Calculate average for each date
    const dates = Object.keys(dailyData).sort();
    const avgEnergy = dates.map(date => {
        const values = dailyData[date];
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    return {
        data: {
            labels: dates,
            datasets: [{
                label: 'Average Energy Consumption (kWh)',
                data: avgEnergy,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1

            }]
        },
        options: defaultChartOptions('Daily Average Energy Consumption')
    };
}

// Prepare average chart for ZEM data (hourly averages across all dates)
// function prepareAverageZemChart(data) {
//     // If single date selected, show hourly data for that date
//     const selectedDate = document.getElementById('dateFilter').value;
//     if (selectedDate !== 'all') {
//         return prepareHourlyZemChart(data);
//     }
    
//     // Group by date first
//     const dateData = {};
//     data.forEach(item => {
//         if (!dateData[item.date]) {
//             dateData[item.date] = {};
//         }
        
//         // Then by hour
//         const hour = item.time.split(':')[0];
//         if (!dateData[item.date][hour]) {
//             dateData[item.date][hour] = [];
//         }
        
//         dateData[item.date][hour].push(item.energy);
//     });
    
//     // Calculate hourly averages across all dates
//     const hourlyAverages = {};
//     for (let hour = 0; hour < 24; hour++) {
//         const hourStr = hour.toString().padStart(2, '0');
//         let values = [];
        
//         Object.keys(dateData).forEach(date => {
//             if (dateData[date][hourStr]) {
//                 values = values.concat(dateData[date][hourStr]);
//             }
//         });
        
//         if (values.length > 0) {
//             hourlyAverages[hourStr] = values.reduce((sum, val) => sum + val, 0) / values.length;
//         } else {
//             hourlyAverages[hourStr] = 0;
//         }
//     }
    
//     // Prepare chart data
//     const hours = Object.keys(hourlyAverages).sort();
//     const averages = hours.map(hour => hourlyAverages[hour]);
    
//     return {
//         data: {
//             labels: hours.map(h => `${h}:00`),
//             datasets: [{
//                 label: 'Average Energy Consumption By Hour (kWh)',
//                 data: averages,
//                 backgroundColor: 'rgba(153, 102, 255, 0.2)',
//                 borderColor: 'rgba(153, 102, 255, 1)',
//                 borderWidth: 2,
//                 tension: 0.3,
//                 fill: true
//             }]
//         },
//         options: defaultChartOptions('Average Energy Consumption By Hour')
//     };
// }


function prepareAverageZemChart(data) {
    // If single date selected, show total energy for that date
    const selectedDate = document.getElementById('dateFilter').value;
    if (selectedDate !== 'all') {
        return prepareDailyTotalZemChart(data, selectedDate);
    }
    
    // // Group by date and calculate total daily energy
    // const dailyTotals = {};
    // data.forEach(item => {
    //     if (!dailyTotals[item.date]) {
    //         dailyTotals[item.date] = 0;
    //     }
        
    //     // Sum all energy values for each date
    //     dailyTotals[item.date] += item.energy;
    // });
    
    // // Prepare chart data - sorted by date
    // const dates = Object.keys(dailyTotals).sort();
    // const totals = dates.map(date => dailyTotals[date]);
    
    // return {
    //     data: {
    //         labels: dates,
    //         datasets: [{
    //             label: 'Total Daily Energy Consumption (kWh)',
    //             data: totals,
    //             backgroundColor: 'rgba(75, 192, 192, 0.6)',
    //             borderColor: 'rgba(75, 192, 192, 1)',
    //             borderWidth: 2,
    //             tension: 0.3,
    //             fill: true
    //         }]
    //     },
    //     options: defaultChartOptions('Total Daily Energy Consumption')
    // };
}



function prepareDailyTotalZemChart(data, selectedDate) {
    // Filter data for the selected date
    const dayData = data.filter(item => item.date === selectedDate);
    
    // Calculate total for the day
    const totalEnergy = (dayData.reduce((sum, item) => sum + item.energy, 0))/24 ;
    
    return {
        type: 'line', 
        data: {
            labels: [selectedDate, totalEnergy],
           // labels: [selectedDate],
            datasets: [{
                label: 'Total Daily Avrage Energy Consumption (kWh)',
                data: [totalEnergy, totalEnergy],
               backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                fill: false,
                //tension: 0 
            }]
        },
        options: defaultChartOptions(`Avrage Energy Consumption for ${selectedDate}`)
    };
}
// Prepare 15-minute interval chart for fieten data
function prepare15MinFietenChart(data) {
    // Sort data by time
    const sortedData = [...data].sort((a, b) => {
        const timeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
    
    // Group by 15-minute intervals
    const timeData = {};
     //  const timeDatanormal = {};

    sortedData.forEach(item => {
        const [hours, minutes] = item.time.split(':').map(Number);
        const interval = minutes - (minutes % 15);
        const timeKey = `${hours.toString().padStart(2, '0')}:${interval.toString().padStart(2, '0')}`;

        if (!timeData[timeKey]) {
            timeData[timeKey] = [];
        }
        //change this since has too value
        timeData[timeKey].push(item.estimated_energy_consumptionkWh);
       // timeData[timeKey].push(item.Total_normal_charging);
    });

    const times = Object.keys(timeData).sort();
    const capacities = times.map(time => {
        const values = timeData[time];
        return values.reduce((sum, val) => sum + val, 0) ;
    });
    
    
  
    return {
        data: {
            labels: times,
            datasets: [{
                label: 'Available estimated Energy Consumption (kWh)',
                data: capacities,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                tension: 0.3,
               // fill: true
            }
        ]
        },
        options: defaultChartOptions('15-Minute Interval Energy Consumption')
    };
}

// Prepare daily chart for fieten data
function prepareDailyFietenChart(data) {
    const selectedDate = document.getElementById('dateFilter').value;
    
    if (selectedDate !== 'all') {
        // Filter data for the selected date (data is already processed by processFacilityData)
        const selectedDateData = data.filter(item => {
            // Convert MM/DD/YYYY to comparable format
            const itemDate = new Date(item.date);
            const selectedDateObj = new Date(selectedDate);
            
            return itemDate.toDateString() === selectedDateObj.toDateString();
        });

        // Group by hour and sum the values
        const hourlyData = {};

        selectedDateData.forEach(item => {
            // Parse hour from time (HH:MM format)
            const hour = parseInt(item.time.split(':')[0]);
            
            // Initialize hour if it doesn't exist
            if (!hourlyData[hour]) {
                hourlyData[hour] = {
                    hour: hour,
                    total: 0,
                    count: 0 // Track number of 15-min intervals
                };
            }
            
            // Add the capacity value to the hourly total
            hourlyData[hour].total += item.estimated_energy_consumptionkWh;
            hourlyData[hour].count += 1;
        });

        // Convert to array and sort by hour
        const chartData = Object.values(hourlyData)
            .sort((a, b) => a.hour - b.hour)
            .map(item => ({
                hour: `${item.hour.toString().padStart(2, '0')}:00`,
                total: item.total.toFixed(2), // Round to 2 decimal places
                count: item.count
            }));
            


        // Return the chart configuration
        return {
            type: 'bar', // or 'line' depending on your preference
            data: {
                labels: chartData.map(item => item.hour),
                datasets: [{
                    label: 'Total Available estimated Energy Consumption (kWh)',
                     data: chartData.map(item => parseFloat((item.total/4).toFixed(2))),
                     backgroundColor: 'rgba(54, 162, 235, 0.2)',
                     borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
            },
             options: defaultChartOptions(`Average Daily Capacity for ${selectedDate}`)

        };
    }
    
  
}



function prepareAverageFietenChart(data) {
    console.log('=== SELECTED DATE AVERAGE CHART DEBUG ===');
    console.log('Input data:', data);
    console.log('Input data length:', data.length);
    
    // Get user-selected date
    const selectedDate = document.getElementById('dateFilter').value;
    console.log('User selected date:', selectedDate);
    
    if (selectedDate === 'all' || !selectedDate) {
        console.log('❌ No specific date selected');
        return null; // or show error message
    }
    
    console.log(`→ Calculating average for selected date: ${selectedDate}`);
    
    // Filter data for the selected date only
    const selectedDateData = data.filter(item => item.date === selectedDate);
    console.log(`Filtered data for ${selectedDate}:`, selectedDateData);
    console.log(`Found ${selectedDateData.length} records for ${selectedDate}`);
    
    if (selectedDateData.length === 0) {
        console.log('❌ No data found for selected date');
        return null;
    }
    
    // Calculate single average for the selected date
    const capacityValues = selectedDateData.map(item => {
        console.log(`Time: ${item.time}, Capacity: ${item.estimated_energy_consumptionkWh}`);
        return item.estimated_energy_consumptionkWh;
    });

      

    const totalCapacity = capacityValues.reduce((sum, val) => sum + val, 0);
    const averageCapacity = totalCapacity / capacityValues.length;

   
    // console.log('\n=== CALCULATION RESULTS ===');
    // console.log(`Date: ${selectedDate}`);
    // console.log(`Total data points: ${capacityValues.length}`);
    // console.log(`All capacity values: [${capacityValues.slice(0, 10).join(', ')}${capacityValues.length > 10 ? '...' : ''}]`);
    // console.log(`Total sum: ${totalCapacity}`);
    // console.log(`Average calculation: ${totalCapacity} ÷ ${capacityValues.length} = ${averageCapacity.toFixed(2)} MW`);
    
    // Return chart with single data point
    return {
         type: 'bar',
        data: {
            // or 'line' depending on your preference
            labels: [selectedDate,selectedDate], // Single label
            datasets: [{
                label: ` Average Capacity for ${selectedDate} (MW)`,
                data: [averageCapacity,averageCapacity], // Single data point
                 backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                // tension: 0,
               // fill: true
            }

        ]

        },
        options: defaultChartOptions(`Average  Daily Capacity for ${selectedDate}`)
    };
}


// Default chart options
function defaultChartOptions(title) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: false,
                //min: 2,
                title: {
                    display: true,
                    text: 'Value'
                }
            },
            x: {
                title: {
                     maxBarThickness: 20, 
                    display: true,
                    text: 'Time Period',
                    type: 'category',
                    //maxTicksLimit: false,  // Show all labels
                      autoSkip: false ,
                       
                            // Don't skip any labels
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: title
            },
            legend: {
                display: true
            },
            //  tooltip: {
            //     enabled: false  // This disables the tooltip
            // }
        }
    };
}

// Search data
function searchData() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    
    if (!currentTable || !allTablesData[currentTable]) {
        return;
    }
    
    // Process raw data
    let processedData;
    if (currentTable === 'fr_energy_hubs') {
        processedData = processFacilityData(allTablesData[currentTable].rows);
    } 
     else if (currentTable === 'chargingplaza1') {
        processedData = processChargingplaza1Data(allTablesData[currentTable].rows);
    } 
    else if (currentTable === 'fieten') {
        processedData = processFietenData(allTablesData[currentTable].rows);
    } else if (currentTable === 'zem') {
        processedData = processZemData(allTablesData[currentTable].rows);
    } else if (currentTable === 'hotel') {
        processedData = processHotelData(allTablesData[currentTable].rows);
    } else {
        processedData = allTablesData[currentTable].rows.map((row, index) => {
            const rowData = {};
            allTablesData[currentTable].columns.forEach((col, i) => {
                rowData[col] = row[i];
            });
            return rowData;
        });
    }
    
    // Apply date filter first
    let filteredData = filterDataByDate(processedData);
    
    // Then apply search filter
    if (searchInput) {
        filteredData = filteredData.filter(item => {
            return Object.values(item).some(value => 
                String(value).toLowerCase().includes(searchInput)
            );
        });
    }
    
    // Reset to first page
    currentPage = 1;
    
    // Update table with filtered data
    displayTableData(filteredData);
    
    // Update pagination
    generatePagination(Math.ceil(filteredData.length / rowsPerPage));
    
    // Update chart with filtered data
    createOrUpdateChart(processedData, currentTable);
}