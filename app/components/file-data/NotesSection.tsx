'use client';
import { getLogger } from '@/app/lib/logger';

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
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
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { FileData, UploadedFile, FileNotes } from '@/app/types/file-data';
import {
  createNoteWithFiles,
  createNoteSmart,
  updateNote,
  removeNote,
  getSignedAttachmentUrl,
  createFile,
} from '@/app/actions/file-data';
import { handleResult } from '@/app/utils/helper-functions/handle-results';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import AttachmentPreviewModal, {
  type AttachmentPreview,
} from '@/app/components/file-data/AttachmentPreviewModal';

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
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [editingNoteUid, setEditingNoteUid] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewAttachment, setPreviewAttachment] =
    useState<AttachmentPreview | null>(null);

  const [existingFiles, setExistingFiles] = useState<NoteRecord['files']>([]);

  // Track expanded notes in compact lists
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Audio recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Draft state for documents when patient validation fails
  const [draftFiles, setDraftFiles] = useState<UploadedFile[]>([]);
  const [showValidationError, setShowValidationError] =
    useState<boolean>(false);

  // Helper function to validate patient data
  const validatePatientData = useCallback((): boolean => {
    const hasId = !!(file?.patient?.id && file.patient.id.trim() !== '');
    const hasNameDob = !!(
      file?.patient?.name &&
      file.patient.name.trim() !== '' &&
      file?.patient?.dob &&
      file.patient.dob.trim() !== ''
    );
    return hasId || hasNameDob;
  }, [file?.patient]);

  const fileNotes = useMemo(
    () => (file.notes?.file_notes ?? []) as unknown as NoteRecord[],
    [file.notes?.file_notes]
  );
  const clinicalNotes = useMemo(
    () => (file.notes?.clinical_notes ?? []) as unknown as NoteRecord[],
    [file.notes?.clinical_notes]
  );

  const filterAndSortNotes = useCallback(
    (notes: NoteRecord[]): NoteRecord[] => {
      let filtered = (notes ?? []).filter((n): n is NoteRecord => Boolean(n));

      // De-duplicate by UID to prevent repeated display on state merges or server joins
      const seen = new Set<string>();
      filtered = filtered.filter(n => {
        const id = n.uid ?? '';
        if (!id) return true;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

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
    },
    [searchQuery, startDate, endDate, sortOrder]
  );

  const filteredFileNotes = useMemo(
    () => filterAndSortNotes(fileNotes),
    [fileNotes, filterAndSortNotes]
  );
  const filteredClinicalNotes = useMemo(
    () => filterAndSortNotes(clinicalNotes),
    [clinicalNotes, filterAndSortNotes]
  );

  function toggleSortOrder(): void {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
  }

  function getFileBadgeStyle(fileType: string | null | undefined): {
    bg: string;
    label: string;
  } {
    const lower = (fileType ?? '').toLowerCase();
    if (lower === 'application/pdf' || lower.endsWith('/pdf'))
      return { bg: 'bg-red-100 text-red-700', label: 'PDF' };
    if (lower.startsWith('image/'))
      return { bg: 'bg-blue-100 text-blue-700', label: 'IMAGE' };
    if (lower.startsWith('audio/'))
      return { bg: 'bg-green-100 text-green-700', label: 'AUDIO' };
    if (lower.startsWith('text/') || lower === 'application/txt')
      return { bg: 'bg-gray-200 text-gray-700', label: 'TEXT' };
    return { bg: 'bg-gray-100 text-gray-700', label: 'OTHER' };
  }

  async function onOpenAttachment(
    fileName: string | null | undefined,
    fileType: string | null | undefined,
    fileLocation: string | null | undefined,
    e: React.MouseEvent
  ): Promise<void> {
    e.stopPropagation();
    if (!fileLocation) return;
    const { data, error } = await handleResult(
      getSignedAttachmentUrl({ fileLocation })
    );
    if (error || !data?.data) {
      alert('Could not open attachment');
      return;
    }
    setPreviewAttachment({
      fileName: fileName ?? 'Attachment',
      fileType: fileType ?? null,
      signedUrl: data.data as unknown as string,
    });
    setPreviewOpen(true);
  }

  function formatDateTime(dateString?: string): string {
    if (!dateString) return '';
    return format(new Date(dateString), 'yyyy/MM/dd HH:mm');
  }

  function getDisplayText(
    noteUid: string | undefined,
    text: string | undefined
  ): { display: string; truncated: boolean } {
    const raw = String(text ?? '');
    const uid = String(noteUid ?? '');
    if (!uid) return { display: raw, truncated: false };
    const isExpanded = expandedNotes.has(uid);
    if (isExpanded || raw.length <= 1000) {
      return { display: raw, truncated: false };
    }
    return { display: raw.slice(0, 1000) + '…', truncated: true };
  }

  function toggleExpanded(
    noteUid: string | undefined,
    e: React.MouseEvent
  ): void {
    e.stopPropagation();
    const uid = String(noteUid ?? '');
    if (!uid) return;
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  function openNoteModal(tabType: 'file' | 'clinical'): void {
    setActiveNoteTab(tabType);
    setNoteDateTime(new Date());
    setNoteContent('');
    setUploadedFiles([]);
    setExistingFiles([]);
    setEditingNoteUid(null);
    setRecordingError(null);
    setShowValidationError(false);
    setIsNoteModalOpen(true);
  }

  function openEditModal(note: NoteRecord, tabType: 'file' | 'clinical'): void {
    setActiveNoteTab(tabType);
    setEditingNoteUid(note.uid ?? null);
    setNoteDateTime(note.time_stamp ? new Date(note.time_stamp) : new Date());
    setNoteContent(note.notes ?? '');
    setUploadedFiles([]);
    setExistingFiles(note.files ?? []);
    setRecordingError(null);
    setShowValidationError(false);
    setIsNoteModalOpen(true);
  }

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(e.target.files ?? []);

    // Check if patient data is valid for uploading documents
    if (!validatePatientData()) {
      // Store files in draft state and show validation error
      setDraftFiles(prev => [...prev, ...(files as unknown as UploadedFile[])]);
      setShowValidationError(true);
      return;
    }

    // If validation passes, add files to uploaded files
    setUploadedFiles(prev => [
      ...prev,
      ...(files as unknown as UploadedFile[]),
    ]);
    setShowValidationError(false);
  }

  function removeFile(index: number): void {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }

  function removeDraftFile(index: number): void {
    setDraftFiles(prev => prev.filter((_, i) => i !== index));
  }

  // Function to move draft files to uploaded files when validation passes
  const moveDraftFilesToUploaded = useCallback((): void => {
    if (validatePatientData() && draftFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...draftFiles]);
      setDraftFiles([]);
      setShowValidationError(false);
    }
  }, [validatePatientData, draftFiles]);

  // Effect to automatically move draft files when patient data becomes valid
  React.useEffect(() => {
    if (validatePatientData() && draftFiles.length > 0) {
      moveDraftFilesToUploaded();
    }
  }, [
    file?.patient,
    moveDraftFilesToUploaded,
    validatePatientData,
    draftFiles.length,
  ]);

  function getSupportedAudioMimeType(): string | null {
    const candidates = [
      'audio/mp4',
      'audio/aac',
      'audio/mpeg',
      'audio/webm;codecs=opus',
      'audio/webm',
    ];
    for (const type of candidates) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const MR: any = (globalThis as unknown as { MediaRecorder?: unknown })
        .MediaRecorder;
      if (
        MR &&
        typeof MR.isTypeSupported === 'function' &&
        MR.isTypeSupported(type)
      ) {
        return type;
      }
    }
    return null;
  }

  async function startRecording(): Promise<void> {
    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const now = new Date();
        const ext = (recorder.mimeType || 'audio/webm').includes('mp4')
          ? 'm4a'
          : ((recorder.mimeType || 'audio/webm').split('/')[1] ?? 'webm');
        const fname = `note-recording-${format(now, 'yyyyMMdd-HHmmss')}.${ext}`;
        const file = new File([blob], fname, {
          type: recorder.mimeType || 'audio/webm',
          lastModified: now.getTime(),
        });
        // Attach to uploads so it gets saved with the note
        setUploadedFiles(prev => [...prev, file as unknown as UploadedFile]);
        // Cleanup stream tracks
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      setRecordingError('Microphone permission denied or not available');
      setIsRecording(false);
      try {
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      } catch {}
    }
  }

  function stopRecording(): void {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }

  async function ensureFileIsSaved(): Promise<FileData> {
    // If the file already has a UID, return as-is
    if (file?.uid) return file;

    // Validate patient data before creating the file
    if (!validatePatientData()) {
      alert(
        'Please provide Patient ID (adult) or Name and Date of Birth (child) before uploading documents.'
      );
      throw new Error('Missing required patient data');
    }

    // Persist the file to create the UID and linkage records
    const result = await handleResult(
      createFile(file as unknown as Record<string, unknown>)
    );
    const created = (result.data as unknown as FileData) || null;
    const err = (result.error as unknown as { message?: string }) || null;
    if (err) {
      const logger = getLogger();
      await logger.error(
        'app/components/file-data/NotesSection.tsx',
        `Failed to create file before note upload: ${err.message || 'Unknown error'}`
      );
      alert(err.message || 'Failed to create file before uploading documents.');
      throw new Error(err.message || 'Failed to create file');
    }
    if (!created?.uid) {
      throw new Error('File creation did not return a UID');
    }

    // Update local state with the created file data
    setFile(() => created);
    return created;
  }

  async function saveNewNote(): Promise<void> {
    if (isSavingNote) return;
    setIsSavingNote(true);
    {
      const logger = getLogger();
      void logger.debug(
        'app/components/file-data/NotesSection.tsx',
        `Attempting to save new note. Current file state: ${JSON.stringify(file)}`
      );
    }

    if (!noteContent.trim() && uploadedFiles.length === 0) {
      alert('Please enter a description or attach at least one document');
      setIsSavingNote(false);
      return;
    }

    // Validate patient data if there are files to upload
    if (uploadedFiles.length > 0 && !validatePatientData()) {
      alert(
        'Cannot save note with documents. Please provide either Patient ID (adult) or Name and Date of Birth (child) before uploading documents.'
      );
      setIsSavingNote(false);
      return;
    }

    // Ensure the file is saved (UID exists) before uploading any attachments
    let workingFile: FileData = file;
    try {
      if (!workingFile?.uid) {
        workingFile = await ensureFileIsSaved();
      }
    } catch (e) {
      const logger = getLogger();
      await logger.error(
        'app/components/file-data/NotesSection.tsx',
        `Failed to ensure file before saving note: ${e instanceof Error ? e.message : 'Unknown error'}`
      );
      setIsSavingNote(false);
      return;
    }

    // Recompute derived IDs from the (possibly) newly saved file
    const fileInfoPatientId = workingFile?.fileinfo_patient?.[0]?.uid ?? '';
    const patientIdFromLink =
      workingFile?.fileinfo_patient?.[0]?.patientid ?? '';

    {
      const logger = getLogger();
      void logger.debug(
        'app/components/file-data/NotesSection.tsx',
        `Derived IDs for note save: ${JSON.stringify({
          fileUid: workingFile?.uid,
          fileInfoPatientId,
          patientIdFromLink,
          patientUidOnPatientObj: workingFile?.patient?.uid,
        })}`
      );
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

    const timeStampIso = noteDateTime.toISOString();
    let savedData: { data?: unknown } | null = null;
    let error: { message?: string } | null = null;

    if (editingNoteUid) {
      const payload = {
        noteUid: editingNoteUid,
        notes: noteContent,
        files: processedFiles,
      };
      {
        const logger = getLogger();
        void logger.debug(
          'app/components/file-data/NotesSection.tsx',
          `Note update payload: ${JSON.stringify(payload)}`
        );
      }
      const result = await handleResult(updateNote(payload));
      savedData = (result.data as unknown as { data?: unknown }) ?? null;
      error = (result.error as unknown as { message?: string }) ?? null;
    } else if (fileInfoPatientId && patientIdFromLink) {
      const payload = {
        fileInfoPatientId,
        patientId: patientIdFromLink,
        timeStamp: timeStampIso,
        notes: noteContent,
        tabType: activeNoteTab,
        files: processedFiles,
      };
      {
        const logger = getLogger();
        void logger.debug(
          'app/components/file-data/NotesSection.tsx',
          `Note save payload (direct): ${JSON.stringify(payload)}`
        );
      }
      const result = await handleResult(createNoteWithFiles(payload));
      savedData = (result.data as unknown as { data?: unknown }) ?? null;
      error = (result.error as unknown as { message?: string }) ?? null;
    } else {
      // Fallback: smart note save with minimal data
      const fileUid = workingFile?.uid ?? '';
      const patientIdNumber = workingFile?.patient?.id || undefined;
      const baseSmartPayload = {
        fileUid,
        timeStamp: timeStampIso,
        notes: noteContent,
        tabType: activeNoteTab,
        files: processedFiles,
      } as const;
      const smartPayload = patientIdNumber
        ? { ...baseSmartPayload, patientIdNumber }
        : baseSmartPayload;
      {
        const logger = getLogger();
        void logger.debug(
          'app/components/file-data/NotesSection.tsx',
          `Note save payload (smart): ${JSON.stringify(smartPayload)}`
        );
      }
      const result = await handleResult(createNoteSmart(smartPayload));
      savedData = (result.data as unknown as { data?: unknown }) ?? null;
      error = (result.error as unknown as { message?: string }) ?? null;
    }

    if (error) {
      const logger = getLogger();
      await logger.error(
        'app/components/file-data/NotesSection.tsx',
        `Failed to save note: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      alert(error.message || 'An unexpected error occurred while saving.');
      setIsSavingNote(false);
      return;
    }

    if (savedData) {
      setFile(prev => {
        const draft = { ...prev } as FileData;
        if (!draft.notes) {
          draft.notes = { file_notes: [], clinical_notes: [] };
        }
        const targetKey =
          activeNoteTab === 'file' ? 'file_notes' : 'clinical_notes';
        const current =
          (draft.notes[targetKey] as unknown as NoteRecord[]) ?? [];
        const incoming = savedData.data as NoteRecord;
        const nextArray = editingNoteUid
          ? current.map(n => (n.uid === incoming.uid ? incoming : n))
          : [incoming, ...current];
        // De-duplicate by UID to keep array clean
        const unique: NoteRecord[] = [];
        const seen = new Set<string>();
        for (const item of nextArray) {
          const id = item?.uid ?? '';
          if (id && seen.has(id)) continue;
          if (id) seen.add(id);
          unique.push(item);
        }
        draft.notes[targetKey] = unique as unknown as NoteRecord[];
        return draft;
      });
      setIsNoteModalOpen(false);
    }
    setIsSavingNote(false);
  }

  async function onDeleteNote(
    note: NoteRecord,
    tab: 'file' | 'clinical'
  ): Promise<void> {
    if (!note?.uid) return;
    const confirmed = window.confirm('Delete this note?');
    if (!confirmed) return;
    const { error } = await handleResult(removeNote({ noteUid: note.uid }));
    if (error) {
      alert('Failed to delete note');
      return;
    }
    setFile(prev => {
      const draft = { ...prev } as FileData;
      const key = tab === 'file' ? 'file_notes' : 'clinical_notes';
      const arr = (
        (draft.notes?.[key] as unknown as NoteRecord[]) ?? []
      ).filter(n => n.uid !== note.uid);

      return {
        ...draft,
        notes: draft.notes
          ? {
              ...draft.notes,
              [key]: arr,
            }
          : ({
              [key]: arr,
            } as FileNotes),
      };
    });
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
                    className="border rounded-md p-4 bg-white shadow-sm cursor-pointer"
                    onClick={() => openEditModal(n, 'file')}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-primary">
                        {formatDateTime(n.time_stamp)}
                      </h3>
                      <button
                        type="button"
                        aria-label="Delete note"
                        className="text-red-500 hover:text-red-600"
                        onClick={e => {
                          e.stopPropagation();
                          void onDeleteNote(n, 'file');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="ml-4 mt-2 text-gray-700">
                      {(() => {
                        const { display, truncated } = getDisplayText(
                          n.uid,
                          n.notes
                        );
                        const isExpanded = expandedNotes.has(
                          String(n.uid ?? '')
                        );
                        return (
                          <>
                            <p className="whitespace-pre-wrap">{display}</p>
                            {(truncated || isExpanded) && (
                              <button
                                type="button"
                                className="text-xs text-primary mt-1 underline"
                                onClick={e => toggleExpanded(n.uid, e)}
                                aria-label={
                                  isExpanded ? 'Show less' : 'Show more'
                                }
                              >
                                {isExpanded ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    {n.files && n.files.length > 0 && (
                      <div className="mt-4 ml-4">
                        <TooltipProvider>
                          <div className="flex flex-wrap gap-2">
                            {n.files.map(f => {
                              const style = getFileBadgeStyle(
                                f?.file_type ?? null
                              );
                              const displayName = f?.file_name ?? 'Attachment';
                              return (
                                <Tooltip key={f?.uid}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={e =>
                                        void onOpenAttachment(
                                          f?.file_name,
                                          f?.file_type,
                                          f?.file_location,
                                          e
                                        )
                                      }
                                      className={`flex items-center gap-2 px-2 py-1 rounded ${style.bg} text-xs max-w-[160px]`}
                                      title={displayName}
                                    >
                                      <span className="font-mono">
                                        {style.label}
                                      </span>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <span className="font-medium">
                                      {displayName}
                                    </span>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </TooltipProvider>
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
                    className="border rounded-md p-4 bg-white shadow-sm cursor-pointer"
                    onClick={() => openEditModal(n, 'clinical')}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-primary">
                        {formatDateTime(n.time_stamp)}
                      </h3>
                      <button
                        type="button"
                        aria-label="Delete note"
                        className="text-red-500 hover:text-red-600"
                        onClick={e => {
                          e.stopPropagation();
                          void onDeleteNote(n, 'clinical');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="ml-4 mt-2 text-gray-700">
                      {(() => {
                        const { display, truncated } = getDisplayText(
                          n.uid,
                          n.notes
                        );
                        const isExpanded = expandedNotes.has(
                          String(n.uid ?? '')
                        );
                        return (
                          <>
                            <p className="whitespace-pre-wrap">{display}</p>
                            {(truncated || isExpanded) && (
                              <button
                                type="button"
                                className="text-xs text-primary mt-1 underline"
                                onClick={e => toggleExpanded(n.uid, e)}
                                aria-label={
                                  isExpanded ? 'Show less' : 'Show more'
                                }
                              >
                                {isExpanded ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    {n.files && n.files.length > 0 && (
                      <div className="mt-4 ml-4">
                        <TooltipProvider>
                          <div className="flex flex-wrap gap-2">
                            {n.files.map(f => {
                              const style = getFileBadgeStyle(
                                f?.file_type ?? null
                              );
                              const displayName = f?.file_name ?? 'Attachment';
                              return (
                                <Tooltip key={f?.uid}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={e =>
                                        void onOpenAttachment(
                                          f?.file_name,
                                          f?.file_type,
                                          f?.file_location,
                                          e
                                        )
                                      }
                                      className={`flex items-center gap-2 px-2 py-1 rounded ${style.bg} text-xs max-w-[160px]`}
                                      title={displayName}
                                    >
                                      <span className="font-mono">
                                        {style.label}
                                      </span>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <span className="font-medium">
                                      {displayName}
                                    </span>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </TooltipProvider>
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
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>
              {editingNoteUid
                ? `Edit ${activeNoteTab === 'file' ? 'File' : 'Clinical'} Note`
                : `Add New ${activeNoteTab === 'file' ? 'File' : 'Clinical'} Note`}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label
                htmlFor="note-date"
                className="text-sm font-medium text-gray-700"
              >
                Date & Time
              </Label>
              <div>
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

            <div className="grid gap-2">
              <Label
                htmlFor="note-content"
                className="text-sm font-medium text-gray-700"
              >
                Note
              </Label>
              <div>
                <Textarea
                  id="note-content"
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Enter note details..."
                  className="min-h-[360px]"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium text-gray-700">
                Attachments
              </Label>
              <div className="space-y-3">
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

                {/* Audio recording controls */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isRecording ? 'destructive' : 'outline'}
                    onClick={() => {
                      if (isRecording) {
                        stopRecording();
                      } else {
                        void startRecording();
                      }
                    }}
                  >
                    {isRecording ? 'Stop Recording' : 'Record Audio'}
                  </Button>
                  {recordingError && (
                    <span className="text-sm text-red-600">
                      {recordingError}
                    </span>
                  )}
                </div>

                {/* Validation error message */}
                {showValidationError && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="text-sm text-yellow-800">
                      <strong>Documents in draft state:</strong> Please provide
                      either Patient ID (adult) or Name and Date of Birth
                      (child) to upload documents.
                    </div>
                  </div>
                )}

                {/* Draft files display */}
                {draftFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-yellow-700">
                      Draft documents (waiting for patient data)
                    </div>
                    {draftFiles.map((uf, index) => {
                      const f = uf as unknown as File;
                      const isAudio = (f?.type ?? '').startsWith('audio/');
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded gap-3"
                        >
                          <span
                            className="text-sm truncate flex-1"
                            title={f?.name ?? ''}
                          >
                            {f?.name ?? ''}
                          </span>
                          {isAudio && (
                            <audio
                              src={URL.createObjectURL(f)}
                              controls
                              preload="metadata"
                              className="max-w-[240px]"
                            />
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDraftFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* New recording will appear below in the uploads list with preview */}

                {(existingFiles?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">
                      Existing attachments
                    </div>
                    <TooltipProvider>
                      <div className="flex flex-wrap gap-2">
                        {existingFiles?.map(f => {
                          const style = getFileBadgeStyle(f?.file_type ?? null);
                          const displayName = f?.file_name ?? 'Attachment';
                          return (
                            <Tooltip key={f?.uid}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={e =>
                                    void onOpenAttachment(
                                      f?.file_name,
                                      f?.file_type,
                                      f?.file_location,
                                      e
                                    )
                                  }
                                  className={`flex items-center gap-2 px-2 py-1 rounded ${style.bg} text-xs max-w-[160px]`}
                                  title={displayName}
                                >
                                  <span className="font-mono">
                                    {style.label}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <span className="font-medium">
                                  {displayName}
                                </span>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </TooltipProvider>
                  </div>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((uf, index) => {
                      const f = uf as unknown as File;
                      const isAudio = (f?.type ?? '').startsWith('audio/');
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded gap-3"
                        >
                          <span
                            className="text-sm truncate flex-1"
                            title={f?.name ?? ''}
                          >
                            {f?.name ?? ''}
                          </span>
                          {isAudio && (
                            <audio
                              src={URL.createObjectURL(f)}
                              controls
                              preload="metadata"
                              className="max-w-[240px]"
                            />
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveNewNote}
              disabled={
                isSavingNote ||
                (!noteContent.trim() && uploadedFiles.length === 0)
              }
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        attachment={previewAttachment}
      />
    </>
  );
}

export default NotesSection;
