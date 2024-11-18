// src/MissingPersonsMap.js

import React, { useEffect, useState } from 'react';
import { geoPath, geoAlbersUsa } from 'd3-geo';
import { scaleSequential } from 'd3-scale';
import { interpolateBlues } from 'd3-scale-chromatic';
import { Feature } from 'geojson';
import { Group } from '@visx/group';
import { Mercator } from '@visx/geo';
import { LegendLinear } from '@visx/legend';

const MissingPersonsMap = () => {
  const [geoData, setGeoData] = useState(null);
  const [missingData, setMissingData] = useState(null);
  const [mergedData, setMergedData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mapping from state abbreviations to full names if needed
  const stateMap = {
    AL: 'Alabama',
    AK: 'Alaska',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    FL: 'Florida',
    GA: 'Georgia',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PA: 'Pennsylvania',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Missing Persons Data
        const missingResponse = await fetch('/data/MissingPersons.json');
        const missingJson = await missingResponse.json();
        setMissingData(missingJson);

        // Fetch GeoJSON Data
        const geoResponse = await fetch('/assets/us-states.geojson');
        const geoJson = await geoResponse.json();
        setGeoData(geoJson);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (geoData && missingData) {
      // Step 1: Count missing persons per state
      const stateCounts = {};

      missingData.forEach((entry) => {
        const state = entry.sighting.address.state.displayName;
        if (state && state !== 'Alaska' && state !== 'Hawaii') { // Exclude non-contiguous states
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
    }
  }, [geoData, missingData]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Define color scale
  const maxCount = Math.max(...mergedData.features.map(f => f.properties.count));
  const colorScale = scaleSequential()
    .domain([0, maxCount])
    .interpolator(interpolateBlues);

  // Define projection
  const projection = geoAlbersUsa()
    .translate([500 / 2, 300 / 2])
    .scale(1000);

  // Define dimensions
  const width = 960;
  const height = 600;

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <Group>
          {mergedData.features.map((feature, i) => {
            const path = geoPath().projection(projection)(feature);
            const count = feature.properties.count;
            return (
              <path
                key={`path-${i}`}
                d={path}
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
        <text
          x={width * 0.05}
          y={height - 30}
          fontSize="10"
          fill="gray"
        >
          Source: Missing Persons Database
        </text>
      </svg>

      {/* Color Legend */}
      <div style={{ position: 'absolute', left: 50, top: 100 }}>
        <LegendLinear
          scale={colorScale}
          labelFormat={(value) => Math.round(value)}
          direction="horizontal"
          labelOffset={20}
        />
        <div style={{ marginTop: 10, fontSize: 12 }}>
          Number of Missing Persons
        </div>
      </div>
    </div>
  );
};

export default MissingPersonsMap;
