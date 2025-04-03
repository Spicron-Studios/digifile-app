import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'

export default function ExtraTab() {
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Enter extra information"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="w-full"
      />
      <Button className="w-full">Submit Extra Info</Button>
    </div>
  )
}

