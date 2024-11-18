// src/context/MissingPersonsContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

interface MissingPersonRecord {
  // Define the properties based on your data structure
  [key: string]: any;
}

interface MissingPersonsContextProps {
  missingPersonsData: MissingPersonRecord[] | null;
  loading: boolean;
}

const MissingPersonsContext = createContext<MissingPersonsContextProps>({
  missingPersonsData: null,
  loading: true,
});

export const MissingPersonsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [missingPersonsData, setMissingPersonsData] = useState<MissingPersonRecord[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://storage.googleapis.com/data-visualization-stelath/data/MissingPersons.json')
      .then((response) => response.json())
      .then((data) => {
        setMissingPersonsData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching MissingPersons data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <MissingPersonsContext.Provider value={{ missingPersonsData, loading }}>
      {children}
    </MissingPersonsContext.Provider>
  );
};

export const useMissingPersonsData = () => useContext(MissingPersonsContext);
