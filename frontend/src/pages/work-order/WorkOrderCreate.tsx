import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { workOrderService } from '@/services/api';
import type { WorkOrderType, WorkOrderPriority, AttachmentVO } from '@/types/workOrder';
import { TYPE_CONFIG } from '@/types/workOrder';

export default function WorkOrderCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<WorkOrderType>('INTERVIEW_FAULT');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<WorkOrderPriority>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentVO[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tempOrderId, setTempOrderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = '标题不能为空';
    else if (title.length > 100) errs.title = '标题不能超过100字符';
    if (!description.trim()) errs.description = '描述不能为空';
    else if (description.length < 10) errs.description = '描述至少10个字符';
    else if (description.length > 5000) errs.description = '描述不能超过5000字符';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileUpload = async (file: File) => {
    // First create a draft to attach files to
    let orderId = tempOrderId;
    if (!orderId) {
      try {
        const res = await workOrderService.create({
          title: title || '草稿',
          type,
          description: description || '草稿工单（待完善）',
          priority: 'MEDIUM',
        });
        orderId = res.data.data.id;
        setTempOrderId(orderId);
      } catch {
        return;
      }
    }

    setUploading(true);
    try {
      const res = await workOrderService.uploadAttachment(orderId, file);
      setAttachments((prev) => [...prev, res.data.data]);
    } catch {
      // handled by interceptor
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = async (attId: string) => {
    if (!tempOrderId) return;
    try {
      await workOrderService.deleteAttachment(tempOrderId, attId);
      setAttachments((prev) => prev.filter((a) => a.id !== attId));
    } catch {
      // handled by interceptor
    }
  };

  const handleSubmit = async (submitNow: boolean) => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      let orderId = tempOrderId;

      if (orderId) {
        // Update draft
        await workOrderService.update(orderId, { title, type, description, priority });
      } else {
        // Create new
        const res = await workOrderService.create({ title, type, description, priority });
        orderId = res.data.data.id;
      }

      if (submitNow) {
        // Submit: DRAFT → PENDING
        await workOrderService.submit(orderId);
      }

      navigate(`/work-orders/${orderId}`);
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions: { value: WorkOrderType; label: string }[] = [
    { value: 'INTERVIEW_FAULT', label: '面试故障' },
    { value: 'FEATURE_SUGGESTION', label: '功能建议' },
    { value: 'BUG_REPORT', label: 'BUG上报' },
  ];

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/work-orders')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">创建工单</h1>
          <p className="text-sm text-slate-500 mt-1">描述您遇到的问题或建议，我们会尽快处理</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            工单标题 <span className="text-red-400">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="简要描述问题，如：视频面试画面卡顿"
            maxLength={100}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
              ${errors.title ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400'}`}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            问题类型 <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            {typeOptions.map((opt) => {
              const cfg = TYPE_CONFIG[opt.value];
              return (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${type === opt.value
                      ? `${cfg.color} ring-2 ring-offset-1 ring-current/20`
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">优先级</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600
                       focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400"
          >
            <option value="LOW">低</option>
            <option value="MEDIUM">中</option>
            <option value="HIGH">高</option>
            <option value="URGENT">紧急</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            详细描述 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请详细描述问题的复现步骤、期望结果、实际结果等..."
            rows={6}
            maxLength={5000}
            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-all
              ${errors.description ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400'}`}
          />
          <div className="flex items-center justify-between mt-1">
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            <span className="text-xs text-slate-400 ml-auto">{description.length}/5000</span>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            附件 <span className="text-xs text-slate-400 font-normal">（截图或视频，可选）</span>
          </label>

          {/* Upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
              ${uploading ? 'border-accent-300 bg-accent-50/50' : 'border-slate-200 hover:border-accent-300 hover:bg-slate-50'}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-500">上传中...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-slate-300">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm text-slate-500">点击或拖拽上传文件</span>
                <span className="text-xs text-slate-400">支持 JPG/PNG/GIF/WebP（最大10MB）和 MP4/WebM（最大100MB）</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,video/mp4,video/webm,video/ogg,video/quicktime"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>

          {/* Attachment list */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2">
                  {/* Preview icon */}
                  {att.fileType === 'IMAGE' && att.thumbnailUrl ? (
                    <img src={att.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-lg">
                      {att.fileType === 'VIDEO' ? '🎬' : '📎'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{att.fileName}</p>
                    <p className="text-xs text-slate-400">{formatSize(att.fileSize)}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600
                       hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            保存草稿
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-accent-600 text-white text-sm font-medium
                       hover:bg-accent-700 disabled:opacity-50 transition-all shadow-button active:scale-95"
          >
            {submitting ? '提交中...' : '提交工单'}
          </button>
          <button
            onClick={() => navigate('/work-orders')}
            className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors ml-auto"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
