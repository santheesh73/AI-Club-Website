import React, { useState } from 'react';
import type { UserProfile } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

interface ProfileEditFormProps {
  profile: UserProfile;
  onSave: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ profile, onSave, onCancel }) => {
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [registerNumber, setRegisterNumber] = useState(profile.registerNumber || '');
  const [department, setDepartment] = useState(profile.department || '');
  const [year, setYear] = useState<string>(profile.year ? String(profile.year) : '');
  const [section, setSection] = useState(profile.section || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [skillsInput, setSkillsInput] = useState((profile.skills || []).join(', '));
  const [interestsInput, setInterestsInput] = useState((profile.interests || []).join(', '));
  const [githubUrl, setGithubUrl] = useState(profile.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolioUrl || '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isValidUrl = (urlStr: string) => {
    if (!urlStr.trim()) return true;
    try {
      const parsed = new URL(urlStr.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length > 100) {
      newErrors.fullName = 'Full name must be under 100 characters';
    }

    if (bio && bio.length > 1000) {
      newErrors.bio = 'Bio cannot exceed 1000 characters';
    }

    if (year) {
      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum) || yearNum < 1 || yearNum > 5) {
        newErrors.year = 'Year must be between 1 and 5';
      }
    }

    if (githubUrl && !isValidUrl(githubUrl)) {
      newErrors.githubUrl = 'Must be a valid URL (e.g. https://github.com/username)';
    }

    if (linkedinUrl && !isValidUrl(linkedinUrl)) {
      newErrors.linkedinUrl = 'Must be a valid URL (e.g. https://linkedin.com/in/username)';
    }

    if (portfolioUrl && !isValidUrl(portfolioUrl)) {
      newErrors.portfolioUrl = 'Must be a valid URL (e.g. https://example.com)';
    }

    if (avatarUrl && !isValidUrl(avatarUrl)) {
      newErrors.avatarUrl = 'Must be a valid image URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    const parsedSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedInterests = interestsInput
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    const payload: Partial<UserProfile> = {
      fullName: fullName.trim(),
      registerNumber: registerNumber.trim() || undefined,
      department: department.trim() || undefined,
      year: year ? parseInt(year, 10) : undefined,
      section: section.trim() || undefined,
      phone: phone.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
      bio: bio.trim() || undefined,
      skills: parsedSkills,
      interests: parsedInterests,
      githubUrl: githubUrl.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      portfolioUrl: portfolioUrl.trim() || undefined,
    };

    setIsSaving(true);
    const result = await onSave(payload);
    setIsSaving(false);

    if (!result.success) {
      setGeneralError(result.error || 'Failed to save profile changes');
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-xl">Edit Personal Profile</CardTitle>
        <CardDescription>
          Update your student information, technical skills, and portfolio links.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {generalError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-cardSm bg-red-50 border border-red-200 text-xs text-red-800 font-medium"
          >
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Identity & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
              required
            />
            <Input
              label="Email Address (Locked)"
              value={profile.email}
              disabled
              helperText="Managed via Supabase Auth"
            />
          </div>

          {/* Academic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Department"
                placeholder="Computer Science & Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Year of Study (1-5)"
                type="number"
                min="1"
                max="5"
                placeholder="3"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                error={errors.year}
              />
            </div>
            <div>
              <Input
                label="Section"
                placeholder="A"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Register / Roll Number"
              placeholder="RA2211003010..."
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
            />
            <Input
              label="Phone Number"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">
              Biography
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about your engineering interests, current research, or projects..."
              className="flex w-full rounded-cardSm border border-surface-border bg-surface px-4 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:border-ink focus-visible:ring-1 focus-visible:ring-ink"
            />
            {errors.bio && <p className="text-xs text-red-600 font-medium">{errors.bio}</p>}
            <p className="text-xs text-ink-muted">Maximum 1000 characters.</p>
          </div>

          {/* Skills and Interests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Technical Skills (comma-separated)"
              placeholder="Python, PyTorch, TypeScript, Next.js, Docker"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              helperText="Separate each skill with a comma"
            />
            <Input
              label="AI / Research Interests (comma-separated)"
              placeholder="LLMs, Computer Vision, Multi-Agent Systems"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              helperText="Separate each interest with a comma"
            />
          </div>

          {/* External Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="GitHub URL"
              placeholder="https://github.com/..."
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              error={errors.githubUrl}
            />
            <Input
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/..."
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              error={errors.linkedinUrl}
            />
            <Input
              label="Portfolio / Website URL"
              placeholder="https://..."
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              error={errors.portfolioUrl}
            />
          </div>

          <Input
            label="Avatar Image URL (Optional)"
            placeholder="https://..."
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            error={errors.avatarUrl}
            helperText="Direct link to a public profile photo"
          />

          <CardFooter className="px-0 pt-4 flex items-center justify-end gap-3 border-t border-surface-border">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Save Profile Changes
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};
