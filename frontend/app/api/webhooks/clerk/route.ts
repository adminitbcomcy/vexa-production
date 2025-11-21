import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }

  // Get headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create new Svix instance with secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error: Could not verify webhook:', err);
    return new Response('Error: Verification error', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const userData = {
      clerk_id: id,
      email: email_addresses[0]?.email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim() || null,
      image_url: image_url || null,
    };

    try {
      // Sync user to Vexa backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_VEXA_API_URL}/api/admin/users/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': process.env.VEXA_ADMIN_API_TOKEN!,
          },
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        console.error('Failed to sync user to Vexa:', await response.text());
      }
    } catch (error) {
      console.error('Error syncing user to Vexa:', error);
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      // Delete user from Vexa backend
      await fetch(
        `${process.env.NEXT_PUBLIC_VEXA_API_URL}/api/admin/users/${id}`,
        {
          method: 'DELETE',
          headers: {
            'X-Admin-Token': process.env.VEXA_ADMIN_API_TOKEN!,
          },
        }
      );
    } catch (error) {
      console.error('Error deleting user from Vexa:', error);
    }
  }

  return new Response('Webhook processed', { status: 200 });
}
