'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';

export type AttachmentPreview = {
  fileName: string;
  fileType: string | null;
  signedUrl: string;
};

function isImage(type: string | null): boolean {
  return Boolean(type && type.startsWith('image/'));
}

function isPdf(type: string | null): boolean {
  return type === 'application/pdf';
}

function isAudio(type: string | null): boolean {
  return Boolean(type && type.startsWith('audio/'));
}

export function AttachmentPreviewModal({
  open,
  onOpenChange,
  attachment,
}: {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  attachment: AttachmentPreview | null;
}): React.JSX.Element {
  const { fileName, fileType, signedUrl } = attachment ?? {
    fileName: '',
    fileType: null,
    signedUrl: '',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="truncate" title={fileName}>
            {fileName || 'Preview'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 min-h-[400px] flex items-center justify-center bg-gray-50 rounded">
          {attachment && isImage(fileType) && (
            <img
              src={signedUrl}
              alt={fileName}
              className="max-h-[70vh] max-w-full object-contain"
            />
          )}
          {attachment && isPdf(fileType) && (
            <iframe
              src={signedUrl}
              title={fileName}
              className="w-full h-[70vh] border"
            />
          )}
          {attachment && isAudio(fileType) && (
            <div className="w-full p-4 text-center">
              <audio
                src={signedUrl}
                controls
                preload="metadata"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">
                If playback fails, download the file and play it locally. Some
                browsers cannot play certain audio formats (e.g., WebM/Opus on
                iOS).
              </p>
            </div>
          )}
          {attachment &&
            !isImage(fileType) &&
            !isPdf(fileType) &&
            !isAudio(fileType) && (
              <div className="text-center space-y-4 p-6">
                <p className="text-sm text-gray-600">
                  Preview not available. You can download the file.
                </p>
                <Button asChild>
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    Download
                  </a>
                </Button>
              </div>
            )}
          {!attachment && (
            <div className="text-gray-500">No attachment selected</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AttachmentPreviewModal;
