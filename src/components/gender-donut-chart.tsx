import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface GenderData {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#FF8042', '#00C49F'];

const GenderDonutChart: React.FC = () => {
  const [data, setData] = useState<GenderData[]>([]);

  useEffect(() => {
    fetch('/data/MissingPersons.json')
      .then((res) => res.json())
      .then((mpData) => {
        const genderCounts: { [key: string]: number } = {};

        mpData.forEach((record: any) => {
          const gender = record.subjectDescription?.sex?.localizedName || 'Unknown';
          genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        });

        const chartData = Object.entries(genderCounts).map(([name, value]) => ({
          name,
          value,
        }));

        setData(chartData);
      });
  }, []);

  return (
    <div>
      <h2>Missing Persons by Gender</h2>
      <PieChart width={400} height={400}>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={70} label>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
};

export default GenderDonutChart;