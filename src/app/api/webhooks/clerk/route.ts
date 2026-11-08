import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { syncUserRecord } from '@/lib/user-sync';
import { db } from '@/lib/db';

interface ClerkWebhookEmail {
  id: string;
  email_address: string;
}

interface ClerkWebhookPhone {
  id: string;
  phone_number: string;
}

interface ClerkUserEventData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_addresses: ClerkWebhookEmail[];
  primary_email_address_id: string | null;
  phone_numbers: ClerkWebhookPhone[];
}

interface ClerkWebhookEvent {
  data: ClerkUserEventData;
  type: 'user.created' | 'user.updated' | 'user.deleted';
}

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  // Retrieve Svix verification headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // Reject requests missing required webhook verification headers
  if (webhookSecret || process.env.NODE_ENV === 'production') {
    if (!webhookSecret) {
      console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET is missing in production environment.');
      return NextResponse.json(
        { error: 'Webhook secret is not configured' },
        { status: 500 }
      );
    }

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: 'Missing required Svix verification headers' },
        { status: 400 }
      );
    }
  }

  const body = await req.text();
  let evt: ClerkWebhookEvent;

  // Cryptographically verify Svix webhook signature
  if (webhookSecret && svixId && svixTimestamp && svixSignature) {
    const wh = new Webhook(webhookSecret);
    try {
      evt = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('[Clerk Webhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }
  } else if (process.env.NODE_ENV !== 'production') {
    try {
      evt = JSON.parse(body) as ClerkWebhookEvent;
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: 'Unauthorized webhook payload' }, { status: 401 });
  }

  const { type, data } = evt;

  try {
    switch (type) {
      case 'user.created':
      case 'user.updated': {
        const primaryEmail =
          data.email_addresses.find((e) => e.id === data.primary_email_address_id)
            ?.email_address ?? data.email_addresses[0]?.email_address;

        if (!primaryEmail) {
          console.warn(`[Clerk Webhook] User ${data.id} has no email address`);
          break;
        }

        const fullName =
          [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

        const phone = data.phone_numbers?.[0]?.phone_number ?? null;

        await syncUserRecord({
          clerkUserId: data.id,
          email: primaryEmail,
          name: fullName,
          phone,
          // role remains null for new users, or preserved if existing
        });

        break;
      }

      case 'user.deleted': {
        if (data.id) {
          await db.user.deleteMany({
            where: { clerkUserId: data.id },
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ success: true, event: type }, { status: 200 });
  } catch (error) {
    console.error(`[Clerk Webhook] Error processing ${type} event:`, error);
    return NextResponse.json(
      { error: 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}
