import { redirect } from 'next/navigation';

// Placeholder — the real customer login UI ships in Phase C.
// Until then, send visitors to the booking flow which will create a customer
// account inline as part of the wizard.
export default function CustomerLoginRedirect() {
  redirect('/book');
}
