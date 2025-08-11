import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseclient';

export default function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    supabase.auth.exchangeCodeForSession().then(({ error }) => {
      if (error) console.error('Auth callback error:', error);
      nav('/'); // or /dashboard
    });
  }, [nav]);

  return <p>Signing you in...</p>;
}
// This component handles the OAuth callback from Supabase