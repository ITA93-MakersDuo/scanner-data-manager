import { Link } from 'react-router-dom';
import { Calendar, HardDrive, Box, Trash2 } from 'lucide-react';
import { Scan } from '../api/client';

interface ScanCardProps {
  scan: Scan;
  onDelete?: (id: number, name: string) => void;
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

const formatColors: Record<string, { bg: string; text: string }> = {
  STL: { bg: 'bg-blue-100', text: 'text-blue-700' },
  PLY: { bg: 'bg-green-100', text: 'text-green-700' },
  OBJ: { bg: 'bg-purple-100', text: 'text-purple-700' },
  STEP: { bg: 'bg-orange-100', text: 'text-orange-700' },
  STP: { bg: 'bg-orange-100', text: 'text-orange-700' },
  IGES: { bg: 'bg-red-100', text: 'text-red-700' },
  IGS: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function ScanCard({ scan, onDelete }: ScanCardProps) {
  const colors = formatColors[scan.file_format] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  const hasThumbnail = !!scan.thumbnail_path;

  return (
    <div className="scan-card relative hover:scale-[1.02] transition-transform">
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(scan.id, scan.object_name);
          }}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white rounded-full shadow-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="削除"
        >
          <Trash2 size={16} />
        </button>
      )}
      <Link
        to={`/scans/${scan.id}`}
        className="block p-4"
      >
      {/* Thumbnail */}
      <div className={`rounded-lg h-40 flex items-center justify-center mb-4 overflow-hidden ${hasThumbnail ? 'bg-gray-100' : colors.bg}`}>
        {hasThumbnail ? (
          <img
            src={`/api/v1/scans/${scan.id}/thumbnail`}
            alt={scan.object_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.classList.add(colors.bg);
              (e.target as HTMLImageElement).parentElement!.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full">
                  <span class="text-4xl ${colors.text} font-bold">${scan.file_format}</span>
                </div>
              `;
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Box size={40} className={colors.text} style={{ opacity: 0.5 }} />
            <span className={`mt-1 text-lg font-bold ${colors.text}`}>{scan.file_format}</span>
          </div>
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
    </div>
  );
}
