import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Trash2, Edit2, Save, X, Calendar,
  HardDrive, User, Clock, FolderOpen, Loader2
} from 'lucide-react';
import { useScan, useUpdateScan, useDeleteScan } from '../hooks/useScans';
import { useProjects } from '../hooks/useProjects';
import { useTags } from '../hooks/useTags';
import { api } from '../api/client';
import ThreeViewer from '../components/ThreeViewer';

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

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ja-JP');
}

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const { data: scan, isLoading, error } = useScan(Number(id));
  const { data: projects } = useProjects();
  const { data: tags } = useTags();
  const updateScan = useUpdateScan();
  const deleteScan = useDeleteScan();

  useEffect(() => {
    if (scan?.id) {
      api.scans.getFileUrl(scan.id).then(setFileUrl).catch(console.error);
    }
  }, [scan?.id]);

  const startEdit = () => {
    if (scan) {
      setEditData({
        object_name: scan.object_name,
        scan_date: scan.scan_date || '',
        notes: scan.notes || '',
        scanner_model: scan.scanner_model || '',
        resolution: scan.resolution || '',
        accuracy: scan.accuracy || '',
        project_id: scan.project_id || '',
        created_by: scan.created_by || '',
      });
      setSelectedTags(scan.tags?.map(t => t.id) || []);
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const saveEdit = async () => {
    try {
      await updateScan.mutateAsync({
        id: Number(id),
        data: {
          ...editData,
          project_id: editData.project_id ? Number(editData.project_id) : null,
          tags: selectedTags,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteScan.mutateAsync(Number(id));
      navigate('/');
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        スキャンデータが見つかりませんでした
      </div>
    );
  }

  const canView3D = ['STL', 'PLY', 'OBJ'].includes(scan.file_format);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{scan.object_name}</h1>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button onClick={cancelEdit} className="btn-secondary flex items-center space-x-1">
                <X size={18} />
                <span>キャンセル</span>
              </button>
              <button
                onClick={saveEdit}
                disabled={updateScan.isPending}
                className="btn-primary flex items-center space-x-1"
              >
                <Save size={18} />
                <span>保存</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={startEdit} className="btn-secondary flex items-center space-x-1">
                <Edit2 size={18} />
                <span>編集</span>
              </button>
              <a
                href={api.scans.getDownloadUrl(scan.id)}
                className="btn-primary flex items-center space-x-1"
              >
                <Download size={18} />
                <span>ダウンロード</span>
              </a>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3D Viewer or placeholder */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {canView3D && fileUrl ? (
            <ThreeViewer
              fileUrl={fileUrl}
              fileFormat={scan.file_format}
            />
          ) : canView3D && !fileUrl ? (
            <div className="h-96 flex items-center justify-center bg-gray-100">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">{scan.file_format} ファイル</p>
                <p className="text-sm">このフォーマットは3Dプレビューに対応していません</p>
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">詳細情報</h2>

          <div className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    オブジェクト名
                  </label>
                  <input
                    value={editData.object_name}
                    onChange={(e) => setEditData({ ...editData, object_name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      スキャン日
                    </label>
                    <input
                      type="date"
                      value={editData.scan_date}
                      onChange={(e) => setEditData({ ...editData, scan_date: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      プロジェクト
                    </label>
                    <select
                      value={editData.project_id}
                      onChange={(e) => setEditData({ ...editData, project_id: e.target.value })}
                      className="input-field"
                    >
                      <option value="">選択なし</option>
                      {projects?.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メモ
                  </label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    rows={3}
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      スキャナー
                    </label>
                    <input
                      value={editData.scanner_model}
                      onChange={(e) => setEditData({ ...editData, scanner_model: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      解像度
                    </label>
                    <input
                      value={editData.resolution}
                      onChange={(e) => setEditData({ ...editData, resolution: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      精度
                    </label>
                    <input
                      value={editData.accuracy}
                      onChange={(e) => setEditData({ ...editData, accuracy: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    作成者
                  </label>
                  <input
                    value={editData.created_by}
                    onChange={(e) => setEditData({ ...editData, created_by: e.target.value })}
                    className="input-field"
                  />
                </div>
                {tags && tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      タグ
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTags(selectedTags.filter((t) => t !== tag.id));
                              } else {
                                setSelectedTags([...selectedTags, tag.id]);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'ring-2 ring-offset-2 ring-indigo-500'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: tag.color, color: 'white' }}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <HardDrive size={16} />
                    <span>ファイル:</span>
                  </div>
                  <div className="font-medium">
                    {scan.filename} ({formatFileSize(scan.file_size)})
                  </div>

                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                      形式
                    </span>
                  </div>
                  <div className="font-medium">{scan.file_format}</div>

                  {scan.scan_date && (
                    <>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar size={16} />
                        <span>スキャン日:</span>
                      </div>
                      <div className="font-medium">{formatDate(scan.scan_date)}</div>
                    </>
                  )}

                  {scan.project_name && (
                    <>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <FolderOpen size={16} />
                        <span>プロジェクト:</span>
                      </div>
                      <div className="font-medium text-indigo-600">{scan.project_name}</div>
                    </>
                  )}

                  {scan.scanner_model && (
                    <>
                      <div className="text-gray-600">スキャナー:</div>
                      <div className="font-medium">{scan.scanner_model}</div>
                    </>
                  )}

                  {scan.resolution && (
                    <>
                      <div className="text-gray-600">解像度:</div>
                      <div className="font-medium">{scan.resolution}</div>
                    </>
                  )}

                  {scan.accuracy && (
                    <>
                      <div className="text-gray-600">精度:</div>
                      <div className="font-medium">{scan.accuracy}</div>
                    </>
                  )}

                  {scan.created_by && (
                    <>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <User size={16} />
                        <span>作成者:</span>
                      </div>
                      <div className="font-medium">{scan.created_by}</div>
                    </>
                  )}

                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock size={16} />
                    <span>登録日時:</span>
                  </div>
                  <div className="font-medium">{formatDateTime(scan.created_at)}</div>
                </div>

                {scan.notes && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">メモ</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{scan.notes}</p>
                  </div>
                )}

                {scan.tags && scan.tags.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">タグ</h3>
                    <div className="flex flex-wrap gap-2">
                      {scan.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Version history */}
      {scan.versions && scan.versions.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">バージョン履歴</h2>
          <div className="space-y-2">
            {scan.versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-medium">v{version.version_number}</span>
                  {version.change_notes && (
                    <span className="text-gray-600 ml-2">- {version.change_notes}</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDateTime(version.created_at)} / {formatFileSize(version.file_size)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">スキャンを削除しますか？</h3>
            <p className="text-gray-600 mb-4">
              この操作は取り消せません。スキャンファイルとすべての関連データが削除されます。
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteScan.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                {deleteScan.isPending ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
