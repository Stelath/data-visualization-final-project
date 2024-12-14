// MissingPersonsContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';

// Type Definitions
interface MissingPersonRecord {
  sighting?: {
    date?: string;
    address?: {
      county?: {
        name?: string;
      };
      state?: {
        name?: string;
      };
    };
  };
  subjectIdentification?: {
    computedMissingMinAge?: number;
  };
  subjectDescription?: {
    heightFrom?: number;
    weightFrom?: number;
    primaryEthnicity?: {
      localizedName?: string;
    };
    sex?: {
      localizedName?: string;
    };
  };
  physicalDescription?: {
    leftEyeColor?: {
      localizedName?: string;
    };
  };
  [key: string]: any;
}

interface DimensionFilter {
  dimension: string;
  ranges: ([number, number] | [string])[];
}

interface CountyFilter {
  name: string;
  state: string;
}

interface FilterState {
  dimensions: DimensionFilter[];
  counties: CountyFilter[];
}

interface FullPlotDataPoint {
  index: number;
  age: number;
  yearsMissing: number;
  height: number;
  weight: number;
  eyeColor: string;
  race: string;
  gender: string;
  state: string;
  county: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  circumstancesOfDisappearance: string;
  lastSeenDate: string;
}

interface MissingPersonsContextProps {
  fullPlotData: FullPlotDataPoint[] | null;
  filteredIndices: number[] | null;
  filterState: FilterState;
  setFilterState: (state: FilterState | ((prev: FilterState) => FilterState)) => void;
  clearAllFilters: () => void;
  loading: boolean;
  error: string | null;
}

// Create Context
const MissingPersonsContext = createContext<MissingPersonsContextProps>({
  fullPlotData: null,
  filteredIndices: null,
  filterState: { dimensions: [], counties: [] },
  setFilterState: () => {},
  clearAllFilters: () => {},
  loading: true,
  error: null,
});

// Provider Component
export const MissingPersonsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [missingPersonsData, setMissingPersonsData] = useState<MissingPersonRecord[] | null>(null);
  const [fullPlotData, setFullPlotData] = useState<FullPlotDataPoint[] | null>(null);
  const [filteredIndices, setFilteredIndices] = useState<number[] | null>(null);
  const [filterState, setFilterState] = useState<FilterState>({ dimensions: [], counties: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Data
  useEffect(() => {
    setLoading(true);
    fetch('https://storage.googleapis.com/data-visualization-stelath/data/MissingPersons.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data: MissingPersonRecord[]) => {
        // Filter out invalid records
        const filteredData = data.filter(record => {
          const age = record.subjectIdentification?.computedMissingMinAge || 0;
          const weight = record.subjectDescription?.weightFrom || 0;
          const height = record.subjectDescription?.heightFrom || 0;
          return weight <= 400 && height <= 100 && age <= 115;
        });

        setMissingPersonsData(filteredData);

        // Transform data into fullPlotData
        const transformedData: FullPlotDataPoint[] = filteredData.map((d, index) => ({
          index,
          age: d.subjectIdentification?.computedMissingMinAge || 0,
          yearsMissing:
            (Date.now() - new Date(d.sighting?.date || Date.now()).getTime()) /
            (1000 * 3600 * 24 * 365),
          height: d.subjectDescription?.heightFrom || 0,
          weight: d.subjectDescription?.weightFrom || 0,
          eyeColor: d.physicalDescription?.leftEyeColor?.localizedName || 'Unknown',
          race: d.subjectDescription?.primaryEthnicity?.localizedName === 'Hawaiian / Pacific Islander'
            ? 'Hawaiian / PI'
            : d.subjectDescription?.primaryEthnicity?.localizedName === 'Black / African American'
            ? 'African American' 
            : d.subjectDescription?.primaryEthnicity?.localizedName === 'American Indian / Alaska Native'
            ? 'Native Amer'
            : d.subjectDescription?.primaryEthnicity?.localizedName === 'Hispanic / Latino'
            ? 'Hispanic'
            : d.subjectDescription?.primaryEthnicity?.localizedName === 'White / Caucasian'
            ? 'Caucasian'
            : d.subjectDescription?.primaryEthnicity?.localizedName || 'Unknown',
          gender: d.subjectDescription?.sex?.localizedName || 'Unknown',
          state: d.sighting?.address?.state?.name || 'Unknown',
          county: d.sighting?.address?.county?.name || 'Unknown',
          firstName: d.subjectIdentification?.firstName || '',
          lastName: d.subjectIdentification?.lastName || '',
          photoUrl: d.images && d.images.length > 0 ? `https://namus.gov${d.images[0].files.original.href}` : '',
          circumstancesOfDisappearance: d.circumstances?.circumstancesOfDisappearance || '',
          lastSeenDate: d.sighting?.date || '',
        }));        

        setFullPlotData(transformedData);
        setFilteredIndices(transformedData.map((_, index) => index));
        setError(null);
      })
      .catch((error) => {
        console.error('Error fetching MissingPersons data:', error);
        setError('Failed to load missing persons data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Apply Filters
  useEffect(() => {
    if (!fullPlotData) return;

    let newFilteredIndices = fullPlotData.map((_, index) => index);

    // Apply dimension filters
    filterState.dimensions.forEach(({ dimension, ranges }) => {
      newFilteredIndices = newFilteredIndices.filter(index => {
        const value = fullPlotData[index][dimension];
        return ranges.some(range => {
          if (typeof range[0] === 'number') {
            // Numerical filter
            const [min, max] = range as [number, number];
            return (value as number) >= min && (value as number) <= max;
          } else {
            // Categorical filter
            const [category] = range as [string];
            return value === category;
          }
        });
      });
    });

    // Apply county filters
    if (filterState.counties.length > 0) {
      newFilteredIndices = newFilteredIndices.filter(index => {
        const record = fullPlotData[index];
        const personCounty = record.county;
        const personState = record.state;

        return filterState.counties.some(county => {
          const normalizedSelectedCounty = county.name.replace(" County", "").toLowerCase();
          const normalizedPersonCounty = personCounty.replace(" County", "").toLowerCase();
          return normalizedPersonCounty === normalizedSelectedCounty && personState === county.state;
        });
      });
    }

    setFilteredIndices(newFilteredIndices);
  }, [filterState, fullPlotData]);

  // Clear all filters
  const clearAllFilters = () => {
    setFilterState({ dimensions: [], counties: [] });
    if (fullPlotData) {
      setFilteredIndices(fullPlotData.map((_, index) => index));
    }
  };

  const contextValue = {
    fullPlotData,
    filteredIndices,
    filterState,
    setFilterState,
    clearAllFilters,
    loading,
    error,
  };

  return (
    <MissingPersonsContext.Provider value={contextValue}>
      {children}
    </MissingPersonsContext.Provider>
  );
};

// Custom Hook
export const useMissingPersonsData = () => {
  const context = useContext(MissingPersonsContext);
  if (context === undefined) {
    throw new Error('useMissingPersonsData must be used within a MissingPersonsProvider');
  }
  return context;
};