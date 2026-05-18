
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest } from 'next/server';

/**
 * API Route to set a custom role on a user.
 * This is a protected route that should only be accessible by admins.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get the authorization token from the header.
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token is missing or invalid.' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    // 2. Verify the token and check if the caller is an admin.
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied. Only admins can set user roles.' }, { status: 403 });
    }

    // 3. Get the target UID and new role from the request body.
    const { uid, role } = await request.json();
    if (!uid || !role) {
      return NextResponse.json({ error: 'UID and role must be provided.' }, { status: 400 });
    }
    
    // 4. Set the custom claim on the target user.
    await adminAuth.setCustomUserClaims(uid, { role });

    // 5. Also update the user's document in Firestore for consistency.
    await adminDb.collection('users').doc(uid).update({ role });

    // 6. Respond with success.
    return NextResponse.json({ message: `Successfully set role "${role}" for user ${uid}.` });

  } catch (error: any) {
    console.error("Error in set-role API:", error);
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token has expired. Please re-authenticate.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
