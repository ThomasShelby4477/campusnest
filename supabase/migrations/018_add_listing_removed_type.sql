-- 018_add_listing_removed_type.sql
-- Allow LISTING_REMOVED notifications (admin removing listings)

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
  'LISTING_REMOVED'
));
