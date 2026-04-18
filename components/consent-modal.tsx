'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'

interface ConsentModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConsentModal({ isOpen, onConfirm, onCancel }: ConsentModalProps) {
  const [isChecked, setIsChecked] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 text-foreground">Мэргэжлийн зөвлөгөө авах</h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-foreground mb-3">
            Таны тестийн үр дүн болон эрэл хайлтыг AI мэргэжлийн зөвлөхөд дамжуулах гэж байна. 
            Энэ үйл ажиллагаа:
          </p>
          <ul className="text-sm text-foreground space-y-2 mb-3">
            <li>• Таны хүнээмгий мэдээллийг процесс хийнэ</li>
            <li>• Гүнзгий мэргэжлийн шинжилгээ өгнө</li>
            <li>• Хувийн сэтгэцийн зөвлөгөө авуулна</li>
          </ul>
          <p className="text-xs text-gray-600">
            Таны мэдээлэл hire.mn болон AI платформын серверт хадгалагдана.
          </p>
        </div>

        <div className="flex items-start gap-3 mb-6">
          <Checkbox 
            id="consent" 
            checked={isChecked}
            onCheckedChange={(checked) => setIsChecked(checked === true)}
            className="mt-1"
          />
          <label htmlFor="consent" className="text-sm text-foreground cursor-pointer">
            Би би өөрийн мэдээллийг дамжуулахыг зөвшөөрч байна. 
            <a href="#" className="text-blue-600 hover:underline"> Нууцлалын бодлого</a>
          </label>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Цуцлах
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!isChecked}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Үргэлжлүүлэх
          </Button>
        </div>
      </div>
    </div>
  )
}
