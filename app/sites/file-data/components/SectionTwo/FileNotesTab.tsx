'use client'

import React, { useState } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label" 
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import Image from 'next/image'

interface TimelineEntry {
  date: string
  time: string
  content: string
  images: string[]
}

const mockEntries: TimelineEntry[] = [
  {
    date: "2024-06-25",
    time: "19:32",
    content: "Patient reported improvement in symptoms after starting new medication.",
    images: ["/placeholder.svg?height=150&width=150", "/placeholder.svg?height=150&width=150"]
  },
  {
    date: "2024-04-21",
    time: "19:45",
    content: "Follow-up appointment scheduled for next month. Patient to continue current treatment plan.",
    images: ["/placeholder.svg?height=150&width=150"]
  }
]

export default function FileNotesTab() {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  return (
    <div className="grid grid-cols-[300px_1fr] divide-x h-full">
      {/* Left Sidebar */}
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input placeholder="Search" className="pl-8" />
        </div>
        <div>
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            Filter
            {isFilterExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {isFilterExpanded && (
            <div className="mt-2 space-y-2">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <DatePicker
                  id="start-date"
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate ?? undefined}
                  endDate={endDate ?? undefined}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <DatePicker
                  id="end-date"
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate ?? undefined}
                  endDate={endDate ?? undefined}
                  minDate={startDate ?? undefined}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          )}
        </div>
        <Button className="w-full">
          + Add Note
        </Button>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-8 overflow-auto">
        {mockEntries.map((entry, index) => (
          <div key={index} className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>📝</span>
              <time>{entry.date}</time>
              <time>{entry.time}</time>
            </div>
            <p className="text-gray-700">{entry.content}</p>
            <div className="grid grid-cols-2 gap-4 max-w-[400px]">
              {entry.images.map((src, imgIndex) => (
                <div key={imgIndex} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={src}
                    alt="File note image"
                    className="w-full h-full object-cover"
                    width={150}
                    height={150}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

