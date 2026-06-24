import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { csrfGuard } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Lazy initialize Razorpay to avoid build-time crash if env vars are missing
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret) {
      console.error('Missing Razorpay API keys');
      return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

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

    // Rate limit: 10 orders per hour per user
    const rateLimitResult = rateLimit(
      `payments:create:${user.id}`,
      { limit: 10, windowMs: 60 * 60 * 1000 }
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Verify user is verified
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('verified_status, subscription_status, subscription_expires_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile.verified_status !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'You must be verified to subscribe' },
        { status: 403 }
      );
    }

    // Check if already Pro
    if (
      profile.subscription_status === 'PRO' &&
      profile.subscription_expires_at &&
      new Date(profile.subscription_expires_at) > new Date()
    ) {
      return NextResponse.json(
        { error: 'Already subscribed' },
        { status: 409 }
      );
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: 19900,
      currency: 'INR',
      receipt: `cn_pro_${user.id}_${Date.now()}`,
    });

    // Insert payment record
    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: 19900,
        currency: 'INR',
        plan: 'pro-semester',
        status: 'CREATED',
      });

    if (insertError) {
      console.error('Failed to insert payment record:', insertError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
