import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { Upload, FileBox, X, Loader2, CheckCircle } from 'lucide-react';
import { useCreateScan } from '../hooks/useScans';
import { useProjects } from '../hooks/useProjects';
import { useTags } from '../hooks/useTags';

interface FormData {
  object_name: string;
  scan_date: string;
  notes: string;
  scanner_model: string;
  resolution: string;
  accuracy: string;
  project_id: string;
  created_by: string;
}

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const createScan = useCreateScan();
  const { data: projects } = useProjects();
  const { data: tags } = useTags();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'model/stl': ['.stl'],
      'application/ply': ['.ply'],
      'model/step': ['.step', '.stp'],
      'model/iges': ['.iges', '.igs'],
      'model/obj': ['.obj'],
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const onSubmit = async (data: FormData) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('object_name', data.object_name || file.name.replace(/\.[^/.]+$/, ''));
    if (data.scan_date) formData.append('scan_date', data.scan_date);
    if (data.notes) formData.append('notes', data.notes);
    if (data.scanner_model) formData.append('scanner_model', data.scanner_model);
    if (data.resolution) formData.append('resolution', data.resolution);
    if (data.accuracy) formData.append('accuracy', data.accuracy);
    if (data.project_id) formData.append('project_id', data.project_id);
    if (data.created_by) formData.append('created_by', data.created_by);
    if (selectedTags.length > 0) formData.append('tags', JSON.stringify(selectedTags));

    try {
      const result = await createScan.mutateAsync(formData);
      setUploadSuccess(true);
      setTimeout(() => {
        navigate(`/scans/${result.id}`);
      }, 1500);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            アップロード完了
          </h2>
          <p className="text-gray-600">
            スキャンデータが正常にアップロードされました
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">スキャンをアップロード</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* File drop zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : file
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center space-x-3">
              <FileBox size={32} className="text-green-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                ファイルをドラッグ&ドロップ、またはクリックして選択
              </p>
              <p className="text-sm text-gray-400">
                対応形式: STL, PLY, STEP, IGES, OBJ (最大500MB)
              </p>
            </>
          )}
        </div>

        {/* Form fields */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              オブジェクト名 *
            </label>
            <input
              {...register('object_name', { required: 'オブジェクト名は必須です' })}
              className="input-field"
              placeholder="スキャンしたオブジェクトの名前"
            />
            {errors.object_name && (
              <p className="text-red-500 text-sm mt-1">{errors.object_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                スキャン日
              </label>
              <input
                type="date"
                {...register('scan_date')}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プロジェクト
              </label>
              <select {...register('project_id')} className="input-field">
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
              {...register('notes')}
              rows={3}
              className="input-field"
              placeholder="スキャンに関するメモ"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                スキャナーモデル
              </label>
              <input
                {...register('scanner_model')}
                className="input-field"
                placeholder="例: EinScan Pro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                解像度
              </label>
              <input
                {...register('resolution')}
                className="input-field"
                placeholder="例: 0.1mm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                精度
              </label>
              <input
                {...register('accuracy')}
                className="input-field"
                placeholder="例: ±0.05mm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作成者
            </label>
            <input
              {...register('created_by')}
              className="input-field"
              placeholder="あなたの名前"
            />
          </div>

          {/* Tags */}
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
                          setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                        } else {
                          setSelectedTags([...selectedTags, tag.id]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-indigo-500'
                          : 'opacity-60 hover:opacity-100'
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

        {/* Submit */}
        <button
          type="submit"
          disabled={!file || createScan.isPending}
          className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createScan.isPending ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>アップロード中...</span>
            </>
          ) : (
            <>
              <Upload size={20} />
              <span>アップロード</span>
            </>
          )}
        </button>

        {createScan.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            アップロードに失敗しました: {createScan.error.message}
          </div>
        )}
      </form>
    </div>
  );
}
