import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { UserProfile } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ProfileViewProps {
  profile: UserProfile;
  onEdit: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onEdit }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AI';
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="h-20 w-20 rounded-full object-cover border-2 border-surface-border shadow-subtle"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-ink text-canvas font-bold text-2xl flex items-center justify-center shadow-subtle">
                {getInitials(profile.fullName)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-ink">{profile.fullName}</h2>
                <Badge variant={profile.role === 'admin' ? 'default' : profile.role === 'member' ? 'success' : 'neutral'}>
                  {profile.role.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-ink-muted mt-1">{profile.email}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-ink-secondary">
                {profile.department && <span>Dept: <strong>{profile.department}</strong></span>}
                {profile.year && <span>Year: <strong>{profile.year}</strong></span>}
                {profile.section && <span>Sec: <strong>{profile.section}</strong></span>}
                {profile.registerNumber && <span>Reg: <strong>{profile.registerNumber}</strong></span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button onClick={onEdit} variant="outline" size="sm">
              Edit Profile
            </Button>
            {profile.role === 'applicant' && (
              <Link to="/applicant/assessment">
                <Button variant="primary" size="sm">
                  <span>Take Assessment</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Bio & Skills */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About & Bio</CardTitle>
              <CardDescription>Academic and engineering background</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.bio ? (
                <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{profile.bio}</p>
              ) : (
                <p className="text-sm text-ink-muted italic">No biography provided yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technical Skills</CardTitle>
              <CardDescription>Proficiencies and development stack</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-pill text-xs font-medium bg-surface-muted text-ink border border-surface-border"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-muted italic">No skills listed yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI & Research Interests</CardTitle>
              <CardDescription>Focus areas for collaborative projects and study groups</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.interests && profile.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 rounded-pill text-xs font-medium bg-accent-lavender-subtle text-accent-lavender-dark border border-accent-lavender/20"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-muted italic">No interests listed yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Contact & Social Presence */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact & Profiles</CardTitle>
              <CardDescription>Verified external links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs text-ink-muted block">Phone</span>
                <span className="text-sm text-ink font-medium">{profile.phone || '—'}</span>
              </div>
              <div className="border-t border-surface-border pt-3">
                <span className="text-xs text-ink-muted block">GitHub</span>
                {profile.githubUrl ? (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-ink font-medium hover:underline break-all"
                  >
                    {profile.githubUrl}
                  </a>
                ) : (
                  <span className="text-sm text-ink-muted italic">—</span>
                )}
              </div>
              <div className="border-t border-surface-border pt-3">
                <span className="text-xs text-ink-muted block">LinkedIn</span>
                {profile.linkedinUrl ? (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-ink font-medium hover:underline break-all"
                  >
                    {profile.linkedinUrl}
                  </a>
                ) : (
                  <span className="text-sm text-ink-muted italic">—</span>
                )}
              </div>
              <div className="border-t border-surface-border pt-3">
                <span className="text-xs text-ink-muted block">Portfolio Website</span>
                {profile.portfolioUrl ? (
                  <a
                    href={profile.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-ink font-medium hover:underline break-all"
                  >
                    {profile.portfolioUrl}
                  </a>
                ) : (
                  <span className="text-sm text-ink-muted italic">—</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-canvas-alt/40">
            <CardContent className="p-4 text-xs text-ink-muted space-y-2">
              <div className="font-semibold text-ink">Identity Authority Notice</div>
              <p>
                Your account is authenticated via Supabase Auth. Your platform identifier is cryptographically linked to your submissions and applications.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
