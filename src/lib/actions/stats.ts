'use server';
/**
 * @fileoverview Server action for fetching application statistics.
 */

import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * Gets the total number of documents in the 'users' collection using an optimized server-side count.
 * NOTE: This requires Firestore security rules to allow 'list' or 'count' operations
 * on the 'users' collection for authenticated users.
 * Example rule for security: `match /users/{document=**} { allow list: if request.auth != null; }`
 * 
 * @returns {Promise<number>} A promise that resolves to the total number of users.
 * @throws Will throw an error if the Firestore operation fails, e.g., due to permissions.
 */
export async function getTotalUsers(): Promise<number> {
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getCountFromServer(usersCollection);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching total user count from Firestore:", error);
    // Re-throw the error to be handled by the calling component (e.g., with useQuery).
    // This provides better error visibility on the frontend.
    throw new Error("Failed to fetch user count. This may be a Firestore permissions issue. Ensure 'allow list' is enabled on the 'users' collection in your security rules.");
  }
};
