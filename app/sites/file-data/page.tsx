'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { FileData } from '@/app/types/file-data';

export default function FileDataListPage(): React.JSX.Element {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function fetchFiles() {
      console.log(
        '%c🚀 Frontend: Starting file fetch',
        'color: blue; font-weight: bold'
      );
      try {
        const response = await fetch('/api/files');
        console.log(
          `%c📡 Frontend: API response status: ${response.status}`,
          'color: cyan'
        );

        const data = await response.json();
        console.log('%c📦 Frontend: Raw response data:', 'color: green', data);
        console.log(
          `%c🔍 Frontend: Is data an array? ${Array.isArray(data)}`,
          'color: green'
        );
        console.log(
          `%c📊 Frontend: Data length: ${Array.isArray(data) ? data.length : 'N/A'}`,
          'color: green'
        );

        if (Array.isArray(data)) {
          const withPatient = data.filter(
            file => file.patient?.id || file.patient?.name
          );
          const withoutPatient = data.filter(
            file => !file.patient?.id && !file.patient?.name
          );
          console.log(
            `%c👤 Frontend: Files with patient data: ${withPatient.length}`,
            'color: orange'
          );
          console.log(
            `%c🚶 Frontend: Files without patient data: ${withoutPatient.length}`,
            'color: orange'
          );
        }

        // Ensure we always have an array
        setFiles(Array.isArray(data) ? data : []);
        console.log(
          '%c✅ Frontend: State updated with file data',
          'color: green; font-weight: bold'
        );
      } catch (error) {
        console.error(
          '%c❌ Frontend: Failed to fetch files:',
          'color: red; font-weight: bold',
          error
        );
        setFiles([]);
      } finally {
        setLoading(false);
        console.log('%c🏁 Frontend: Loading state set to false', 'color: blue');
      }
    }

    fetchFiles();
  }, []);

  // Make sure we have an array before filtering
  console.log(
    '%c📂 Frontend: Current files state before filtering:',
    'color: purple',
    files
  );
  console.log(
    `%c🔍 Frontend: Is files state an array? ${Array.isArray(files)}`,
    'color: purple'
  );

  const filteredFiles = Array.isArray(files)
    ? files.filter(file => {
        // Handle case where search query is empty (show all files)
        if (!searchQuery) return true;

        // Define what fields we're searching in, handling possible null/undefined values
        const fileNumber = file.file_number?.toLowerCase() || '';
        const accountNumber = file.account_number?.toLowerCase() || '';
        const patientId = file.patient?.id?.toLowerCase() || '';
        const patientName = file.patient?.name?.toLowerCase() || '';

        const query = searchQuery.toLowerCase();

        const matchesFileNumber = fileNumber.includes(query);
        const matchesAccountNumber = accountNumber.includes(query);
        const matchesPatientId = patientId.includes(query);
        const matchesPatientName = patientName.includes(query);

        if (searchQuery) {
          console.log('%c🔎 Frontend: Filtering file:', 'color: orange', {
            uid: file.uid,
            file_number: file.file_number,
            matchesFileNumber,
            matchesAccountNumber,
            matchesPatientId,
            matchesPatientName,
          });
        }

        return (
          matchesFileNumber ||
          matchesAccountNumber ||
          matchesPatientId ||
          matchesPatientName
        );
      })
    : [];

  console.log(
    `%c📊 Frontend: Filtered files count: ${filteredFiles.length}`,
    'color: green; font-weight: bold'
  );

  const handleCreateNew = () => {
    window.location.href = `/sites/file-data/new-record`;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">File Data</h1>
        <Button onClick={handleCreateNew}>Create New</Button>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by file number, account number, ID or patient name"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <p>Loading...</p>
      ) : filteredFiles.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFiles.map(file => (
                <tr key={file.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.file_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.account_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.patient?.id || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.patient?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.patient?.gender || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/sites/file-data/${file.uid}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No Records found</p>
        </div>
      )}
    </div>
  );
}
