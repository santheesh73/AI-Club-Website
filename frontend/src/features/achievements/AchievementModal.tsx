import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { communityApi } from '@/services/communityApi';
import type {
  AchievementDto,
  AchievementCategoryRecord,
  CreateAchievementInput,
  UpdateAchievementInput,
} from '@/types/community';
import { AlertCircle } from 'lucide-react';

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement?: AchievementDto | null;
  categories: AchievementCategoryRecord[];
  onSaved: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({
  isOpen,
  onClose,
  achievement,
  categories,
  onSaved,
}) => {
  const isEditing = Boolean(achievement);

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [credentialId, setCredentialId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (achievement) {
      setCategoryId(achievement.category.id);
      setTitle(achievement.title);
      setDescription(achievement.description);
      setIssuer(achievement.issuer);
      setIssuedAt(achievement.issuedAt);
      setCredentialUrl(achievement.credentialUrl || '');
      setCredentialId(achievement.credentialId || '');
    } else {
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setTitle('');
      setDescription('');
      setIssuer('');
      setIssuedAt(new Date().toISOString().split('T')[0]);
      setCredentialUrl('');
      setCredentialId('');
    }
    setError(null);
  }, [achievement, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !title.trim() || !description.trim() || !issuer.trim() || !issuedAt) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && achievement) {
        const updatePayload: UpdateAchievementInput = {
          categoryId,
          title: title.trim(),
          description: description.trim(),
          issuer: issuer.trim(),
          issuedAt,
          credentialUrl: credentialUrl.trim() || null,
          credentialId: credentialId.trim() || null,
        };

        const res = await communityApi.updateAchievement(achievement.id, updatePayload);
        if (res.success) {
          onSaved();
          onClose();
        } else {
          setError(res.error?.message || 'Failed to update achievement');
        }
      } else {
        const createPayload: CreateAchievementInput = {
          categoryId,
          title: title.trim(),
          description: description.trim(),
          issuer: issuer.trim(),
          issuedAt,
          credentialUrl: credentialUrl.trim() || null,
          credentialId: credentialId.trim() || null,
        };

        const res = await communityApi.createAchievement(createPayload);
        if (res.success) {
          onSaved();
          onClose();
        } else {
          setError(res.error?.message || 'Failed to add achievement');
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Achievement / Credential' : 'Add Achievement or Credential'}
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-card bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Title / Award Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AWS Certified Solutions Architect - Associate"
              className="w-full px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Issuing Organization
              </label>
              <input
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g. Amazon Web Services"
                className="w-full px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Issued Date
              </label>
              <input
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Description & Highlights
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summarize the scope, criteria, or notable milestones accomplished..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Credential URL (Optional)
              </label>
              <input
                type="url"
                value={credentialUrl}
                onChange={(e) => setCredentialUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Credential ID / Badge ID (Optional)
              </label>
              <input
                type="text"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                placeholder="e.g. CERT-839210"
                className="w-full px-3 py-2 text-sm bg-surface rounded-card border border-surface-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Achievement'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
