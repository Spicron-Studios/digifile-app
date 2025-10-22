'use client';
import { getLogger } from '@/app/lib/logger';

import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { getFiles, type FileListItem } from '@/app/actions/files';
import { useState, useEffect } from 'react';

function FileDataClient({
  initialFiles,
}: {
  initialFiles: FileListItem[];
}): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const filtered = initialFiles.filter(file => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      file.file_number.toLowerCase().includes(q) ||
      file.account_number.toLowerCase().includes(q) ||
      file.patient.id.toLowerCase().includes(q) ||
      file.patient.name.toLowerCase().includes(q)
    );
  });

  return (
    <>
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

      {filtered.length > 0 ? (
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
              {filtered.map(file => (
                <tr key={file.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.file_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.account_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.patient.id || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.patient.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.patient.gender || '-'}
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
    </>
  );
}

export default function FileDataListPage(): React.JSX.Element {
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const fileData = await getFiles();
        setFiles(fileData);
      } catch (error) {
        const logger = getLogger();
        await logger.error(
          'app/(main)/sites/file-data/page.tsx',
          `Error loading files: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">File Data</h1>
        <Button
          onClick={() => (window.location.href = '/sites/file-data/new-record')}
        >
          Create New
        </Button>
      </div>

      <FileDataClient initialFiles={files} />
    </div>
  );
}
