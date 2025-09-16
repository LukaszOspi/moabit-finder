import { NextResponse } from 'next/server'

import { resolveRecipientsFromEnv, sendEmail } from '../../../lib/email'

type ContactFormPayload = {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const buildEmailBody = ({ name, email, subject, message }: Required<ContactFormPayload>) => {
  const lines = [
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Betreff: ${subject}`,
    '',
    message,
  ]

  return lines.join('\n')
}

export const POST = async (request: Request) => {
  let payload: ContactFormPayload

  try {
    payload = await request.json()
  } catch (_error) {
    return NextResponse.json(
      { error: 'Ungültige Anfrage. Es wurden keine Formulardaten gefunden.' },
      { status: 400 },
    )
  }

  const name = payload.name?.trim()
  const email = payload.email?.trim()
  const subject = payload.subject?.trim() || 'Kontaktformular'
  const message = payload.message?.trim()

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Bitte füllen Sie alle Pflichtfelder aus.' },
      { status: 400 },
    )
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' },
      { status: 400 },
    )
  }

  const recipients = resolveRecipientsFromEnv(
    process.env.CONTACT_RECIPIENT_EMAILS || process.env.SMTP_USER,
  )

  if (!recipients.length) {
    console.warn('CONTACT_RECIPIENT_EMAILS is not configured. Contact form submissions cannot be delivered.')
    return NextResponse.json(
      { error: 'Der Kontakt-Dienst ist derzeit nicht verfügbar.' },
      { status: 503 },
    )
  }

  const textBody = buildEmailBody({
    name,
    email,
    subject,
    message,
  })

  const emailResult = await sendEmail({
    to: recipients,
    subject: `Kontaktanfrage: ${subject}`,
    text: textBody,
    replyTo: email,
  })

  if (!emailResult.success) {
    return NextResponse.json(
      { error: 'Ihre Nachricht konnte nicht versendet werden. Bitte versuchen Sie es später erneut.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ success: true })
}
