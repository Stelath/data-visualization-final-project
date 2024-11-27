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
  const [error] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://storage.googleapis.com/data-visualization-stelath/data/MissingPersons.json')
      .then((response) => response.json())
      .then((data: MissingPersonRecord[]) => {
        // Filter out records with weight > 400 or height > 200
        const filteredData = data.filter(record => {
          const age = record.subjectIdentification?.computedMissingMinAge || 0;
          const weight = record.subjectDescription?.weightFrom || 0;
          const height = record.subjectDescription?.heightFrom || 0;
          return weight <= 400 && height <= 200 && age <= 115;
        });
        
        setMissingPersonsData(filteredData);
        setFilteredIndices(filteredData.map((_, index) => index));
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