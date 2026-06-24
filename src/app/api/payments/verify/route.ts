import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { csrfGuard } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    const csrfError = csrfGuard(request);
    if (csrfError) return csrfError;

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limit: 20 verifications per hour per user
    const rateLimitResult = rateLimit(
      `payments:verify:${user.id}`,
      { limit: 20, windowMs: 60 * 60 * 1000 }
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    // Validate all fields are present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment fields' },
        { status: 400 }
      );
    }

    // Verify signature using HMAC-SHA256
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(razorpay_signature, 'hex');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return NextResponse.json(
        { error: 'SIGNATURE_MISMATCH' },
        { status: 400 }
      );
    }

    // Update payment record
    const { data: payment, error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'PAID',
        razorpay_payment_id,
        razorpay_signature,
        verified_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select()
      .single();

    if (updateError || !payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Security check: verify the payment belongs to the current user
    if (payment.user_id !== user.id) {
      console.error(
        `Payment ownership mismatch: payment user ${payment.user_id} !== auth user ${user.id}`
      );
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Calculate expiry: 150 days from now
    const expiresAt = new Date(
      Date.now() + 150 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Update profile subscription
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'PRO',
        subscription_expires_at: expiresAt,
        subscription_plan: 'pro-semester',
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Failed to update profile subscription:', profileError);
      return NextResponse.json(
        { error: 'Failed to activate subscription' },
        { status: 500 }
      );
    }

    // Create notification
    const expiryDate = new Date(expiresAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'LISTING_APPROVED',
        title: 'Welcome to CampusNest Pro! 🎉',
        body: `You now have full access to show interest and post listings. Your subscription is active until ${expiryDate}.`,
        link: '/profile',
      });

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the request for a notification error
    }

    return NextResponse.json({
      success: true,
      expiresAt,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
