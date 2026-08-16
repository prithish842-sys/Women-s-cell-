import {
  useEffect,
  useId,
  useState,
  type SyntheticEvent,
} from "react";

import { resolveUploadUrl } from "../../utils/api.js";
import styles from "./AnimatedMemberCard.module.css";

export interface AnimatedMemberCardData {
  id: string;
  fullName: string;

  profileImage?: string | null;
  memberType?: "STUDENT" | "FACULTY" | string | null;
  clubRole?: string | null;
  department?: string | null;
  course?: string | null;
  designation?: string | null;
  currentStudyYear?: string | number | null;
  serviceSince?: string | number | null;
  academicStatus?: string | null;

  primarySkills?: string[] | string | null;
  achievementsCount?: number | null;
}

interface AnimatedMemberCardProps {
  member: AnimatedMemberCardData;

  /**
   * Pass an already resolved image URL from the existing
   * project image utility.
   */
  imageUrl?: string | null;

  /**
   * Used for mobile/touch expansion.
   * Desktop hover works through CSS.
   */
  isExpanded: boolean;

  onToggle: (memberId: string) => void;
  onViewProfile: (memberId: string) => void;
}

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getSkillText(
  primarySkills?: string[] | string | null,
): string {
  if (Array.isArray(primarySkills)) {
    return primarySkills.filter(Boolean).slice(0, 2).join(" • ");
  }

  return primarySkills?.trim() || "Skill not added";
}

function formatStudyYear(
  currentStudyYear?: string | number | null,
): string {
  if (
    currentStudyYear === null ||
    currentStudyYear === undefined ||
    currentStudyYear === ""
  ) {
    return "Year not added";
  }

  const value = String(currentStudyYear).trim();

  if (/year/i.test(value)) {
    return value;
  }

  return `Year ${value}`;
}

export default function AnimatedMemberCard({
  member,
  imageUrl,
  isExpanded,
  onToggle,
  onViewProfile,
}: AnimatedMemberCardProps) {
  const detailsId = useId();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const initials = getInitials(member.fullName);
  const skills = getSkillText(member.primarySkills);
  const studyYear = formatStudyYear(member.currentStudyYear);
  const isFaculty = member.memberType === "FACULTY";
  const roleText = member.clubRole || member.designation || "";
  const courseText = isFaculty
    ? member.designation || "Designation not added"
    : member.course || "Course not added";
  const resolvedImageUrl = imageUrl?.trim()
    ? resolveUploadUrl(imageUrl)
    : "";

  const handleImageError = (
    event: SyntheticEvent<HTMLImageElement>,
  ) => {
    const image = event.currentTarget;

    if (image.dataset.fallbackApplied === "true") {
      return;
    }

    image.dataset.fallbackApplied = "true";
    setImageFailed(true);
  };

  return (
    <article
      className={styles.shell}
      data-expanded={isExpanded ? "true" : "false"}
    >
      <button
        type="button"
        className={styles.card}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        aria-label={`${isExpanded ? "Close" : "Open"} details for ${
          member.fullName
        }`}
        onClick={() => onToggle(member.id)}
      >
        <span
          className={styles.topIcon}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9.5" cy="7" r="4" />
            <path d="M19 8v6" />
            <path d="M22 11h-6" />
          </svg>
        </span>

        <span className={styles.profilePicture}>
          {!imageFailed && resolvedImageUrl ? (
            <img
              src={resolvedImageUrl}
              alt={`${member.fullName} profile`}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
          ) : (
            <span
              className={styles.initialsFallback}
              aria-label={`${member.fullName} initials`}
            >
              {initials || "SP"}
            </span>
          )}
        </span>

        <span className={styles.detailsPanel}>
          <span className={styles.compactSummary}>
            <span
              className={styles.compactCourse}
              title={courseText}
            >
              {courseText}
            </span>

            <span className={styles.compactYear}>
              {isFaculty ? "Faculty" : studyYear}
            </span>
          </span>

          <span
            id={detailsId}
            className={styles.expandedContent}
          >
            <strong className={styles.memberName}>
              {member.fullName}
            </strong>

            {roleText && (
              <span className={styles.memberRole}>
                {roleText}
              </span>
            )}

            <span className={styles.detailList}>
              <span>
                <b>Department:</b>{" "}
                {member.department || "Not added"}
              </span>

              <span>
                <b>{isFaculty ? "Designation" : "Course"}:</b>{" "}
                {courseText}
              </span>

              {!isFaculty && (
                <span>
                  <b>Year:</b> {studyYear}
                </span>
              )}

              <span>
                <b>Since:</b>{" "}
                {member.serviceSince || "Not added"}
              </span>
            </span>

            <span className={styles.skillBadge}>
              {isFaculty ? "Women Empowerment Cell" : skills}
            </span>

            <span className={styles.bottomMetadata}>
              <span className={styles.statusBadge}>
                {isFaculty ? "Faculty" : member.academicStatus || "Active Student"}
              </span>

              <span className={styles.achievementCount}>
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 21h8" />
                  <path d="M12 17v4" />
                  <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
                  <path d="M5 6H3v2a4 4 0 0 0 4 4" />
                  <path d="M19 6h2v2a4 4 0 0 1-4 4" />
                </svg>

                {member.achievementsCount ?? 0} achievements
              </span>
            </span>
          </span>
        </span>
      </button>

      <button
        type="button"
        className={styles.viewProfileButton}
        tabIndex={isExpanded ? 0 : -1}
        aria-label={`View ${member.fullName} profile`}
        onClick={() => onViewProfile(member.id)}
      >
        View Profile
      </button>
    </article>
  );
}
