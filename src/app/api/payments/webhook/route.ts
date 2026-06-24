import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not defined');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Get the raw body as a string for signature verification
    const rawBody = await request.text();

    // Verify the webhook signature
    const isValid = validateWebhookSignature(rawBody, signature, webhookSecret);
    
    if (!isValid) {
      console.error('Invalid Razorpay webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Parse the body as JSON after validation
    const payload = JSON.parse(rawBody);

    // Handle payment.failed event
    if (payload.event === 'payment.failed') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      if (orderId) {
        const { error } = await supabaseAdmin
          .from('payments')
          .update({ status: 'FAILED' })
          .eq('razorpay_order_id', orderId);

        if (error) {
          console.error(`Failed to update payment status for order ${orderId}:`, error);
        } else {
          console.log(`Successfully updated order ${orderId} to FAILED`);
        }
      }
    } else if (payload.event === 'order.paid') {
      // Fallback for successful payments in case frontend verify fails
      const orderEntity = payload.payload.order?.entity;
      const paymentEntity = payload.payload.payment?.entity;
      
      const orderId = orderEntity?.id || paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        // 1. Get the payment to find the user_id
        const { data: payment } = await supabaseAdmin
          .from('payments')
          .select('user_id, status')
          .eq('razorpay_order_id', orderId)
          .single();

        if (payment && payment.status !== 'PAID') {
          // 2. Update payment to PAID
          await supabaseAdmin
            .from('payments')
            .update({
              status: 'PAID',
              razorpay_payment_id: paymentId,
              verified_at: new Date().toISOString(),
            })
            .eq('razorpay_order_id', orderId);

          // 3. Update profile to PRO
          const expiresAt = new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString();
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'PRO',
              subscription_expires_at: expiresAt,
              subscription_plan: 'pro-semester',
            })
            .eq('id', payment.user_id);

          // 4. Create notification
          const expiryDate = new Date(expiresAt).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
          });
          await supabaseAdmin.from('notifications').insert({
            user_id: payment.user_id,
            type: 'LISTING_APPROVED',
            title: 'Welcome to CampusNest Pro! 🎉',
            body: `Your payment was confirmed. Your subscription is active until ${expiryDate}.`,
            link: '/profile',
          });

          console.log(`Successfully fulfilled order.paid for order ${orderId}`);
        }
      }
    }

    // Acknowledge receipt of the webhook
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
