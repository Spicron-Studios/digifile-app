'use client';

import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateTimePickerProps {
  id: string;
  value?: Date | null;
  onChange?: (_date: Date | null) => void;
}

export function DateTimePicker({ id, value, onChange }: DateTimePickerProps) {
  return (
    <ReactDatePicker
      id={id}
      selected={value || null}
      onChange={onChange}
      showTimeSelect
      dateFormat="Pp"
      className="w-full p-2 border rounded"
      selectsMultiple={false}
    />
  );
}
