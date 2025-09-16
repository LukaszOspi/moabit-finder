import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Registration page. Collects user information for account creation
 * and performs basic validation. In a production setting you would
 * integrate this form with your backend to create user accounts and
 * enforce proper password policies and security measures such as
 * hashing on the server side.
 */
const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Basic client-side validation
    if (!form.name || !form.email || !form.password) {
      setError('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    if (form.password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch (error) {
        // Ignore JSON parsing errors and use default message below
      }

      if (!response.ok) {
        const message =
          payload?.errors?.[0]?.message ||
          payload?.message ||
          'Die Registrierung ist fehlgeschlagen.';
        throw new Error(message);
      }

      navigate('/login', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Die Registrierung ist fehlgeschlagen.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Registrieren</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={form.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="email" className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-1 font-medium">Passwort</label>
          <input
            type="password"
            id="password"
            name="password"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block mb-1 font-medium">Passwort bestätigen</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={form.confirmPassword}
            onChange={handleChange}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-primary-700 text-white px-4 py-2 rounded hover:bg-primary-800 disabled:opacity-75 disabled:cursor-not-allowed w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Wird erstellt…' : 'Konto erstellen'}
        </button>
      </form>
      <p className="mt-4 text-sm">Bereits registriert? <Link to="/login" className="text-primary-700 hover:underline">Anmelden</Link></p>
    </div>
  );
};

export default RegisterPage;
