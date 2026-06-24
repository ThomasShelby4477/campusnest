'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, FileCheck, X, Camera } from 'lucide-react'
import imageCompression from 'browser-image-compression'

interface IdUploadStepProps {
  onUploaded: () => void
}

export function IdUploadStep({ onUploaded }: IdUploadStepProps) {
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const idInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, or PDF files are allowed')
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB')
      return false
    }
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && validateFile(file)) setIdFile(file)
  }

  const handleUpload = async () => {
    if (!idFile) {
      toast.error('Please select your student ID card')
      return
    }
    setUploading(true)
    try {
      // Compress ID card
      const idOptions = { maxSizeMB: 1, maxWidthOrHeight: 2000, useWebWorker: true }
      const compressedId = idFile.type === 'application/pdf' ? idFile : await imageCompression(idFile, idOptions)
      
      const idFormData = new FormData()
      idFormData.append('file', compressedId)
      idFormData.append('type', 'id-card')

      const idRes = await fetch('/api/upload/id-card', { method: 'POST', body: idFormData })
      
      if (!idRes.ok) {
        let errorMsg = 'Failed to upload ID card'
        try {
          const idData = await idRes.json()
          errorMsg = idData.error || errorMsg
        } catch {
          if (idRes.status === 413) errorMsg = 'File is still too large. Please upload a smaller file.'
        }
        toast.error(errorMsg)
        return
      }

      // Upload selfie if provided
      if (selfieFile) {
        const selfieOptions = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true }
        const compressedSelfie = selfieFile.type === 'application/pdf' ? selfieFile : await imageCompression(selfieFile, selfieOptions)
        
        const selfieFormData = new FormData()
        selfieFormData.append('file', compressedSelfie)
        selfieFormData.append('type', 'selfie')

        const selfieRes = await fetch('/api/upload/id-card', { method: 'POST', body: selfieFormData })
        if (!selfieRes.ok) {
          console.error('Selfie upload failed')
        }
      }

      toast.success('Documents uploaded! Verification in progress.')
      onUploaded()
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="border-border-light shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mb-3">
          <Upload className="w-7 h-7 text-warning" />
        </div>
        <CardTitle className="text-2xl font-bold text-text-primary">Verify Your Identity</CardTitle>
        <CardDescription className="text-text-muted">
          Upload your NFSU student ID card for verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ID Card drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => idInputRef.current?.click()}
          className={`relative cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all
            ${dragActive ? 'border-navy bg-navy/5' : 'border-border-light hover:border-navy/40 hover:bg-muted-bg'}
            ${idFile ? 'border-success bg-success/5' : ''}`}
        >
          <input
            ref={idInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f && validateFile(f)) setIdFile(f)
            }}
            className="hidden"
            aria-label="Upload student ID card"
          />
          {idFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileCheck className="w-8 h-8 text-success" />
              <div className="text-left">
                <p className="font-medium text-text-primary text-sm">{idFile.name}</p>
                <p className="text-xs text-text-muted">{(idFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIdFile(null) }}
                className="ml-auto p-1 rounded-full hover:bg-danger/10"
                aria-label="Remove file"
              >
                <X className="w-4 h-4 text-danger" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-text-muted mx-auto mb-2" />
              <p className="font-medium text-text-primary">Drop your student ID here</p>
              <p className="text-sm text-text-muted mt-1">or click to browse · JPEG, PNG, or PDF · Max 5MB</p>
            </>
          )}
        </div>

        {/* Selfie upload (optional) */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-muted flex items-center gap-1">
            <Camera className="w-4 h-4" /> Selfie (optional)
          </p>
          <div
            onClick={() => selfieInputRef.current?.click()}
            className={`cursor-pointer border rounded-xl p-4 text-center transition-all
              ${selfieFile ? 'border-success bg-success/5' : 'border-border-light hover:border-navy/40'}`}
          >
            <input
              ref={selfieInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f && validateFile(f)) setSelfieFile(f)
              }}
              className="hidden"
              aria-label="Upload selfie"
            />
            {selfieFile ? (
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-success" />
                <span className="text-sm text-text-primary">{selfieFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelfieFile(null) }}
                  className="ml-auto p-1"
                  aria-label="Remove selfie"
                >
                  <X className="w-4 h-4 text-danger" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-text-muted">Click to add a selfie for faster verification</p>
            )}
          </div>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!idFile || uploading}
          className="w-full h-12 bg-coral hover:bg-coral-dark text-white font-semibold text-base"
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading...
            </span>
          ) : (
            'Submit for Verification'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
