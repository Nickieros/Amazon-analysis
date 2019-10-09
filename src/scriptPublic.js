let analyse = {
    // размерность для столбцов Click (количество цифр)
    capacityClick: 4,

    // максимально допустимая погрешность для столбцов Click в числовом выражении (проценты поделить на 100)
    accuracyClick: 0.001,

    // размерность для столбцов Conversion (количество цифр)
    capacityConversion: 4,

    // максимально допустимая погрешность для столбцов Conversion в числовом выражении (проценты поделить на 100)
    accuracyConversion: 0.001,

    parsedResult: {},

    // column numbers of specified data. Number starts from zero
    searchTermColumn: 1,
    searchFrequencyRankColumn: 2,
    asinsColumns: [3, 7, 11],
    productsDescriptionColumns: [4, 8, 12],
    clickColumns: [5, 9, 13],
    conversionColumns: [6, 10, 14],
    // end of column numbers

    // Type of specified data in columns
    columnTypes: {
        searchTerm: "string",
        quantity: 'int',
        searchFrequencyRank: "int",
        asin: "string",
        productDescription: "string",
        click: "float",
        conversion: "float",
        link: "string",
    },

    searchTerm: '', // search term that user selected
    searchTermIndex: 0, // search term row index
    sortColumnNumber: 2,
    isSortAscending: true,
    error: false,
    errorMsg: '',

    /**
     * asins in selected row by "Search Term"
     * @type {Array.<string>}
     */
    selectedAsins: [],

    /**
     * Asins counters
     * @type {Array.<number>}
     */
    selectedAsinsCounters: [],

    /**
     * array contains asins and quantity
     * from frequency which contains any of selectedAsins
     * @type {Array.<string, number>}
     */
    competitors: [],

    frequency: [],

    quantitativeValues: [],
    quantitativeClicksOther: [],
    quantitativeConversionsOther: [],
    quantitativeAccuracyClick: [],
    quantitativeCapacityClick: [],
    quantitativeAccuracyConversion: [],
    quantitativeCapacityConversion: [],

    // define column headers in full table
    fullTableHeaders: [
        "Department",
        "Search Term",
        "Rank",
        "1 ASIN",
        "1 Product Title",
        "1 clck",
        "1 conv",
        "2 ASIN",
        "2 Product Title",
        "2 clck",
        "2 conv",
        "3 ASIN",
        "3 Product Title",
        "3 clck",
        "3 conv"
    ],

    // define column headers in competitors table
    competitorsTableHeaders: [
        "ASIN",
        "К-во",
        "Link",
    ],

    setParsedResult: result => {
        // delete unneeded first and second row
        result.data.shift();
        result.data.shift();

        // delete empty last row if exists
        if (result.data[result.data.length-1].length === 1) {
            result.data.pop();
        }

        analyse.parsedResult = result;
    },
};


function parseFile() {
    let fileInput = document.body.querySelector('#fileInput');

    if ( ! fileInput.files.length) {
        alert("Надо выбрать файл");
        return false;
    }

    Papa.parse(fileInput.files[0], {
        delimiter: "",	// auto-detect
        newline: "",	// auto-detect
        quoteChar: '"',
        escapeChar: '"',
        header: false,
        transformHeader: undefined,
        dynamicTyping: true,
        preview: 0,
        encoding: "",
        worker: true,
        comments: false,
        step: undefined,
        error: undefined,
        download: false,
        downloadRequestHeaders: undefined,
        skipEmptyLines: false,
        chunk: undefined,
        fastMode: undefined,
        beforeFirstChunk: undefined,
        withCredentials: undefined,
        transform: undefined,
        delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP],
        complete: result => {
            console.log("parsing complete");
            if (validateParsingResult(result)) {
                analyse.setParsedResult(result);
                analyse.frequency = analyse.parsedResult.data;

                document.getElementById('competitorsHeader').innerHTML = '';
                document.getElementById('competitors').innerHTML = '';
                document.getElementById('frequencyHeader').innerHTML = '';
                document.getElementById('frequency').innerHTML = '';
                document.getElementById('quantitativeValuesHeader').innerHTML = '';
                document.getElementById('quantitativeValues').innerHTML = '';

                analyse.selectedAsins = [];
                analyse.competitors = [];
                analyse.selectedAsinsCounters = [];
                analyse.searchTerm = '';
                analyse.searchTermIndex = 0;
                analyse.quantitativeValues = [];
                analyse.quantitativeClicksOther = [];
                analyse.quantitativeConversionsOther = [];
                analyse.quantitativeAccuracyClick = [];
                analyse.quantitativeCapacityClick = [];
                analyse.quantitativeAccuracyConversion = [];
                analyse.quantitativeCapacityConversion = [];

                renderTable(
                    'frequency',
                    analyse.frequency,
                    2,// analyse.searchFrequencyRankColumn,
                    true);
            }
            console.log("render complete");
        },
    });
}

/**
 * Renders table into parent element
 * Gets content from parsed file as array "dataArray"
 * @param {string} parentElementId id of parent HTMLElement into which the table will be inserted
 * @param {Array} dataArray two-dimension array for table content without column headers
 * @param {number} columnNumberToSort column number (started from zero) to sort
 * @param {boolean} isSortAscending true if sorting data should be ascending, false - descending
 * @param {boolean} isFullTable true if table show 14 columns, false - competitors table, default: true
 * @param {number} [lastRow] number of last row (limit rows number to lastRow), default: lastRow = 0 (no limit)
 */
function renderTable(parentElementId, dataArray, columnNumberToSort, isSortAscending = true, isFullTable = true, lastRow = 0) {
    let html = '';
    let value = '';
    let columnName = (isFullTable ? getFullTableColumnName(columnNumberToSort) : getCompetitorsTableColumnName(columnNumberToSort));

    let parentHTMLElement = document.getElementById(parentElementId);

    if (isFullTable) {
        analyse.sortColumnNumber = columnNumberToSort;
        analyse.isSortAscending = isSortAscending;
    }

    if (lastRow === 0 || lastRow >= dataArray.length) {
        lastRow = dataArray.length - 1;
    }

    sortArray(
        dataArray,
        (columnName.value === 'link' ? columnNumberToSort - 2 : columnNumberToSort),
        analyse.columnTypes[columnName.value],
        isSortAscending,
    );

    html += `<input type="button" class="clipboard" value="копировать таблицу" data-clipboard-target="#${parentElementId}Table" onclick="clearSelection();">`;
    if(parentElementId === 'quantitativeValues'){
        html += `
		<table id="quantitativeSetup" class="quantitativeSetup">
			<tr>
        		<td>разрядность для мин. значения click</td>
        		<td><div>
        			<label>${analyse.capacityClick}</label><br />
        			<input type='range' value="${analyse.capacityClick}" min="1" max="4" step="1" size="1" onchange="changeQuantitativeValues('click', 'capacity', this, ${columnNumberToSort}, ${isSortAscending})" oninput="changeQuantitativeValues('click', 'capacity', this, ${columnNumberToSort}, ${isSortAscending})"></div>
        		</td>
        		<td>макс.допустимая погрешность в % для click</td>
        		<td><div>
        			<input type='number' value="${analyse.accuracyClick * 100}" min="0" step="0.001" max="100"  size="5" onchange="changeQuantitativeValues('click', 'accuracy', this, ${columnNumberToSort}, ${isSortAscending})" oninput="changeQuantitativeValues('click', 'accuracy', this, ${columnNumberToSort}, ${isSortAscending})"><br />
        			<input type='range' value="${analyse.accuracyClick * 100}" min="0" step="0.001" max="100"  size="5" onchange="changeQuantitativeValues('click', 'accuracy', this, ${columnNumberToSort}, ${isSortAscending})" oninput="changeQuantitativeValues('click', 'accuracy', this, ${columnNumberToSort}, ${isSortAscending})"></div>
        		</td>
        		<td>разрядность для мин. значения conversion</td>
        		<td><div>
        			<label>${analyse.capacityConversion}</label><br />
        			<input type='range' value="${analyse.capacityConversion}" min="1" max="4" step="1" size="1" onchange="changeQuantitativeValues('conversion', 'capacity', this, ${columnNumberToSort}, ${isSortAscending})" oninput="changeQuantitativeValues('conversion', 'capacity', this, ${columnNumberToSort}, ${isSortAscending})"></div>
        		</td>
        		<td>макс.допустимая погрешность в % для conversion</td>
        		<td><div>
        			<input type='number' value="${analyse.accuracyClick * 100}" min="0" step="0.001" max="100"  size="5" onchange="changeQuantitativeValues('conversion', 'accuracy', this, ${columnNumberToSort}, ${isSortAscending})" oninput="changeQuantitativeValues('conversion', 'accuracy', this, ${columnNumberToSort}, ${isSortAscending})"><br />
        			<input type='range' value="${analyse.accuracyClick * 100}" min="0" step="0.001" max="100"  size="5" onchange="changeQuantitativeValues('conversion', 'accuracy', this, ${columnNumberToSort}, ${isSortAscending})" oninput="changeQuantitativeValues('conversion', 'accuracy', this, ${columnNumberToSort}, ${isSortAscending})"></div>
        		</td>
    		</tr>
		</table>`;
    }
    html += `<table id='${parentElementId}Table' class=${isFullTable ? 'fullTable' : 'competitorsTable'}>`;

    for(let i = 0; i <= lastRow; i++) {

        // create column headers
        if (i === 0) {
            html += "<tr data-sorted='true'>";

            for (
                let j = (isFullTable ? 1 : 0); // starting from "j = 1" because first column is not needed in FullTable
                j < (isFullTable ? analyse.fullTableHeaders.length : analyse.competitorsTableHeaders.length);
                j++
            ) {
                html += `
                    <th data-sorted-direction=${
                    // Is this column need to be sorted?
                    j === columnNumberToSort
                        ? (isSortAscending ? "ascending" : "descending") // how this column need to be sorted?
                        : ''}><input type="text" onkeypress="filter('${parentElementId}', ${j}, this, event)"><br />${
                    (isFullTable ? analyse.fullTableHeaders[j] : analyse.competitorsTableHeaders[j])
                    }</th>`;
            }
            html += "</tr>";
        }

        if (isFullTable) {
            html += "<tr data-visible='true'>";

            // starting from "j = 1" because first column is not needed
            for (let j = 1; j < dataArray[0].length; j++) {

                // detect column type
                columnName = getFullTableColumnName(j);

                // define class for element
                let elementClass = '';
                // if (columnName.isSearchFrequencyRank) elementClass = " class='rank' ";
                // if (columnName.isAsin) elementClass = " class='asin' ";
                // if (columnName.isClick || columnName.isConversion) elementClass = " class='clck' ";

                value = (dataArray[i][j] === null ? '' : dataArray[i][j]);

                if(columnName.isClick && parentElementId === 'quantitativeValues') {
                    html += `<td title='${
                        dataArray[i][5]} : ${dataArray[i][9]} : ${dataArray[i][13]} : ${analyse.quantitativeClicksOther[i]}\n${
                        (analyse.quantitativeAccuracyClick[i] * 100).toFixed(3)}% - полученная погрешность, ограничена:\n${
                        (analyse.accuracyClick * 100).toFixed(3)}% - допустимой погрешностью, или\n${
                        analyse.capacityClick} - разрядностью минимального числа'>`;
                } else if(columnName.isConversion && parentElementId === 'quantitativeValues') {
                    html += `<td title='${
                        dataArray[i][6]} : ${dataArray[i][10]} : ${dataArray[i][14]} : ${analyse.quantitativeConversionsOther[i]}\n${
                        (analyse.quantitativeAccuracyConversion[i] * 100).toFixed(3)}% - полученная погрешность,ограничена:\n${
                        (analyse.accuracyConversion * 100).toFixed(3)}% - допустимой погрешностью, или\n${
                        analyse.capacityClick} - разрядностью минимального числа'>`;
                } else html += "<td>";
                if (columnName.isProductDescription) html += `<span class='productDescription' title='${value}'>`;
                if (columnName.isSearchTerm) html += `<span class='searchTerm' title='${value}'>`;
                html += value;
                if (columnName.isProductDescription || columnName.isSearchTerm) html += "</span>";
                html += '</td>';
            }
            html += "</tr>";
        }
    }

    if (parentElementId ==='competitors') {
        for (let i = 0; i < analyse.competitors.length; i++) {
            html += `<tr>
                <td>${dataArray[i][0]}</td>
                <td>${dataArray[i][1]}</td>
                <td>
                    <a href="https://www.amazon.com/s?k=${dataArray[i][0]}&ref=nb_sb_noss" target="_blank">
                        ${dataArray[i][0]}
                    </a>
                </td>
            </tr>`;
        }
    }

    html += "</table>";

    parentHTMLElement.innerHTML = html;
}

/**
 * Returns true if parsing result passed validation
 * @param result
 * @returns {boolean}
 */
function validateParsingResult(result) {
    let errorMessage = '';
    let columnHeaders = ["Department","Search Term","Search Frequency Rank","#1 Clicked ASIN","#1 Product Title","#1 Click Share","#1 Conversion Share","#2 Clicked ASIN","#2 Product Title","#2 Click Share","#2 Conversion Share","#3 Clicked ASIN","#3 Product Title","#3 Click Share","#3 Conversion Share"];

    if (result.data.length < 3) {
        errorMessage = "ожидалось минимум 3 строки:\n1 - служебная\n2 - заголовки столбцов\n3 - строка данных";
    } else if (result.data[1].length !== 15) {
        errorMessage = "ожидалось 15 столбцов";
    } else if (columnHeaders.toString() !== result.data[1].toString()) {
        errorMessage = "\nво второй строке ожидались\nследующие заголовки столбцов: \n" + columnHeaders.join('\n');
    }

    if (errorMessage) {
        analyse.error = true;
        analyse.errorMsg = "Ошибка импорта данных из файла: " + errorMessage;
        alert(analyse.errorMsg);
        return false;
    } else return true;
}

/**
 * Clears selection from any HTMLElements (they bekame selected after copying them to buffer)
 */
function clearSelection() {
    let intervalId = setInterval(()=>window.getSelection().removeAllRanges(),900);
    setTimeout(()=>clearInterval(intervalId) ,3000);
}

function tableClick(event) {
    if (event.target.closest('td') && (event.target.closest('table').id === "frequencyTable" || event.target.closest('table').id === "quantitativeValuesTable")) {
        // scroll to top of page
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 500);

        // reset data for pushing new values later
        analyse.selectedAsins = [];
        analyse.competitors = [];
        analyse.selectedAsinsCounters = [];
        analyse.searchTerm = '';
        analyse.searchTermIndex = 0;
        analyse.quantitativeValues = [];
        analyse.quantitativeClicksOther = [];
        analyse.quantitativeConversionsOther = [];
        analyse.quantitativeAccuracyClick = [];
        analyse.quantitativeCapacityClick = [];
        analyse.quantitativeAccuracyConversion = [];
        analyse.quantitativeCapacityConversion = [];

        analyse.searchTerm = event.target.closest('tr').firstChild.firstChild.innerHTML;
        analyse.searchTermIndex = analyse.parsedResult.data.findIndex(row => row.indexOf(analyse.searchTerm) !== -1);

        let html = ''; // html buffer
        let filteredResult = new Set(); // to avoid duplicates
        let filteredAsins = [];

        // link to selected row in two-dimensional parsed array associated with clicked table row
        const selectedDataRow = analyse.parsedResult.data[analyse.searchTermIndex];

        // fill analyse.selectedAsins array
        for (let i = 0; i < analyse.asinsColumns.length; i++) {
            let asin = selectedDataRow[analyse.asinsColumns[i]];
            if (asin !== null) {
                analyse.selectedAsins.push(asin);
                analyse.selectedAsinsCounters.push(0);
            }
        }

        // fill filteredResult
        for(let i = 0; i < analyse.parsedResult.data.length; i++) {
            const row = analyse.parsedResult.data[i];
            for(let j = 0; j < analyse.selectedAsins.length; j++) {
                if (row.includes(analyse.selectedAsins[j])) {
                    filteredResult.add(row); // avoid duplicates
                }
            }
        }

        // get all asins from filteredResult and push them to filteredAsins
        filteredResult.forEach(row => {
            for (let i = 0; i < analyse.asinsColumns.length; i++) {
                let asin = row[analyse.asinsColumns[i]];
                if (asin) filteredAsins.push(asin);
            }

        });

        // insert de-duplicated asins and their counters to analyse.competitors
        let asins = {};
        filteredAsins.forEach(asin => asins[asin] ? asins[asin]++ : asins[asin] = 1);
        analyse.competitors = Object.entries(asins);

        analyse.frequency = [...filteredResult];

        for(let i = 0; i < analyse.frequency.length; i++) {
            analyse.quantitativeValues.push([Array(analyse.frequency.length)]);
        }

        for(let i = 0; i < analyse.frequency.length; i++) {
            for(let j = 0; j < analyse.frequency[i].length; j++) {
                if (j === 5 || j === 6) {
                    [
                        analyse.quantitativeValues[i][5],
                        analyse.quantitativeValues[i][9],
                        analyse.quantitativeValues[i][13],
                        analyse.quantitativeClicksOther[i],
                        analyse.quantitativeAccuracyClick[i],
                        analyse.quantitativeCapacityClick[i]
                    ] = getQuantitativeValues(
                        analyse.frequency[i][5],
                        analyse.frequency[i][9],
                        analyse.frequency[i][13],
                        analyse.capacityClick,
                        analyse.accuracyClick);
                    [
                        analyse.quantitativeValues[i][6],
                        analyse.quantitativeValues[i][10],
                        analyse.quantitativeValues[i][14],
                        analyse.quantitativeConversionsOther[i],
                        analyse.quantitativeAccuracyConversion[i],
                        analyse.quantitativeCapacityConversion[i],
                    ] = getQuantitativeValues(
                        analyse.frequency[i][6],
                        analyse.frequency[i][10],
                        analyse.frequency[i][14],
                        analyse.capacityConversion,
                        analyse.accuracyConversion);
                } else if ( ! (j === 9 || j === 10 || j === 13 || j === 14)) {
                    analyse.quantitativeValues[i][j] = analyse.frequency[i][j];
                }
            }
        }

        // fill result for stage 1 from html buffer
        html = `<h3>1. Конкуренты ASINs '${analyse.selectedAsins.join("', '")}' по поисковой фразе: "${analyse.searchTerm}"
                    <input type="button" onclick="clearFilter()" value="сбросить фильтр">
                </h3>`;
        document.getElementById('competitorsHeader').innerHTML = html;

        html = `<h3>2. Фильтр частотности для ASINs '${analyse.selectedAsins.join("', '")}', поисковая фраза: "${analyse.searchTerm}"  <input type="button" onclick="clearFilter()" value="сбросить фильтр"></h3>`;
        document.getElementById('frequencyHeader').innerHTML = html;

        html = `<h3>3. Количественные значения click, conversion  <input type="button" onclick="clearFilter()" value="сбросить фильтр"></h3>`;
        document.getElementById('quantitativeValuesHeader').innerHTML = html;

        renderTable(
            'competitors',
            analyse.competitors,
            analyse.competitorsTableHeaders.indexOf('К-во') !== -1 ? analyse.competitorsTableHeaders.indexOf('К-во') : 0,
            false,
            false);

        renderTable(
            'frequency',
            analyse.frequency,
            analyse.sortColumnNumber,
            analyse.isSortAscending);

        renderTable(
            'quantitativeValues',
            analyse.quantitativeValues,
            analyse.sortColumnNumber,
            analyse.isSortAscending);
    } else if (event.target.closest('th') && event.target.tagName !== 'INPUT') {
        let clickedElement = event.target.closest('th');
        let sortedDirection = clickedElement.dataset.sortedDirection;
        let parentElementId = event.target.closest('div').id;
        let isFullTable = (event.target.closest('div').id !== 'competitors');

        // sets ascending sort or inverts direction if exists
        if (sortedDirection !== '') analyse.isSortAscending = (sortedDirection !== "ascending"); else analyse.isSortAscending = true;

        event.target.closest('tr').querySelectorAll('data-sorted-direction')
        .forEach(element => element.dataset.sortedDirection = '');

        clickedElement.dataset.sortedDirection = (analyse.isSortAscending ? "ascending" : "descending");

        renderTable(
            parentElementId,
            analyse[event.target.closest('div').id],
            event.target.closest('th').cellIndex + (isFullTable ? 1 : 0), // +1 is needed because first column from array is skipped in table
            analyse.isSortAscending,
            isFullTable,
        );
    }
}

/**
 * Unhide all rows in table (remove from all rows class '.hide')
 * @param tableId
 */
function unhideTableRows(tableId) {
    document.getElementById(tableId).querySelectorAll('tr[data-visible="false"]').forEach(element=>element.dataset.visible = 'true');
}

function sortStringArray(dataArray, arrayIndex, isAscending) {
    dataArray.sort((a,b) => {
        a = a[arrayIndex];
        b = b[arrayIndex];
        a = (a === null ? a = '' : String(a));
        b = (b === null ? b = '' : String(b));
        return isAscending ? a.localeCompare(b) : b.localeCompare(a);
    });
}

function sortIntArray(dataArray, arrayIndex, isAscending) {
    dataArray.sort((a,b) => {
        a = parseInt(String(a[arrayIndex]).replace(/,/g,''));
        b = parseInt(String(b[arrayIndex]).replace(/,/g,''));
        if (isNaN(a)) a = 101;
        if (isNaN(b)) b = 101;
        return isAscending ? a - b : b - a;
    });
}

function sortFloatArray(dataArray, arrayIndex, isAscending) {
    dataArray.sort((a,b) => {
        a = parseFloat(a[arrayIndex]);
        b = parseFloat(b[arrayIndex]);
        if (isNaN(a)) a = 101;
        if (isNaN(b)) b = 101;
        return isAscending ? a - b : b - a;
    });
}

function sortArray(dataArray, columnNumberToSort, columnDataType, isSortAscending) {
    switch (columnDataType) {
        case "string":
            sortStringArray(dataArray, columnNumberToSort, isSortAscending);
            break;

        case "int":
            sortIntArray(dataArray, columnNumberToSort, isSortAscending);
            break;

        case "float":
            sortFloatArray(dataArray, columnNumberToSort, isSortAscending);
            break;
    }
}

function getFullTableColumnName(columnNumber) {
    let columnName =  {
        isSearchTerm: (columnNumber === analyse.searchTermColumn),
        isSearchFrequencyRank: (columnNumber === analyse.searchFrequencyRankColumn),
        isAsin: analyse.asinsColumns.includes(columnNumber),
        isProductDescription: analyse.productsDescriptionColumns.includes(columnNumber),
        isClick: analyse.clickColumns.includes(columnNumber),
        isConversion: analyse.conversionColumns.includes(columnNumber)
    };

    // columnName.value - a string with the name of the property that has a true value (it may be the only one)
    // columnName.value is obtained from such property name conversion as "isSearchFrequencyRank" => "searchFrequencyRank"
    // it is in camelCase without "is": searchTerm, searchFrequencyRank, asin, productDescription, click, conversion
    columnName.value = Object.keys(columnName).filter(
        value => columnName[value])[0].substr(2).replace(/^\w/, c => c.toLowerCase()
    );

    return columnName;
}

function getCompetitorsTableColumnName(columnNumber) {
    let columnName =  {
        isAsin: (columnNumber === 0),
        isQuantity: (columnNumber === 1),
        isLink: (columnNumber === 2),
    };

    // columnName.value - a string with the name of the property that has a true value (it may be the only one)
    // columnName.value is obtained from such property name conversion as "isSearchFrequencyRank" => "searchFrequencyRank"
    // it is in camelCase without "is": searchFrequencyRank, quantity, asin
    columnName.value = Object.keys(columnName).filter(
        value => columnName[value])[0].substr(2).replace(/^\w/, c => c.toLowerCase()
    );

    return columnName;
}

function clearFilter() {
    document.getElementById('competitorsHeader').innerHTML = '';
    document.getElementById('competitors').innerHTML = '';
    document.getElementById('frequencyHeader').innerHTML = '';
    document.getElementById('frequency').innerHTML = '';
    document.getElementById('quantitativeValuesHeader').innerHTML = '';
    document.getElementById('quantitativeValues').innerHTML = '';

    analyse.selectedAsins = [];
    analyse.competitors = [];
    analyse.selectedAsinsCounters = [];
    analyse.searchTerm = '';
    analyse.searchTermIndex = 0;
    analyse.quantitativeValues = [];
    analyse.quantitativeClicksOther = [];
    analyse.quantitativeConversionsOther = [];
    analyse.quantitativeAccuracyClick = [];
    analyse.quantitativeCapacityClick = [];
    analyse.quantitativeAccuracyConversion = [];
    analyse.quantitativeCapacityConversion = [];

    analyse.frequency = analyse.parsedResult.data;

    renderTable(
        'frequency',
        analyse.parsedResult.data,
        analyse.sortColumnNumber,
        analyse.isSortAscending);

    // scroll to top of page
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 500);
}

function filter(tableParentId, columnNumber, inputElement, event) {
    if (!event) event = window.event;
    let keyCode = event.keyCode || event.which;
    if (keyCode !== 13) return;
    let table = document.getElementById(tableParentId + "Table");

    // hide all rows that do not match the filter
    for(let i = 0; i < analyse[tableParentId].length; i++) {
        if(String(analyse[tableParentId][i][columnNumber]).toLowerCase().includes(String(inputElement.value).toLowerCase())) {
            // i+1 because array does not have columns headers but table does
            table.rows[i+1].dataset.visible = "true";
        } else {
            // i+1 because array does not have columns headers but table does
            table.rows[i+1].dataset.visible = "false";
        }
    }

    // columnNumber-- because array does not have columns headers but table does
    if (tableParentId !== 'competitors') columnNumber--;

    // clear previous filter in other cell
    Array.from(table.rows[0].cells).forEach(cell => {
        if (cell.cellIndex !== columnNumber) {
            cell.querySelector('input').value = '';
        }
    });
}

function getQuantitativeValues(a, b, c, capacity, accuracy) {
    let values = [];
    a = parseFloat(a);
    b = parseFloat(b);
    c = parseFloat(c);
    values.push(isNaN(a) ? 0 : Math.round(a * 100));
    values.push(isNaN(b) ? 0 : Math.round(b * 100));
    values.push(isNaN(c) ? 0 : Math.round(c * 100));
    values.push(10000 - values[0] - values[1] - values[2]);

    let minValue = Math.min(...values);
    if(minValue === 0) {
        values.some(value => { if(value) minValue = value; });
        if(minValue === 0) return [0,0,0,0,0];

        values.forEach(value => {
            if (value !== 0 && value < minValue) minValue = value;
        });
    }

    let newValues = [];
    let newAccuracy = 1;
    let currentAccuracy = 1;
    let multiplier = 1;
    let maxMultiplier = 10000 * Math.pow(10, capacity - 4);
    let accuracyValues = [];
    let relativeValues = []; // array of values/minValue
    let info = ''; // info buffer

    // calculate values relative to variable with minimal value
    for(let i = 0; i < 4; i++) {
        relativeValues[i] = values[i]/minValue;
    }

    // find optimal values ​​corresponding to the given capacity and accuracy
    for(let i = 1; i < maxMultiplier; i++) {
        for(let j = 0; j < 4; j++) {
            newValues[j] = relativeValues[j] * i;
            accuracyValues[j] = (newValues[j] ? Math.abs(1 - Math.round(newValues[j])/newValues[j]) : 0);
        }
        newAccuracy = Math.max(...accuracyValues);
        if (newAccuracy < currentAccuracy) {
            currentAccuracy = newAccuracy;
            multiplier = i;
            if (newAccuracy < accuracy) break;
        }
    }

    // get values ​​for the found optimal multiplier
    for(let j = 0; j < 4; j++) {
        newValues[j] = relativeValues[j] * multiplier;
        accuracyValues[j] = (newValues[j] ? Math.abs(1 - Math.round(newValues[j])/newValues[j]) : 0);
        newValues[j] = Math.round(newValues[j]);
    }

    return [
        newValues[0],
        newValues[1],
        newValues[2],
        newValues[3],
        currentAccuracy,
        capacity
    ];
}

function changeQuantitativeValues(columnType, valueType, input, columnNumberToSort, isSortAscending) {
    let value = input.value;
    if(columnType === 'click') {
        if(valueType === 'capacity') {
            value = parseInt(value);
            if (isNaN(value)){
                value = 4;
            } else if (value < 1) {
                value = 1;
            } else if (value > 4) {
                value = 4;
            }
            input.value = value;
            input.previousElementSibling.previousSibling.innerText = value;
            analyse.capacityClick = value;
        } else {
            value = parseFloat(value);
            if (isNaN(value) || value < 0){
                value = 0;
            } else if (value > 100) {
                value = 100;
            }
            input.value = value.toFixed(3);
            input.type === 'range'
                ? input.previousElementSibling.previousSibling.value = value.toFixed(3)
                : input.nextElementSibling.nextElementSibling.value = value.toFixed(3);
            analyse.accuracyClick = value/100;
        }
    } else {
        if(valueType === 'capacity') {
            if (isNaN(value)){
                value = 4;
            } else if (value < 1) {
                value = 1;
            } else if (value > 4) {
                value = 4;
            }
            input.value = value;
            input.previousElementSibling.previousSibling.innerText = value;
            analyse.capacityConversion = value;
        } else {
            value = parseFloat(value);
            if (isNaN(value) || value < 0){
                value = 0;
            } else if (value > 100) {
                value = 100;
            }
            input.value = value.toFixed(3);
            input.type === 'range'
                ? input.previousElementSibling.previousSibling.value = value.toFixed(3)
                : input.nextElementSibling.nextElementSibling.value = value.toFixed(3);
            analyse.accuracyConversion = value/100;
        }
    }

    for(let i = 0; i < analyse.frequency.length; i++) {
        [
            analyse.quantitativeValues[i][5],
            analyse.quantitativeValues[i][9],
            analyse.quantitativeValues[i][13],
            analyse.quantitativeClicksOther[i],
            analyse.quantitativeAccuracyClick[i],
            analyse.quantitativeCapacityClick[i]
        ] = getQuantitativeValues(
            analyse.frequency[i][5],
            analyse.frequency[i][9],
            analyse.frequency[i][13],
            analyse.capacityClick,
            analyse.accuracyClick);
        [
            analyse.quantitativeValues[i][6],
            analyse.quantitativeValues[i][10],
            analyse.quantitativeValues[i][14],
            analyse.quantitativeConversionsOther[i],
            analyse.quantitativeAccuracyConversion[i],
            analyse.quantitativeCapacityConversion[i],
        ] = getQuantitativeValues(
            analyse.frequency[i][6],
            analyse.frequency[i][10],
            analyse.frequency[i][14],
            analyse.capacityConversion,
            analyse.accuracyConversion);
    }

    for(let i = 0; i < analyse.quantitativeValues.length; i++) {
        let row = document.getElementById('quantitativeValuesTable').rows[i + 1]; // .rows[i + 1] to skip column headers in table
        let titleClick = createQuantitativeTitle(i, 'Click');
        let titleConversion = createQuantitativeTitle(i, 'Conversion');

        for(let j = 0; j < analyse.clickColumns.length; j++) {
            let cellClick = row.cells[analyse.clickColumns[j] - 1]; // - 1 because table does not have first column that data array does
            let cellConversion = row.cells[analyse.conversionColumns[j] - 1]; // - 1 because table does not have first column that data array does

            cellClick.innerText = analyse.quantitativeValues[i][analyse.clickColumns[j]];
            cellConversion.innerText = analyse.quantitativeValues[i][analyse.conversionColumns[j]];

            cellClick.title = titleClick;
            cellConversion.title = titleConversion;
        }
    }
}

function createQuantitativeTitle(rowIndex, columnType) {
    if(isNaN(rowIndex) || rowIndex < 0)
        throw Error('rowIndex must be a number >= 0');
    if(columnType !== 'Click' && columnType !== 'Conversion')
        throw Error('createQuantitativeTitle: columnType must be string "Click" or "Conversion"');

    let isClick = (columnType === 'Click');

    return `${
        analyse.quantitativeValues[rowIndex][isClick ? 5 : 6]} : ${analyse.quantitativeValues[rowIndex][isClick ? 9 : 10]} : ${analyse.quantitativeValues[rowIndex][isClick ? 13 : 14]} : ${analyse[isClick ? 'quantitativeClicksOther' : 'quantitativeConversionsOther'][rowIndex]}\n${
        (analyse[isClick ? 'quantitativeAccuracyClick' : 'quantitativeAccuracyConversion'][rowIndex] * 100).toFixed(3)}% - полученная погрешность, ограничена:\n${
        (analyse[isClick ? 'accuracyClick' : 'accuracyConversion'] * 100).toFixed(3)}% - допустимой погрешностью, или\n${
        analyse[isClick ? 'capacityClick' : 'capacityConversion']} - разрядностью минимального числа`;
}

new ClipboardJS('.clipboard'); // handle clicks on elements with ".clipboard" class for copy data to clipboard
document.body.querySelector('#fileInput').value = ''; // clear filename if exists
document.body.addEventListener('click', tableClick);
