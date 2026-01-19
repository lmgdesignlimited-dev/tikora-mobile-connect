import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Video, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  bucket: string;
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  onUploadComplete: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  existingFiles?: string[];
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export function FileUpload({
  bucket,
  folder = '',
  accept = 'image/*',
  maxSize = 5,
  multiple = false,
  onUploadComplete,
  onUploadError,
  className,
  label,
  hint,
  disabled = false,
  existingFiles = [],
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    existingFiles.map(url => ({
      name: url.split('/').pop() || 'file',
      url,
      size: 0,
      type: 'existing',
    }))
  );
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/') || type === 'existing') return Image;
    if (type.startsWith('video/')) return Video;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    const fileArray = Array.from(files);
    
    // Validate file sizes
    const oversizedFiles = fileArray.filter(f => f.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      const error = `File(s) exceed maximum size of ${maxSize}MB`;
      toast.error(error);
      onUploadError?.(error);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        const url = await uploadFile(file);
        setProgress(((index + 1) / fileArray.length) * 100);
        return {
          name: file.name,
          url: url!,
          size: file.size,
          type: file.type,
        };
      });

      const results = await Promise.all(uploadPromises);
      const newFiles = multiple ? [...uploadedFiles, ...results] : results;
      setUploadedFiles(newFiles);
      onUploadComplete(newFiles.map(f => f.url));
      toast.success(`${results.length} file(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file(s)');
      onUploadError?.(error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const removeFile = async (url: string) => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(p => p === bucket);
      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        await supabase.storage.from(bucket).remove([filePath]);
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }

    const newFiles = uploadedFiles.filter(f => f.url !== url);
    setUploadedFiles(newFiles);
    onUploadComplete(newFiles.map(f => f.url));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50',
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center p-6 text-center">
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Uploading...</p>
              <Progress value={progress} className="w-full max-w-xs h-2" />
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {hint || `Max ${maxSize}MB per file`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div
                key={file.url}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                  {file.size > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(file.size)})
                    </span>
                  )}
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                </div>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.url);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
