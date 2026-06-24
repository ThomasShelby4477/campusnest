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
        // Update the payment record in the database to FAILED
        const { error } = await supabaseAdmin
          .from('payments')
          .update({ status: 'FAILED' })
          .eq('razorpay_order_id', orderId);

        if (error) {
          console.error(`Failed to update payment status for order ${orderId}:`, error);
          // Still return 200 so Razorpay knows we received it, but log the error
        } else {
          console.log(`Successfully updated order ${orderId} to FAILED`);
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
