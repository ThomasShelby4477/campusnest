-- 021_add_listing_restored_type.sql
-- Add LISTING_RESTORED notification type for when admin restores a removed listing

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'NEW_MATCH',
    'NEW_MESSAGE',
    'VERIFICATION_APPROVED',
    'VERIFICATION_REJECTED',
    'LISTING_APPROVED',
    'REPORT_RESOLVED',
    'INTEREST_REQUEST',
    'INTEREST_ACCEPTED',
    'INTEREST_DECLINED',
    'LISTING_REMOVED',
    'LISTING_RESTORED'
  ));
