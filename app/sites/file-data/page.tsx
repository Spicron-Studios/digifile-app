import { SharedProvider } from './context/SharedContext'
import Header from './components/Header'
import SectionOne from './components/SectionOne'
import SectionTwo from './components/SectionTwo'

export default function FileDataPage() {
  return (
    <SharedProvider>
      <main className="flex flex-col h-screen bg-white text-black">
        <Header accountNo="7771919" fileNo="713000" />
        <div className="flex-1 h-[45vh] border-b border-gray-200">
          <SectionOne />
        </div>
        <div className="flex-1 h-[45vh]">
          <SectionTwo />
        </div>
      </main>
    </SharedProvider>
  )
}

