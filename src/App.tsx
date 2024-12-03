import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StateChoroplethMap from '@/components/county-choropleth-map';
import ParallelCoordinatesPlot from '@/components/parallel-coordinates-plot';
import InteractiveBarChart from '@/components/interactive-bar-chart';
import { MissingPersonsProvider } from '@/context/MissingPersonsContext';
import PersonDetails from '@/components/person-details';
import './App.css';

type Dimension = {
  name: string;
  kind: 'numerical' | 'categorical';
};

function App() {
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  const handleDimensionClick = (dimension: Dimension) => {
    setSelectedDimension(dimension);
    setSelectedPerson(null); // Reset selected person when dimension is clicked
  };

  const handlePersonSelect = (personData: any) => {
    setSelectedPerson(personData);
  };


  return (
    <MissingPersonsProvider>
      <div className="h-screen overflow-hidden bg-background p-2">
        <div className="grid h-full grid-rows-[47%_53%] gap-2">
          <div className="grid grid-cols-3 gap-2 min-h-0">
            <Card className="col-span-2 min-h-0">
              <CardContent className="h-full overflow-hidden">
                <StateChoroplethMap />
              </CardContent>
            </Card>
            
            <Card className="min-h-0">
              <CardHeader className="p-4">
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
          
          <div className="grid grid-cols-3 gap-2 min-h-0">
            <Card className="col-span-2 min-h-0">
              <CardContent className="h-full p-4 overflow-hidden">
                <ParallelCoordinatesPlot
                  onDimensionClick={handleDimensionClick}
                  onPersonSelect={handlePersonSelect} // Pass the handler
                />
              </CardContent>
            </Card>

            <Card className="min-h-0">
              <CardContent className="h-full p-4 overflow-hidden">
                {selectedPerson ? (
                  <PersonDetails
                    person={selectedPerson}
                    onBack={() => setSelectedPerson(null)} // Handler to go back
                  />
                ) : (
                  <InteractiveBarChart selectedDimension={selectedDimension} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MissingPersonsProvider>
  );
}

export default App;