'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';

export default function FileDataPage() {
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
          patient: {
            name: '',
            gender: '',
          }
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!file && !isNewRecord) {
    return <div>File not found</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header Section - 10% height */}
      <div className="h-[10%] border-b bg-white p-4">
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
        </div>
      </div>

      {/* Main Content Area - 90% height split into two sections */}
      <div className="flex h-[90%]">
        {/* Left Section - 45% of remaining space */}
        <div className="w-[50%] p-4">
          <Card className="h-full">
            <Tabs defaultValue="tab1" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tab1">Patient Details</TabsTrigger>
                <TabsTrigger value="tab2">Medical History</TabsTrigger>
                <TabsTrigger value="tab3">Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">
                <div className="p-4">Patient Details Content</div>
              </TabsContent>
              <TabsContent value="tab2">
                <div className="p-4">Medical History Content</div>
              </TabsContent>
              <TabsContent value="tab3">
                <div className="p-4">Documents Content</div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Section - 45% of remaining space */}
        <div className="w-[50%] p-4">
          <Card className="h-full">
            <Tabs defaultValue="tab1" className="h-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="tab1">Billing</TabsTrigger>
                <TabsTrigger value="tab2">Insurance</TabsTrigger>
                <TabsTrigger value="tab3">Claims</TabsTrigger>
                <TabsTrigger value="tab4">Payments</TabsTrigger>
                <TabsTrigger value="tab5">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">
                <div className="p-4">Billing Content</div>
              </TabsContent>
              <TabsContent value="tab2">
                <div className="p-4">Insurance Content</div>
              </TabsContent>
              <TabsContent value="tab3">
                <div className="p-4">Claims Content</div>
              </TabsContent>
              <TabsContent value="tab4">
                <div className="p-4">Payments Content</div>
              </TabsContent>
              <TabsContent value="tab5">
                <div className="p-4">Notes Content</div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
