import React, { useEffect, useState } from 'react';
import { geoPath, geoAlbersUsa } from 'd3-geo';
import { scaleSequential, scaleLinear } from 'd3-scale';
import { interpolateBlues } from 'd3-scale-chromatic';
import { Group } from '@visx/group';
import { LegendLinear } from '@visx/legend';
import { useMissingPersonsData } from '../context/MissingPersonsContext';

interface GeoFeature {
  type: string;
  properties: {
    NAME: string;
    count?: number;
  };
  geometry: any;
}

interface GeoData {
  type: string;
  features: GeoFeature[];
}

const MissingPersonsMap: React.FC = () => {
  const { missingPersonsData, loading: missingDataLoading } = useMissingPersonsData();
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [mergedData, setMergedData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch GeoJSON Data
    fetch('https://storage.googleapis.com/data-visualization-stelath/assets/us-states.geojson')
      .then((response) => response.json())
      .then((geoJson) => {
        setGeoData(geoJson);
      })
      .catch((error) => {
        console.error('Error fetching geo data:', error);
      });
  }, []);

  useEffect(() => {
    if (!geoData || !missingPersonsData || missingDataLoading) {
      return;
    }

    // Step 1: Count missing persons per state
    const stateCounts: { [key: string]: number } = {};

    missingPersonsData.forEach((entry: any) => {
      const state = entry.sighting.address.state.displayName;
      if (state && state !== 'Alaska' && state !== 'Hawaii') {
        stateCounts[state] = (stateCounts[state] || 0) + 1;
      }
    });

    // Step 2: Merge counts into GeoJSON
    const featuresWithCounts = geoData.features.map((feature) => {
      const stateName = feature.properties.NAME;
      const count = stateCounts[stateName] || 0;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          count,
        },
      };
    });

    setMergedData({
      ...geoData,
      features: featuresWithCounts,
    });

    setLoading(false);
  }, [geoData, missingPersonsData, missingDataLoading]);

  if (loading || !mergedData) {
    return <div>Loading...</div>;
  }

  if (loading || !mergedData) {
    return <div>Loading...</div>;
  }

  // Define color scales
  const counts = mergedData.features.map((f) => f.properties.count || 0);
  const maxCount = Math.max(...counts);

  const colorScale = scaleSequential(interpolateBlues)
    .domain([0, maxCount]);

  // Create a linear scale for the legend
  const legendScale = scaleLinear<string>()
    .domain([0, maxCount])
    .range(['#f7fbff', '#08519c']);

  // Define projection
  const projection = geoAlbersUsa().translate([960 / 2, 600 / 2]).scale(1000);

  // Define path generator
  const pathGenerator = geoPath().projection(projection);

  // Define dimensions
  const width = 960;
  const height = 600;

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <Group>
          {mergedData.features.map((feature, i) => {
            const path = pathGenerator(feature.geometry);
            const count = feature.properties.count || 0;
            return (
              <path
                key={`path-${i}`}
                d={path || undefined}
                fill={count > 0 ? colorScale(count) : '#EEE'}
                stroke="#fff"
                strokeWidth={0.5}
              />
            );
          })}
        </Group>

        {/* Titles and Annotations */}
        <text
          x={width / 2}
          y={40}
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
        >
          Missing Persons Across the United States
        </text>
        <text
          x={width / 2}
          y={70}
          textAnchor="middle"
          fontSize="16"
          fill="gray"
        >
          Distribution by State
        </text>
        <text x={width * 0.05} y={height - 30} fontSize="10" fill="gray">
          Source: Missing Persons Database
        </text>
      </svg>

      {/* Color Legend */}
      <div style={{ position: 'absolute', left: 50, top: 100 }}>
        <LegendLinear
          scale={legendScale}
          labelFormat={(value) => Math.round(value as number).toString()}
          direction="column"
          steps={5}
        />
        <div style={{ marginTop: 10, fontSize: 12 }}>Number of Missing Persons</div>
      </div>
    </div>
  );
};

export default MissingPersonsMap;
