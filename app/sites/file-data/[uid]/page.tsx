'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function FileDataPage() {
  const { uid } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFileData() {
      try {
        const response = await fetch(`/api/files/${uid}`);
        const data = await response.json();
        setFile(data);
      } catch (error) {
        console.error('Failed to fetch file data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFileData();
  }, [uid]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!file) {
    return <div>File not found</div>;
  }

  return (
    <div>
      <h1>File Details</h1>
      <div>
        <p>File Number: {file.file_number}</p>
        <p>Account Number: {file.account_number}</p>
        {file.patient && (
          <div>
            <h2>Patient Information</h2>
            <p>Name: {file.patient.name}</p>
            <p>Gender: {file.patient.gender}</p>
          </div>
        )}
      </div>
    </div>
  );
}
