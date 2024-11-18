import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from 'recharts';

interface RatioData {
  name: string;
  ratio: number;
  color: string;
}

const EyeColorRatioChart: React.FC = () => {
  const [data, setData] = useState<RatioData[]>([]);

  const eyeColorMap: { [key: string]: string } = {
    Brown: '#8B4513',
    Blue: '#4169E1',
    Hazel: '#8E7618',
    Green: '#228B22',
    Other: '#808080',
  };

  useEffect(() => {
    fetch('/data/MissingPersons.json')
      .then((response) => response.json())
      .then((mpData) => {
        const eyeColors: { [key: string]: number } = {};

        mpData.forEach((record: any) => {
          const physDesc = record.physicalDescription;
          if (physDesc) {
            const leftEye = physDesc.leftEyeColor?.localizedName || 'Unknown';
            const rightEye = physDesc.rightEyeColor?.localizedName || 'Unknown';
            eyeColors[leftEye] = (eyeColors[leftEye] || 0) + 1;
            eyeColors[rightEye] = (eyeColors[rightEye] || 0) + 1;
          }
        });

        const total = Object.values(eyeColors).reduce((a, b) => a + b, 0);
        const missingPersonPercentages: { [key: string]: number } = {};

        Object.entries(eyeColors).forEach(([color, count]) => {
          missingPersonPercentages[color] = (count / total) * 100;
        });

        // Population frequencies
        const populationFrequencies: { [key: string]: number } = {
          Brown: 45.0,
          Blue: 27.0,
          Hazel: 18.0,
          Green: 9.0,
          Other: 1.0,
        };

        // Calculate representation ratios
        const ratios = Object.keys(populationFrequencies).map((color) => {
          const observed = missingPersonPercentages[color] || 0;
          const expected = populationFrequencies[color];
          const ratio = observed / expected;
          return { 
            name: color, 
            ratio: parseFloat(ratio.toFixed(2)),
            color: eyeColorMap[color] || '#000000'
          };
        });

        setData(ratios);
      });
  }, []);

  return (
    <div>
      <h2>Eye Color Representation Ratio</h2>
      <BarChart width={600} height={400} data={data}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 'auto']} />
        <Tooltip formatter={(value: any) => `${value}x`} />
        <Legend />
        <ReferenceLine y={1} stroke="red" strokeDasharray="3 3" />
        <Bar 
          dataKey="ratio" 
          fill="#82ca9d" 
          label={{ position: 'top', formatter: (value: any) => `${value}x` }}
        >
          {data.map((entry, index) => (
            <Bar key={`bar-${index}`} dataKey="ratio" fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </div>
  );
};


export default EyeColorRatioChart;
