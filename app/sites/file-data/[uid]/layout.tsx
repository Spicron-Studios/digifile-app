'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

export default function FileDataLayout({ children }) {
  const pathname = usePathname();
  const params = useParams();
  const [headerData, setHeaderData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if we're on a file detail page
  const isDetailPage = pathname.includes('/file-data/') && params.uid !== 'new-record';
  const isNewRecord = params.uid === 'new-record';
  
  // Set up event listener for header data
  useEffect(() => {
    // Function to handle the custom event
    const handleHeaderData = (event) => {
      setHeaderData(event.detail);
    };
    
    // Listen for the custom event
    window.addEventListener('file-header-data', handleHeaderData);
    
    // Clean up the event listener
    return () => {
      window.removeEventListener('file-header-data', handleHeaderData);
    };
  }, []);
  
  // Function to handle save button click
  const handleSave = () => {
    // Dispatch an event for the page to handle
    window.dispatchEvent(new Event('file-save-triggered'));
    setIsSaving(true);
    
    // Reset saving state after a delay
    setTimeout(() => setIsSaving(false), 2000);
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header Bar */}
      {(isDetailPage || isNewRecord) && (
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <div className="flex items-center">
            <Link href="/sites/file-data" className="flex items-center mr-6 text-gray-600 hover:text-gray-900">
              <ArrowLeft size={16} className="mr-1" />
              <span>Back</span>
            </Link>
          </div>
          
          {headerData && (
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">File Number:</span>
                <span className="font-medium">{headerData.fileNumber || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Account Number:</span>
                <span className="font-medium">{headerData.accountNumber || '-'}</span>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
} 