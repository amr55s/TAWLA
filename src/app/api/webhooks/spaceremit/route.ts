import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log('SpaceRemit Webhook Received:', payload);
    
    // TODO: Verify SpaceRemit signature
    // TODO: Update Supabase based on payload.status

    return NextResponse.json({ received: true, status: 200 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
