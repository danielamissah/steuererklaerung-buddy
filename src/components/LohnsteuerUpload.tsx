'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { LohnsteuerOCRResult } from '@/types';
import { T } from '@/data/translations';

interface Props {
  t: T;
  onSuccess: (result: LohnsteuerOCRResult) => void;
}

// Drag-and-drop upload for Lohnsteuerbescheinigung.
// The document is sent to /api/ocr which uses Google Cloud Vision
// to extract the numbered field values automatically.
export function LohnsteuerUpload({ t, onSuccess }: Props) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<LohnsteuerOCRResult | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setStatus('processing');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data: LohnsteuerOCRResult = await res.json();

      if (!res.ok || data.confidence === 0) {
        setStatus('error');
        return;
      }

      setResult(data);
      setStatus('success');
      onSuccess(data);
    } catch {
      setStatus('error');
    }
  }, [onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all duration-200 ${
          isDragActive 
            ? 'border-primary bg-primary-light' 
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-2.5">📄</div>
        <p className="text-sm font-semibold text-[#374151] mb-1">
          {t.uploadLohnsteuer}
        </p>
        <p className="text-[12px] text-[#9CA3AF]">
          {t.uploadHint}
        </p>
      </div>

      {status === 'processing' && (
        <div className="bg-primary-light rounded-xl p-3.5 text-[13px] text-primary">
          {t.ocrProcessing}
        </div>
      )}

      {status === 'success' && result && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4">
          <p className="text-[13px] font-bold text-green-700 mb-2">
            {t.ocrSuccess} (confidence: {Math.round(result.confidence * 100)}%)
          </p>
          <p className="text-[12px] text-green-800">{t.ocrReview}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-[13px] text-red-600">
          {t.uploadError}
        </div>
      )}
    </div>
  );
}