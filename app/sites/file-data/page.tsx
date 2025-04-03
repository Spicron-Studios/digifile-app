'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import prisma from '@/app/lib/prisma';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { v4 as uuidv4 } from 'uuid';

export default function FileDataListPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch('/api/files');
        const data = await response.json();
        setFiles(data);
      } catch (error) {
        console.error("Failed to fetch files:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFiles();
  }, []);
  
  const filteredFiles = files.filter(file => 
    file.file_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.account_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.patient?.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleCreateNew = () => {
    const newId = uuidv4();
    window.location.href = `/sites/file-data/${newId}`;
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
              {filteredFiles.map((file) => (
                <tr key={file.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{file.file_number || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{file.account_number || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{file.patient?.id || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{file.patient?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{file.patient?.gender || '-'}</td>
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
