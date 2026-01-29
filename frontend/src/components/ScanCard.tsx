import { Link } from 'react-router-dom';
import { FileBox, Calendar, HardDrive } from 'lucide-react';
import { Scan } from '../api/client';

interface ScanCardProps {
  scan: Scan;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ja-JP');
}

export default function ScanCard({ scan }: ScanCardProps) {
  return (
    <Link
      to={`/scans/${scan.id}`}
      className="scan-card block p-4 hover:scale-[1.02] transition-transform"
    >
      {/* Thumbnail placeholder */}
      <div className="bg-gray-200 rounded-lg h-40 flex items-center justify-center mb-4">
        <FileBox size={48} className="text-gray-400" />
      </div>

      {/* Content */}
      <h3 className="font-semibold text-lg text-gray-900 truncate mb-2">
        {scan.object_name}
      </h3>

      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
            {scan.file_format}
          </span>
          <span className="flex items-center">
            <HardDrive size={14} className="mr-1" />
            {formatFileSize(scan.file_size)}
          </span>
        </div>

        {scan.scan_date && (
          <div className="flex items-center">
            <Calendar size={14} className="mr-1" />
            {formatDate(scan.scan_date)}
          </div>
        )}

        {scan.project_name && (
          <div className="text-indigo-600 truncate">
            {scan.project_name}
          </div>
        )}
      </div>

      {/* Tags */}
      {scan.tags && scan.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {scan.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {scan.tags.length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
              +{scan.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
