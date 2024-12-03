import React from "react";
import { useMissingPersonsData } from "@/context/MissingPersonsContext";

interface PersonDetailsProps {
  person: any;
  onBack: () => void;
}

const PersonDetails: React.FC<PersonDetailsProps> = ({ person, onBack }) => {
  const { missingPersonsData } = useMissingPersonsData();

  // Get the full data of the person using the index
  const personData = missingPersonsData
    ? missingPersonsData[person.index]
    : null;

  if (!personData) {
    return <div>Person data not available.</div>;
  }

  // Extract pertinent information
  const {
    subjectIdentification,
    subjectDescription,
    physicalDescription,
    sighting,
    images,
    circumstances,
  } = personData;

  // Construct the image URL (update this according to your actual image hosting)
  const imageUrl =
    images && images.length > 0
      ? `https://namus.gov${images[0].files.original.href}`
      : null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">
        {subjectIdentification.firstName} {subjectIdentification.lastName}
      </h2>

      <div className="flex gap-8">
        <div className="flex-1">
          <p>
            <strong>Age:</strong> {subjectIdentification.currentMinAge}
          </p>
          <p>
            <strong>Gender:</strong> {subjectDescription.sex.localizedName}
          </p>
          <p>
            <strong>Height:</strong> {subjectDescription.heightFrom} inches
          </p>
          <p>
            <strong>Weight:</strong> {subjectDescription.weightFrom} lbs
          </p>
          <p>
            <strong>Hair Color:</strong>{" "}
            {physicalDescription.hairColor.localizedName}
          </p>
          <p>
            <strong>Eye Color:</strong>{" "}
            {physicalDescription.leftEyeColor.localizedName}
          </p>
        </div>

        {imageUrl && (
          <div className="w-48 h-48 overflow-hidden">
            <img
              src={imageUrl}
              alt={`${subjectIdentification.firstName} ${subjectIdentification.lastName}`}
              className="w-full h-full object-cover rounded"
            />
          </div>
        )}
      </div>

      <p>
        <strong>Last Seen:</strong> {sighting.date} in {sighting.address.city},{" "}
        {sighting.address.state.name}
      </p>
      {circumstances && circumstances.circumstancesOfDisappearance && (
        <p>
          <strong>Circumstances:</strong>{" "}
          {circumstances.circumstancesOfDisappearance}
        </p>
      )}
    </div>
  );
};

export default PersonDetails;
