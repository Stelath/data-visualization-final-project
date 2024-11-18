import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import EyeColorDonutChart from "@/components/eye-color-donut-chart";
import EyeColorRatioChart from "@/components/eye-color-ratio-chart";
import GenderDonutChart from "@/components/gender-donut-chart";
import StateChoroplethMap from "@/components/state-choropleth-map";
import ParallelCoordinatesPlot from "@/components/parallel-coordinates-plot";
import { MissingPersonsProvider } from "@/context/MissingPersonsContext";
import "./App.css";

function App() {
  return (
    <MissingPersonsProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Missing Persons Data Visualizations
        </h1>
        <div className="grid gap-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>State Choropleth Map</CardTitle>
            </CardHeader>
            <CardContent>
              <StateChoroplethMap />
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Parallel Coordinates Plot</CardTitle>
            </CardHeader>
            <CardContent>
              <ParallelCoordinatesPlot />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Eye Color</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="donut">
                    <AccordionTrigger>Donut Chart</AccordionTrigger>
                    <AccordionContent>
                      <EyeColorDonutChart />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="ratio">
                    <AccordionTrigger>Ratio Chart</AccordionTrigger>
                    <AccordionContent>
                      <EyeColorRatioChart />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gender</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="donut">
                    <AccordionTrigger>Donut Chart</AccordionTrigger>
                    <AccordionContent>
                      <GenderDonutChart />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MissingPersonsProvider>
  );
}

export default App;
