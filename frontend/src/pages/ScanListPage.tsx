import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, FileBox } from 'lucide-react';
import { useScans } from '../hooks/useScans';
import ScanCard from '../components/ScanCard';
import FilterPanel from '../components/FilterPanel';

export default function ScanListPage() {
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useScans({
    search: search || undefined,
    project_id: projectId || undefined,
    limit,
    offset: page * limit,
  });

  // Filter by tags on client side (since API doesn't support tag filtering yet)
  const filteredScans = useMemo(() => {
    if (!data?.data) return [];
    if (selectedTags.length === 0) return data.data;

    return data.data.filter((scan) =>
      selectedTags.every((tagId) => scan.tags?.some((t) => t.id === tagId))
    );
  }, [data?.data, selectedTags]);

  const totalPages = data ? Math.ceil(data.pagination.total / limit) : 0;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        データの読み込みに失敗しました: {error.message}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">スキャン一覧</h1>
        <Link to="/upload" className="btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>アップロード</span>
        </Link>
      </div>

      {/* Filter */}
      <FilterPanel
        search={search}
        onSearchChange={setSearch}
        projectId={projectId}
        onProjectChange={setProjectId}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
      />

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredScans.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileBox size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            スキャンデータがありません
          </h3>
          <p className="text-gray-500 mb-4">
            3Dスキャンファイルをアップロードして管理を開始しましょう
          </p>
          <Link to="/upload" className="btn-primary inline-flex items-center space-x-2">
            <Plus size={20} />
            <span>最初のスキャンをアップロード</span>
          </Link>
        </div>
      )}

      {/* Grid */}
      {!isLoading && filteredScans.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredScans.map((scan) => (
              <ScanCard key={scan.id} scan={scan} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                前へ
              </button>
              <span className="text-gray-600">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
