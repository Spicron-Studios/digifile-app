'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Calendar } from '@/app/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Editor } from '@/app/components/ui/editor';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Checkbox } from '@/app/components/ui/checkbox';

export default function FileDataPage() {
  const { uid } = useParams();
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isNewRecord = uid === 'new-record';
  const [extraInfo, setExtraInfo] = useState(file?.extraInfo || '');
  const [coverType, setCoverType] = useState('medical-aid');
  const [sameAsPatient, setSameAsPatient] = useState(false);

  // References for date input fields
  const yearInputRef = useRef(null);
  const monthInputRef = useRef(null);
  const dayInputRef = useRef(null);
  
  // References for member date fields
  const memberYearInputRef = useRef(null);
  const memberMonthInputRef = useRef(null);
  const memberDayInputRef = useRef(null);
  
  // Separate state for date parts
  const [dateOfBirth, setDateOfBirth] = useState({
    year: '',
    month: '',
    day: ''
  });
  
  // Separate state for member date parts
  const [memberDateOfBirth, setMemberDateOfBirth] = useState({
    year: '',
    month: '',
    day: ''
  });
  
  // Initialize date parts from file data if available
  useEffect(() => {
    if (file?.patient?.dob && typeof file.patient.dob === 'string') {
      // Parse existing date if available
      const dateParts = file.patient.dob.split('/');
      if (dateParts.length === 3) {
        setDateOfBirth({
          year: dateParts[0],
          month: dateParts[1],
          day: dateParts[2]
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
    if (file?.medical_cover?.member?.dob && typeof file.medical_cover.member.dob === 'string') {
      const dateParts = file.medical_cover.member.dob.split('/');
      if (dateParts.length === 3) {
        setMemberDateOfBirth({
          year: dateParts[0],
          month: dateParts[1],
          day: dateParts[2]
        });
      }
    }
  }, [file]);

  // Handle date part changes with validation and auto-focus
  const handleDatePartChange = (part: 'year' | 'month' | 'day', value: string, maxLength: number, nextRef?: React.RefObject<HTMLInputElement>) => {
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
    const newDob = part === 'year' 
      ? `${value}/${dateOfBirth.month}/${dateOfBirth.day}`
      : part === 'month'
      ? `${dateOfBirth.year}/${value}/${dateOfBirth.day}`
      : `${dateOfBirth.year}/${dateOfBirth.month}/${value}`;
    
    setFile({
      ...file,
      patient: {
        ...file.patient,
        dob: newDob
      }
    });
    
    // Auto-focus to next field when max length is reached
    if (value.length === maxLength && nextRef?.current) {
      nextRef.current.focus();
    }
  };
  
  // Handle member date part changes with validation and auto-focus
  const handleMemberDatePartChange = (part: 'year' | 'month' | 'day', value: string, maxLength: number, nextRef?: React.RefObject<HTMLInputElement>) => {
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
    const newDob = part === 'year' 
      ? `${value}/${memberDateOfBirth.month}/${memberDateOfBirth.day}`
      : part === 'month'
      ? `${memberDateOfBirth.year}/${value}/${memberDateOfBirth.day}`
      : `${memberDateOfBirth.year}/${memberDateOfBirth.month}/${value}`;
    
    setFile({
      ...file,
      medical_cover: {
        ...file.medical_cover,
        member: {
          ...file.medical_cover?.member,
          dob: newDob
        }
      }
    });
    
    // Auto-focus to next field when max length is reached
    if (value.length === maxLength && nextRef?.current) {
      nextRef.current.focus();
    }
  };
  
  // Handle medical cover type change
  const handleCoverTypeChange = (value: string) => {
    setCoverType(value);
    
    // Update file state
    setFile({
      ...file,
      medical_cover: {
        ...file.medical_cover,
        type: value
      }
    });
  };
  
  // Handle same as patient checkbox change
  const handleSameAsPatientChange = (checked: boolean) => {
    setSameAsPatient(checked);
    
    // Update file state
    setFile({
      ...file,
      medical_cover: {
        ...file.medical_cover,
        same_as_patient: checked
      }
    });
  };

  // Function to handle input changes for patient data
  const handlePatientInputChange = (field, value) => {
    console.log(`Updating patient.${field} to:`, value);
    
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
      const fullYear = parseInt(yearPart) > currentYearLastTwo
        ? `${currentCentury - 1}${yearPart}`
        : `${currentCentury}${yearPart}`;
      
      // Update date of birth fields
      setDateOfBirth({
        year: fullYear,
        month: monthPart,
        day: dayPart
      });
      
      // Update the file state with the extracted DOB
      setFile(prevFile => ({
        ...prevFile,
        patient: {
          ...prevFile.patient,
          [field]: value,
          dob: `${fullYear}/${monthPart}/${dayPart}`
        }
      }));
      return;
    }
    
    // Special handling for name - auto-generate initials
    if (field === 'name' || field === 'surname') {
      setFile(prevFile => {
        const newName = field === 'name' ? value : prevFile.patient?.name || '';
        const newSurname = field === 'surname' ? value : prevFile.patient?.surname || '';
        
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
            initials: initials.trim()
          }
        };
      });
      return;
    }
    
    // Standard handling for other fields
    setFile(prevFile => ({
      ...prevFile,
      patient: {
        ...prevFile.patient,
        [field]: value
      }
    }));
  };

  // Function to handle select changes for patient data
  const handlePatientSelectChange = (field, value) => {
    console.log(`Updating patient.${field} to:`, value);
    
    // Special handling for gender based field
    if (field === 'title') {
      // If title is changed, update gender accordingly
      const gender = value === 'Mr' ? 'male' : value === 'Mrs' ? 'female' : file?.patient?.gender || '';
      
      setFile(prevFile => ({
        ...prevFile,
        patient: {
          ...prevFile.patient,
          [field]: value,
          gender: gender
        }
      }));
      return;
    }
    
    // Standard handling for other fields
    setFile(prevFile => ({
      ...prevFile,
      patient: {
        ...prevFile.patient,
        [field]: value
      }
    }));
  };

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

  // Send header data to layout
  useEffect(() => {
    if (file) {
      const headerData = {
        fileNumber: file.file_number,
        accountNumber: file.account_number
      };
      
      // Dispatch a custom event with the header data
      window.dispatchEvent(new CustomEvent('file-header-data', { detail: headerData }));
    }
  }, [file]);

  // Function to save the file data
  const handleSave = async () => {
    if (!file) return;
    
    try {
      setSaving(true);
      console.log('Saving file data:', file);
      
      const endpoint = isNewRecord ? '/api/files/new' : `/api/files/${uid}`;
      const method = isNewRecord ? 'POST' : 'PUT';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(file),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save file data');
      }
      
      const savedData = await response.json();
      
      // Update the file state with the returned data
      setFile(savedData);
      
      // If this was a new record, redirect to the saved record's page
      if (isNewRecord && savedData.uid) {
        router.push(`/sites/file-data/${savedData.uid}`);
      }
      
      console.log('File saved successfully:', savedData);
      alert("File data saved successfully");
    } catch (error) {
      console.error('Error saving file:', error);
      alert("Failed to save file data");
    } finally {
      setSaving(false);
    }
  };

  // Listen for save trigger from layout
  useEffect(() => {
    const handleSaveTrigger = () => {
      handleSave();
    };
    
    window.addEventListener('file-save-triggered', handleSaveTrigger);
    
    return () => {
      window.removeEventListener('file-save-triggered', handleSaveTrigger);
    };
  }, [handleSave]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!file && !isNewRecord) {
    return <div>File not found</div>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main content container - takes full height and prevents overflow */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Section - 50% width */}
        <div className="w-1/2 p-4 overflow-hidden">
          <Card className="h-full flex flex-col overflow-hidden">
            <Tabs defaultValue="tab1" className="h-full flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3 shrink-0">
                <TabsTrigger value="tab1">Patient Details</TabsTrigger>
                <TabsTrigger value="tab2">Medical History</TabsTrigger>
                <TabsTrigger value="tab3">Documents</TabsTrigger>
              </TabsList>
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
                        onChange={(e) => handlePatientInputChange('id', e.target.value)}
                      />
                    </div>
                    
                    {/* Right Column - Row 1 - CHANGED FROM INPUT TO SELECT */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Select 
                        value={file?.patient?.title || ''} 
                        onValueChange={(value) => handlePatientSelectChange('title', value)}
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
                        onChange={(e) => handlePatientInputChange('name', e.target.value)}
                      />
                    </div>

                    {/* Right Column - Row 2 */}
                    <div className="space-y-2">
                      <Label htmlFor="initials">Initials</Label>
                      <Input 
                        id="initials" 
                        placeholder="Auto-generated from name" 
                        value={file?.patient?.initials || ''}
                        onChange={(e) => handlePatientInputChange('initials', e.target.value)}
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
                        onChange={(e) => handlePatientInputChange('surname', e.target.value)}
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
                            onChange={(e) => handleDatePartChange('year', e.target.value, 4, monthInputRef)}
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
                            onChange={(e) => handleDatePartChange('month', e.target.value, 2, dayInputRef)}
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
                            onChange={(e) => handleDatePartChange('day', e.target.value, 2)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Left Column - Row 4 */}
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={file?.patient?.gender || ''} 
                        onValueChange={(value) => handlePatientSelectChange('gender', value)}
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
                        onChange={(e) => handlePatientInputChange('cell_phone', e.target.value)}
                      />
                    </div>

                    {/* Left Column - Row 5 */}
                    <div className="space-y-2">
                      <Label htmlFor="additionalContact1">Additional Contact Name</Label>
                      <Input 
                        id="additionalContact1" 
                        placeholder="Enter contact name" 
                        value={file?.patient?.additional_name || ''}
                        onChange={(e) => handlePatientInputChange('additional_name', e.target.value)}
                      />
                    </div>

                    {/* Right Column - Row 5 */}
                    <div className="space-y-2">
                      <Label htmlFor="additionalContact2">Additional Contact Cell</Label>
                      <Input 
                        id="additionalContact2" 
                        placeholder="Enter contact cell" 
                        value={file?.patient?.additional_cell || ''}
                        onChange={(e) => handlePatientInputChange('additional_cell', e.target.value)}
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
                        onChange={(e) => handlePatientInputChange('email', e.target.value)}
                      />
                    </div>

                    {/* Full Width - Row 7 */}
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="address">Residential Address</Label>
                      <Input 
                        id="address" 
                        placeholder="Enter residential address" 
                        value={file?.patient?.address || ''}
                        onChange={(e) => handlePatientInputChange('address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="tab2" className="flex-1 overflow-auto">
                <div className="p-6 h-full overflow-auto space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Medical Cover</h3>
                    
                    {/* Radio Group for Cover Type */}
                    <RadioGroup 
                      value={coverType} 
                      onValueChange={handleCoverTypeChange}
                      className="flex space-x-4 mb-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medical-aid" id="medical-aid" />
                        <Label htmlFor="medical-aid">Medical Aid</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="private" />
                        <Label htmlFor="private">Private</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="injury-on-duty" id="injury-on-duty" />
                        <Label htmlFor="injury-on-duty">Injury on Duty</Label>
                      </div>
                    </RadioGroup>
                    
                    {/* Dynamic content based on selected cover type */}
                    {coverType === 'medical-aid' && (
                      <div className="space-y-6">
                        <h4 className="text-md font-medium">Medical Aid Details</h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="medical-aid-name">Medical Aid</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select medical aid" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="discovery">Discovery Health</SelectItem>
                                <SelectItem value="momentum">Momentum Health</SelectItem>
                                <SelectItem value="bonitas">Bonitas</SelectItem>
                                <SelectItem value="medihelp">Medihelp</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="membership-number">Membership Number</Label>
                            <Input id="membership-number" placeholder="Enter membership number" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="dependent-code">Patient Dependent Code</Label>
                            <Input id="dependent-code" placeholder="Enter dependent code" />
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <h4 className="text-md font-medium mb-4">Main Member</h4>
                          
                          <div className="flex items-center space-x-2 mb-4">
                            <Checkbox 
                              id="same-as-patient" 
                              checked={sameAsPatient}
                              onCheckedChange={handleSameAsPatientChange}
                            />
                            <Label htmlFor="same-as-patient">Same as patient</Label>
                          </div>
                          
                          {!sameAsPatient && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="member-id">ID Number</Label>
                                <Input id="member-id" placeholder="Enter ID number" />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="member-name">Name</Label>
                                <Input id="member-name" placeholder="Enter name" />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="member-initials">Initials</Label>
                                <Input id="member-initials" placeholder="Enter initials" />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="member-surname">Surname</Label>
                                <Input id="member-surname" placeholder="Enter surname" />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="member-dob-year">Date of Birth</Label>
                                <div className="flex items-center">
                                  <div className="flex-1">
                                    <Input
                                      id="member-dob-year"
                                      ref={memberYearInputRef}
                                      placeholder="YYYY"
                                      maxLength={4}
                                      className="text-center"
                                      value={memberDateOfBirth.year}
                                      onChange={(e) => handleMemberDatePartChange('year', e.target.value, 4, memberMonthInputRef)}
                                    />
                                  </div>
                                  <span className="px-2 text-gray-500">/</span>
                                  <div className="w-16">
                                    <Input
                                      id="member-dob-month"
                                      ref={memberMonthInputRef}
                                      placeholder="MM"
                                      maxLength={2}
                                      className="text-center"
                                      value={memberDateOfBirth.month}
                                      onChange={(e) => handleMemberDatePartChange('month', e.target.value, 2, memberDayInputRef)}
                                    />
                                  </div>
                                  <span className="px-2 text-gray-500">/</span>
                                  <div className="w-16">
                                    <Input
                                      id="member-dob-day"
                                      ref={memberDayInputRef}
                                      placeholder="DD"
                                      maxLength={2}
                                      className="text-center"
                                      value={memberDateOfBirth.day}
                                      onChange={(e) => handleMemberDatePartChange('day', e.target.value, 2)}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="member-cell">Cell Number</Label>
                                <Input id="member-cell" placeholder="Enter cell number" />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="member-contact-name">Additional Contact Name</Label>
                                <Input id="member-contact-name" placeholder="Enter contact name" />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="member-contact-number">Additional Contact Number</Label>
                                <Input id="member-contact-number" placeholder="Enter contact number" />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="member-email">Email Address</Label>
                                <Input id="member-email" type="email" placeholder="Enter email address" />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="member-address">Residential Address</Label>
                                <Input id="member-address" placeholder="Enter residential address" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {coverType === 'private' && (
                      <div className="p-6 flex items-center justify-center text-gray-500">
                        <p>No additional information needed for private payment.</p>
                      </div>
                    )}
                    
                    {coverType === 'injury-on-duty' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="company-name">Name of Company</Label>
                          <Input id="company-name" placeholder="Enter company name" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="contact-person">Contact Person</Label>
                          <Input id="contact-person" placeholder="Enter contact person name" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="contact-number">Contact Number</Label>
                          <Input id="contact-number" placeholder="Enter contact number" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="contact-email">Contact Email</Label>
                          <Input id="contact-email" type="email" placeholder="Enter contact email" />
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
                      onChange={(content) => setExtraInfo(content)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Section - 50% width */}
        <div className="w-1/2 p-4 overflow-hidden">
          <Card className="h-full flex flex-col overflow-hidden">
            <Tabs defaultValue="tab1" className="h-full flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-5 shrink-0">
                <TabsTrigger value="tab1">Billing</TabsTrigger>
                <TabsTrigger value="tab2">Insurance</TabsTrigger>
                <TabsTrigger value="tab3">Claims</TabsTrigger>
                <TabsTrigger value="tab4">Payments</TabsTrigger>
                <TabsTrigger value="tab5">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="flex-1 overflow-auto">
                <div className="p-4 h-full">Billing Content</div>
              </TabsContent>
              <TabsContent value="tab2" className="flex-1 overflow-auto">
                <div className="p-4 h-full">Insurance Content</div>
              </TabsContent>
              <TabsContent value="tab3" className="flex-1 overflow-auto">
                <div className="p-4 h-full">Claims Content</div>
              </TabsContent>
              <TabsContent value="tab4" className="flex-1 overflow-auto">
                <div className="p-4 h-full">Payments Content</div>
              </TabsContent>
              <TabsContent value="tab5" className="flex-1 overflow-auto">
                <div className="p-4 h-full">Notes Content</div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
