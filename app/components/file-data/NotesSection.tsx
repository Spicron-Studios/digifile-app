'use client';

import React, { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { TabsContent } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';
import { Calendar as ShadcnCalendar } from '@/app/components/ui/day-picker-calendar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  ArrowUpDown,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import type { FileData, UploadedFile } from '@/app/types/file-data';
import { createNoteWithFiles } from '@/app/actions/file-data';

type NoteRecord = {
  uid?: string;
  time_stamp?: string;
  notes?: string;
  files?: Array<{
    uid?: string;
    file_name?: string | null;
    file_type?: string | null;
    file_location?: string | null;
  }>;
};

export function NotesSection({
  file,
  setFile,
}: {
  file: FileData;
  setFile: (_updater: (_prev: FileData) => FileData) => void;
}): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [activeNoteTab, setActiveNoteTab] = useState<'file' | 'clinical'>(
    'file'
  );
  const [noteDateTime, setNoteDateTime] = useState<Date>(new Date());
  const [noteContent, setNoteContent] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileNotes = (file.notes?.file_notes ?? []) as unknown as NoteRecord[];
  const clinicalNotes = (file.notes?.clinical_notes ??
    []) as unknown as NoteRecord[];

  const filteredFileNotes = useMemo(
    () => filterAndSortNotes(fileNotes),
    [fileNotes, searchQuery, startDate, endDate, sortOrder]
  );
  const filteredClinicalNotes = useMemo(
    () => filterAndSortNotes(clinicalNotes),
    [clinicalNotes, searchQuery, startDate, endDate, sortOrder]
  );

  function filterAndSortNotes(notes: NoteRecord[]): NoteRecord[] {
    let filtered = notes;
    if (searchQuery.trim()) {
      filtered = filtered.filter(n =>
        (n.notes ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (startDate) {
      filtered = filtered.filter(n =>
        n.time_stamp
          ? new Date(n.time_stamp).getTime() >= startDate.getTime()
          : true
      );
    }
    if (endDate) {
      filtered = filtered.filter(n =>
        n.time_stamp
          ? new Date(n.time_stamp).getTime() <= endDate.getTime()
          : true
      );
    }
    filtered = [...filtered].sort((a, b) => {
      const dateA = a.time_stamp ? new Date(a.time_stamp).getTime() : 0;
      const dateB = b.time_stamp ? new Date(b.time_stamp).getTime() : 0;
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return filtered;
  }

  function toggleSortOrder(): void {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
  }

  function formatDateTime(dateString?: string): string {
    if (!dateString) return '';
    return format(new Date(dateString), 'yyyy/MM/dd HH:mm');
  }

  function openNoteModal(tabType: 'file' | 'clinical'): void {
    setActiveNoteTab(tabType);
    setNoteDateTime(new Date());
    setNoteContent('');
    setUploadedFiles([]);
    setIsNoteModalOpen(true);
  }

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(e.target.files ?? []);
    setUploadedFiles(prev => [
      ...prev,
      ...(files as unknown as UploadedFile[]),
    ]);
  }

  function removeFile(index: number): void {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function saveNewNote(): Promise<void> {
    if (!file?.uid && !file?.fileinfo_patient?.[0]?.uid) {
      alert('File data is not ready. Please try again.');
      return;
    }
    if (!noteContent.trim()) {
      alert('Please enter note content');
      return;
    }

    const processedFiles: Array<{
      name: string;
      type: string;
      size: number;
      content: string;
    }> = [];
    for (const f of uploadedFiles as unknown as File[]) {
      const reader = new FileReader();

      const item = await new Promise<{
        name: string;
        type: string;
        size: number;
        content: string;
      }>(resolve => {
        reader.onload = e => {
          resolve({
            name: f.name,
            type: f.type,
            size: f.size,
            content: String(e?.target?.result ?? ''),
          });
        };
        reader.readAsDataURL(f);
      });
      processedFiles.push(item);
    }

    const payload = {
      fileInfoPatientId: file.fileinfo_patient?.[0]?.uid ?? '',
      patientId: file.patient?.uid ?? '',
      timeStamp: noteDateTime.toISOString(),
      notes: noteContent,
      tabType: activeNoteTab,
      files: processedFiles,
    };

    const saved = await createNoteWithFiles(payload);
    setFile(prev => {
      const draft = { ...prev } as FileData;
      if (!draft.notes) {
        draft.notes = { file_notes: [], clinical_notes: [] };
      }
      const targetKey =
        activeNoteTab === 'file' ? 'file_notes' : 'clinical_notes';

      draft.notes[targetKey] = [
        (saved as any).data as NoteRecord,
        ...((draft.notes[targetKey] as unknown as NoteRecord[]) ?? []),
      ];
      return draft;
    });

    setIsNoteModalOpen(false);
  }

  return (
    <>
      {/* File Notes Tab */}
      <TabsContent value="tab1" className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="h-[20%] p-4 border-b space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">File Notes</h3>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={() => openNoteModal('file')}
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Note
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in notes..."
                className="pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex-1 flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'yyyy/MM/dd') : 'From'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <ShadcnCalendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'yyyy/MM/dd') : 'To'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <ShadcnCalendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortOrder}
                title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="h-[80%] overflow-auto p-4">
            {filteredFileNotes.length > 0 ? (
              <div className="space-y-6">
                {filteredFileNotes.map(n => (
                  <div
                    key={n.uid}
                    className="border rounded-md p-4 bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-primary">
                        {formatDateTime(n.time_stamp)}
                      </h3>
                    </div>
                    <div className="ml-4 mt-2 text-gray-700">
                      <p>{n.notes}</p>
                    </div>
                    {n.files && n.files.length > 0 && (
                      <div className="mt-4 ml-4">
                        <div className="flex flex-wrap gap-2">
                          {n.files.map(f => (
                            <div
                              key={f?.uid}
                              className="flex items-center p-2 border rounded bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                            >
                              <a
                                href={f?.file_location ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {f?.file_name}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500">
                {searchQuery || startDate || endDate
                  ? 'No matching file notes found'
                  : 'No file notes available'}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Clinical Notes Tab */}
      <TabsContent value="tab2" className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="h-[20%] p-4 border-b space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Clinical Notes</h3>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={() => openNoteModal('clinical')}
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Note
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in notes..."
                className="pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex-1 flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'yyyy/MM/dd') : 'From'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <ShadcnCalendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'yyyy/MM/dd') : 'To'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <ShadcnCalendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortOrder}
                title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="h-[80%] overflow-auto p-4">
            {filteredClinicalNotes.length > 0 ? (
              <div className="space-y-6">
                {filteredClinicalNotes.map(n => (
                  <div
                    key={n.uid}
                    className="border rounded-md p-4 bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-primary">
                        {formatDateTime(n.time_stamp)}
                      </h3>
                    </div>
                    <div className="ml-4 mt-2 text-gray-700">
                      <p>{n.notes}</p>
                    </div>
                    {n.files && n.files.length > 0 && (
                      <div className="mt-4 ml-4">
                        <div className="flex flex-wrap gap-2">
                          {n.files.map(f => (
                            <div
                              key={f?.uid}
                              className="flex items-center p-2 border rounded bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                            >
                              <a
                                href={f?.file_location ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {f?.file_name}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500">
                {searchQuery || startDate || endDate
                  ? 'No matching clinical notes found'
                  : 'No clinical notes available'}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Add Note Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              Add New {activeNoteTab === 'file' ? 'File' : 'Clinical'} Note
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note-date" className="text-right">
                Date & Time
              </Label>
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(noteDateTime, 'yyyy/MM/dd')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <ShadcnCalendar
                        mode="single"
                        selected={noteDateTime}
                        onSelect={(date: Date | undefined) => {
                          if (date) setNoteDateTime(new Date(date));
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Input
                    type="time"
                    defaultValue={format(noteDateTime, 'HH:mm')}
                    className="w-32"
                    onChange={e => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = new Date(noteDateTime);
                      newDate.setHours(parseInt(hours || '0'));
                      newDate.setMinutes(parseInt(minutes || '0'));
                      setNoteDateTime(newDate);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="note-content" className="text-right">
                Note
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="note-content"
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Enter note details..."
                  className="min-h-[200px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right">Attachments</Label>
              <div className="col-span-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <span className="text-sm text-gray-500">
                    Upload any document
                  </span>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((uf, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm truncate">
                          {(uf as unknown as File).name ?? ''}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNewNote} disabled={!noteContent.trim()}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default NotesSection;
