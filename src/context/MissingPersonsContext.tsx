import React, { createContext, useContext, useEffect, useState } from 'react';

interface MissingPersonRecord {
  [key: string]: any;
}

interface MissingPersonsContextProps {
  missingPersonsData: MissingPersonRecord[] | null;
  filteredIndices: number[] | null;
  setFilteredIndices: (indices: number[] | null) => void;
  loading: boolean;
  error: string | null;
}

const MissingPersonsContext = createContext<MissingPersonsContextProps>({
  missingPersonsData: null,
  filteredIndices: null,
  setFilteredIndices: () => {},
  loading: true,
  error: null,
});

export const MissingPersonsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [missingPersonsData, setMissingPersonsData] = useState<MissingPersonRecord[] | null>(null);
  const [filteredIndices, setFilteredIndices] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://storage.googleapis.com/data-visualization-stelath/data/MissingPersons.json')
      .then((response) => response.json())
      .then((data: MissingPersonRecord[]) => {
        setMissingPersonsData(data);
        setFilteredIndices(data.map((_, index) => index)); // This initializes filteredIndices
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching MissingPersons data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <MissingPersonsContext.Provider value={{ missingPersonsData, filteredIndices, setFilteredIndices, loading, error }}>
      {children}
    </MissingPersonsContext.Provider>
  );
};

export const useMissingPersonsData = () => useContext(MissingPersonsContext);
