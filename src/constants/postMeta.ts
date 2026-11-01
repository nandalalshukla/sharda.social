import type { BadgeVariant } from "@/components/ui";
import type { FeatherName } from "@/components/ui";
import type {
  LostFoundCategory,
  LostFoundKind,
  PostType,
} from "@/api/types";

/**
 * One description of each post type, shared by the feed tabs, the composer's
 * type picker and the card badge — same single source of truth the website
 * keeps in `components/social/postMeta.ts`.
 */
export interface PostTypeMeta {
  value: PostType;
  label: string;
  tabLabel: string;
  emptyTitle: string;
  icon: FeatherName;
  badge: BadgeVariant;
  /** One line shown in the composer when this type is selected. */
  hint: string;
}

export const postTypeMeta: Record<PostType, PostTypeMeta> = {
  general: {
    value: "general",
    label: "General",
    tabLabel: "General",
    emptyTitle: "No posts yet",
    icon: "message-square",
    badge: "primary",
    hint: "Share what's on your mind with the campus.",
  },
  announcement: {
    value: "announcement",
    label: "Announcement",
    tabLabel: "Announcements",
    emptyTitle: "No announcements yet",
    icon: "bell",
    badge: "coral",
    hint: "Important news for students. Reviewed by a moderator before it goes live.",
  },
  event: {
    value: "event",
    label: "Event",
    tabLabel: "Events",
    emptyTitle: "No events yet",
    icon: "calendar",
    badge: "mint",
    hint: "Fests, workshops, meetups. Reviewed by a moderator before it goes live.",
  },
  opportunity: {
    value: "opportunity",
    label: "Opportunity",
    tabLabel: "Opportunities",
    emptyTitle: "No opportunities yet",
    icon: "briefcase",
    badge: "sky",
    hint: "Jobs, internships, collaborations and other openings.",
  },
  lost_found: {
    value: "lost_found",
    label: "Lost & Found",
    tabLabel: "Lost & Found",
    emptyTitle: "Nothing on the lost & found board",
    icon: "search",
    badge: "purple",
    hint: "Lost something on campus, or found something that isn't yours?",
  },
};

export const postTypeOrder: PostType[] = ["general", "announcement", "event", "opportunity", "lost_found"];

export const resolvePostTypeMeta = (type?: string | null): PostTypeMeta =>
  postTypeMeta[type as PostType] ?? postTypeMeta.general;

/** Events and announcements from general members wait for a moderator. */
export const MODERATED_POST_TYPES: PostType[] = ["event", "announcement"];
export const isPostReviewer = (role?: string | null) => role === "mod" || role === "admin";
export const postWillNeedApproval = (type: PostType, role?: string | null) =>
  MODERATED_POST_TYPES.includes(type) && !isPostReviewer(role);

export const lostFoundKindMeta: Record<
  LostFoundKind,
  { label: string; composerLabel: string; composerHint: string; badge: BadgeVariant }
> = {
  lost: {
    label: "Lost",
    composerLabel: "I lost something",
    composerHint: "Ask the campus to keep an eye out for it",
    badge: "warning",
  },
  found: {
    label: "Found",
    composerLabel: "I found something",
    composerHint: "Help it get back to whoever owns it",
    badge: "success",
  },
};

export const lostFoundCategoryMeta: Record<LostFoundCategory, { label: string; icon: FeatherName }> = {
  electronics: { label: "Electronics", icon: "smartphone" },
  documents: { label: "Documents", icon: "file-text" },
  stationery: { label: "Stationery", icon: "edit-3" },
  clothing: { label: "Clothing", icon: "shopping-bag" },
  accessories: { label: "Accessories", icon: "watch" },
  keys: { label: "Keys", icon: "key" },
  wallet: { label: "Wallet / Purse", icon: "credit-card" },
  id_card: { label: "ID Card", icon: "user" },
  other: { label: "Other", icon: "package" },
};

export const lostFoundCategoryOrder = Object.keys(lostFoundCategoryMeta) as LostFoundCategory[];

export const resolveLostFoundCategory = (category?: string | null) =>
  lostFoundCategoryMeta[category as LostFoundCategory] ?? lostFoundCategoryMeta.other;

export const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "nudity", label: "Nudity or sexual content" },
  { value: "violence", label: "Violence or threats" },
  { value: "fake_information", label: "False information" },
  { value: "scam", label: "Scam or fraud" },
  { value: "other", label: "Something else" },
] as const;
