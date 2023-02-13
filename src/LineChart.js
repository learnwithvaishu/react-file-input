import LineChart from 'echarts-for-react';
import React from 'react';

const LineCharts = ({ data }) => {
  return (
    <LineChart
      option={{
        xAxis: {
          type: 'category',
          data: data.map((x) => x['Unix Timestamp']),
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            data: data.map((x) => x.Open),
            type: 'line',
          },
        ],
      }}
    />
  );
};

export default LineCharts;
