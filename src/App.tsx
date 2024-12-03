import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StateChoroplethMap from '@/components/county-choropleth-map';
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
        <div className="grid grid-rows-[55%_45%] gap-4 h-[calc(100vh-2rem)]">
          <div className="grid grid-cols-3 gap-4">
            <Card className="w-full h-full col-span-2">
              <CardContent className="p-4">
                <StateChoroplethMap />
              </CardContent>
            </Card>
            
            <Card className="w-full h-full">
              <CardHeader>
                <CardTitle className="text-3xl font-bold mb-2">Missing Persons Visualization</CardTitle>
                <div className="space-y-4">
                  <div>
                  <p className="text-xl italic">By:</p>
                    <p className="text-2xl">Alex Korte</p>
                    <p className="text-2xl">Nolen Schnabel</p>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-lg font-medium">Data Sourced From:</p>
                    <div className="space-y-1">
                      <a 
                        href="https://namus.gov"
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-blue-500 hover:text-blue-700 block"
                      >
                        NamUs.gov
                      </a>
                      <a
                        href="https://census.gov" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 block"
                      >
                        U.S. Census Bureau (census.gov)
                      </a>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <Card className="w-full h-full col-span-2">
              <CardContent className="p-4">
                <ParallelCoordinatesPlot onDimensionClick={handleDimensionClick} />
              </CardContent>
            </Card>
            
            <Card className="w-full h-full">
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