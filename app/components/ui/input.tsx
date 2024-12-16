"use client"

import React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input(props: InputProps) {
  return <input {...props} className={`w-full p-2 border rounded ${props.className}`} />
}
