import React from 'react';
import EyeColorDonutChart from '@/components/eye-color-donut-chart';
import EyeColorRatioChart from '@/components/eye-color-ratio-chart';
import GenderDonutChart from '@/components/gender-donut-chart';
// import StateChoroplethMap from '@/components/state-choropleth-map';

export default function App() {
  return (
    <div>
      <h1>Missing Persons Data Visualizations</h1>
      <GenderDonutChart />
      <EyeColorDonutChart />
      <EyeColorRatioChart />
      {/* <StateChoroplethMap /> */}
      {/* <CountyChoroplethMap /> */}
    </div>
  );
}


export default App
