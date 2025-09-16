import type { CollectionConfig, PayloadRequest } from 'payload'

import { resolveRecipientsFromEnv, sendEmail } from '../lib/email'

const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'location', 'status', 'organizer'],
  },
  access: {
    read: ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      const notExpired = {
        or: [
          { expiryDate: { equals: null } },
          { expiryDate: { greater_than_equal: new Date().toISOString() } },
        ],
      }
      if (!user) {
        return {
          and: [{ status: { equals: 'approved' } }, notExpired],
        } as any
      }
      if (user.role === 'organizer') {
        return {
          or: [
            { and: [{ status: { equals: 'approved' } }, notExpired] },
            { organizer: { equals: user.id } },
          ],
        } as any
      }
      return true
    },
    create: ({ req }: { req: PayloadRequest }) => !!req.user,
    update: ({ req }: { req: PayloadRequest }) => {
      const { user } = req
      if (!user) return false
      if (user.role === 'admin' || user.role === 'editor') return true
      return { organizer: { equals: user.id } } as any
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 70,
      label: 'Titel der Veranstaltung',
    },
    {
      name: 'subtitle',
      type: 'text',
      maxLength: 100,
      label: 'Untertitel / Teaser',
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      label: 'Art der Veranstaltung',
      options: [
        { label: 'Einmalig', value: 'einmalig' },
        { label: 'Täglich', value: 'täglich' },
        { label: 'Wöchentlich', value: 'wöchentlich' },
        { label: 'Monatlich', value: 'monatlich' },
        { label: 'Jährlich', value: 'jährlich' },
      ],
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      label: 'Startdatum',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      label: 'Enddatum',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'recurrence',
      type: 'group',
      label: 'Wiederholung',
      admin: {
        condition: (_, siblingData) => siblingData?.eventType !== 'einmalig',
      },
      fields: [
        {
          name: 'daysOfWeek',
          type: 'select',
          hasMany: true,
          label: 'Wochentage',
          options: [
            { label: 'Montag', value: 'mon' },
            { label: 'Dienstag', value: 'tue' },
            { label: 'Mittwoch', value: 'wed' },
            { label: 'Donnerstag', value: 'thu' },
            { label: 'Freitag', value: 'fri' },
            { label: 'Samstag', value: 'sat' },
            { label: 'Sonntag', value: 'sun' },
          ],
        },
        {
          name: 'repeatUntil',
          type: 'date',
          label: 'Wiederholen bis',
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
      ],
    },
    {
      name: 'time',
      type: 'group',
      label: 'Uhrzeit',
      fields: [
        { name: 'from', type: 'text', label: 'Von' },
        { name: 'to', type: 'text', label: 'Bis' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 1000,
      label: 'Beschreibung',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Bild zur Veranstaltung',
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      required: true,
      label: 'Veranstaltungsort',
    },
    {
      name: 'organizer',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      label: 'Veranstalter',
      defaultValue: ({ user }: { user: PayloadRequest['user'] }) => user?.id,
      access: {
        update: ({ req }: { req: PayloadRequest }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'isAccessible',
      type: 'checkbox',
      label: 'Barrierefrei',
      defaultValue: false,
    },
    {
      name: 'cost',
      type: 'group',
      label: 'Kosten',
      fields: [
        { name: 'isFree', type: 'checkbox', label: 'Kostenlos' },
        { name: 'details', type: 'text', label: 'Details (Preis, Soli, etc.)' },
      ],
    },
    {
      name: 'registration',
      type: 'group',
      label: 'Anmeldung',
      fields: [
        { name: 'required', type: 'checkbox', label: 'Anmeldung erforderlich' },
        { name: 'details', type: 'text', label: 'Anmeldedetails' },
      ],
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'Tags',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'Status',
      options: [
        { label: 'Entwurf', value: 'draft' },
        { label: 'Ausstehend', value: 'pending' },
        { label: 'Freigegeben', value: 'approved' },
        { label: 'Archiviert', value: 'archived' },
      ],
      access: {
        update: ({ req }: { req: PayloadRequest }) =>
          req.user?.role === 'editor' || req.user?.role === 'admin',
      },
    },
    {
      name: 'expiryDate',
      type: 'date',
      label: 'Ablaufdatum',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'lastRenewalReminder',
      type: 'date',
      label: 'Letzte Erinnerung zur Verlängerung',
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }: { data?: any }) => {
        if (!data?.expiryDate) {
          const baseDate = data?.endDate || data?.startDate
          if (baseDate) {
            data.expiryDate = baseDate
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({
        doc,
        operation,
        previousDoc,
        req,
      }: {
        doc: any
        operation: string
        previousDoc?: any
        req: PayloadRequest
      }) => {
        const transitionedToApproved =
          operation === 'update' &&
          doc?.status === 'approved' &&
          previousDoc?.status !== 'approved'

        if (!transitionedToApproved) {
          return
        }

        const recipients = resolveRecipientsFromEnv(
          process.env.EVENT_APPROVAL_NOTIFICATION_EMAILS ||
            process.env.CONTACT_RECIPIENT_EMAILS ||
            process.env.SMTP_USER,
        )

        if (!recipients.length) {
          req.payload?.logger?.warn?.(
            'EVENT_APPROVAL_NOTIFICATION_EMAILS is not configured. Skipping approval email.',
          )
          return
        }

        const startDate = doc?.startDate ? new Date(doc.startDate) : null
        const endDate = doc?.endDate ? new Date(doc.endDate) : null
        const dateFormatter = new Intl.DateTimeFormat('de-DE', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })

        const formattedStart = startDate ? dateFormatter.format(startDate) : 'unbekannt'
        const formattedEnd = endDate ? dateFormatter.format(endDate) : undefined

        const organizerName =
          typeof doc?.organizer === 'object' && doc.organizer
            ? doc.organizer.name || doc.organizer.title || doc.organizer.id
            : doc?.organizer

        const locationName =
          typeof doc?.location === 'object' && doc.location
            ? doc.location.name || doc.location.title || doc.location.id
            : doc?.location

        const plainLines = [
          `Titel: ${doc?.title ?? 'Unbekannt'}`,
          `Status: ${doc?.status}`,
          `Start: ${formattedStart}`,
        ]

        if (formattedEnd) {
          plainLines.push(`Ende: ${formattedEnd}`)
        }

        if (organizerName) {
          plainLines.push(`Veranstalter: ${organizerName}`)
        }

        if (locationName) {
          plainLines.push(`Ort: ${locationName}`)
        }

        const htmlLines = [`<p>Die Veranstaltung <strong>${doc?.title ?? 'Unbekannt'}</strong> wurde soeben freigegeben.</p>`, '<ul>']
        htmlLines.push(`<li><strong>Status:</strong> ${doc?.status}</li>`)
        htmlLines.push(`<li><strong>Start:</strong> ${formattedStart}</li>`)

        if (formattedEnd) {
          htmlLines.push(`<li><strong>Ende:</strong> ${formattedEnd}</li>`)
        }

        if (organizerName) {
          htmlLines.push(`<li><strong>Veranstalter:</strong> ${organizerName}</li>`)
        }

        if (locationName) {
          htmlLines.push(`<li><strong>Ort:</strong> ${locationName}</li>`)
        }

        htmlLines.push('</ul>')

        const adminUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL
          ? `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/admin/collections/events/${doc?.id}`
          : undefined

        if (adminUrl) {
          plainLines.push(`Link zur Veranstaltung im Admin: ${adminUrl}`)
        }

        const textBody = plainLines.join('\n')

        if (adminUrl) {
          htmlLines.push(`<p><a href="${adminUrl}">Zur Veranstaltung im Admin-Bereich</a></p>`)
        }

        const result = await sendEmail({
          to: recipients,
          subject: `Veranstaltung freigegeben: ${doc?.title ?? 'Ohne Titel'}`,
          text: textBody,
          html: htmlLines.join('\n'),
        })

        if (!result.success) {
          req.payload?.logger?.error?.(
            `E-Mail-Benachrichtigung für Veranstaltung ${doc?.id} fehlgeschlagen: ${result.error}`,
          )
        }
      },
    ],
  },
  timestamps: true,
}

export default Events
