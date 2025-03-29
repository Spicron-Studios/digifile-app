'use client'

import { useState } from 'react'
import { Tab } from '@headlessui/react'
import PatientTab from './SectionOne/PatientTab'
import MedicalCoverTab from './SectionOne/MedicalCoverTab'
import ExtraTab from './SectionOne/ExtraTab'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function SectionOne() {
  const [tabs] = useState({
    Patient: PatientTab,
    'Medical Cover': MedicalCoverTab,
    Extra: ExtraTab,
  })

  return (
    <div className="bg-white h-full p-6 overflow-auto">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-200 p-1">
          {Object.keys(tabs).map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-gray-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow text-black'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-black'
                )
              }
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2 h-[calc(100%-3rem)] overflow-auto">
          {Object.values(tabs).map((TabComponent, idx) => (
            <Tab.Panel
              key={idx}
              className={classNames(
                'rounded-xl bg-white p-3',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-gray-400 focus:outline-none focus:ring-2'
              )}
            >
              <TabComponent />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

