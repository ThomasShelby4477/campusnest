-- 018_add_listing_removed_type.sql
-- Allow LISTING_REMOVED notifications (admin removing listings)
-- Includes all types from 008_interest_requests.sql

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
  'LISTING_REMOVED'
));
