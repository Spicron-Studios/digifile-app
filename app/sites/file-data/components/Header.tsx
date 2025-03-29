import { Button } from '@/app/components/ui/button'

interface HeaderProps {
  accountNo: string;
  fileNo: string;
}

export default function Header({ accountNo, fileNo }: HeaderProps) {
  return (
    <header className="bg-black text-white p-4 h-[10vh] flex items-center">
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
          File Selection
        </Button>
        <div className="flex space-x-4">
          <div>Account No. {accountNo}</div>
          <div>File No. {fileNo}</div>
        </div>
      </div>
    </header>
  )
}

