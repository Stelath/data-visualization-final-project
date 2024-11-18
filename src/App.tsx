import React from 'react';
import CaseNetwork from '@/components/case-network'; // Adjust the import path if necessary
import './App.css'; // Import a CSS file for styling

function App() {
  return (
    <div>
      <h1>Missing Persons Data Visualizations</h1>
      <div className="chart-container">
        <CaseNetwork /> {/* Only display the Case Network component */}
      </div>
    </div>
  );
}

export default App;