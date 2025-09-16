import React, { useState } from 'react';

/**
 * Contact page with address and a contact form. The form currently
 * performs basic client-side validation and shows a confirmation
 * message on submission. Replace the handleSubmit function with
 * integration to your backend or form service as needed.
 */
const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [feedback, setFeedback] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: 'idle', message: '' });
    // Basic validation: ensure fields are filled in
    if (!form.name || !form.email || !form.message) {
      setFeedback({ type: 'error', message: 'Bitte füllen Sie alle Pflichtfelder aus.' });
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch (error) {
        // ignore JSON parse errors and fallback to generic message
      }

      if (!response.ok || payload.success !== true) {
        const message = payload?.error || 'Ihre Nachricht konnte nicht gesendet werden.';
        throw new Error(message);
      }

      setFeedback({ type: 'success', message: 'Vielen Dank! Ihre Nachricht wurde gesendet.' });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler beim Senden der Nachricht.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Kontakt</h1>
      <p className="mb-6 text-gray-700">
        Haben Sie Fragen, Anregungen oder möchten Sie mit uns in Kontakt treten? Nutzen
        Sie das untenstehende Formular oder kontaktieren Sie uns direkt.
      </p>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">Adresse</h2>
          <p>MoaFinder<br />Turmstraße 75<br />10555 Berlin</p>
          <h2 className="text-lg font-semibold mb-2 mt-4">Kontakt</h2>
          <p>Telefon: <a href="tel:+493012345678" className="text-primary-700 hover:underline">030 123 456 78</a></p>
          <p>Email: <a href="mailto:info@moafinder.de" className="text-primary-700 hover:underline">info@moafinder.de</a></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1 font-medium">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 font-medium">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="subject" className="block mb-1 font-medium">Betreff</label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={form.subject}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="message" className="block mb-1 font-medium">Nachricht *</label>
            <textarea
              id="message"
              name="message"
              rows="4"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={form.message}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="bg-primary-700 text-white px-4 py-2 rounded hover:bg-primary-800 disabled:opacity-75 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Wird gesendet…' : 'Nachricht senden'}
          </button>
          {feedback.type === 'success' && (
            <p className="mt-2 text-green-700">{feedback.message}</p>
          )}
          {feedback.type === 'error' && (
            <p className="mt-2 text-red-600">{feedback.message}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
