import { useState } from 'react';
import { Plus, Edit2, Trash2, FolderOpen, Save, X, Loader2, Tag } from 'lucide-react';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import { useTags, useCreateTag, useDeleteTag } from '../hooks/useTags';

export default function ProjectsPage() {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  const [showTagForm, setShowTagForm] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#6366f1');

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tags, isLoading: tagsLoading } = useTags();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    await createProject.mutateAsync({ name: projectName, description: projectDesc });
    setProjectName('');
    setProjectDesc('');
    setShowProjectForm(false);
  };

  const handleUpdateProject = async (id: number) => {
    if (!projectName.trim()) return;
    await updateProject.mutateAsync({ id, data: { name: projectName, description: projectDesc } });
    setProjectName('');
    setProjectDesc('');
    setEditingProject(null);
  };

  const handleDeleteProject = async (id: number) => {
    if (confirm('このプロジェクトを削除しますか？')) {
      await deleteProject.mutateAsync(id);
    }
  };

  const handleCreateTag = async () => {
    if (!tagName.trim()) return;
    await createTag.mutateAsync({ name: tagName, color: tagColor });
    setTagName('');
    setTagColor('#6366f1');
    setShowTagForm(false);
  };

  const handleDeleteTag = async (id: number) => {
    if (confirm('このタグを削除しますか？')) {
      await deleteTag.mutateAsync(id);
    }
  };

  const startEditProject = (project: { id: number; name: string; description: string | null }) => {
    setEditingProject(project.id);
    setProjectName(project.name);
    setProjectDesc(project.description || '');
  };

  const colorOptions = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  ];

  return (
    <div className="space-y-8">
      {/* Projects Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <FolderOpen size={24} />
            <span>プロジェクト</span>
          </h2>
          <button
            onClick={() => setShowProjectForm(true)}
            className="btn-primary flex items-center space-x-1"
          >
            <Plus size={18} />
            <span>新規作成</span>
          </button>
        </div>

        {/* New project form */}
        {showProjectForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-medium mb-3">新規プロジェクト</h3>
            <div className="space-y-3">
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="プロジェクト名"
                className="input-field"
              />
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="説明（オプション）"
                rows={2}
                className="input-field"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateProject}
                  disabled={createProject.isPending}
                  className="btn-primary flex items-center space-x-1"
                >
                  {createProject.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>作成</span>
                </button>
                <button
                  onClick={() => {
                    setShowProjectForm(false);
                    setProjectName('');
                    setProjectDesc('');
                  }}
                  className="btn-secondary flex items-center space-x-1"
                >
                  <X size={16} />
                  <span>キャンセル</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects list */}
        {projectsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="bg-white rounded-lg shadow divide-y">
            {projects.map((project) => (
              <div key={project.id} className="p-4">
                {editingProject === project.id ? (
                  <div className="space-y-3">
                    <input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="input-field"
                    />
                    <textarea
                      value={projectDesc}
                      onChange={(e) => setProjectDesc(e.target.value)}
                      rows={2}
                      className="input-field"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateProject(project.id)}
                        disabled={updateProject.isPending}
                        className="btn-primary flex items-center space-x-1"
                      >
                        <Save size={16} />
                        <span>保存</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingProject(null);
                          setProjectName('');
                          setProjectDesc('');
                        }}
                        className="btn-secondary flex items-center space-x-1"
                      >
                        <X size={16} />
                        <span>キャンセル</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-500">{project.description}</p>
                      )}
                      <p className="text-xs text-indigo-600 mt-1">
                        {project.scan_count || 0} スキャン
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditProject(project)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            プロジェクトがありません
          </div>
        )}
      </section>

      {/* Tags Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Tag size={24} />
            <span>タグ</span>
          </h2>
          <button
            onClick={() => setShowTagForm(true)}
            className="btn-primary flex items-center space-x-1"
          >
            <Plus size={18} />
            <span>新規作成</span>
          </button>
        </div>

        {/* New tag form */}
        {showTagForm && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-medium mb-3">新規タグ</h3>
            <div className="space-y-3">
              <input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="タグ名"
                className="input-field"
              />
              <div>
                <label className="block text-sm text-gray-600 mb-2">色</label>
                <div className="flex space-x-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setTagColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        tagColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateTag}
                  disabled={createTag.isPending}
                  className="btn-primary flex items-center space-x-1"
                >
                  {createTag.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>作成</span>
                </button>
                <button
                  onClick={() => {
                    setShowTagForm(false);
                    setTagName('');
                    setTagColor('#6366f1');
                  }}
                  className="btn-secondary flex items-center space-x-1"
                >
                  <X size={16} />
                  <span>キャンセル</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tags list */}
        {tagsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
          </div>
        ) : tags && tags.length > 0 ? (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center space-x-2 px-3 py-2 rounded-full text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-xs opacity-75">({tag.usage_count || 0})</span>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            タグがありません
          </div>
        )}
      </section>
    </div>
  );
}
