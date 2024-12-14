'use client'

import { Logger } from './lib/logger'

export default async function Home() {
  const logger = Logger.getInstance()
  await logger.init()
  await logger.info('page.tsx', 'Hello World from Home Page')

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-xl">Under construction</h1>
    </div>
  );
}
