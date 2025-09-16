'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/card';
import FileInfoCard from '@/app/components/file-data/FileInfoCard';
import PatientDetails from '@/app/components/file-data/PatientDetails';
import MedicalAidInfo from '@/app/components/file-data/MedicalAidInfo';
import InjuryOnDutyForm from '@/app/components/file-data/InjuryOnDutyForm';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { Label } from '@/app/components/ui/label';
import NotesSection from '@/app/components/file-data/NotesSection';

import { Editor } from '@/app/components/ui/editor';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';

import { createFile, getFile, updateFile } from '@/app/actions/file-data';
import {
  FileData,
  MedicalScheme,
  DateParts,
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

  // Notes UI state moved into NotesSection

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
      if (isNewRecord && (savedData as FileData).uid) {
        router.push(`/sites/file-data/${(savedData as FileData).uid}`);
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

  // Notes logic removed - handled by NotesSection

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
                      <FileInfoCard
                        fileNumber={file?.file_number || ''}
                        accountNumber={file?.account_number || ''}
                        onChange={(field, value) =>
                          setFile(prev =>
                            prev ? { ...prev, [field]: value } : prev
                          )
                        }
                      />
                      <PatientDetails
                        patient={file?.patient || {}}
                        dateOfBirth={dateOfBirth}
                        onDatePartChange={handleDatePartChange}
                        onInputChange={handlePatientInputChange}
                        onSelectChange={handlePatientSelectChange}
                      />
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
                          <MedicalAidInfo
                            medicalSchemes={medicalSchemes}
                            sameAsPatient={sameAsPatient}
                            member={file?.medical_cover?.member}
                            medicalAid={file?.medical_cover?.medical_aid}
                            onSchemeChange={handleMedicalSchemeChange}
                            onSameAsPatientChange={handleSameAsPatientChange}
                            onMemberInputChange={handleMemberInputChange}
                            onMemberSelectChange={handleMemberSelectChange}
                            memberDateParts={memberDateOfBirth}
                            onMemberDatePartChange={handleMemberDatePartChange}
                            // casting refs to any to satisfy differing nullable types
                            memberRefs={{
                              yearRef: null as any,
                              monthRef: null as any,
                              dayRef: null as any,
                            }}
                            onMedicalAidFieldChange={(field, value) =>
                              setFile(prev =>
                                prev
                                  ? {
                                      ...prev,
                                      medical_cover: {
                                        ...prev.medical_cover,
                                        medical_aid: {
                                          ...prev.medical_cover?.medical_aid,
                                          [field]: value,
                                        },
                                      },
                                    }
                                  : prev
                              )
                            }
                          />
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
                          <InjuryOnDutyForm
                            injury={file?.medical_cover?.injury_on_duty}
                            onChange={handleInjuryInputChange}
                          />
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
                  {/* NotesSection extracted component */}
                  {file && (
                    <NotesSection
                      file={file as unknown as FileData}
                      setFile={(updater: (_prev: FileData) => FileData) =>
                        setFile(
                          prev =>
                            updater(
                              prev as unknown as FileData
                            ) as unknown as typeof prev
                        )
                      }
                    />
                  )}

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

      {/* Notes handled inside NotesSection */}
    </div>
  );
}
