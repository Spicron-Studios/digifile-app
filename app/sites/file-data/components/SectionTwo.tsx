'use client'

import { useState } from 'react'
import { Tab } from '@headlessui/react'
import FileNotesTab from './SectionTwo/FileNotesTab'
import ClinicalNotesTab from './SectionTwo/ClinicalNotesTab'
import EScriptsTab from './SectionTwo/EScriptsTab'
import PaymentsTab from './SectionTwo/PaymentsTab'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function SectionTwo() {
  const [tabs] = useState({
    'File Notes': FileNotesTab,
    'Clinical Notes': ClinicalNotesTab,
    eScripts: EScriptsTab,
    'Payments and other': PaymentsTab,
  })

  return (
    <div className="bg-white h-full overflow-hidden">
      <Tab.Group>
        <Tab.List className="flex space-x-1 bg-gray-200 p-1">
          {Object.keys(tabs).map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                classNames(
                  'w-full py-2.5 text-sm font-medium leading-5 text-gray-700',
                  'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-400 ring-white ring-opacity-60',
                  selected
                    ? 'bg-white shadow'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-700'
                )
              }
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="h-[calc(100%-3rem)] overflow-auto">
          {Object.values(tabs).map((TabComponent, idx) => (
            <Tab.Panel
              key={idx}
              className={classNames(
                'bg-white p-3',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-400 ring-white ring-opacity-60'
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

