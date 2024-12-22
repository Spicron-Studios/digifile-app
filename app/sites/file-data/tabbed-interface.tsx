'use client'

import React, { useState } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Card, CardContent } from "@/app/components/ui/card"
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
    content: "This is a paragraph",
    images: ["/placeholder.svg?height=150&width=150", "/placeholder.svg?height=150&width=150"]
  },
  {
    date: "2024-04-21",
    time: "19:45",
    content: "This is a paragraph",
    images: ["/placeholder.svg?height=150&width=150"]
  }
]

export default function TabbedInterface() {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card className="shadow-sm">
        {/* Top Half - Static Content */}
        <CardContent className="p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h2>
          <p className="mt-4 text-gray-600">Welcome to your dashboard. Here you can view and manage your account information.</p>
        </CardContent>

        {/* Bottom Half - Tabbed Interface */}
        <Tabs defaultValue="tab1" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-gray-50">
            {Array.from({ length: 7 }).map((_, i) => (
              <TabsTrigger
                key={i}
                value={`tab${i + 1}`}
                className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Tab {i + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="tab1" className="p-0">
            <div className="grid grid-cols-[300px_1fr] divide-x">
              {/* Left Sidebar */}
              <div className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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
                  + Add
                </Button>
              </div>

              {/* Main Content */}
              <div className="p-6 space-y-8">
                {mockEntries.map((entry, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>🌐</span>
                      <time>{entry.date}</time>
                      <time>{entry.time}</time>
                    </div>
                    <p className="text-gray-600">{entry.content}</p>
                    <div className="grid grid-cols-2 gap-4 max-w-[400px]">
                      {entry.images.map((src, imgIndex) => (
                        <div key={imgIndex} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={src}
                            alt="Content image"
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
          </TabsContent>
          
          {/* Other tab contents would follow the same pattern */}
          {Array.from({ length: 6 }).map((_, i) => (
            <TabsContent key={i + 2} value={`tab${i + 2}`} className="p-6">
              <h3 className="text-xl font-semibold text-gray-800">Tab {i + 2} Content</h3>
              <p className="mt-2 text-gray-600">This is the content for tab {i + 2}.</p>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  )
}

