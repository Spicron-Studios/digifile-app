'use client'
import React, { useEffect, useState } from 'react'

const Page = () => {
  const [usernames, setUsernames] = useState<string[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api')
        const data = await response.json()
        const names = data.map((user: { username: string }) => user.username).filter(Boolean)
        console.log('Usernames:', names)
        setUsernames(names)
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }

    fetchUsers()
  }, [])

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {usernames.map((username, index) => (
          <li key={index}>{username}</li>
        ))}
      </ul>
    </div>
  )
}

export default Page