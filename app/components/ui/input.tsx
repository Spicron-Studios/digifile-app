"use client"

import React from "react"

export function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full p-2 border rounded ${props.className}`} />
}
