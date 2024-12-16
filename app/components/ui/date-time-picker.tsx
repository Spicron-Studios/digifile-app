"use client"

import React from "react"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

interface DateTimePickerProps {
  id: string
  value?: Date
  onChange?: (date: Date | null) => void
}

export function DateTimePicker({ id, value, onChange }: DateTimePickerProps) {
  return (
    <ReactDatePicker
      id={id}
      selected={value}
      onChange={onChange}
      showTimeSelect
      dateFormat="Pp"
      className="w-full p-2 border rounded"
    />
  )
}
