// CountyChoroplethMap.tsx

import React, { useEffect, useState } from "react";
import { geoPath, geoAlbersUsa } from "d3-geo";
import { scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import { Group } from "@visx/group";
import { useMissingPersonsData } from "@/context/MissingPersonsContext";
import { csv } from "d3-fetch";

interface GeoFeature {
  type: string;
  properties: {
    NAME: string;
    NAMELSAD: string;
    STATE: string;
    count?: number;
    population?: number;
    rate?: number;
  };
  geometry: any;
}

interface GeoData {
  type: string; 
  features: GeoFeature[];
}

const CountyChoroplethMap: React.FC = () => {
  const { 
    fullPlotData, 
    filteredIndices, 
    filterState,
    setFilterState, 
    clearAllFilters,
    loading 
  } = useMissingPersonsData();
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [mergedData, setMergedData] = useState<GeoData | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [populationData, setPopulationData] = useState<{ [key: string]: number }>({});
  const [hoveredCounty, setHoveredCounty] = useState<{
    name: string;
    state: string;
    count: number;
    population: number;
    rate: number;
    x: number;
    y: number;
  } | null>(null);
  
  // No need for selectedCounties state as it's managed via filterState.counties

  // Fetch GeoJSON data
  useEffect(() => {
    fetch("https://storage.googleapis.com/data-visualization-stelath/assets/us-counties.geojson")
      .then((response) => response.json())
      .then((geoJson: GeoData) => {
        setGeoData(geoJson);
        setGeoLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching geo data:", error);
        setGeoLoading(false);
      });
  }, []);

  // Fetch population data
  useEffect(() => {
    csv("https://storage.googleapis.com/data-visualization-stelath/data/co-est2023-pop.csv")
      .then((data) => {
        const popMap: { [key: string]: number } = {};
        data.forEach((row) => {
          const geographicArea = row["Geographic Area"];
          const population = parseInt(row["2023"].replace(/,/g, ""), 10);
          
          if (geographicArea && !isNaN(population)) {
            const [county, state] = geographicArea.split(", ");
            const key = `${county}, ${state}`;
            popMap[key] = population;
          }
        });
        setPopulationData(popMap);
      })
      .catch((error) => console.error("Error fetching population data:", error));
  }, []);

  useEffect(() => {
    if (
      geoLoading ||
      loading ||
      !geoData ||
      !fullPlotData ||
      Object.keys(populationData).length === 0
    ) {
      return;
    }
  
    const countyCounts: { [key: string]: number } = {};
  
    // Use filtered indices if available, otherwise use all data
    const dataToUse = filteredIndices && filteredIndices.length > 0
      ? filteredIndices.map(idx => fullPlotData[idx])
      : fullPlotData;
  
    dataToUse.forEach((entry) => {
      const county = entry.county;
      const state = entry.state;
  
      if (county !== "Unknown" && state !== "Unknown") {
        const key = `${county}, ${state}`;
        countyCounts[key] = (countyCounts[key] || 0) + 1;
      }
    });
  
    const featuresWithCounts = geoData.features.map((feature) => {
      const countyName = feature.properties.NAMELSAD;
      const stateName = feature.properties.STATE;
      const key = `${countyName}, ${stateName}`;
      const count = countyCounts[key] || 0;
      const population = populationData[key] || 1;
      const rate = (count / population) * 100000;
      
      return {
        ...feature,
        properties: {
          ...feature.properties,
          count,
          population,
          rate,
        },
      };
    });
  
    setMergedData({
      ...geoData,
      features: featuresWithCounts,
    });
  }, [geoData, loading, fullPlotData, populationData, geoLoading, filteredIndices]);

  const handleCountyClick = (feature: GeoFeature) => {
    const clickedCounty = feature.properties.NAMELSAD;
    const clickedState = feature.properties.STATE;

    setFilterState(prevState => {
      const countyExists = prevState.counties.some(
        c => c.name === clickedCounty && c.state === clickedState
      );

      let newCounties;
      if (countyExists) {
        newCounties = prevState.counties.filter(
          c => !(c.name === clickedCounty && c.state === clickedState)
        );
      } else {
        newCounties = [...prevState.counties, { name: clickedCounty, state: clickedState }];
      }

      return {
        ...prevState,
        counties: newCounties,
      };
    });
  };

  const handleMouseMove = (
    event: React.MouseEvent,
    feature: GeoFeature
  ) => {
    setHoveredCounty({
      name: feature.properties.NAME,
      state: feature.properties.STATE,
      count: feature.properties.count || 0,
      population: feature.properties.population || 0,
      rate: feature.properties.rate || 0,
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleMouseLeave = () => {
    setHoveredCounty(null);
  };

  if (geoLoading || loading || !mergedData) {
    return <div>Loading...</div>;
  }

  const counts = mergedData.features.map((f) => f.properties.rate || 0);
  const maxRate = 250;

  const colorScale = scaleSequential(interpolateBlues).domain([0, maxRate]);

  const width = 850;
  const height = 390;
  const scaleVal = 800;

  const projection = geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(scaleVal);
  const pathGenerator = geoPath().projection(projection);

  return (
    <div className="relative font-sans">
      <div className="absolute top-0 left-0 z-10 p-2 text-sm text-gray-600 bg-white bg-opacity-90 rounded">
        {filterState.counties.length > 0 ? (
          <div>
            <span>
              Showing cases in {filterState.counties.map(county => `${county.name}, ${county.state}`).join(' and ')}
            </span>
            <button 
              onClick={clearAllFilters} 
              className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
            >
              Clear Selection{filterState.counties.length > 1 ? 's' : ''}
            </button>
          </div>
        ) : (
          <span>Click on counties to filter cases (click multiple for multi-select)</span>
        )}
      </div>

      <div className="flex justify-center">
        <svg width={width} height={height}>
          <Group>
            {mergedData.features.map((feature, i) => {
              const path = pathGenerator(feature.geometry);
              const rate = feature.properties.rate || 0;
              const isSelected = filterState.counties.some(
                county => 
                  county.name === feature.properties.NAMELSAD && 
                  county.state === feature.properties.STATE
              );

              return (
                <path
                  key={`path-${i}`}
                  d={path || undefined}
                  fill={rate > 0 ? colorScale(rate) : "#EEE"}
                  stroke={isSelected ? "#FF0000" : "#fff"}
                  strokeWidth={isSelected ? 2 : 0.5}
                  onMouseMove={(e) => handleMouseMove(e, feature)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleCountyClick(feature)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </Group>

          {/* Color Scale Legend */}
          <g transform={`translate(${width - 100}, ${height / 4})`}>
            {Array.from({length: 10}, (_, i) => {
              const value = (maxRate / 9) * i;
              return (
                <g key={i} transform={`translate(0, ${i * 20})`}>
                  <rect
                    width={20}
                    height={20}
                    fill={colorScale(value)}
                    stroke="#fff"
                    strokeWidth={0.5}
                  />
                  <text
                    x={25}
                    y={15}
                    fontSize={10}
                    fill="gray"
                  >
                    {value.toFixed(2)}
                  </text>
                </g>
              );
            })}
            <text
              x={10}
              y={-10}
              fontSize={12}
              textAnchor="middle"
              fill="gray"
            >
              Rate
            </text>
          </g>
        </svg>
      </div>

      {hoveredCounty && (
        <div
          className="fixed bg-white px-4 py-2 rounded shadow-lg border border-gray-200 pointer-events-none"
          style={{
            left: `${hoveredCounty.x}px`,
            top: `${hoveredCounty.y}px`,
            transform: 'translate(10px, 10px)',
          }}
        >
          <p className="font-semibold">{hoveredCounty.name}, {hoveredCounty.state}</p>
          <p className="text-gray-600">
            Missing Persons: {hoveredCounty.count.toLocaleString()}
          </p>
          <p className="text-gray-600">
            Population: {hoveredCounty.population.toLocaleString()}
          </p>
          <p className="text-gray-600">
            Rate per 100k: {hoveredCounty.rate.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};

export default CountyChoroplethMap;