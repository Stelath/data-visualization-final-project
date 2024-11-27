import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent, 
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import EyeColorDonutChart from '@/components/eye-color-donut-chart';
import EyeColorRatioChart from '@/components/eye-color-ratio-chart';
import GenderDonutChart from '@/components/gender-donut-chart';
import StateChoroplethMap from '@/components/state-choropleth-map';
import ParallelCoordinatesPlot from '@/components/parallel-coordinates-plot';
import InteractiveBarChart from '@/components/interactive-bar-chart';
import { MissingPersonsProvider } from '@/context/MissingPersonsContext';
import './App.css';

type Dimension = 'age' | 'height' | 'weight' | 'yearsMissing';

function App() {
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null);

  const handleDimensionClick = (dimension: Dimension) => {
    setSelectedDimension(dimension);
  };

  return (
    <MissingPersonsProvider>
      <div className="min-h-screen bg-background p-4">
        <div className="grid grid-cols-5 gap-4 h-[calc(100vh-2rem)]">
          <div className="col-span-3 flex items-center">
            <Card className="h-[95%] w-full">
              <CardContent className="p-4">
                <StateChoroplethMap />
              </CardContent>
            </Card>
          </div>
          
          <div className="col-span-2 grid grid-rows-2 gap-4">
            <Card className="w-full">
              <CardContent className="p-4">
                <ParallelCoordinatesPlot onDimensionClick={handleDimensionClick} />
              </CardContent>
            </Card>
            
            <Card className="w-full">
              <CardContent className="p-4">
                <InteractiveBarChart selectedDimension={selectedDimension} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MissingPersonsProvider>
  );
}

export default App;