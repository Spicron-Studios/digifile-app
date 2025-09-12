'use client';

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Calendar as ShadcnCalendar } from '@/app/components/ui/day-picker-calendar';
import {
  CalendarIcon,
  Search,
  Plus,
  ArrowUpDown,
  Upload,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';
import { Editor } from '@/app/components/ui/editor';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import {
  createFile,
  createNoteWithFiles,
  getFile,
  updateFile,
} from '@/app/actions/file-data';
import {
  FileData,
  MedicalScheme,
  DateParts,
  UploadedFile,
  HandleInputChange,
} from '@/app/types/file-data';
import { handleResult } from '@/app/utils/helper-functions/handle-results';
import { toast } from 'sonner';

export default function FileDataPage(): React.JSX.Element {
  const { uid } = useParams();
  const router = useRouter();
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isNewRecord = uid === 'new-record';
  const [extraInfo, setExtraInfo] = useState<string>('');
  const [coverType, setCoverType] = useState<string>('medical-aid');
  const [sameAsPatient, setSameAsPatient] = useState<boolean>(false);

  // References for date input fields
  const yearInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const dayInputRef = useRef<HTMLInputElement>(null);

  // References for member date fields
  const memberYearInputRef = useRef<HTMLInputElement>(null);
  const memberMonthInputRef = useRef<HTMLInputElement>(null);
  const memberDayInputRef = useRef<HTMLInputElement>(null);

  // Separate state for date parts
  const [dateOfBirth, setDateOfBirth] = useState<DateParts>({
    year: '',
    month: '',
    day: '',
  });

  // Separate state for member date parts
  const [memberDateOfBirth, setMemberDateOfBirth] = useState<DateParts>({
    year: '',
    month: '',
    day: '',
  });

  // Add new states for member info
  const [memberGender, setMemberGender] = useState<string>('');

  // Add state for medical schemes
  const [medicalSchemes, setMedicalSchemes] = useState<MedicalScheme[]>([]);

  // Add new state for notes filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // New state for the note modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [activeNoteTab, setActiveNoteTab] = useState<string>('');
  const [noteDateTime, setNoteDateTime] = useState<Date>(new Date());
  const [noteContent, setNoteContent] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize date parts from file data if available
  useEffect(() => {
    if (file?.patient?.dob && typeof file.patient.dob === 'string') {
      // Parse existing date if available
      const dateParts = file.patient.dob.split('/');
      if (dateParts.length === 3) {
        setDateOfBirth({
          year: dateParts[0] || '',
          month: dateParts[1] || '',
          day: dateParts[2] || '',
        });
      }
    }

    // Initialize medical cover type if available
    if (file?.medical_cover?.type) {
      setCoverType(file.medical_cover.type);
    }

    // Initialize same as patient checkbox if available
    if (file?.medical_cover?.same_as_patient) {
      setSameAsPatient(file.medical_cover.same_as_patient);
    }

    // Initialize member date of birth if available
    if (
      file?.medical_cover?.member?.dob &&
      typeof file.medical_cover.member.dob === 'string'
    ) {
      const dateParts = file.medical_cover.member.dob.split('/');
      if (dateParts.length === 3) {
        setMemberDateOfBirth({
          year: dateParts[0] || '',
          month: dateParts[1] || '',
          day: dateParts[2] || '',
        });
      }
    }

    // Initialize extraInfo from file data
    if (file?.extraInfo) {
      setExtraInfo(file.extraInfo);
    }
  }, [file]);

  // Handle date part changes with validation and auto-focus
  const handleDatePartChange = (
    part: 'year' | 'month' | 'day',
    value: string,
    maxLength: number,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    // Apply appropriate validations
    if (part === 'month' && value.length === 2 && parseInt(value) > 12) {
      value = '12';
    }

    if (part === 'day' && value.length === 2 && parseInt(value) > 31) {
      value = '31';
    }

    // Update the date part
    setDateOfBirth(prev => ({ ...prev, [part]: value }));

    // Update the patient DOB in the file state
    const newDob =
      part === 'year'
        ? `${value}/${dateOfBirth.month}/${dateOfBirth.day}`
        : part === 'month'
          ? `${dateOfBirth.year}/${value}/${dateOfBirth.day}`
          : `${dateOfBirth.year}/${dateOfBirth.month}/${value}`;

    setFile(prevFile => {
      if (!prevFile) return null;
      return {
        ...prevFile,
        patient: {
          ...prevFile.patient,
          dob: newDob,
        },
      };
    });

    // Auto-focus to next field when max length is reached
    if (value.length === maxLength && nextRef?.current) {
      nextRef.current.focus();
    }
  };

  // Handle member date part changes with validation and auto-focus
  const handleMemberDatePartChange = (
    part: 'year' | 'month' | 'day',
    value: string,
    maxLength: number,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ): void => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    // Apply appropriate validations
    if (part === 'month' && value.length === 2 && parseInt(value) > 12) {
      value = '12';
    }

    if (part === 'day' && value.length === 2 && parseInt(value) > 31) {
      value = '31';
    }

    // Update the date part
    setMemberDateOfBirth(prev => ({ ...prev, [part]: value }));

    // Update the member DOB in the file state
    const newDob =
      part === 'year'
        ? `${value}/${memberDateOfBirth.month}/${memberDateOfBirth.day}`
        : part === 'month'
          ? `${memberDateOfBirth.year}/${value}/${memberDateOfBirth.day}`
          : `${memberDateOfBirth.year}/${memberDateOfBirth.month}/${value}`;

    setFile(prevFile => {
      if (!prevFile) return null;
      return {
        ...prevFile,
        medical_cover: {
          ...prevFile.medical_cover,
          member: {
            ...prevFile.medical_cover?.member,
            dob: newDob,
          },
        },
      };
    });

    // Auto-focus to next field when max length is reached
    if (value.length === maxLength && nextRef?.current) {
      nextRef.current.focus();
    }
  };

  // Handle medical cover type change
  const handleCoverTypeChange = (value: string): void => {
    setCoverType(value);

    // Update file state
    setFile(prevFile => {
      if (!prevFile) return null;
      return {
        ...prevFile,
        medical_cover: {
          ...prevFile.medical_cover,
          type: value,
        },
      };
    });
  };

  // Handle same as patient checkbox change
  const handleSameAsPatientChange = (checked: boolean): void => {
    setSameAsPatient(checked);

    // Update file state
    setFile(prevFile => {
      if (!prevFile) return null;
      return {
        ...prevFile,
        medical_cover: {
          ...prevFile.medical_cover,
          same_as_patient: checked,
        },
      };
    });
  };

  // Function to handle input changes for patient data
  const handlePatientInputChange: HandleInputChange = (
    field: string,
    value: string
  ): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Updating patient.${field} to:`, value);
    }

    // Special handling for ID number - extract and populate date of birth
    if (field === 'id' && value.length >= 6) {
      const idNumber = value;
      const yearPart = idNumber.substring(0, 2);
      const monthPart = idNumber.substring(2, 4);
      const dayPart = idNumber.substring(4, 6);

      // Determine the century
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100);
      const currentYearLastTwo = currentYear % 100;

      // If the year part is greater than the current year's last two digits,
      // it's likely from the previous century
      const fullYear =
        parseInt(yearPart) > currentYearLastTwo
          ? `${currentCentury - 1}${yearPart}`
          : `${currentCentury}${yearPart}`;

      // Update date of birth fields
      setDateOfBirth({
        year: fullYear,
        month: monthPart,
        day: dayPart,
      });

      // Update the file state with the extracted DOB
      setFile(prevFile => {
        if (!prevFile) return null;
        return {
          ...prevFile,
          patient: {
            ...prevFile.patient,
            [field]: value,
            dob: `${fullYear}/${monthPart}/${dayPart}`,
          },
        };
      });
      return;
    }

    // Special handling for name - auto-generate initials
    if (field === 'name' || field === 'surname') {
      setFile(prevFile => {
        if (!prevFile) return null;
        const newName = field === 'name' ? value : prevFile.patient?.name || '';
        const newSurname =
          field === 'surname' ? value : prevFile.patient?.surname || '';

        // Generate initials from name and surname
        let initials = '';
        if (newName) {
          // Split by spaces in case there's a middle name
          const nameParts = newName.split(' ');
          nameParts.forEach(part => {
            if (part.trim()) {
              initials += part.charAt(0).toUpperCase() + '.';
            }
          });
        }

        if (newSurname) {
          initials += newSurname.charAt(0).toUpperCase() + '.';
        }

        return {
          ...prevFile,
          patient: {
            ...prevFile.patient,
            [field]: value,
            initials: initials.trim(),
          },
        };
      });
      return;
    }

    // Standard handling for other fields
    setFile(prevFile => {
      if (!prevFile) return null;
      return {
        ...prevFile,
        patient: {
          ...prevFile.patient,
          [field]: value,
        },
      };
    });
  };

  // Function to handle select changes for patient data
  const handlePatientSelectChange = (field: string, value: string): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Updating patient.${field} to:`, value);
    }

    // Special handling for gender based field
    if (field === 'title') {
      // If title is changed, update gender accordingly
      const gender =
        value === 'Mr'
          ? 'male'
          : value === 'Mrs'
            ? 'female'
            : file?.patient?.gender || '';

      setFile(prevFile => {
        if (!prevFile) return null;
        return {
          ...prevFile,
          patient: {
            ...prevFile.patient,
            [field]: value,
            gender: gender,
          },
        };
      });
      return;
    }

    // Standard handling for other fields
    setFile(prevFile => {
      if (!prevFile) return null;
      return {
        ...prevFile,
        patient: {
          ...prevFile.patient,
          [field]: value,
        },
      };
    });
  };

  // Handle member input changes - similar to handlePatientInputChange
  const handleMemberInputChange = (field: string, value: string): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Updating medical_cover.member.${field} to:`, value);
    }

    // Special handling for ID number - extract and populate date of birth
    if (field === 'id' && value.length >= 6) {
      const idNumber = value;
      const yearPart = idNumber.substring(0, 2);
      const monthPart = idNumber.substring(2, 4);
      const dayPart = idNumber.substring(4, 6);

      // Determine the century
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100);
      const currentYearLastTwo = currentYear % 100;

      // If the year part is greater than the current year's last two digits,
      // it's likely from the previous century
      const fullYear =
        parseInt(yearPart) > currentYearLastTwo
          ? `${currentCentury - 1}${yearPart}`
          : `${currentCentury}${yearPart}`;

      // Update date of birth fields
      setMemberDateOfBirth({
        year: fullYear,
        month: monthPart,
        day: dayPart,
      });

      // Update the file state with the extracted DOB
      setFile(prevFile => {
        if (!prevFile) return null;
        return {
          ...prevFile,
          medical_cover: {
            ...prevFile.medical_cover,
            member: {
              ...prevFile.medical_cover?.member,
              [field]: value,
              dob: `${fullYear}/${monthPart}/${dayPart}`,
            },
          },
        };
      });
      return;
    }

    // Special handling for name - auto-generate initials
    if (field === 'name' || field === 'surname') {
      setFile(prevFile => {
        if (!prevFile) return null;
        const newName =
          field === 'name' ? value : prevFile.medical_cover?.member?.name || '';
        const newSurname =
          field === 'surname'
            ? value
            : prevFile.medical_cover?.member?.surname || '';

        // Generate initials from name and surname
        let initials = '';
        if (newName) {
          // Split by spaces in case there's a middle name
          const nameParts = newName.split(' ');
          nameParts.forEach(part => {
            if (part.trim()) {
              initials += part.charAt(0).toUpperCase() + '.';
            }
          });
        }

        if (newSurname) {
          initials += newSurname.charAt(0).toUpperCase() + '.';
        }

        return {
          ...prevFile,
          medical_cover: {
            ...prevFile.medical_cover,
            member: {
              ...prevFile.medical_cover?.member,
              [field]: value,
              initials: initials.trim(),
            },
          },
        };
      });
      return;
    }

    // Standard handling for other fields
    setFile(prevFile => {
      if (!prevFile) return null;
      return {
        ...prevFile,
        medical_cover: {
          ...prevFile.medical_cover,
          member: {
            ...prevFile.medical_cover?.member,
            [field]: value,
          },
        },
      };
    });
  };

  // Function to handle select changes for member data - similar to handlePatientSelectChange
  const handleMemberSelectChange = (field: string, value: string): void => {
    console.log(`Updating medical_cover.member.${field} to:`, value);

    // Special handling for gender based field
    if (field === 'title') {
      // If title is changed, update gender accordingly
      const gender =
        value === 'Mr'
          ? 'male'
          : value === 'Mrs'
            ? 'female'
            : memberGender || '';
      setMemberGender(gender);

      setFile(prevFile => {
        if (!prevFile) return null;
        return {
          ...prevFile,
          medical_cover: {
            ...prevFile.medical_cover,
            member: {
              ...prevFile.medical_cover?.member,
              [field]: value,
              gender: gender,
            },
          },
        };
      });
      return;
    }

    // Standard handling for other fields
    setFile(prevFile => {
      if (!prevFile) return null;
      return {
        ...prevFile,
        medical_cover: {
          ...prevFile.medical_cover,
          member: {
            ...prevFile.medical_cover?.member,
            [field]: value,
          },
        },
      };
    });
  };

  // Function to handle medical scheme selection
  const handleMedicalSchemeChange = (schemeId: string): void => {
    console.log('Selected medical scheme:', schemeId);

    setFile(prevFile => {
      if (!prevFile) return null;
      return {
        ...prevFile,
        medical_cover: {
          ...prevFile.medical_cover,
          medical_aid: {
            ...prevFile.medical_cover?.medical_aid,
            scheme_id: schemeId,
            name:
              medicalSchemes.find(scheme => scheme.uid === schemeId)
                ?.scheme_name || '',
          },
        },
      };
    });
  };

  // Function to handle injury on duty input changes
  const handleInjuryInputChange = (field: string, value: string): void => {
    console.log(`Updating medical_cover.injury_on_duty.${field} to:`, value);

    setFile(prevFile => {
      if (!prevFile) return null;
      return {
        ...prevFile,
        medical_cover: {
          ...prevFile.medical_cover,
          injury_on_duty: {
            ...prevFile.medical_cover?.injury_on_duty,
            [field]: value,
          },
        },
      };
    });
  };

  // Get medical schemes from the file data response instead of a separate API call
  useEffect(() => {
    async function fetchFileData() {
      if (isNewRecord) {
        // Generate new file number and account number for new records
        const newFileNumber = `F${new Date().getFullYear()}${Math.floor(
          Math.random() * 10000
        )
          .toString()
          .padStart(4, '0')}`;
        const newAccountNumber = `A${Math.floor(Math.random() * 1000000)
          .toString()
          .padStart(6, '0')}`;

        try {
          const data = await getFile('new');
          setFile({
            file_number: newFileNumber,
            account_number: newAccountNumber,
            patient: {
              name: '',
              gender: '',
            },
            medical_cover: (data as Record<string, unknown>).medical_cover,
          } as unknown as FileData);

          if ((data as Record<string, unknown>).medical_schemes) {
            setMedicalSchemes(
              (data as Record<string, unknown>)
                .medical_schemes as MedicalScheme[]
            );
          }
        } catch (error) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.error(
              'Failed to fetch medical schemes for new record:',
              error
            );
          }
          setFile({
            file_number: newFileNumber,
            account_number: newAccountNumber,
            patient: {
              name: '',
              gender: '',
            },
          } as unknown as FileData);
        }

        setLoading(false);
        return;
      }

      try {
        const data = await getFile(String(uid));
        setFile(data as unknown as FileData);

        // Set medical schemes from the response
        if ((data as Record<string, unknown>).medical_schemes) {
          setMedicalSchemes(
            (data as Record<string, unknown>).medical_schemes as MedicalScheme[]
          );
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch file data:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    void fetchFileData();
  }, [uid, isNewRecord]);

  // Send header data to layout
  useEffect(() => {
    if (file) {
      const headerData = {
        fileNumber: file.file_number,
        accountNumber: file.account_number,
      };

      // Dispatch a custom event with the header data
      window.dispatchEvent(
        new CustomEvent('file-header-data', { detail: headerData })
      );
    }
  }, [file]);

  // Function to save the file data
  const handleSave = async (): Promise<void> => {
    if (!file) return;

    const setSavingGlobal = (
      window as unknown as { setSaving?: (_v: boolean) => void }
    ).setSaving;
    if (typeof setSavingGlobal === 'function') setSavingGlobal(true);

    if (process.env.NODE_ENV === 'development') {
      console.log('Saving file data:', file);
    }

    const promise = isNewRecord
      ? createFile(file as unknown as Record<string, unknown>)
      : updateFile(String(uid), file as unknown as Record<string, unknown>);

    const { data: savedData, error } = await handleResult(promise);

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving file:', error);
      }
      toast.error(error.message || 'Failed to save file data');
      if (typeof setSavingGlobal === 'function') setSavingGlobal(false);
      return;
    }

    if (savedData) {
      // Update the file state with the returned data
      setFile(savedData);

      // If this was a new record, redirect to the saved record's page
      if (isNewRecord && (savedData as any).uid) {
        router.push(`/sites/file-data/${(savedData as any).uid}`);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('File saved successfully:', savedData);
      }
      toast.success('File saved successfully');
    }

    if (typeof setSavingGlobal === 'function') setSavingGlobal(false);
  };

  // Listen for save trigger from layout
  useEffect(() => {
    const handleSaveTrigger = (): void => {
      handleSave();
    };

    window.addEventListener('file-save-triggered', handleSaveTrigger);

    return () => {
      window.removeEventListener('file-save-triggered', handleSaveTrigger);
    };
  }, [handleSave]);

  // Function to filter and sort notes
  type Note = {
    uid?: string;
    time_stamp: string;
    notes?: string;
    files?: Array<{ uid: string; file_location: string; file_name: string }>;
  };
  const filterNotes = (notes: Note[] | undefined): Note[] => {
    if (!notes) return [];

    // First filter by search query
    let filtered = notes;
    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Then filter by date range
    if (startDate) {
      filtered = filtered.filter(
        note => new Date(note.time_stamp) >= startDate
      );
    }

    if (endDate) {
      filtered = filtered.filter(note => new Date(note.time_stamp) <= endDate);
    }

    // Sort by timestamp
    filtered.sort((a, b) => {
      const dateA = new Date(a.time_stamp);
      const dateB = new Date(b.time_stamp);
      return sortOrder === 'desc'
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

    return filtered;
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  // Format date for display
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'yyyy/MM/dd HH:mm');
  };

  // Function to handle opening the note modal
  const openNoteModal = (tabType: string): void => {
    setActiveNoteTab(tabType);
    setNoteDateTime(new Date());
    setNoteContent('');
    setUploadedFiles([]);
    setIsNoteModalOpen(true);
  };

  // Function to handle file uploads
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files ?? []);
    setUploadedFiles(prev => [
      ...prev,
      ...(files as unknown as UploadedFile[]),
    ]);
  };

  // Function to remove a file from the upload list
  const removeFile = (index: number): void => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Function to save the new note
  const saveNewNote = async (): Promise<void> => {
    // Add a check for the file object
    if (!file) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Cannot save note: File data is not loaded yet.');
      }
      alert('File data is not ready. Please try again.');
      return;
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(file);
    }
    debugger;

    if (!noteContent.trim()) {
      alert('Please enter note content');
      return;
    }

    try {
      // Convert file objects to base64 for transmission
      const processedFiles: Array<{
        name: string;
        type: string;
        size: number;
        content: string | ArrayBuffer | null;
      }> = [];

      for (const file of uploadedFiles as unknown as File[]) {
        const reader = new FileReader();
        const filePromise = new Promise<{
          name: string;
          type: string;
          size: number;
          content: string | ArrayBuffer | null;
        }>(resolve => {
          reader.onload = e => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              content: e?.target?.result ?? null,
            });
          };
          reader.readAsDataURL(file);
        });

        processedFiles.push(await filePromise);
      }

      // Prepare the note data
      const noteData = {
        fileId: file.uid, // Now safe to access file.uid
        fileInfoPatientId: file.fileinfo_patient
          ? file.fileinfo_patient[0]?.uid
          : '',
        patientId: file.patient?.uid,
        orgId: file.orgid,
        timeStamp: noteDateTime.toISOString(),
        notes: noteContent,
        tabType: activeNoteTab, // 'file' or 'clinical'
        files: processedFiles,
      };

      // Save the note to the database
      const response = await fetch('/api/files/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      const savedNote = await createNoteWithFiles({
        fileInfoPatientId: noteData.fileInfoPatientId || '',
        patientId: noteData.patientId || '',
        timeStamp: noteData.timeStamp,
        notes: noteData.notes,
        tabType: noteData.tabType,
        files: noteData.files?.map(file => ({
          name: file.name,
          type: file.type,
          content: file.content as string,
        })),
      });

      // Update the file state with the new note
      setFile(prevFile => {
        const updatedFile = { ...prevFile };

        // Initialize notes object if it doesn't exist
        if (!updatedFile.notes) {
          updatedFile.notes = {
            file_notes: [],
            clinical_notes: [],
          };
        }

        // Add the new note to the appropriate array
        if (activeNoteTab === 'file') {
          updatedFile.notes.file_notes = [
            (savedNote as any).data,
            ...(updatedFile.notes.file_notes || []),
          ];
        } else if (activeNoteTab === 'clinical') {
          updatedFile.notes.clinical_notes = [
            (savedNote as any).data,
            ...(updatedFile.notes.clinical_notes || []),
          ];
        }

        return updatedFile;
      });

      // Close the modal
      setIsNoteModalOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    }
  };

  const fileNotFound = !file && !isNewRecord;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main content container - takes full height and prevents overflow */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Section - 50% width */}
        <div className="w-1/2 p-4 overflow-hidden">
          <Card className="h-full flex flex-col overflow-hidden">
            <Tabs
              defaultValue="tab1"
              className="h-full flex flex-col overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-3 shrink-0">
                <TabsTrigger value="tab1">Patient Details</TabsTrigger>
                <TabsTrigger value="tab2">Medical History</TabsTrigger>
                <TabsTrigger value="tab3">Documents</TabsTrigger>
              </TabsList>
              {fileNotFound ? (
                <div className="flex-1 flex items-center justify-center p-6 text-gray-500">
                  File not found
                </div>
              ) : (
                <>
                  <TabsContent value="tab1" className="flex-1 overflow-hidden">
                    <div className="p-6 h-full overflow-auto">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {/* Left Column - Row 1 */}
                        <div className="space-y-2">
                          <Label htmlFor="idNo">ID No</Label>
                          <Input
                            id="idNo"
                            placeholder="Enter ID number"
                            value={file?.patient?.id || ''}
                            onChange={e =>
                              handlePatientInputChange('id', e.target.value)
                            }
                          />
                        </div>

                        {/* Right Column - Row 1 - CHANGED FROM INPUT TO SELECT */}
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Select
                            value={file?.patient?.title || ''}
                            onValueChange={value =>
                              handlePatientSelectChange('title', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select title" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr">Mr</SelectItem>
                              <SelectItem value="Mrs">Mrs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Left Column - Row 2 */}
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            placeholder="Enter name"
                            value={file?.patient?.name || ''}
                            onChange={e =>
                              handlePatientInputChange('name', e.target.value)
                            }
                          />
                        </div>

                        {/* Right Column - Row 2 */}
                        <div className="space-y-2">
                          <Label htmlFor="initials">Initials</Label>
                          <Input
                            id="initials"
                            placeholder="Auto-generated from name"
                            value={file?.patient?.initials || ''}
                            onChange={e =>
                              handlePatientInputChange(
                                'initials',
                                e.target.value
                              )
                            }
                            readOnly
                          />
                        </div>

                        {/* Left Column - Row 3 */}
                        <div className="space-y-2">
                          <Label htmlFor="surname">Surname</Label>
                          <Input
                            id="surname"
                            placeholder="Enter surname"
                            value={file?.patient?.surname || ''}
                            onChange={e =>
                              handlePatientInputChange(
                                'surname',
                                e.target.value
                              )
                            }
                          />
                        </div>

                        {/* Right Column - Row 3 (Date of Birth) */}
                        <div className="space-y-2">
                          <Label htmlFor="dob-year">Date of Birth</Label>
                          <div className="flex items-center">
                            <div className="flex-1">
                              <Input
                                id="dob-year"
                                ref={yearInputRef}
                                placeholder="YYYY"
                                maxLength={4}
                                className="text-center"
                                value={dateOfBirth.year}
                                onChange={e =>
                                  handleDatePartChange(
                                    'year',
                                    e.target.value,
                                    4,
                                    monthInputRef
                                  )
                                }
                              />
                            </div>
                            <span className="px-2 text-gray-500">/</span>
                            <div className="w-16">
                              <Input
                                id="dob-month"
                                ref={monthInputRef}
                                placeholder="MM"
                                maxLength={2}
                                className="text-center"
                                value={dateOfBirth.month}
                                onChange={e =>
                                  handleDatePartChange(
                                    'month',
                                    e.target.value,
                                    2,
                                    dayInputRef
                                  )
                                }
                              />
                            </div>
                            <span className="px-2 text-gray-500">/</span>
                            <div className="w-16">
                              <Input
                                id="dob-day"
                                ref={dayInputRef}
                                placeholder="DD"
                                maxLength={2}
                                className="text-center"
                                value={dateOfBirth.day}
                                onChange={e =>
                                  handleDatePartChange('day', e.target.value, 2)
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* Left Column - Row 4 */}
                        <div className="space-y-2">
                          <Label htmlFor="gender">Gender</Label>
                          <Select
                            value={file?.patient?.gender || ''}
                            onValueChange={value =>
                              handlePatientSelectChange('gender', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Right Column - Row 4 */}
                        <div className="space-y-2">
                          <Label htmlFor="cellphone">Cellphone</Label>
                          <Input
                            id="cellphone"
                            placeholder="Enter cellphone number"
                            value={file?.patient?.cell_phone || ''}
                            onChange={e =>
                              handlePatientInputChange(
                                'cell_phone',
                                e.target.value
                              )
                            }
                          />
                        </div>

                        {/* Left Column - Row 5 */}
                        <div className="space-y-2">
                          <Label htmlFor="additionalContact1">
                            Additional Contact Name
                          </Label>
                          <Input
                            id="additionalContact1"
                            placeholder="Enter contact name"
                            value={file?.patient?.additional_name || ''}
                            onChange={e =>
                              handlePatientInputChange(
                                'additional_name',
                                e.target.value
                              )
                            }
                          />
                        </div>

                        {/* Right Column - Row 5 */}
                        <div className="space-y-2">
                          <Label htmlFor="additionalContact2">
                            Additional Contact Cell
                          </Label>
                          <Input
                            id="additionalContact2"
                            placeholder="Enter contact cell"
                            value={file?.patient?.additional_cell || ''}
                            onChange={e =>
                              handlePatientInputChange(
                                'additional_cell',
                                e.target.value
                              )
                            }
                          />
                        </div>

                        {/* Left Column - Row 6 */}
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            value={file?.patient?.email || ''}
                            onChange={e =>
                              handlePatientInputChange('email', e.target.value)
                            }
                          />
                        </div>

                        {/* Full Width - Row 7 */}
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="address">Residential Address</Label>
                          <Input
                            id="address"
                            placeholder="Enter residential address"
                            value={file?.patient?.address || ''}
                            onChange={e =>
                              handlePatientInputChange(
                                'address',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="tab2" className="flex-1 overflow-auto">
                    <div className="p-6 h-full overflow-auto space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">
                          Medical Cover
                        </h3>

                        {/* Radio Group for Cover Type */}
                        <RadioGroup
                          value={coverType}
                          onValueChange={handleCoverTypeChange}
                          className="flex space-x-4 mb-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="medical-aid"
                              id="medical-aid"
                            />
                            <Label htmlFor="medical-aid">Medical Aid</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="private" id="private" />
                            <Label htmlFor="private">Private</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="injury-on-duty"
                              id="injury-on-duty"
                            />
                            <Label htmlFor="injury-on-duty">
                              Injury on Duty
                            </Label>
                          </div>
                        </RadioGroup>

                        {/* Dynamic content based on selected cover type */}
                        {coverType === 'medical-aid' && (
                          <div className="space-y-6">
                            <h4 className="text-md font-medium">
                              Medical Aid Details
                            </h4>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="medical-aid-name">
                                  Medical Aid
                                </Label>
                                <Select
                                  value={
                                    file?.medical_cover?.medical_aid
                                      ?.scheme_id || ''
                                  }
                                  onValueChange={handleMedicalSchemeChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select medical aid" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {medicalSchemes.map(scheme => (
                                      <SelectItem
                                        key={scheme.uid}
                                        value={scheme.uid}
                                      >
                                        {scheme.scheme_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="membership-number">
                                  Membership Number
                                </Label>
                                <Input
                                  id="membership-number"
                                  placeholder="Enter membership number"
                                  value={
                                    file?.medical_cover?.medical_aid
                                      ?.membership_number || ''
                                  }
                                  onChange={e => {
                                    setFile(prevFile => {
                                      if (!prevFile) return null;
                                      return {
                                        ...prevFile,
                                        medical_cover: {
                                          ...prevFile.medical_cover,
                                          medical_aid: {
                                            ...prevFile.medical_cover
                                              ?.medical_aid,
                                            membership_number: e.target.value,
                                          },
                                        },
                                      };
                                    });
                                  }}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="dependent-code">
                                  Patient Dependent Code
                                </Label>
                                <Input
                                  id="dependent-code"
                                  placeholder="Enter dependent code"
                                  value={
                                    file?.medical_cover?.medical_aid
                                      ?.dependent_code || ''
                                  }
                                  onChange={e => {
                                    setFile(prevFile => {
                                      if (!prevFile) return null;
                                      return {
                                        ...prevFile,
                                        medical_cover: {
                                          ...prevFile.medical_cover,
                                          medical_aid: {
                                            ...prevFile.medical_cover
                                              ?.medical_aid,
                                            dependent_code: e.target.value,
                                          },
                                        },
                                      };
                                    });
                                  }}
                                />
                              </div>
                            </div>

                            <div className="pt-4 border-t">
                              <h4 className="text-md font-medium mb-4">
                                Main Member
                              </h4>

                              <div className="flex items-center space-x-2 mb-4">
                                <Checkbox
                                  id="same-as-patient"
                                  checked={sameAsPatient}
                                  onCheckedChange={handleSameAsPatientChange}
                                />
                                <Label htmlFor="same-as-patient">
                                  Same as patient
                                </Label>
                              </div>

                              {!sameAsPatient && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="member-id">ID Number</Label>
                                    <Input
                                      id="member-id"
                                      placeholder="Enter ID number"
                                      value={
                                        file?.medical_cover?.member?.id || ''
                                      }
                                      onChange={e =>
                                        handleMemberInputChange(
                                          'id',
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="member-title">Title</Label>
                                    <Select
                                      value={
                                        file?.medical_cover?.member?.title || ''
                                      }
                                      onValueChange={value =>
                                        handleMemberSelectChange('title', value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select title" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Mr">Mr</SelectItem>
                                        <SelectItem value="Mrs">Mrs</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="member-name">Name</Label>
                                    <Input
                                      id="member-name"
                                      placeholder="Enter name"
                                      value={
                                        file?.medical_cover?.member?.name || ''
                                      }
                                      onChange={e =>
                                        handleMemberInputChange(
                                          'name',
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="member-initials">
                                      Initials
                                    </Label>
                                    <Input
                                      id="member-initials"
                                      placeholder="Auto-generated from name"
                                      value={
                                        file?.medical_cover?.member?.initials ||
                                        ''
                                      }
                                      readOnly
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="member-surname">
                                      Surname
                                    </Label>
                                    <Input
                                      id="member-surname"
                                      placeholder="Enter surname"
                                      value={
                                        file?.medical_cover?.member?.surname ||
                                        ''
                                      }
                                      onChange={e =>
                                        handleMemberInputChange(
                                          'surname',
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="member-dob-year">
                                      Date of Birth
                                    </Label>
                                    <div className="flex items-center">
                                      <div className="flex-1">
                                        <Input
                                          id="member-dob-year"
                                          ref={memberYearInputRef}
                                          placeholder="YYYY"
                                          maxLength={4}
                                          className="text-center"
                                          value={memberDateOfBirth.year}
                                          onChange={e =>
                                            handleMemberDatePartChange(
                                              'year',
                                              e.target.value,
                                              4,
                                              memberMonthInputRef
                                            )
                                          }
                                        />
                                      </div>
                                      <span className="px-2 text-gray-500">
                                        /
                                      </span>
                                      <div className="w-16">
                                        <Input
                                          id="member-dob-month"
                                          ref={memberMonthInputRef}
                                          placeholder="MM"
                                          maxLength={2}
                                          className="text-center"
                                          value={memberDateOfBirth.month}
                                          onChange={e =>
                                            handleMemberDatePartChange(
                                              'month',
                                              e.target.value,
                                              2,
                                              memberDayInputRef
                                            )
                                          }
                                        />
                                      </div>
                                      <span className="px-2 text-gray-500">
                                        /
                                      </span>
                                      <div className="w-16">
                                        <Input
                                          id="member-dob-day"
                                          ref={memberDayInputRef}
                                          placeholder="DD"
                                          maxLength={2}
                                          className="text-center"
                                          value={memberDateOfBirth.day}
                                          onChange={e =>
                                            handleMemberDatePartChange(
                                              'day',
                                              e.target.value,
                                              2
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="member-gender">
                                      Gender
                                    </Label>
                                    <Select
                                      value={
                                        file?.medical_cover?.member?.gender ||
                                        ''
                                      }
                                      onValueChange={value =>
                                        handleMemberSelectChange(
                                          'gender',
                                          value
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="male">
                                          Male
                                        </SelectItem>
                                        <SelectItem value="female">
                                          Female
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="member-cell">
                                      Cell Number
                                    </Label>
                                    <Input
                                      id="member-cell"
                                      placeholder="Enter cell number"
                                      value={
                                        file?.medical_cover?.member?.cell || ''
                                      }
                                      onChange={e =>
                                        handleMemberInputChange(
                                          'cell',
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="member-contact-name">
                                      Additional Contact Name
                                    </Label>
                                    <Input
                                      id="member-contact-name"
                                      placeholder="Enter contact name"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="member-contact-number">
                                      Additional Contact Number
                                    </Label>
                                    <Input
                                      id="member-contact-number"
                                      placeholder="Enter contact number"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="member-email">
                                      Email Address
                                    </Label>
                                    <Input
                                      id="member-email"
                                      type="email"
                                      placeholder="Enter email address"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="member-address">
                                      Residential Address
                                    </Label>
                                    <Input
                                      id="member-address"
                                      placeholder="Enter residential address"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {coverType === 'private' && (
                          <div className="p-6 flex items-center justify-center text-gray-500">
                            <p>
                              No additional information needed for private
                              payment.
                            </p>
                          </div>
                        )}

                        {coverType === 'injury-on-duty' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="company-name">
                                Name of Company
                              </Label>
                              <Input
                                id="company-name"
                                placeholder="Enter company name"
                                value={
                                  file?.medical_cover?.injury_on_duty
                                    ?.company_name || ''
                                }
                                onChange={e =>
                                  handleInjuryInputChange(
                                    'company_name',
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="contact-person">
                                Contact Person
                              </Label>
                              <Input
                                id="contact-person"
                                placeholder="Enter contact person name"
                                value={
                                  file?.medical_cover?.injury_on_duty
                                    ?.contact_person || ''
                                }
                                onChange={e =>
                                  handleInjuryInputChange(
                                    'contact_person',
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="contact-number">
                                Contact Number
                              </Label>
                              <Input
                                id="contact-number"
                                placeholder="Enter contact number"
                                value={
                                  file?.medical_cover?.injury_on_duty
                                    ?.contact_number || ''
                                }
                                onChange={e =>
                                  handleInjuryInputChange(
                                    'contact_number',
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="contact-email">
                                Contact Email
                              </Label>
                              <Input
                                id="contact-email"
                                type="email"
                                placeholder="Enter contact email"
                                value={
                                  file?.medical_cover?.injury_on_duty
                                    ?.contact_email || ''
                                }
                                onChange={e =>
                                  handleInjuryInputChange(
                                    'contact_email',
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="tab3" className="flex-1 overflow-auto">
                    <div className="p-4 h-full overflow-auto">
                      <h3 className="text-lg font-medium">Extra Information</h3>
                      <div className="mt-4">
                        <Editor
                          content={extraInfo}
                          onChange={content => setExtraInfo(content)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </Card>
        </div>

        {/* Right Section - 50% width */}
        <div className="w-1/2 p-4 overflow-hidden">
          <Card className="h-full flex flex-col overflow-hidden">
            <Tabs
              defaultValue="tab1"
              className="h-full flex flex-col overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-4 shrink-0">
                <TabsTrigger value="tab1">File Notes</TabsTrigger>
                <TabsTrigger value="tab2">Clinical Notes</TabsTrigger>
                <TabsTrigger value="tab3">eScripts</TabsTrigger>
                <TabsTrigger value="tab4">Payments and Other</TabsTrigger>
              </TabsList>
              {fileNotFound ? (
                <div className="flex-1 flex items-center justify-center p-6 text-gray-500">
                  File not found
                </div>
              ) : (
                <>
                  {/* File Notes Tab */}
                  <TabsContent value="tab1" className="flex-1 overflow-hidden">
                    <div className="h-full flex flex-col">
                      {/* Header section - 20% height */}
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
                                  {startDate
                                    ? format(startDate, 'yyyy/MM/dd')
                                    : 'From'}
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
                                  {endDate
                                    ? format(endDate, 'yyyy/MM/dd')
                                    : 'To'}
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
                            title={
                              sortOrder === 'desc'
                                ? 'Newest first'
                                : 'Oldest first'
                            }
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Timeline section - 80% height */}
                      <div className="h-[80%] overflow-auto p-4">
                        {file?.notes?.file_notes &&
                        filterNotes(file.notes.file_notes as unknown as Note[])
                          .length > 0 ? (
                          <div className="space-y-6">
                            {filterNotes(
                              file.notes.file_notes as unknown as Note[]
                            ).map(note => (
                              <div
                                key={note.uid}
                                className="border rounded-md p-4 bg-white shadow-sm"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="text-lg font-bold text-primary">
                                    {formatDateTime(note.time_stamp)}
                                  </h3>
                                </div>
                                <div className="ml-4 mt-2 text-gray-700">
                                  <p>{note.notes}</p>
                                </div>
                                {note.files && note.files.length > 0 && (
                                  <div className="mt-4 ml-4">
                                    <div className="flex flex-wrap gap-2">
                                      {note.files.map(file => (
                                        <div
                                          key={file.uid}
                                          className="flex items-center p-2 border rounded bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                                        >
                                          <a
                                            href={file.file_location}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                          >
                                            {file.file_name}
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
                      {/* Header section - 20% height */}
                      <div className="h-[20%] p-4 border-b space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">
                            Clinical Notes
                          </h3>
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
                                  {startDate
                                    ? format(startDate, 'yyyy/MM/dd')
                                    : 'From'}
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
                                  {endDate
                                    ? format(endDate, 'yyyy/MM/dd')
                                    : 'To'}
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
                            title={
                              sortOrder === 'desc'
                                ? 'Newest first'
                                : 'Oldest first'
                            }
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Timeline section - 80% height */}
                      <div className="h-[80%] overflow-auto p-4">
                        {file?.notes?.clinical_notes &&
                        filterNotes(
                          file.notes.clinical_notes as unknown as Note[]
                        ).length > 0 ? (
                          <div className="space-y-6">
                            {filterNotes(
                              file.notes.clinical_notes as unknown as Note[]
                            ).map(note => (
                              <div
                                key={note.uid}
                                className="border rounded-md p-4 bg-white shadow-sm"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="text-lg font-bold text-primary">
                                    {formatDateTime(note.time_stamp)}
                                  </h3>
                                </div>
                                <div className="ml-4 mt-2 text-gray-700">
                                  <p>{note.notes}</p>
                                </div>
                                {note.files && note.files.length > 0 && (
                                  <div className="mt-4 ml-4">
                                    <div className="flex flex-wrap gap-2">
                                      {note.files.map(file => (
                                        <div
                                          key={file.uid}
                                          className="flex items-center p-2 border rounded bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                                        >
                                          <a
                                            href={file.file_location}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                          >
                                            {file.file_name}
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

                  {/* Other tabs */}
                  <TabsContent value="tab3" className="flex-1 overflow-auto">
                    <div className="p-4 h-full">eScripts Content</div>
                  </TabsContent>
                  <TabsContent value="tab4" className="flex-1 overflow-auto">
                    <div className="p-4 h-full">Payments and Other Content</div>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Add Note Modal */}
      {!fileNotFound && (
        <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                Add New {activeNoteTab === 'file' ? 'File' : 'Clinical'} Note
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Date time picker */}
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
                          onSelect={(date: Date | undefined): void => {
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

              {/* Note content */}
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

              {/* Document upload */}
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

                  {/* Display uploaded files */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm truncate">{file.name}</span>
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
              <Button
                variant="outline"
                onClick={() => setIsNoteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={saveNewNote} disabled={!noteContent.trim()}>
                Save Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
