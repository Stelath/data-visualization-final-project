import React, { useEffect, useState } from 'react';
import ReactMapGL, { Source, Layer } from 'react-map-gl';
import { scaleSequential } from 'd3-scale';
import { interpolateBlues } from 'd3-scale-chromatic';

interface StateData {
  [key: string]: number;
}

const MAPBOX_TOKEN = 'YOUR_MAPBOX_ACCESS_TOKEN'; // Replace with your Mapbox token

const StateChoroplethMap: React.FC = () => {
  const [viewport, setViewport] = useState({
    latitude: 37.8,
    longitude: -96,
    zoom: 3,
  });

  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/data/us-states.geojson').then((res) => res.json()),
      fetch('/data/MissingPersons.json').then((res) => res.json()),
    ]).then(([geojson, mpData]) => {
      const stateCounts: StateData = {};

      mpData.forEach((entry: any) => {
        const state = entry.sighting?.address?.state?.displayName || 'Unknown';
        stateCounts[state] = (stateCounts[state] || 0) + 1;
      });

      // Merge counts into GeoJSON
      geojson.features = geojson.features.map((feature: any) => {
        const stateName = feature.properties.name; // Adjust based on GeoJSON properties
        const count = stateCounts[stateName] || 0;
        feature.properties.count = count;
        return feature;
      });

      setGeoData(geojson);
    });
  }, []);

  const colorScale = scaleSequential(interpolateBlues).domain([0, 100]); // Adjust domain as needed

  const layerStyle = {
    id: 'data',
    type: 'fill',
    paint: {
      'fill-color': ['interpolate', ['linear'], ['get', 'count'], 0, '#FFFFFF', 100, '#0000FF'],
      'fill-opacity': 0.6,
    },
  };

  return (
    <div>
      <h2>Missing Persons by State</h2>
      <ReactMapGL
        {...viewport}
        width="100%"
        height="600px"
        mapStyle="mapbox://styles/mapbox/light-v10"
        onViewportChange={setViewport}
        mapboxApiAccessToken={MAPBOX_TOKEN}
      >
        {geoData && (
          <Source id="my-data" type="geojson" data={geoData}>
            <Layer {...layerStyle} />
          </Source>
        )}
      </ReactMapGL>
    </div>
  );
};

export default StateChoroplethMap;