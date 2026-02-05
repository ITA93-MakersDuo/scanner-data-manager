import { Link } from 'react-router-dom';
import { Calendar, HardDrive, Box } from 'lucide-react';
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

const formatColors: Record<string, { bg: string; text: string; accent: string }> = {
  STL: { bg: 'bg-blue-100', text: 'text-blue-700', accent: 'text-blue-400' },
  PLY: { bg: 'bg-green-100', text: 'text-green-700', accent: 'text-green-400' },
  OBJ: { bg: 'bg-purple-100', text: 'text-purple-700', accent: 'text-purple-400' },
  STEP: { bg: 'bg-orange-100', text: 'text-orange-700', accent: 'text-orange-400' },
  STP: { bg: 'bg-orange-100', text: 'text-orange-700', accent: 'text-orange-400' },
  IGES: { bg: 'bg-red-100', text: 'text-red-700', accent: 'text-red-400' },
  IGS: { bg: 'bg-red-100', text: 'text-red-700', accent: 'text-red-400' },
};

export default function ScanCard({ scan }: ScanCardProps) {
  const colors = formatColors[scan.file_format] || { bg: 'bg-gray-100', text: 'text-gray-700', accent: 'text-gray-400' };

  return (
    <Link
      to={`/scans/${scan.id}`}
      className="scan-card block p-4 hover:scale-[1.02] transition-transform"
    >
      {/* Thumbnail with format-based color */}
      <div className={`${colors.bg} rounded-lg h-40 flex flex-col items-center justify-center mb-4 relative`}>
        <Box size={48} className={colors.accent} />
        <span className={`mt-2 text-lg font-bold ${colors.text}`}>
          {scan.file_format}
        </span>
        {['STL', 'PLY', 'OBJ'].includes(scan.file_format) && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/80 rounded text-xs text-gray-600">
            3Dプレビュー可
          </span>
        )}
      </div>

      {/* Content */}
      <h3 className="font-semibold text-lg text-gray-900 truncate mb-2">
        {scan.object_name}
      </h3>

      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 ${colors.bg} ${colors.text} rounded text-xs font-medium`}>
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
