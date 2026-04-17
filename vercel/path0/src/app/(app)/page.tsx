
import { redirect } from 'next/navigation';

/**
 * This page is part of the '(app)' route group, which handles authenticated routes.
 * A page at this level (e.g., /app/) would conflict with the root page.tsx.
 * To resolve this, we use a server-side redirect to send the user to the dashboard,
 * which is the intended behavior for the base authenticated route.
 */
export default function AppRootPage() {
  redirect('/dashboard');
}
