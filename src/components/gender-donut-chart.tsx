import React, { useEffect, useState } from 'react';
import { Pie } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleOrdinal } from '@visx/scale';
import { Text } from '@visx/text';
import { useMissingPersonsData } from '../context/MissingPersonsContext';

interface GenderData {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#FF8042', '#00C49F'];

const GenderDonutChart: React.FC = () => {
  const { missingPersonsData, loading } = useMissingPersonsData();
  const [data, setData] = useState<GenderData[]>([]);

  useEffect(() => {
    if (loading || !missingPersonsData) return;

    const genderCounts: { [key: string]: number } = {};

    missingPersonsData.forEach((record: any) => {
      const gender = record.subjectDescription?.sex?.localizedName || 'Unknown';
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    });

    const chartData = Object.entries(genderCounts).map(([name, value]) => ({
      name,
      value,
    }));

    setData(chartData);
  }, [missingPersonsData, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const width = 400;
  const height = 400;
  const radius = Math.min(width, height) / 2 - 40;

  const colorScale = scaleOrdinal<string, string>({
    domain: data.map((d) => d.name),
    range: COLORS,
  });

  const total = data.reduce((acc, cur) => acc + cur.value, 0);

  return (
    <div>
      <h2>Missing Persons by Gender</h2>
      <svg width={width} height={height}>
        <Group top={height / 2} left={width / 2}>
          <Pie
            data={data}
            pieValue={(d) => d.value}
            outerRadius={radius}
            innerRadius={radius - 50}
            padAngle={0.01}
          >
            {(pie) =>
              pie.arcs.map((arc, index) => {
                const [centroidX, centroidY] = pie.path.centroid(arc);
                const arcPath = pie.path(arc) as string;
                const color = colorScale(arc.data.name);
                return (
                  <g key={`arc-${arc.data.name}-${index}`}>
                    <path d={arcPath} fill={color} />
                    <Text
                      x={centroidX}
                      y={centroidY}
                      dy=".33em"
                      fill="white"
                      fontSize={12}
                      textAnchor="middle"
                    >
                      {`${((arc.data.value / total) * 100).toFixed(1)}%`}
                    </Text>
                  </g>
                );
              })
            }
          </Pie>
        </Group>
      </svg>
    </div>
  );
};

export default GenderDonutChart;
