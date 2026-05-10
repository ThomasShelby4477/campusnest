/* ─────────────────────────────────────────────────────────────
   CampusNest — Database types (hand-written to match schema)
   ───────────────────────────────────────────────────────────── */

export type VerifiedStatus = 'PARTIAL' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type UserRole = 'STUDENT' | 'LANDLORD' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type RoomType = 'SINGLE' | 'SHARED' | '1BHK' | '2BHK' | '3BHK' | 'PG';
export type FurnishedType = 'FURNISHED' | 'SEMI' | 'UNFURNISHED';
export type GenderAllowed = 'MALE' | 'FEMALE' | 'ANY';
export type WaterSupply = '24H' | 'TIMED' | 'BOREWELL';
export type SleepSchedule = 'EARLY_BIRD' | 'NIGHT_OWL' | 'FLEXIBLE';
export type GuestsPolicy = 'RARELY' | 'SOMETIMES' | 'OFTEN';
export type StudyEnv = 'SILENT' | 'LIGHT_NOISE' | 'NOISY';
export type FoodPref = 'VEG' | 'NON_VEG' | 'EGGETARIAN' | 'ANY';
export type Personality = 'INTROVERT' | 'EXTROVERT' | 'AMBIVERT';
export type GenderPref = 'MALE' | 'FEMALE' | 'ANY';
export type ChatType = 'ROOMMATE' | 'BUDDY';
export type ReportTargetType = 'USER' | 'LISTING';
export type ReportReason = 'FAKE_LISTING' | 'SCAM' | 'HARASSMENT' | 'SPAM' | 'DISCRIMINATION' | 'OTHER';
export type ReportStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
export type NotificationType =
  | 'NEW_MATCH'
  | 'NEW_MESSAGE'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'LISTING_APPROVED'
  | 'REPORT_RESOLVED';

/* ── Row types ─────────────────────────────────────────────── */

export interface Profile {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  year: number | null;
  branch: string | null;
  gender: Gender | null;
  avatar_url: string | null;
  student_id_path: string | null;
  selfie_path: string | null;
  verified_status: VerifiedStatus;
  verification_badge: boolean;
  role: UserRole;
  is_active: boolean;
  looking_for_buddy: boolean;
  fcm_token: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  budget_min: number | null;
  budget_max: number | null;
  sleep_schedule: SleepSchedule | null;
  cleanliness: number | null;
  smoking: boolean | null;
  drinking: boolean | null;
  guests_policy: GuestsPolicy | null;
  study_env: StudyEnv | null;
  gaming: boolean | null;
  food_pref: FoodPref | null;
  personality: Personality | null;
  gender_pref: GenderPref | null;
  move_in_date: string | null;
  quiz_completed: boolean;
  updated_at: string;
}

export interface Listing {
  id: string;
  poster_id: string;
  title: string;
  description: string | null;
  rent: number;
  deposit: number;
  room_type: RoomType | null;
  furnished: FurnishedType | null;
  gender_allowed: GenderAllowed | null;
  roommates_needed: number;
  has_wifi: boolean;
  has_ac: boolean;
  food_available: boolean;
  water_supply: WaterSupply | null;
  latitude: number;
  longitude: number;
  address: string;
  distance_from_college: number | null;
  available_from: string | null;
  is_active: boolean;
  is_verified: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  order: number;
  is_primary: boolean;
}

export interface RoommateLike {
  id: string;
  liker_id: string;
  liked_id: string;
  created_at: string;
}

export interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  chat_type: ChatType;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface SavedListing {
  user_id: string;
  listing_id: string;
  saved_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ConsentRecord {
  id: string;
  user_id: string | null;
  policy_version: string;
  consented_at: string;
  ip_address: string | null;
}

/* ── Public profile view ───────────────────────────────────── */

export interface PublicProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  year: number | null;
  branch: string | null;
  verified_status: VerifiedStatus;
  verification_badge: boolean;
  looking_for_buddy: boolean;
  gender: Gender | null;
}

/* ── Joined / enriched types ───────────────────────────────── */

export interface ListingWithImages extends Listing {
  listing_images: ListingImage[];
  profiles: Pick<Profile, 'name' | 'avatar_url'>;
}

export interface ListingDetail extends Listing {
  listing_images: ListingImage[];
  profiles: Pick<Profile, 'name' | 'avatar_url' | 'verified_status' | 'verification_badge'>;
}

export interface MatchWithProfile extends Match {
  other_user: PublicProfile;
  last_message: Message | null;
  unread_count: number;
}

export interface RoommateCard extends PublicProfile {
  preferences: UserPreferences;
  compatibility_score: number;
}
