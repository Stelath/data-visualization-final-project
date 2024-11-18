import React, { useEffect, useState } from 'react';
import { GeoMercator } from '@visx/geo';
import { scaleQuantize } from '@visx/scale';
import { schemeBlues } from 'd3-scale-chromatic';
import usStates from './us-states.json'; // Ensure you have a valid GeoJSON file

interface StateProperties {
  name: string;
  count: number;
}

const StateChoroplethMap: React.FC = () => {
  const [geoData, setGeoData] = useState<any>(usStates);
  const [stateCounts, setStateCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetch('/data/MissingPersons.json')
      .then((res) => res.json())
      .then((mpData) => {
        const counts: { [key: string]: number } = {};

        mpData.forEach((entry: any) => {
          const state = entry.sighting?.address?.state?.displayName || 'Unknown';
          counts[state] = (counts[state] || 0) + 1;
        });

        setStateCounts(counts);

        // Update geoData with counts
        const updatedGeoData = {
          ...geoData,
          features: geoData.features.map((feature: any) => {
            const stateName = feature.properties?.name || '';
            const count = counts[stateName] || 0;
            return {
              ...feature,
              properties: {
                ...feature.properties,
                count,
              },
            };
          }),
        };

        setGeoData(updatedGeoData);
      });
  }, []);

  const width = 800;
  const height = 600;

  // Define color scale based on counts
  const counts = geoData.features.map((f: any) => f.properties.count);
  const colorScale = scaleQuantize<string>({
    domain: [Math.min(...counts), Math.max(...counts)],
    range: schemeBlues[9],
  });

  return (
    <div>
      <h2>Missing Persons by State</h2>
      <svg width={width} height={height}>
        <GeoMercator
          data={geoData}
          scale={width / 1.3}
          translate={[width / 2, height / 2]}
        >
          {(mercator) => (
            <g>
              {mercator.features.map(({ feature, path }, i) => {
                const stateName = feature.properties?.name || '';
                const count = feature.properties?.count || 0;
                const fill = colorScale(count);
                return (
                  <path
                    key={`path-${i}`}
                    d={path || ''}
                    fill={fill}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                  />
                );
              })}
            </g>
          )}
        </GeoMercator>
      </svg>
    </div>
  );
};

export default StateChoroplethMap;
