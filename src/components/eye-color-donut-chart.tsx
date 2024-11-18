import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface EyeColorData {
  name: string;
  value: number;
}

const COLORS: { [key: string]: string } = {
  Blue: '#4B9CD3',
  Brown: '#654321',
  Green: '#228B22',
  Gray: '#808080',
  Hazel: '#8E7618',
  Other: '#A9A9A9',
  Black: '#000000',
  Unknown: '#D3D3D3',
  // Add other colors if needed
};

const EyeColorDonutChart: React.FC = () => {
  const [data, setData] = useState<EyeColorData[]>([]);

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

        // Combine rare colors into 'Other'
        const total = Object.values(eyeColors).reduce((a, b) => a + b, 0);
        const threshold = total * 0.01; // 1%
        let otherTotal = 0;

        const filteredEyeColors = Object.entries(eyeColors)
          .filter(([color, count]) => {
            if (count < threshold || !COLORS[color]) {
              otherTotal += count;
              return false;
            }
            return true;
          })
          .map(([name, value]) => ({ name, value }));

        if (otherTotal > 0) {
          filteredEyeColors.push({ name: 'Other', value: otherTotal });
        }

        setData(filteredEyeColors);
      });
  }, []);

  const renderLabel = (entry: any) => `${entry.name}: ${((entry.value / data.reduce((acc, cur) => acc + cur.value, 0)) * 100).toFixed(1)}%`;

  return (
    <div>
      <h2>Eye Color Distribution of Missing Persons</h2>
      <PieChart width={400} height={400}>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={70} label={renderLabel}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS['Other']} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
};

export default EyeColorDonutChart;