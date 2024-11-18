import React, { createContext, useContext, useEffect, useState } from 'react';

interface MissingPersonRecord {
  // Define the properties based on your data structure
  [key: string]: any;
}

interface MissingPersonsContextProps {
  missingPersonsData: MissingPersonRecord[] | null;
  loading: boolean;
  filteredIndices: number[];
  setFilteredIndices: (indices: number[]) => void;
}

const MissingPersonsContext = createContext<MissingPersonsContextProps>({
  missingPersonsData: null,
  loading: true,
  filteredIndices: [],
  setFilteredIndices: () => {},
});


export const MissingPersonsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [missingPersonsData, setMissingPersonsData] = useState<MissingPersonRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filteredIndices, setFilteredIndices] = useState<number[]>([]);

  useEffect(() => {
    fetch('https://storage.googleapis.com/data-visualization-stelath/data/MissingPersons.json')
      .then((response) => response.json())
      .then((data) => {
        setMissingPersonsData(data);
        setFilteredIndices(data.map((_, index) => index)); // Initialize to all indices
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching MissingPersons data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <MissingPersonsContext.Provider value={{ missingPersonsData, loading, filteredIndices, setFilteredIndices }}>
      {children}
    </MissingPersonsContext.Provider>
  );
};

export const MissingPersonsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [missingPersonsData, setMissingPersonsData] = useState<MissingPersonRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filteredIndices, setFilteredIndices] = useState<number[]>([]);

  useEffect(() => {
    fetch('https://storage.googleapis.com/data-visualization-stelath/data/MissingPersons.json')
      .then((response) => response.json())
      .then((data) => {
        setMissingPersonsData(data);
        setFilteredIndices(data.map((_, index) => index)); // Initialize to all indices
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching MissingPersons data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <MissingPersonsContext.Provider value={{ missingPersonsData, loading, filteredIndices, setFilteredIndices }}>
      {children}
    </MissingPersonsContext.Provider>
  );
};

export const useMissingPersonsData = () => useContext(MissingPersonsContext);
