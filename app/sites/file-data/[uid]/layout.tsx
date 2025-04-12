'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function FileDataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { uid } = useParams();
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isNewRecord = uid === 'new-record';

  useEffect(() => {
    async function fetchFileData() {
      if (isNewRecord) {
        // Generate new file number and account number for new records
        const newFileNumber = `F${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const newAccountNumber = `A${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
        
        setFile({
          file_number: newFileNumber,
          account_number: newAccountNumber,
        });
        setLoading(false);
        return;
      }

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
  }, [uid, isNewRecord]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header Section - reduced to 8% height */}
      <div className="h-[8%] border-b bg-white py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          {!loading && file && (
            <div className="flex gap-6">
              <div>
                <span className="text-sm text-gray-500">File Number:</span>
                <span className="ml-2 font-medium">{file?.file_number}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Account Number:</span>
                <span className="ml-2 font-medium">{file?.account_number}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {loading ? <div>Loading...</div> : children}
      </div>
    </div>
  );
} 