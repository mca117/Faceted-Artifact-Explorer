import { X } from "lucide-react";

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

export default function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center">
      {label}
      <button 
        className="ml-1 text-primary-500 hover:text-primary-700"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
