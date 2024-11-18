import React, { useState } from 'react';
import { scaleOrdinal } from '@visx/scale';
import { Group } from '@visx/group';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import { line, curveCardinal } from 'd3-shape';
import { Text } from '@visx/text';

// Types for our data structure
interface CaseData {
  idFormatted: string;
  subjectIdentification: {
    firstName: string;
    lastName: string;
  };
  sighting?: {
    address?: {
      city?: string;
      state?: {
        name: string;
      };
    };
    date?: string;
  };
  circumstances?: {
    circumstancesOfDisappearance?: string;
  };
}

interface Node {
  id: string;
  group: string;
  details: {
    name: string;
    location: string;
    dateLastSeen?: string;
    circumstances?: string;
  };
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
  reason: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

const COLORS = {
  "Missing Person": '#4B9CD3',
  "Location": '#45B7D1',
  "Date": '#4682B4'
};

const CaseNetwork = () => {
  // Example case data based on the provided format
  const sampleCase: CaseData = {
    idFormatted: 'MP5211',
    subjectIdentification: {
      firstName: 'Layla',
      lastName: 'Adkins'
    },
    sighting: {
      address: {
        city: 'Leeds',
        state: {
          name: 'Alabama'
        }
      },
      date: '2009-01-21'
    },
    circumstances: {
      circumstancesOfDisappearance: 'Layla was last seen, Highway 41, November 13, 2008'
    }
  };

  // Transform single case into network data
  const transformDataToGraph = (caseData: CaseData): GraphData => {
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Add main person node
    const personNode: Node = {
      id: caseData.idFormatted,
      group: "Missing Person",
      details: {
        name: `${caseData.subjectIdentification.firstName} ${caseData.subjectIdentification.lastName}`,
        location: caseData.sighting?.address?.city || 'Unknown Location',
        dateLastSeen: caseData.sighting?.date,
        circumstances: caseData.circumstances?.circumstancesOfDisappearance
      }
    };
    nodes.push(personNode);

    // Add location node if available
    if (caseData.sighting?.address?.city) {
      const locationId = `loc-${caseData.sighting.address.city}`;
      nodes.push({
        id: locationId,
        group: "Location",
        details: {
          name: `${caseData.sighting.address.city}, ${caseData.sighting.address.state?.name}`,
          location: caseData.sighting.address.city
        }
      });
      
      links.push({
        source: caseData.idFormatted,
        target: locationId,
        value: 1,
        reason: 'Last Seen Location'
      });
    }

    // Add date node if available
    if (caseData.sighting?.date) {
      const dateId = `date-${caseData.sighting.date}`;
      nodes.push({
        id: dateId,
        group: "Date",
        details: {
          name: new Date(caseData.sighting.date).toLocaleDateString(),
          location: 'Date Last Seen'
        }
      });
      
      links.push({
        source: caseData.idFormatted,
        target: dateId,
        value: 1,
        reason: 'Date Last Seen'
      });
    }

    return { nodes, links };
  };

  const [data] = useState<GraphData>(() => transformDataToGraph(sampleCase));
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  React.useEffect(() => {
    if (!data) return;

    const simulation = forceSimulation<Node>()
      .nodes(data.nodes)
      .force('link', forceLink<Node, Link>()
        .id(d => d.id)
        .links(data.links)
        .distance(150))
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(400, 300));

    simulation.on('tick', () => {
      setNodes([...simulation.nodes()]);
      setLinks([...data.links]);
    });

    return () => simulation.stop();
  }, [data]);

  const colorScale = scaleOrdinal<string, string>({
    domain: Object.keys(COLORS),
    range: Object.values(COLORS),
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Missing Person Case Network</h2>
      <div className="border rounded-lg p-4 bg-white shadow-lg">
        <svg width={800} height={600}>
          <Group>
            {links.map((link, index) => {
              const source = nodes.find(n => n.id === link.source);
              const target = nodes.find(n => n.id === link.target);
              
              if (!source?.x || !target?.x) return null;

              const path = line()
                .x(d => d[0])
                .y(d => d[1])
                .curve(curveCardinal)([
                  [source.x, source.y],
                  [target.x, target.y],
                ]);

              return (
                <path
                  key={`link-${index}`}
                  d={path || ''}
                  stroke="#999"
                  strokeOpacity={0.6}
                  strokeWidth={2}
                  fill="none"
                />
              );
            })}

            {nodes.map((node, index) => (
              <g key={`node-group-${index}`}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={10}
                  fill={colorScale(node.group)}
                  stroke="#fff"
                  strokeWidth={2}
                  className="cursor-pointer"
                >
                  <title>{`${node.details.name}\n${node.details.circumstances || ''}`}</title>
                </circle>
                <Text
                  x={node.x}
                  y={(node.y || 0) - 15}
                  fontSize={12}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#333"
                >
                  {node.details.name}
                </Text>
              </g>
            ))}
          </Group>
        </svg>
      </div>
    </div>
  );
};

export default CaseNetwork;