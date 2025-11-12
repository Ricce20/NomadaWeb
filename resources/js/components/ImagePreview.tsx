import { useEffect, useState } from 'react';

interface ImagePreviewProps {
  files: FileList | null;
  onRemove: (index: number) => void;
}

export default function ImagePreview({ files, onRemove }: ImagePreviewProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }

    const newPreviews: string[] = [];
    const readers: FileReader[] = [];

    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        readers.push(reader);

        reader.onload = (e) => {
          newPreviews[index] = e.target?.result as string;
          if (newPreviews.filter(Boolean).length === files.length) {
            setPreviews([...newPreviews]);
          }
        };

        reader.readAsDataURL(file);
      }
    });

    return () => {
      readers.forEach((reader) => reader.abort());
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  if (!files || files.length === 0 || previews.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium mb-2">Vista previa:</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {previews.map((preview, index) => (
          <div key={index} className="relative group">
            <img
              src={preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-32 object-cover rounded border"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {files[index]?.name.slice(0, 15)}
              {files[index]?.name.length > 15 ? '...' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
