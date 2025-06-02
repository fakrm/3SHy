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
    
    const tableNames = Object.keys(allTablesData);
    
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
            
            // Reload data with new view
            if (currentTable) {
                loadTableData(currentTable);
            }
        });
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
    
    // Update table name display and make first letter capital, Charat returns the letter at index 0 and then concatinate with the rest of string
    document.getElementById('currentTableName').textContent = tableName.charAt(0).toUpperCase() + tableName.slice(1) + ' Data';
    
    // Update chart title
    document.getElementById('currentChartTitle').textContent = tableName.charAt(0).toUpperCase() + tableName.slice(1) + ' ' + getViewTitle();
    
    // Show raw data from first page
    currentPage = 1;
    
    // Load data for selected table
    loadTableData(tableName);
}

// Get title based on current view
function getViewTitle() {
    //Switch state
    switch(currentView) {
        case '15min':
            return '15-Minute Interval Data';
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
    } else if (tableName === 'fieten') {
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


    
    else if (tableName === 'users' || tableName === 'parties') {//If the selected table was not above
        // Generic processing for other tables
        document.getElementById('intervaloptions').style.display = 'none';
         document.getElementById('textdate').style.display = 'none';
          document.getElementById('currentChartTitle').style.display = 'none';
          document.getElementById('containerch').style.display = 'none';
         
         

         
        
        processedData = tableData.rows.map((row, index) => {
            const rowData = {};
            tableData.columns.forEach((col, i) => {
                rowData[col] = row[i];
            });
            return rowData;
        });
    }
    
    // Populate date filter
    populateDateFilter(processedData, tableName);
    
    // Update table with data
    updateTable(processedData);
    
    // Create or update charts
    createOrUpdateChart(processedData, tableName);
}

// Process facility data (FR)
function processFacilityData(rows) {
    return rows.map(row => {
        return {
            id: row[0],
            party_id: row[1],
            time: row[2],
            date: row[3],
            available_capacity: parseFloat(row[4])
        };
    });
}

// Process fieten data into structured format
function processFietenData(rows) {
    return rows.map(row => {
        return {
            Date_hour: row[0],
            Time_hour: row[1],
            Energy_distribution: parseFloat(row[2]),
            kWh: parseFloat(row[3]),
            MWh: parseFloat(row[4]),
            Date_quart: row[5],
            Time_quart: row[6],
            Estimated_energy_consumption: parseFloat(row[7]),
            party_id: row[8]
        };
    });
}


//Defined fields for raw table show
function processZemData(rows) {
    return rows.map(row => {
        return {
            Date1: row[0],
            Time: row[1],
            'Energy Consumption 2023': parseFloat(row[2]) || 0,
            unknown: row[3],
            Date2: row[4],
            'Time.1': row[5],
            'Estimated Energy Consumption 2023': parseFloat(row[6]) || 0,
            Date3: row[7],
            'Time.2': row[8],
            'Estimated Energy Consumption 2024': parseFloat(row[9]) || 0,
            Date4: row[10],
            'Time.3': row[11],
            'Estimated Energy Consumption 2025': parseFloat(row[12]) || 0,
            Date5: row[13],
            'Time.4': row[14],
            'Estimated Energy Consumption 2026': parseFloat(row[15]) || 0,
            'Unnamed: 16': row[16],
            Date6: row[17],
            'Time.5': row[18],
            'Estimated Energy Consumption 2027': parseFloat(row[19]) || 0,
            Date7: row[20],
            'Time.6': row[21],
            'Estimated Energy Consumption 2028': parseFloat(row[22]) || 0,
            party_id: row[23]
        };
    });
}

// Populate date filter dropdown based on dates
//This is not correct should be based on table name and avalable dates for that specific company
/*function populateDateFilter(data, tableName) {
    const dateFilter = document.getElementById('dateFilter');
    dateFilter.innerHTML = '<option value="all">All Dates</option>';
    
    // Determine date field based on table
    let dateField = 'date';
    if (tableName === 'fieten') {
        dateField = 'Date_hour';
    }
     if (tableName === 'zem') {
        dateField = 'Date1';
    }
    if (currentTable === 'zem') {
    dateField = 'Date1';
    }
    else if (currentTable === 'zem') {
    processedData = processZemData(allTablesData[currentTable].rows);
}
    
    // Get unique dates
    const dates = [...new Set(data.map(item => item[dateField]))].sort();
    
    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        dateFilter.appendChild(option);
    });
}*/
function populateDateFilter(data, tableName) {
    const dateFilter = document.getElementById('dateFilter');
    
    if (tableName == "users" || tableName == "parties") {
        // Hide the date filter for users and parties tables
        dateFilter.style.display = 'none';
        // Optional: Also hide the label if you have one
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
            'fieten': 'Date_hour',
            'zem': 'Date1'
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
    }
}


// Update table with data
function updateTable(data) {
    // Apply date filter
    const filteredData = filterDataByDate(data);
    
    // Update table with filtered data
    displayTableData(filteredData);
    
    // Generate pagination
    generatePagination(Math.ceil(filteredData.length / rowsPerPage));
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
        dateField = 'Date_hour';
    }
     if (currentTable === 'zem') {
        dateField = 'Date1';
    }
    
    return data.filter(item => item[dateField] === selectedDate);
}

// Filter data by date (called from select change)
function filterByDate() {
    if (currentTable) {
        // Load data for current table with new filter
        updateTable(allTablesData[currentTable].rows);
        
        // Update chart with new filter
        const processedData = currentTable === 'fr_energy_hubs' 
            ? processFacilityData(allTablesData[currentTable].rows)
            : processFietenData(allTablesData[currentTable].rows);
            
        createOrUpdateChart(processedData, currentTable);
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
    
    // Prepare chart data based on view and table
    let chartData;
    if (tableName === 'fr_energy_hubs') {
        chartData = prepareFacilityChartData(data);
    } else if (tableName === 'fieten') {
        chartData = prepareFietenChartData(data);
    } 
     else if (tableName === 'zem') {
    chartData = prepareZemChartData(data);}
    
    else {
        // Generic chart data preparation
        chartData = {
            labels: ['No data available'],
            datasets: [{
                label: 'Data',
                data: [0],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        };
    }
    
    // Create chart
    charts.dataChart = new Chart(chartCanvas, {
        type: currentView === 'daily' ? 'bar' : 'line',
        data: chartData.data,
        options: chartData.options
    });
}

// Prepare chart data for facility table
function prepareFacilityChartData(data) {
    // Apply date filter
    const filteredData = filterDataByDate(data);
    
    if (filteredData.length === 0) {
        return {
            data: {
                labels: ['No data available'],
                datasets: [{
                    label: 'No data',
                    data: [0],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
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
        timeData[timeKey].push(item.available_capacity);
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
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: defaultChartOptions('15-Minute Interval Capacity')
    };
}

// Prepare daily chart for facility data
function prepareDailyFacilityChart(data) {
    // Group by date
    const dailyData = {};
    data.forEach(item => {
        if (!dailyData[item.date]) {
            dailyData[item.date] = [];
        }
        dailyData[item.date].push(item.available_capacity);
    });
    
    // Calculate average for each date
    const dates = Object.keys(dailyData).sort();
    const avgCapacities = dates.map(date => {
        const values = dailyData[date];
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    return {
        data: {
            labels: dates,
            datasets: [{
                label: 'Average Capacity (MW)',
                data: avgCapacities,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: defaultChartOptions('Daily Average Capacity')
    };
}

// Prepare average chart for facility data
function prepareAverageFacilityChart(data) {
    // Group by date first
    const dateData = {};
    data.forEach(item => {
        if (!dateData[item.date]) {
            dateData[item.date] = {};
        }
        
        // Then by hour
        const hour = item.time.split(':')[0];
        if (!dateData[item.date][hour]) {
            dateData[item.date][hour] = [];
        }
        
        dateData[item.date][hour].push(item.available_capacity);
    });
    
    // Calculate hourly averages across all dates
    const hourlyAverages = {};
    for (let hour = 0; hour < 24; hour++) {
        const hourStr = hour.toString().padStart(2, '0');
        let values = [];
        
        Object.keys(dateData).forEach(date => {
            if (dateData[date][hourStr]) {
                values = values.concat(dateData[date][hourStr]);
            }
        });
        
        if (values.length > 0) {
            hourlyAverages[hourStr] = values.reduce((sum, val) => sum + val, 0) / values.length;
        } else {
            hourlyAverages[hourStr] = 0;
        }
    }
    
    // Prepare chart data
    const hours = Object.keys(hourlyAverages).sort();
    const averages = hours.map(hour => hourlyAverages[hour]);
    
    return {
        data: {
            labels: hours.map(h => `${h}:00`),
            datasets: [{
                label: 'Average Capacity By Hour (MW)',
                data: averages,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: defaultChartOptions('Average Capacity By Hour')
    };
}

// Prepare chart data for fieten table
function prepareFietenChartData(data) {
    // Apply date filter
    const filteredData = filterDataByDate(data);
    
    if (filteredData.length === 0) {
        return {
            data: {
                labels: ['No data available'],
                datasets: [{
                    label: 'No data',
                    data: [0],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
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

function prepare15MinZemChart(data) {
    // Use Date1 and Time for primary data
    const sortedData = [...data].sort((a, b) => {
        const timeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        return timeToMinutes(a.Time) - timeToMinutes(b.Time);
    });
    
    const labels = sortedData.map(item => item.Time || 'N/A');
    
    return {
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Estimated Energy 2023 (kWh)',
                    data: sortedData.map(item => item['Estimated Energy Consumption 2023']),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Estimated Energy 2024 (kWh)',
                    data: sortedData.map(item => item['Estimated Energy Consumption 2024']),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Estimated Energy 2025 (kWh)',
                    data: sortedData.map(item => item['Estimated Energy Consumption 2025']),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Estimated Energy 2026 (kWh)',
                    data: sortedData.map(item => item['Estimated Energy Consumption 2026']),
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Estimated Energy 2027 (kWh)',
                    data: sortedData.map(item => item['Estimated Energy Consumption 2027']),
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Estimated Energy 2028 (kWh)',
                    data: sortedData.map(item => item['Estimated Energy Consumption 2028']),
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Energy Consumption (kWh)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Estimated Energy Consumption by Year (15-min intervals)'
                },
                legend: {
                    display: true
                }
            }
        }
    };
}


function prepareDailyZemChart(data) {
    // Group by date (using Date1 as primary date)
    const dailyData = {};
    data.forEach(item => {
        const date = item.Date1 || 'Unknown';
        if (!dailyData[date]) {
            dailyData[date] = {
                2023: [],
                2024: [],
                2025: [],
                2026: [],
                2027: [],
                2028: []
            };
        }
        dailyData[date][2023].push(item['Estimated Energy Consumption 2023']);
        dailyData[date][2024].push(item['Estimated Energy Consumption 2024']);
        dailyData[date][2025].push(item['Estimated Energy Consumption 2025']);
        dailyData[date][2026].push(item['Estimated Energy Consumption 2026']);
        dailyData[date][2027].push(item['Estimated Energy Consumption 2027']);
        dailyData[date][2028].push(item['Estimated Energy Consumption 2028']);
    });
    
    const dates = Object.keys(dailyData).sort();
    const years = [2023, 2024, 2025, 2026, 2027, 2028];
    const colors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(255, 206, 86, 0.6)'
    ];
    
    const datasets = years.map((year, index) => ({
        label: `Avg. Energy ${year} (kWh)`,
        data: dates.map(date => {
            const values = dailyData[date][year].filter(v => v > 0);
            return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        }),
        backgroundColor: colors[index],
        borderColor: colors[index].replace('0.6', '1'),
        borderWidth: 1
    }));
    
    return {
        data: {
            labels: dates,
            datasets: datasets
        },
        options: defaultChartOptions('Daily Average Energy Consumption by Year')
    };
}
function prepareAverageZemChart(data) {
    // Group by hour across all dates
    const hourlyData = {};
    
    // Initialize hourly data structure
    for (let hour = 0; hour < 24; hour++) {
        const hourStr = hour.toString().padStart(2, '0');
        hourlyData[hourStr] = {
            2023: [],
            2024: [],
            2025: [],
            2026: [],
            2027: [],
            2028: []
        };
    }
    
    // Process data
    data.forEach(item => {
        const time = item.Time || '00:00';
        const hour = time.split(':')[0];
        
        if (hourlyData[hour]) {
            hourlyData[hour][2023].push(item['Estimated Energy Consumption 2023']);
            hourlyData[hour][2024].push(item['Estimated Energy Consumption 2024']);
            hourlyData[hour][2025].push(item['Estimated Energy Consumption 2025']);
            hourlyData[hour][2026].push(item['Estimated Energy Consumption 2026']);
            hourlyData[hour][2027].push(item['Estimated Energy Consumption 2027']);
            hourlyData[hour][2028].push(item['Estimated Energy Consumption 2028']);
        }
    });
    
    const hours = Object.keys(hourlyData).sort();
    const years = [2023, 2024, 2025, 2026, 2027, 2028];
    const colors = [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 206, 86, 0.2)'
    ];
    
    const datasets = years.map((year, index) => ({
        label: `Avg. Energy ${year} (kWh)`,
        data: hours.map(hour => {
            const values = hourlyData[hour][year].filter(v => v > 0);
            return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        }),
        backgroundColor: colors[index],
        borderColor: colors[index].replace('0.2', '1'),
        borderWidth: 2,
        tension: 0.3,
        fill: true
    }));
    
    return {
        data: {
            labels: hours.map(h => `${h}:00`),
            datasets: datasets
        },
        options: defaultChartOptions('Average Energy Consumption by Hour and Year')
    };
}


function prepareZemChartData(data) {
    // Apply date filter
    const filteredData = filterDataByDate(data);
    
    if (filteredData.length === 0) {
        return {
            data: {
                labels: ['No data available'],
                datasets: [{
                    label: 'No data',
                    data: [0],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: defaultChartOptions('No Data')
        };
    }
    
    // Prepare data based on view
    switch(currentView) {
        case '15min':
            return prepare15MinZemChart(filteredData);
        case 'daily':
            return prepareDailyZemChart(filteredData);
        case 'average':
            return prepareAverageZemChart(filteredData);
        default:
            return prepare15MinZemChart(filteredData);
    }
}
// Prepare 15-minute interval chart for fieten data
function prepare15MinFietenChart(data) {
    // Sort data by time
    const sortedData = [...data].sort((a, b) => {
        const timeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        return timeToMinutes(a.Time_quart) - timeToMinutes(b.Time_quart);
    });
    
    const labels = sortedData.map(item => item.Time_quart);
    const energyData = sortedData.map(item => item.Estimated_energy_consumption);
    const kWhData = sortedData.map(item => item.kWh);
    
    return {
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Estimated Energy (kWh)',
                    data: energyData,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Energy (kWh)',
                    data: kWhData,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Energy (kWh)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: '15-Minute Interval Energy Consumption'
                },
                legend: {
                    display: true
                }
            }
        }
    };
}

// Prepare daily chart for fieten data
function prepareDailyFietenChart(data) {
    // Group by date
    const dailyData = {};
    data.forEach(item => {
        if (!dailyData[item.Date_hour]) {
            dailyData[item.Date_hour] = {
                energy: [],
                kWh: [],
                MWh: []
            };
        }
        dailyData[item.Date_hour].energy.push(item.Estimated_energy_consumption);
        dailyData[item.Date_hour].kWh.push(item.kWh);
        dailyData[item.Date_hour].MWh.push(item.MWh);
    });
    
    // Calculate average for each date
    const dates = Object.keys(dailyData).sort();
    const avgEnergy = dates.map(date => {
        const values = dailyData[date].energy;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    const avgKWh = dates.map(date => {
        const values = dailyData[date].kWh;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    const avgMWh = dates.map(date => {
        const values = dailyData[date].MWh;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    return {
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Avg. Estimated Energy (kWh)',
                    data: avgEnergy,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Avg. Energy (kWh)',
                    data: avgKWh,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Avg. Energy (MWh)',
                    data: avgMWh,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: defaultChartOptions('Daily Average Energy Consumption')
    };
}

// Prepare average chart for fieten data
function prepareAverageFietenChart(data) {
    // Group by date first
    const dateData = {};
    data.forEach(item => {
        if (!dateData[item.Date_hour]) {
            dateData[item.Date_hour] = {};
        }
        
        // Then by hour
        const hour = item.Time_hour.split(':')[0];
        if (!dateData[item.Date_hour][hour]) {
            dateData[item.Date_hour][hour] = {
                energy: [],
                kWh: [],
                distribution: []
            };
        }
        
        dateData[item.Date_hour][hour].energy.push(item.Estimated_energy_consumption);
        dateData[item.Date_hour][hour].kWh.push(item.kWh);
        dateData[item.Date_hour][hour].distribution.push(item.Energy_distribution);
    });
    
    // Calculate hourly averages across all dates
    const hourlyAverages = {
        energy: {},
        kWh: {},
        distribution: {}
    };
    
    for (let hour = 0; hour < 24; hour++) {
        const hourStr = hour.toString().padStart(2, '0');
        let energyValues = [];
        let kWhValues = [];
        let distributionValues = [];
        
        Object.keys(dateData).forEach(date => {
            if (dateData[date][hourStr]) {
                energyValues = energyValues.concat(dateData[date][hourStr].energy);
                kWhValues = kWhValues.concat(dateData[date][hourStr].kWh);
                distributionValues = distributionValues.concat(dateData[date][hourStr].distribution);
            }
        });
        
        if (energyValues.length > 0) {
            hourlyAverages.energy[hourStr] = energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length;
            hourlyAverages.kWh[hourStr] = kWhValues.reduce((sum, val) => sum + val, 0) / kWhValues.length;
            hourlyAverages.distribution[hourStr] = distributionValues.reduce((sum, val) => sum + val, 0) / distributionValues.length;
        } else {
            hourlyAverages.energy[hourStr] = 0;
            hourlyAverages.kWh[hourStr] = 0;
            hourlyAverages.distribution[hourStr] = 0;
        }
    }
    
    const hours = Object.keys(hourlyAverages.energy).sort();
    const energyAverages = hours.map(hour => hourlyAverages.energy[hour]);
    const kWhAverages = hours.map(hour => hourlyAverages.kWh[hour]);
    const distributionAverages = hours.map(hour => hourlyAverages.distribution[hour]);
    
    return {
        data: {
            labels: hours.map(h => `${h}:00`),
            datasets: [
                {
                    label: 'Avg. Estimated Energy (kWh)',
                    data: energyAverages,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Avg. Energy (kWh)',
                    data: kWhAverages,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Avg. Energy Distribution',
                    data: distributionAverages,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: defaultChartOptions('Average Energy By Hour')
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
                title: {
                    display: true,
                    text: 'Value'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Time Period'
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
            }
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
    } else if (currentTable === 'fieten') {
        processedData = processFietenData(allTablesData[currentTable].rows);
    } 
    else if (currentTable === 'zem') {
        processedData = processZemData(allTablesData[currentTable].rows);
    }
    else {
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
    createOrUpdateChart(filteredData, currentTable);
}