'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Upload,
  Link as LinkIcon,
  Sparkles,
  X,
  Check,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SERVICE_IMAGE_PRESETS, type ServiceImagePreset } from '@/lib/validations/service';
import { cn } from '@/lib/utils';

interface ServiceImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ServiceImagePicker({ value, onChange, className }: ServiceImagePickerProps) {
  const [activeTab, setActiveTab] = React.useState<'presets' | 'upload' | 'url'>('presets');
  const [urlInput, setUrlInput] = React.useState(value && !value.startsWith('data:') ? value : '');
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSelectPreset = (preset: ServiceImagePreset) => {
    onChange(preset.url);
    setImageError(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    // 3MB limit for base64 upload
    const MAX_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError('Image file size must be less than 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
        setImageError(false);
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read image file. Please try another.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      onChange('');
      return;
    }
    onChange(urlInput.trim());
    setImageError(false);
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setFileError(null);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Selection / Preview Box */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-muted/20 p-4 transition-all">
        {value ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Active Service Cover Image
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Remove
              </Button>
            </div>

            <div className="relative h-44 w-full overflow-hidden rounded-xl border border-border/50 bg-background/50 shadow-inner">
              {/* Fallback if image fails to load */}
              {imageError ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                  <p className="text-xs">Failed to load preview for this image URL.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="h-7 text-xs"
                  >
                    Select Another
                  </Button>
                </div>
              ) : (
                <Image
                  src={value}
                  alt="Service preview"
                  fill
                  unoptimized
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">No service image selected</p>
              <p className="text-[11px] text-muted-foreground">
                Choose a campus preset below, upload a photo, or paste an external image URL.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs to choose image source */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'presets' | 'upload' | 'url')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 bg-muted/40">
          <TabsTrigger value="presets" className="text-xs gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Preset Gallery
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs gap-1.5">
            <LinkIcon className="h-3.5 w-3.5" />
            Web URL
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Presets Gallery */}
        <TabsContent value="presets" className="mt-3 space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Select a high-resolution campus photo matching your facility or service type:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-1">
            {SERVICE_IMAGE_PRESETS.map((preset) => {
              const isSelected = value === preset.url;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={cn(
                    'group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all hover:scale-[1.02]',
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                      : 'border-border/60 hover:border-indigo-500/50'
                  )}
                >
                  <div className="relative h-20 w-full overflow-hidden bg-muted">
                    <Image
                      src={preset.url}
                      alt={preset.label}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center">
                        <div className="rounded-full bg-white p-1 text-indigo-600 shadow">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-1.5 bg-card/90">
                    <p className="text-[10px] font-medium leading-tight truncate text-foreground">
                      {preset.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 2: File Upload */}
        <TabsContent value="upload" className="mt-3 space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/10 p-6 text-center transition-colors hover:border-indigo-500 hover:bg-indigo-500/5"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 mb-2">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              Click to browse or drop an image file
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Supports PNG, JPG, or WEBP (Max 3 MB)
            </p>
          </div>
          {fileError && (
            <p className="text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {fileError}
            </p>
          )}
        </TabsContent>

        {/* Tab 3: Direct Web URL */}
        <TabsContent value="url" className="mt-3 space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Paste a publicly accessible direct image URL (HTTPS):
          </p>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="text-xs"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleApplyUrl}
              className="text-xs shrink-0"
            >
              Apply URL
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
