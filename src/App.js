import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import LineCharts from './LineChart';
import BarCharts from './BarChart';

const options = [
  { value: 'Open', label: 'Open' },
  { value: 'Low', label: 'Low' },
  { value: 'High', label: 'High' },
  { value: 'Close', label: 'Close' },
];

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getMonthYear(date) {
  var dt = new Date(date);
  return months[dt.getMonth()] + '-' + dt.getFullYear().toString().slice(-2);
}

function groupBy(xs, f) {
  return xs.reduce((r, v, i, a, k = f(v)) => {
    (r[k] || (r[k] = [])).push(v);
    return r;
  }, {});
}

function App() {
  const [column, setColumn] = useState("Open");
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState('line');
  const [isLoading] = useState(false);
  const [barData, setBarData] = useState([]);

  const [tableData, setTableData] = useState([]);

  console.log(tableData);

  const handleChartType = (type) => {
    document.getElementById('bar').classList.remove('active-tab');
    document.getElementById('line').classList.add('active-tab');
    setChartType(type);
    if (type === 'bar') {
      processBarData();
      document.getElementById('line').classList.remove('active-tab');
      document.getElementById('bar').classList.add('active-tab');
    }
  };

  const processBarData = () => {
    let chartData = [];
    data.forEach((d) => {
      if (d['Unix Timestamp']) {
        chartData.push({
          month: getMonthYear(d.Date),
          open: d.Open,
          high: d.High,
          low: d.Low,
          close: d.Close,
        });
      }
    });
    chartData = groupBy(chartData, (c) => c.month);
    let chartInput = [];
    for (var key in chartData) {
      let openSum = 0;
      let lowSum = 0;
      let highSum = 0;
      let closeSum = 0;
      var len = chartData[key].length;
      chartData[key].forEach((item) => {
        openSum = openSum + Number(item.open);
        lowSum = lowSum + Number(item.low);
        highSum = highSum + Number(item.high);
        closeSum = openSum + Number(item.close);
      });
      let openAvg = openSum / len;
      let lowAvg = lowSum / len;
      let highAvg = highSum / len;
      let closeAvg = closeSum / len;
      chartInput.push({
        Date: key,
        Open: openAvg,
        Low: lowAvg,
        High: highAvg,
        Close: closeAvg,
      });
    }

    setBarData(chartInput);
  };

  // process CSV data
  const processData = (dataString) => {
    const dataStringLines = dataString.split(/\r\n|\n/);
    const headers = dataStringLines[0].split(
      /,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/
    );

    const list = [];
    for (let i = 1; i < dataStringLines.length; i++) {
      const row = dataStringLines[i].split(
        /,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/
      );
      if (headers && row.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          let d = row[j];
          if (d.length > 0) {
            if (d[0] === '"') d = d.substring(1, d.length - 1);
            if (d[d.length - 1] === '"') d = d.substring(d.length - 2, 1);
          }
          if (headers[j]) {
            obj[headers[j]] = d;
          }
        }

        // remove the blank rows
        if (Object.values(obj).filter((x) => x).length > 0) {
          list.push(obj);
        }
      }
    }

    // prepare columns list from headers
    const columns = headers.map((c) => ({
      name: c,
      selector: c,
    }));

    console.log(list);
    setData(list);
    setColumn(columns);
  };

  const handleColumnChange = ({ target }) => {
    setColumn(target.value);
  };

  // handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      /* Parse data */
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_csv(ws, { header: 1 });
      processData(data);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Time Series Data</h1>
      <hr></hr>
      <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
      {isLoading ? (
        <LoadingSpinner />
      ) : data.length > 0 ? (
        <div>
          <div
            style={{
              display: 'flex',
              paddingBottom: '1rem',
              justifyContent: 'space-between',
            }}
          >
            <select
              style={{ padding: '5px 20px' }}
              value={column}
              onChange={handleColumnChange}
            >
              {options.map(({ value, label }, index) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <div>
              <button
                id="line"
                className="active-tab"
                onClick={() => handleChartType('line')}
                style={{ padding: '6px 40px', border: '0' }}
              >
                Line
              </button>
              <button
                id="bar"
                onClick={() => handleChartType('bar')}
                style={{ padding: '6px 40px', border: '0' }}
              >
                Bar
              </button>
            </div>
          </div>
          <div style={{ border: '0.625px solid #d0d0d0' }}>
            {chartType === 'line' ? (
              <LineCharts data={data} column={column} />
            ) : (
              <BarCharts data={barData} column={column} />
            )}
          </div>
        </div>
      ) : (
        <div>No data to display</div>
      )}
    </div>
  );
}

export default App;
