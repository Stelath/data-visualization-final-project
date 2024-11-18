import React, { useEffect, useState } from "react";
import { geoPath, geoAlbersUsa } from "d3-geo";
import { scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import { Group } from "@visx/group";
import { useMissingPersonsData } from "@/context/MissingPersonsContext";
import { stateNameMapping } from "@/utils/stateNameMapping";

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
  const { filteredData, loading: missingDataLoading } = useMissingPersonsData();
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [mergedData, setMergedData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredState, setHoveredState] = useState<{
    name: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    fetch(
      "https://storage.googleapis.com/data-visualization-stelath/assets/us-states.geojson"
    )
      .then((response) => response.json())
      .then((geoJson) => {
        setGeoData(geoJson);
      })
      .catch((error) => {
        console.error("Error fetching geo data:", error);
      });
  }, []);

  useEffect(() => {
    if (!geoData || !filteredData || missingDataLoading) {
      return;
    }
  
    const stateCounts: { [key: string]: number } = {};
  
    filteredData.forEach((entry: any) => {
      try {
        const stateAbbr = entry.sighting?.address?.state?.displayName;
        if (stateAbbr) {
          // Find full state name from abbreviation
          const fullStateName = Object.keys(stateNameMapping).find(
            (key) => stateNameMapping[key] === stateAbbr
          );
  
          if (
            fullStateName &&
            fullStateName !== "Alaska" &&
            fullStateName !== "Hawaii"
          ) {
            stateCounts[fullStateName] = (stateCounts[fullStateName] || 0) + 1;
          }
        }
      } catch (error) {
        console.error("Error processing missing persons data:", error);
      }
    });  

    const statesToRemove = [
      "Commonwealth of the Northern Mariana Islands",
      "Guam",
      "Puerto Rico",
      "American Samoa",
      "United States Virgin Islands",
      "Alaska",
      "Hawaii",
    ];

    const featuresWithCounts = geoData.features
      .filter((feature) => !statesToRemove.includes(feature.properties.NAME))
      .map((feature) => {
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
  }, [geoData, filteredData, missingDataLoading]);

  if (loading || !mergedData) {
    return <div>Loading...</div>;
  }

  const counts = mergedData.features.map((f) => f.properties.count || 0);
  const maxCount = Math.max(...counts);

  const colorScale = scaleSequential(interpolateBlues).domain([0, maxCount]);

  const projection = geoAlbersUsa()
    .translate([960 / 2, 600 / 2])
    .scale(1000);
  const pathGenerator = geoPath().projection(projection);

  const width = 960;
  const height = 600;

  const handleMouseMove = (
    event: React.MouseEvent,
    feature: GeoFeature
  ) => {
    setHoveredState({
      name: feature.properties.NAME,
      count: feature.properties.count || 0,
      x: event.clientX,
      y: event.clientY
    });
  };  

  const handleMouseLeave = () => {
    setHoveredState(null);
  };

  return (
    <div className="relative font-sans">
      <svg width={width} height={height}>
        <Group>
          {mergedData.features.map((feature, i) => {
            const path = pathGenerator(feature.geometry);
            const count = feature.properties.count || 0;
            const isHovered = hoveredState?.name === feature.properties.NAME;

            return (
              <path
                key={`path-${i}`}
                d={path || undefined}
                fill={count > 0 ? colorScale(count) : "#EEE"}
                stroke={isHovered ? "#2563eb" : "#fff"}
                strokeWidth={isHovered ? 2 : 0.5}
                onMouseMove={(e) => handleMouseMove(e, feature)}
                onMouseLeave={handleMouseLeave}
                style={{
                  transition:
                    "stroke 0.2s ease-in-out, stroke-width 0.2s ease-in-out",
                }}
              />
            );
          })}
        </Group>

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

      {hoveredState && (
        <div
          className="fixed bg-white px-4 py-2 rounded shadow-lg border border-gray-200 pointer-events-none"
          style={{
            left: `${hoveredState.x}px`,
            top: `${hoveredState.y}px`,
            transform: 'translate(10px, 10px)',
          }}
        >
          <p className="font-semibold">{hoveredState.name}</p>
          <p className="text-gray-600">
            Missing Persons: {hoveredState.count.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default MissingPersonsMap;
