'use client';

/**
 * AttachmentUpload.tsx
 *
 * Provides drag & drop file upload capabilities connected to
 * the Supabase Storage announcements bucket.
 */

import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, File, Film } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import styles from '@/styles/components/shared/AttachmentUpload.module.css';

export interface AttachedFile {
  id?: string;
  name: string;
  url: string;
  size: number;
  type: string;
  progress?: number;
  uploading?: boolean;
}

interface AttachmentUploadProps {
  files: AttachedFile[];
  onChange: (files: AttachedFile[]) => void;
}

/**
 * AttachmentUpload
 *
 * Renders the Drag & Drop upload container.
 */
export default function AttachmentUpload({ files, onChange }: AttachmentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFileToSupabase = async (file: File) => {
    const fileId = Math.random().toString(36).substring(7);
    const filePath = `announcements/${fileId}_${file.name}`;

    // Add placeholder file in loading state
    const tempFile: AttachedFile = {
      id: fileId,
      name: file.name,
      url: '',
      size: file.size,
      type: file.type,
      uploading: true,
      progress: 10
    };

    onChange([...files, tempFile]);

    try {
      // 1. Upload to Supabase Storage bucket 'announcements'
      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data } = supabase.storage.from('announcements').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // 3. Update parent with the completed file object
      onChange(files.map(f => f.id === fileId ? {
        ...f,
        url: publicUrl,
        uploading: false,
        progress: 100
      } : f).concat({
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type
      }).filter(f => f.id !== fileId)); // Filter out the temporary placeholder

    } catch (err) {
      console.error('Failed to upload file:', err);
      alert(`Error uploading file "${file.name}": Please run Supabase SQL migration to create the announcements storage bucket.`);
      // Remove temporary file on failure
      onChange(files.filter(f => f.id !== fileId));
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => {
      uploadFileToSupabase(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(file => {
      uploadFileToSupabase(file);
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    onChange(updated);
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <FileText size={18} className={styles.fileIcon} />;
    if (type.includes('video')) return <Film size={18} className={styles.fileIcon} />;
    return <File size={18} className={styles.fileIcon} />;
  };

  return (
    <div className={styles.uploadContainer}>
      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={24} className={styles.dropzoneIcon} />
        <div className={styles.dropzoneText}>Drag & drop attachments here</div>
        <div className={styles.dropzoneSubtext}>Supports PDF, DOCX, XLSX, JPG, PNG, WEBP (Max 10MB)</div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file, idx) => (
            <div key={idx} className={styles.fileItem}>
              <div className={styles.fileMeta}>
                {getFileIcon(file.type)}
                <div className={styles.fileDetails}>
                  <span className={styles.fileName} title={file.name}>{file.name}</span>
                  <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                  {file.uploading && (
                    <div className={styles.progressContainer}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${file.progress || 20}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className={styles.removeBtn}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
