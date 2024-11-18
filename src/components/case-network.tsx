import React, { useEffect, useState } from 'react';
import { scaleOrdinal } from '@visx/scale';
import { Group } from '@visx/group';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import { line, curveCardinal } from 'd3-shape';
import { Text } from '@visx/text';

interface Node {
  id: string;
  group: string;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

const COLORS: { [key: string]: string } = {
  "Missing Person": '#4B9CD3',
};

const CaseNetwork: React.FC = () => {
  const [data, setData] = useState<GraphData | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using a more robust path resolution
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const response = await fetch(`${basePath}/data/NetworkGraph.json`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawText = await response.text();
        console.log('Raw response:', rawText);
        
        if (!rawText.trim()) {
          throw new Error('Empty response received');
        }
        
        const rawData = JSON.parse(rawText);
        console.log('Parsed data:', rawData);
        
        if (!Array.isArray(rawData)) {
          throw new Error('Expected an array of person data');
        }
        
        const transformedData = transformDataToGraph(rawData);
        setData(transformedData);
        setError(null);
      } catch (error) {
        console.error('Detailed error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!data) return;

    const simulation = forceSimulation<Node>()
      .nodes(data.nodes)
      .force('link', forceLink<Link>().id((d) => d.id).links(data.links))
      .force('charge', forceManyBody().strength(-50))
      .force('center', forceCenter(400 / 2, 400 / 2));

    simulation.on('tick', () => {
      setNodes([...simulation.nodes()]);
      setLinks([...data.links]);
    });

    return () => {
      simulation.stop();
    };
  }, [data]);

  const colorScale = scaleOrdinal<string, string>({
    domain: Object.keys(COLORS),
    range: Object.values(COLORS),
  });

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">Loading network data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded bg-red-50">
        <h2 className="text-lg font-semibold text-red-700">Error Loading Network Graph</h2>
        <p className="text-red-600 mt-2">{error}</p>
        <div className="mt-4">
          <p className="font-medium">Please check that:</p>
          <ul className="list-disc ml-6 mt-2 text-red-600">
            <li>The file exists at /data/NetworkGraph.json</li>
            <li>The JSON format is valid</li>
            <li>The file is accessible from your web server</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!data || nodes.length === 0) {
    return (
      <div className="p-4">
        <p className="text-gray-600">No network data available</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Network Graph of Missing Persons</h2>
      <svg width={400} height={400} style={{ border: '1px solid #ccc' }}>
        <Group>
          {links.map((link, index) => {
            const source = nodes.find((n) => n.id === link.source);
            const target = nodes.find((n) => n.id === link.target);
            if (!source || !target || source.x === undefined || target.x === undefined) return null;

            const path = line()
              .x((d) => d[0])
              .y((d) => d[1])
              .curve(curveCardinal)([
                [source.x, source.y],
                [target.x, target.y],
              ]);

            return (
              <path
                key={`link-${index}`}
                d={path || ''}
                stroke="#999"
                strokeWidth={Math.sqrt(link.value)}
                fill="none"
              />
            );
          })}

          {nodes.map((node, index) => (
            <circle
              key={`node-${index}`}
              cx={node.x || 0}
              cy={node.y || 0}
              r={8}
              fill={colorScale(node.group)}
              stroke="#fff"
              strokeWidth={2}
            >
              <title>{node.id}</title>
            </circle>
          ))}

          {nodes.map((node, index) => (
            <Text
              key={`label-${index}`}
              x={node.x || 0}
              y={node.y ? node.y - 10 : 0}
              fontSize={10}
              textAnchor="middle"
              fill="#333"
            >
              {node.id}
            </Text>
          ))}
        </Group>
      </svg>
    </div>
  );
};

const transformDataToGraph = (rawData: any): GraphData => {
  console.log('Transforming data:', rawData);
  
  const nodes = rawData.map((person: any) => ({
    id: person.idFormatted,
    group: "Missing Person",
  }));

  const links: Link[] = [];
  
  for (let i = 0; i < rawData.length; i++) {
    for (let j = i + 1; j < rawData.length; j++) {
      const personA = rawData[i];
      const personB = rawData[j];
      
      if (personA.sighting?.address?.city === personB.sighting?.address?.city) {
        links.push({
          source: personA.idFormatted,
          target: personB.idFormatted,
          value: 1,
        });
      }
    }
  }

  console.log('Transformed data:', { nodes, links });
  return { nodes, links };
};

export default CaseNetwork;