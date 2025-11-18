import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface InlineEditCellProps {
  value: string | number;
  onSave: (value: string | number) => Promise<void>;
  type?: "text" | "number";
  min?: number;
  disabled?: boolean;
  className?: string;
}

export default function InlineEditCell({
  value,
  onSave,
  type = "text",
  min,
  disabled = false,
  className,
}: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      // Revertir al valor original en caso de error
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(type === "number" ? Number(e.target.value) : e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          min={min}
          disabled={isSaving}
          className={cn("h-8 w-24", className)}
        />
        {isSaving && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => !disabled && setIsEditing(true)}
      disabled={disabled}
      className={cn(
        "text-left hover:bg-muted px-2 py-1 rounded transition-colors",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {type === "number" && typeof value === "number" ? value.toFixed(2) : value}
    </button>
  );
}
