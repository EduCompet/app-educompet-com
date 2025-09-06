// app/page.js
import { redirect } from 'next/navigation';

export default function Home() {
  // Permanently redirect users to the login page
  redirect('/login');
  
  // This part will not be rendered due to the redirect
  return null;
}