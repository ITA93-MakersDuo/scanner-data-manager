import { Search, Filter, X } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useTags } from '../hooks/useTags';

interface FilterPanelProps {
  search: string;
  onSearchChange: (value: string) => void;
  projectId: number | null;
  onProjectChange: (id: number | null) => void;
  selectedTags: number[];
  onTagsChange: (tags: number[]) => void;
}

export default function FilterPanel({
  search,
  onSearchChange,
  projectId,
  onProjectChange,
  selectedTags,
  onTagsChange,
}: FilterPanelProps) {
  const { data: projects } = useProjects();
  const { data: tags } = useTags();

  const clearFilters = () => {
    onSearchChange('');
    onProjectChange(null);
    onTagsChange([]);
  };

  const hasFilters = search || projectId || selectedTags.length > 0;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="スキャン名で検索..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Project filter */}
        <div className="w-full md:w-48">
          <select
            value={projectId || ''}
            onChange={(e) => onProjectChange(e.target.value ? Number(e.target.value) : null)}
            className="input-field"
          >
            <option value="">すべてのプロジェクト</option>
            {projects?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
            <span>クリア</span>
          </button>
        )}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2 mb-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">タグでフィルター:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (isSelected) {
                      onTagsChange(selectedTags.filter((id) => id !== tag.id));
                    } else {
                      onTagsChange([...selectedTags, tag.id]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-indigo-500'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: tag.color,
                    color: 'white',
                  }}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
