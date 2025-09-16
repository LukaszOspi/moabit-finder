import nodemailer from 'nodemailer'

type RecipientInput = string | string[] | undefined | null

export type SendEmailOptions = {
  to: RecipientInput
  subject: string
  text: string
  html?: string
  replyTo?: string
}

type SendEmailResult = {
  success: boolean
  error?: string
}

let transporterPromise: Promise<nodemailer.Transporter | null> | null = null

const parseRecipients = (input: RecipientInput): string[] => {
  if (!input) return []

  if (Array.isArray(input)) {
    return input
      .map((value) => value.trim())
      .filter(Boolean)
  }

  return input
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

const buildFromAddress = () => {
  const address = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
  const name = process.env.SMTP_FROM_NAME

  if (!address) return undefined

  return name ? `${name} <${address}>` : address
}

const createTransporter = async (): Promise<nodemailer.Transporter | null> => {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    console.warn('Email transport is not configured: missing SMTP credentials.')
    return null
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: {
        user,
        pass,
      },
    })

    try {
      await transporter.verify()
    } catch (error) {
      console.warn('SMTP verification failed. Continuing anyway.', error)
    }

    return transporter
  } catch (error) {
    console.error('Failed to create email transporter.', error)
    return null
  }
}

const getTransporter = async (): Promise<nodemailer.Transporter | null> => {
  if (!transporterPromise) {
    transporterPromise = createTransporter()
  }

  return transporterPromise
}

export const sendEmail = async ({ to, subject, text, html, replyTo }: SendEmailOptions): Promise<SendEmailResult> => {
  const recipients = parseRecipients(to)

  if (!recipients.length) {
    return {
      success: false,
      error: 'No recipient configured for outgoing email.',
    }
  }

  const transporter = await getTransporter()

  if (!transporter) {
    return {
      success: false,
      error: 'Email transport is not configured. Set SMTP_* environment variables.',
    }
  }

  const from = buildFromAddress()
  const fallbackFrom = process.env.SMTP_USER

  try {
    await transporter.sendMail({
      from: from || fallbackFrom,
      to: recipients,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br />'),
      replyTo,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send email.', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    }
  }
}

export const resolveRecipientsFromEnv = (value: RecipientInput): string[] => parseRecipients(value)
