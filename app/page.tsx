'use client'

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    fetch('/api/test')
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-xl">Under construction</h1>
    </div>
  );
}
