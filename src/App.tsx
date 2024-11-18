import React from 'react';
import EyeColorDonutChart from '@/components/eye-color-donut-chart';
import EyeColorRatioChart from '@/components/eye-color-ratio-chart';
import GenderDonutChart from '@/components/gender-donut-chart';
import StateChoroplethMap from '@/components/state-choropleth-map';
import './App.css'; // Import a CSS file for styling

function App() {
  return (
    <div>
      <h1>Missing Persons Data Visualizations</h1>
      <StateChoroplethMap /> {/* Keep the map at the top */}
      <div className="chart-container">
        <GenderDonutChart />
        <EyeColorDonutChart />
        <EyeColorRatioChart />
      </div>
    </div>
  );
}

export default App;