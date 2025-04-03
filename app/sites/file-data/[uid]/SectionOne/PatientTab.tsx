'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Select } from '@/app/components/ui/select'
import { useSharedContext } from '../context/SharedContext'

export default function PatientTab() {
  const { updatePatientData } = useSharedContext()
  const [patientData, setPatientData] = useState({
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
  })

  useEffect(() => {
    if (patientData.idNo.length === 13) {
      const dob = patientData.idNo.substring(0, 6)
      const genderDigit = parseInt(patientData.idNo.charAt(6))
      const gender = genderDigit >= 5 ? 'Male' : 'Female'
      setPatientData(prev => ({
        ...prev,
        dateOfBirth: dob,
        gender: gender
      }))
    }
  }, [patientData.idNo])

  useEffect(() => {
    const initials = patientData.name.split(' ').map(n => n[0]).join('')
    setPatientData(prev => ({ ...prev, initials }))
  }, [patientData.name])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPatientData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    updatePatientData(patientData)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Patient Details</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="idNo">ID No*</Label>
          <Input
            id="idNo"
            name="idNo"
            value={patientData.idNo}
            onChange={handleInputChange}
            maxLength={13}
            required
          />
        </div>
        <div>
          <Label htmlFor="title">Title*</Label>
          <Input
            id="title"
            name="title"
            value={patientData.title}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Name*</Label>
          <Input
            id="name"
            name="name"
            value={patientData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="initials">Initials*</Label>
          <Input
            id="initials"
            name="initials"
            value={patientData.initials}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="surname">Surname*</Label>
          <Input
            id="surname"
            name="surname"
            value={patientData.surname}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth*</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            value={patientData.dateOfBirth}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="gender">Gender*</Label>
          <Select
            id="gender"
            name="gender"
            value={patientData.gender}
            onValueChange={(value) => handleInputChange({ target: { name: 'gender', value } } as any)}
            required
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Unknown">Unknown</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="cellPhone">Cell Phone</Label>
          <Input
            id="cellPhone"
            name="cellPhone"
            value={patientData.cellPhone}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="additionalContactName">Additional Contact Name</Label>
          <Input
            id="additionalContactName"
            name="additionalContactName"
            value={patientData.additionalContactName}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="additionalContactNumber">Additional Contact Number</Label>
          <Input
            id="additionalContactNumber"
            name="additionalContactNumber"
            value={patientData.additionalContactNumber}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={patientData.email}
            onChange={handleInputChange}
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="residentialAddress">Residential Address</Label>
          <Input
            id="residentialAddress"
            name="residentialAddress"
            value={patientData.residentialAddress}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <Button className="w-full" onClick={handleSubmit}>Submit Patient Info</Button>
    </div>
  )
}

