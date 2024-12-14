import React from "react";

interface PersonDetailsProps {
  person: any;
  onBack: () => void;
}

const PersonDetails: React.FC<PersonDetailsProps> = ({ person, onBack }) => {
  if (!person) {
    return <div>Person data not available.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {person.firstName} {person.lastName}
        </h2>
        <button
          onClick={onBack}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          Back
        </button>
      </div>

      <div className="flex gap-8">
        <div className="flex-1 space-y-2">
          <p><strong>Age:</strong> {person.age}</p>
          <p><strong>Gender:</strong> {person.gender}</p>
          <p><strong>Height:</strong> {person.height} inches</p>
          <p><strong>Weight:</strong> {person.weight} lbs</p>
          <p><strong>Eye Color:</strong> {person.eyeColor}</p>
          <p><strong>Race:</strong> {person.race}</p>
          <p><strong>Years Missing:</strong> {person.yearsMissing.toFixed(1)}</p>
          <p>
            <strong>Last Seen:</strong> {person.lastSeenDate && new Date(person.lastSeenDate).toLocaleDateString()} 
          </p>
        </div>

        {person.photoUrl && (
          <div className="flex-shrink-0">
            <div className="w-48 h-48 overflow-hidden rounded-lg shadow-md">
              <img
                src={person.photoUrl}
                alt={`${person.firstName} ${person.lastName}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-person.png';
                  target.classList.add('opacity-50');
                }}
              />
            </div>
          </div>
        )}
      </div>

      {person.circumstancesOfDisappearance && (
        <div className="mt-6">
          <strong>Circumstances:</strong>
          <p className="mt-1">{person.circumstancesOfDisappearance}</p>
        </div>
      )}
    </div>
  );
};

export default PersonDetails;