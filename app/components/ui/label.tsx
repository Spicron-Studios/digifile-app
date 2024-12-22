"use client"

import React from "react"

export function Label({ ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={`block mb-1 font-medium ${props.className}`} />
}
