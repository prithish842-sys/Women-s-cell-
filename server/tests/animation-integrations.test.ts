import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('animation integration source contracts', () => {
  it('gallery folder cards use real album fields and no reference fake files', () => {
    const source = read('src/components/gallery/AnimatedGalleryFolder.tsx');
    expect(source).toContain('album.title');
    expect(source).toContain('album.photoCount');
    expect(source).toContain('previewImages');
    expect(source).toContain('onKeyDown');
    expect(source).not.toMatch(/Hero_BG|Promo_Cut|Q3_Report|Pitch_Deck|UIverse|SMKY|SMOOKYDEV/);
  });

  it('gallery lightbox includes modal keyboard and focus behavior', () => {
    const source = read('src/components/gallery/GalleryImageLightbox.tsx');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('Escape');
    expect(source).toContain('ArrowLeft');
    expect(source).toContain('ArrowRight');
    expect(source).toContain('previousFocusRef');
    expect(source).toContain("document.body.style.overflow = 'hidden'");
  });

  it('member and in-charge cards avoid private/publicly unrelated reference content', () => {
    const publicCard = read('src/components/members/PublicMemberCard.tsx');
    const inChargeCard = read('src/components/members/InChargeRevealCard.tsx');
    expect(publicCard).toContain('View Profile');
    expect(publicCard).toContain('member.name');
    expect(publicCard).toContain('member.clubRole');
    expect(publicCard).toContain('member.department');
    expect(publicCard).toContain('member.course');
    expect(publicCard).toContain('statusLabel(member.academicStatus)');
    expect(publicCard).toContain('member.achievements?.length || 0');
    expect(publicCard).toContain('profileFallbackImage');
    expect(publicCard).toContain('assignImageFallback');
    expect(publicCard).not.toMatch(/phone|registerNumber|passwordHash|UIverse/);
    expect(inChargeCard).toContain('aria-expanded');
    expect(inChargeCard).not.toMatch(/Temperature|Humidity|Wind|AQI|Pressure|Weather/);
  });

  it('public member card uses fixed-boundary interactive animation', () => {
    const publicCard = read('src/components/members/PublicMemberCard.tsx');
    expect(publicCard).toContain('h-[320px]');
    expect(publicCard).toContain('max-w-[320px]');
    expect(publicCard).toContain('overflow-hidden');
    expect(publicCard).toContain("top: active ? '20%' : '80%'");
    expect(publicCard).toContain("borderRadius: active ? '80px 29px 29px 29px' : '29px'");
    expect(publicCard).toContain('top: active ? 10 : 3');
    expect(publicCard).toContain("width: active ? 100 : 'calc(100% - 6px)'");
    expect(publicCard).toContain("border: active ? '7px solid #B75D7A' : '0px solid #B75D7A'");
    expect(publicCard).toContain('zIndex: active ? 30 : 1');
    expect(publicCard).toContain("'scale(1.3)'");
    expect(publicCard).toContain("'scale(1.18)'");
    expect(publicCard).toContain("objectPosition: 'center'");
    expect(publicCard).toContain("'all 0.5s ease-in-out 0.5s'");
    expect(publicCard).toContain('More Info');
    expect(publicCard).toContain('<span>Back</span>');
    expect(publicCard).toContain('setShowInfo(true)');
    expect(publicCard).toContain('setShowInfo(false)');
    expect(publicCard).toContain("event.key === 'Enter'");
    expect(publicCard).toContain("event.key === ' '");
    expect(publicCard).toContain('aria-expanded={active}');
    expect(publicCard).toContain('useReducedMotionPreference');
    expect(publicCard).toContain("closest('a,button')");
    expect(publicCard).not.toContain('layout');
  });

  it('members page owns one expanded card at a time without public filters', () => {
    const membersPage = read('src/pages/public/Members.tsx');
    expect(membersPage).toContain("api.get('/public/members')");
    expect(membersPage).toContain('setExpandedMemberId');
    expect(membersPage).toContain('expandedMemberId === member._id');
    expect(membersPage).toContain('currentId === member._id ? null : member._id');
    expect(membersPage).toContain("closest('[data-singa-member-card=\"true\"]')");
    expect(membersPage).toContain('items-stretch');
    expect(membersPage).toContain('md:grid-cols-2 lg:grid-cols-3');
    expect(membersPage).toContain('AnimatedMemberCard');
    expect(membersPage).not.toContain('Filter directory');
    expect(membersPage).not.toContain('searchTerm');
    expect(membersPage).not.toContain('Search by name, course');
    expect(membersPage).not.toContain('selectedDept');
    expect(membersPage).not.toContain('selectedRole');
    expect(membersPage).not.toContain('showAlumni');
  });

  it('registration welcome is only mounted from successful registration state', () => {
    const registerPage = read('src/pages/auth/Register.tsx');
    expect(registerPage).toContain("setRegistrationState('SUCCESS_ANIMATION')");
    expect(registerPage).toContain("registrationState === 'SUCCESS_ANIMATION'");
    expect(registerPage).toContain("navigate('/student/dashboard', { replace: true })");
    const successBranch = registerPage.slice(registerPage.indexOf('if (res.success)'), registerPage.indexOf('} else {', registerPage.indexOf('if (res.success)')));
    expect(successBranch).not.toContain('navigate(');
  });
});
