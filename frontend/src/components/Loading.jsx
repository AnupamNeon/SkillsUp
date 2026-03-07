import { Loader2 } from 'lucide-react';

export default function Loading({ text = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-24 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl animate-pulse" />
        <div className="relative rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-400">{text}</p>
    </div>
  );
}