'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Select } from '@/app/components/ui/select'
import { useSharedContext } from '../context/SharedContext'

type CoverType = 'Medical Aid' | 'Private' | 'Injury on Duty'

export default function MedicalCoverTab() {
  const { updatePatientData, patientData } = useSharedContext()
  const [coverType, setCoverType] = useState<CoverType>('Medical Aid')
  const [medicalAidData, setMedicalAidData] = useState({
    medicalScheme: '',
    membershipNumber: '',
    patientDependentCode: '',
    mainMemberSameAsPatient: false,
    mainMember: {
      idNo: '',
      title: '',
      name: '',
      initials: '',
      surname: '',
      dateOfBirth: '',
      gender: '',
      cellPhone: '',
      additionalContactName: '',
      additionalContactNumber: '',
      email: '',
      residentialAddress: '',
      residentialAddressSameAsPatient: false
    }
  })

  useEffect(() => {
    if (medicalAidData.mainMemberSameAsPatient) {
      setMedicalAidData(prev => ({
        ...prev,
        mainMember: {
          ...prev.mainMember,
          ...patientData,
          residentialAddressSameAsPatient: true
        }
      }))
    }
  }, [medicalAidData.mainMemberSameAsPatient, patientData])

  useEffect(() => {
    if (medicalAidData.mainMember.name) {
      const initials = medicalAidData.mainMember.name.split(' ').map(n => n[0]).join('')
      setMedicalAidData(prev => ({
        ...prev,
        mainMember: { ...prev.mainMember, initials }
      }))
    }
  }, [medicalAidData.mainMember.name])

  useEffect(() => {
    if (medicalAidData.mainMember.idNo.length === 13) {
      const dob = medicalAidData.mainMember.idNo.substring(0, 6)
      const genderDigit = parseInt(medicalAidData.mainMember.idNo.charAt(6))
      const gender = genderDigit >= 5 ? 'Male' : 'Female'
      setMedicalAidData(prev => ({
        ...prev,
        mainMember: { ...prev.mainMember, dateOfBirth: dob, gender }
      }))
    }
  }, [medicalAidData.mainMember.idNo])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name.startsWith('mainMember.')) {
      const mainMemberField = name.split('.')[1]
      setMedicalAidData(prev => ({
        ...prev,
        mainMember: { ...prev.mainMember, [mainMemberField]: value }
      }))
    } else {
      setMedicalAidData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = () => {
    updatePatientData({ coverType, ...(coverType === 'Medical Aid' ? medicalAidData : {}) })
  }

  return (
    <div className="space-y-6">
      <RadioGroup value={coverType} onValueChange={(value) => setCoverType(value as CoverType)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Medical Aid" id="medical-aid" />
          <Label htmlFor="medical-aid">Medical Aid</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Private" id="private" />
          <Label htmlFor="private">Private</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Injury on Duty" id="injury-on-duty" />
          <Label htmlFor="injury-on-duty">Injury on Duty</Label>
        </div>
      </RadioGroup>

      {coverType === 'Medical Aid' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Medical Insurance Details</h3>
          <div>
            <Label htmlFor="medicalScheme">Medical Scheme*</Label>
            <Select
              id="medicalScheme"
              name="medicalScheme"
              value={medicalAidData.medicalScheme}
              onValueChange={(value) => handleInputChange({ target: { name: 'medicalScheme', value } } as any)}
              required
            >
              <option value="">Select a scheme</option>
              <option value="scheme1">Scheme 1</option>
              <option value="scheme2">Scheme 2</option>
              {/* Add more schemes as needed */}
            </Select>
          </div>
          <div>
            <Label htmlFor="membershipNumber">Membership Number*</Label>
            <Input
              id="membershipNumber"
              name="membershipNumber"
              value={medicalAidData.membershipNumber}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="patientDependentCode">Patient Dependent Code</Label>
            <Input
              id="patientDependentCode"
              name="patientDependentCode"
              value={medicalAidData.patientDependentCode}
              onChange={handleInputChange}
            />
          </div>

          <h3 className="text-lg font-semibold">Main Member</h3>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mainMemberSameAsPatient"
              checked={medicalAidData.mainMemberSameAsPatient}
              onCheckedChange={(checked) => 
                setMedicalAidData(prev => ({ ...prev, mainMemberSameAsPatient: checked as boolean }))
              }
            />
            <Label htmlFor="mainMemberSameAsPatient">Same as Patient</Label>
          </div>

          {!medicalAidData.mainMemberSameAsPatient && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="mainMember.idNo">ID No.*</Label>
                <Input
                  id="mainMember.idNo"
                  name="mainMember.idNo"
                  value={medicalAidData.mainMember.idNo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mainMember.title">Title</Label>
                <Input
                  id="mainMember.title"
                  name="mainMember.title"
                  value={medicalAidData.mainMember.title}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="mainMember.name">Name*</Label>
                <Input
                  id="mainMember.name"
                  name="mainMember.name"
                  value={medicalAidData.mainMember.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mainMember.initials">Initials*</Label>
                <Input
                  id="mainMember.initials"
                  name="mainMember.initials"
                  value={medicalAidData.mainMember.initials}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mainMember.surname">Surname*</Label>
                <Input
                  id="mainMember.surname"
                  name="mainMember.surname"
                  value={medicalAidData.mainMember.surname}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mainMember.dateOfBirth">Date of Birth</Label>
                <Input
                  id="mainMember.dateOfBirth"
                  name="mainMember.dateOfBirth"
                  value={medicalAidData.mainMember.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="mainMember.gender">Gender*</Label>
                <Select
                  id="mainMember.gender"
                  name="mainMember.gender"
                  value={medicalAidData.mainMember.gender}
                  onValueChange={(value) => handleInputChange({ target: { name: 'mainMember.gender', value } } as any)}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Unknown">Unknown</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="mainMember.cellPhone">Cell Phone</Label>
                <Input
                  id="mainMember.cellPhone"
                  name="mainMember.cellPhone"
                  value={medicalAidData.mainMember.cellPhone}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="mainMember.additionalContactName">Additional Contact Name</Label>
                <Input
                  id="mainMember.additionalContactName"
                  name="mainMember.additionalContactName"
                  value={medicalAidData.mainMember.additionalContactName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="mainMember.additionalContactNumber">Additional Contact Number</Label>
                <Input
                  id="mainMember.additionalContactNumber"
                  name="mainMember.additionalContactNumber"
                  value={medicalAidData.mainMember.additionalContactNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="mainMember.email">Email Address</Label>
                <Input
                  id="mainMember.email"
                  name="mainMember.email"
                  type="email"
                  value={medicalAidData.mainMember.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="mainMember.residentialAddress">Residential Address</Label>
                <Input
                  id="mainMember.residentialAddress"
                  name="mainMember.residentialAddress"
                  value={medicalAidData.mainMember.residentialAddress}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mainMember.residentialAddressSameAsPatient"
                  checked={medicalAidData.mainMember.residentialAddressSameAsPatient}
                  onCheckedChange={(checked) => 
                    setMedicalAidData(prev => ({
                      ...prev,
                      mainMember: {
                        ...prev.mainMember,
                        residentialAddressSameAsPatient: checked as boolean,
                        residentialAddress: checked ? patientData.residentialAddress : prev.mainMember.residentialAddress
                      }
                    }))
                  }
                />
                <Label htmlFor="mainMember.residentialAddressSameAsPatient">Same as Patient</Label>
              </div>
            </div>
          )}
        </div>
      )}

      {coverType === 'Private' && (
        <div>
          <Label>Nothing Here</Label>
        </div>
      )}

      {coverType === 'Injury on Duty' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName">Name of Company*</Label>
            <Input
              id="companyName"
              name="companyName"
              required
            />
          </div>
          <div>
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              name="contactPerson"
            />
          </div>
          <div>
            <Label htmlFor="contactNumber">Contact Number*</Label>
            <Input
              id="contactNumber"
              name="contactNumber"
              required
            />
          </div>
          <div>
            <Label htmlFor="contactEmail">Contact Email Address</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
            />
          </div>
        </div>
      )}

      <Button className="w-full" onClick={handleSubmit}>Submit Medical Cover Info</Button>
    </div>
  )
}

