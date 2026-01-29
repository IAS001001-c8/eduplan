-- Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Ensure RLS is properly configured for real-time subscriptions
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Simplified policy using only auth.uid() without user_sessions reference
-- Allow users to view notifications where they are the recipient
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Allow authenticated users to insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (
    user_id = auth.uid()
  );

-- Added indexes for better real-time performance
-- Create index for better real-time performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_establishment 
  ON notifications(establishment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id, is_read) WHERE is_read = false;
