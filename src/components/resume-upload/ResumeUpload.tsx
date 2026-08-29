import * as React from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils/helpers';
import type { ResumeFile } from '@/types';

interface ResumeUploadProps {
  file: ResumeFile | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  error?: string;
}

export function ResumeUpload({ file, onFileSelect, onFileRemove, error }: ResumeUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileRemove();
  };

  return (
    <div className="space-y-4">
      {file ? (
        <div className="relative rounded-lg border-2 border-green-500 bg-green-50/10 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <FileText className="h-8 w-8" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{file.file.name}</p>
              <p className="truncate text-xs text-muted-foreground">{formatFileSize(file.file.size)}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemove} className="h-10 w-10 shrink-0">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative flex h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:bg-accent/50',
            isDragOver ? 'border-primary bg-primary/10' : 'border-border'
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-8 w-8" />
          </div>
          <p className="text-center text-sm font-medium">
            Перетащите PDF сюда или{' '}
            <span className="text-primary underline underline-offset-4">выберите файл</span>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Максимальный размер: 10 MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Поддерживается только PDF формат. Максимальный размер файла: 10 MB.
      </p>
    </div>
  );
}
