'use client'

import React, { createContext, useContext, useState } from 'react'

type SharedContextType = {
  patientData: any
  updatePatientData: (data: any) => void
}

const SharedContext = createContext<SharedContextType | undefined>(undefined)

export function SharedProvider({ children }: { children: React.ReactNode }) {
  const [patientData, setPatientData] = useState({})

  const updatePatientData = (data: any) => {
    setPatientData((prevData) => ({ ...prevData, ...data }))
  }

  return (
    <SharedContext.Provider value={{ patientData, updatePatientData }}>
      {children}
    </SharedContext.Provider>
  )
}

export function useSharedContext() {
  const context = useContext(SharedContext)
  if (context === undefined) {
    throw new Error('useSharedContext must be used within a SharedProvider')
  }
  return context
}

