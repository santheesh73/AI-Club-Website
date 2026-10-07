import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { communityApi } from '@/services/communityApi';
import type {
  ProjectCategoryRecord,
  TechnologyRecord,
  ProjectLinkRecord,
  ProjectMediaRecord,
  ContributorDto,
  ProjectVisibility,
  ProjectLinkType,
  ProjectMediaType,
} from '@/types/community';

interface UseProjectEditorProps {
  projectId?: string; // If provided, edit mode; otherwise, create mode
}

export function useProjectEditor({ projectId }: UseProjectEditorProps = {}) {
  const navigate = useNavigate();
  const isEditMode = Boolean(projectId);

  const [categories, setCategories] = useState<ProjectCategoryRecord[]>([]);
  const [technologies, setTechnologies] = useState<TechnologyRecord[]>([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [visibility, setVisibility] = useState<ProjectVisibility>('public');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);

  // Sub-resources (for edit mode)
  const [links, setLinks] = useState<ProjectLinkRecord[]>([]);
  const [media, setMedia] = useState<ProjectMediaRecord[]>([]);
  const [contributors, setContributors] = useState<ContributorDto[]>([]);

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, techRes] = await Promise.all([
        communityApi.getCategories(),
        communityApi.getTechnologies(),
      ]);

      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
        if (!isEditMode && catRes.data.length > 0) {
          setCategoryId(catRes.data[0].id);
        }
      }
      if (techRes.success && techRes.data) {
        setTechnologies(techRes.data);
      }

      // If in edit mode, fetch the project detail
      if (projectId) {
        const projRes = await communityApi.getProjectDetail(projectId);
        if (projRes.success) {
          const p = projRes.data;
          setTitle(p.title);
          setSlug(p.slug);
          setShortDescription(p.shortDescription);
          setDescription(p.description);
          setCategoryId(p.category.id);
          setVisibility(p.visibility);
          setCoverImageUrl(p.coverImageUrl || '');
          setSelectedTechIds(p.technologies.map((t) => t.id));
          setLinks(p.links || []);
          setMedia(p.media || []);
          setContributors(p.contributors || []);
        } else {
          setError(projRes.error.message || 'Project not found');
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load project editor data');
    } finally {
      setLoading(false);
    }
  }, [projectId, isEditMode]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Technology toggle
  const toggleTechnology = (techId: string) => {
    setSelectedTechIds((prev) =>
      prev.includes(techId) ? prev.filter((id) => id !== techId) : [...prev, techId]
    );
  };

  // Save Project (Create or Update)
  const saveProject = async (andPublish = false) => {
    if (!title.trim() || !shortDescription.trim() || !description.trim() || !categoryId) {
      setError('Please fill in all required fields (title, short description, details, and category).');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditMode && projectId) {
        // Update project
        const updateRes = await communityApi.updateProject(projectId, {
          title: title.trim(),
          slug: slug.trim() || undefined,
          shortDescription: shortDescription.trim(),
          description: description.trim(),
          categoryId,
          visibility,
          coverImageUrl: coverImageUrl.trim() || null,
          technologyIds: selectedTechIds,
        });

        if (!updateRes.success) {
          setError(updateRes.error?.message || 'Failed to update project');
          setSaving(false);
          return;
        }

        if (andPublish) {
          await communityApi.publishProject(projectId);
        }

        navigate('/member/projects');
      } else {
        // Create project
        const createRes = await communityApi.createProject({
          title: title.trim(),
          slug: slug.trim() || undefined,
          shortDescription: shortDescription.trim(),
          description: description.trim(),
          categoryId,
          visibility,
          coverImageUrl: coverImageUrl.trim() || null,
          technologyIds: selectedTechIds,
        });

        if (!createRes.success) {
          setError(createRes.error.message || 'Failed to create project');
          setSaving(false);
          return;
        }

        const newId = createRes.data.id;
        if (andPublish) {
          await communityApi.publishProject(newId);
        }

        navigate('/member/projects');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to save project. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  // Link sub-actions (available in edit mode)
  const addLink = async (label: string, url: string, linkType: ProjectLinkType) => {
    if (!projectId) return false;
    try {
      const res = await communityApi.addLink(projectId, { label, url, linkType });
      if (res.success && res.data) {
        setLinks((prev) => [...prev, res.data!]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!projectId) return false;
    try {
      const res = await communityApi.deleteLink(projectId, linkId);
      if (res.success) {
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Media sub-actions (available in edit mode)
  const addMedia = async (mediaUrl: string, mediaType: ProjectMediaType = 'image', altText?: string) => {
    if (!projectId) return false;
    try {
      const res = await communityApi.addMedia(projectId, { mediaUrl, mediaType, altText });
      if (res.success && res.data) {
        setMedia((prev) => [...prev, res.data!]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteMedia = async (mediaId: string) => {
    if (!projectId) return false;
    try {
      const res = await communityApi.deleteMedia(projectId, mediaId);
      if (res.success) {
        setMedia((prev) => prev.filter((m) => m.id !== mediaId));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Contributor sub-actions (available in edit mode)
  const addContributor = async (userId: string, role = 'Contributor') => {
    if (!projectId) return false;
    try {
      const res = await communityApi.addContributor(projectId, { userId, role });
      if (res.success && res.data) {
        setContributors(res.data.contributors);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const removeContributor = async (userId: string) => {
    if (!projectId) return false;
    try {
      const res = await communityApi.removeContributor(projectId, userId);
      if (res.success && res.data) {
        setContributors(res.data.contributors);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return {
    isEditMode,
    categories,
    technologies,
    // Fields
    title,
    setTitle,
    slug,
    setSlug,
    shortDescription,
    setShortDescription,
    description,
    setDescription,
    categoryId,
    setCategoryId,
    visibility,
    setVisibility,
    coverImageUrl,
    setCoverImageUrl,
    selectedTechIds,
    toggleTechnology,
    // Sub-resources
    links,
    addLink,
    deleteLink,
    media,
    addMedia,
    deleteMedia,
    contributors,
    addContributor,
    removeContributor,
    // Operations
    loading,
    saving,
    error,
    saveProject,
  };
}
