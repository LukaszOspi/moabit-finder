// Utility functions to adapt Payload CMS documents into shapes the frontend can render easily.

export function adaptLocation(doc) {
  if (!doc || typeof doc !== 'object') {
    return null;
  }

  const {
    id,
    name = 'Ohne Namen',
    shortName = name,
    description = '',
    image,
    address,
    coordinates,
    mapPosition,
    openingHours = '',
  } = doc;

  const adaptedImage =
    image && typeof image === 'object'
      ? {
          url: image.url ?? image?.sizes?.thumbnail?.url ?? null,
          alt: image.alt ?? name,
        }
      : null;

  const addr = address && typeof address === 'object' ? address : {};
  const addressLine = [addr.street, addr.number].filter(Boolean).join(' ');
  const cityLine = [addr.postalCode, addr.city].filter(Boolean).join(' ');

  let latitude = null;
  let longitude = null;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    // Payload stores point fields as [lng, lat]
    ;[longitude, latitude] = coordinates;
  } else if (coordinates && typeof coordinates === 'object') {
    latitude = coordinates.lat ?? coordinates.latitude ?? null;
    longitude = coordinates.lng ?? coordinates.longitude ?? null;
  }

  const position =
    mapPosition && typeof mapPosition === 'object'
      ? {
          x: typeof mapPosition.x === 'number' ? mapPosition.x : null,
          y: typeof mapPosition.y === 'number' ? mapPosition.y : null,
        }
      : { x: null, y: null };

  return {
    id,
    name,
    shortName,
    description,
    image: adaptedImage,
    address: {
      ...addr,
      line1: addressLine || null,
      line2: cityLine || null,
    },
    coordinates: latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null,
    mapPosition: position,
    openingHours,
    raw: doc,
  };
}

const eventTypeLabelMap = {
  einmalig: 'einmalige Veranstaltung',
  täglich: 'tägliches Angebot',
  wöchentlich: 'wöchentliches Angebot',
  monatlich: 'monatliches Angebot',
  jährlich: 'jährliches Angebot',
};

export function adaptEvent(doc) {
  if (!doc || typeof doc !== 'object') {
    return null;
  }

  const {
    id,
    title = 'Ohne Titel',
    subtitle,
    eventType = 'einmalig',
    startDate,
    endDate,
    time,
    description = '',
    image,
    location,
    organizer,
    isAccessible = false,
    cost,
    registration,
    tags,
  } = doc;

  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;
  const timeFrom = time?.from?.trim?.();
  const timeTo = time?.to?.trim?.();
  const timeLabel =
    timeFrom && timeTo
      ? `${timeFrom} – ${timeTo}`
      : timeFrom
        ? timeFrom
        : timeTo
          ? timeTo
          : '';

  const adaptedLocation =
    location && typeof location === 'object' ? adaptLocation(location) : null;

  const adaptedOrganizer =
    organizer && typeof organizer === 'object'
      ? {
          id: organizer.id,
          name: organizer.name ?? organizer.title ?? 'Organisation',
          email: organizer.email ?? null,
          phone: organizer.phone ?? null,
          website: organizer.website ?? null,
          raw: organizer,
        }
      : null;

  const adaptedImage =
    image && typeof image === 'object'
      ? {
          url: image.url ?? image?.sizes?.thumbnail?.url ?? null,
          alt: image.alt ?? title,
        }
      : null;

  const tagList = Array.isArray(tags)
    ? tags
        .map((tag) => (tag && typeof tag === 'object' ? tag : null))
        .filter(Boolean)
    : [];

  const targetTags = tagList.filter((tag) => tag.category === 'target').map((tag) => tag.name);
  const topicTags = tagList.filter((tag) => tag.category === 'topic').map((tag) => tag.name);
  const formatTags = tagList.filter((tag) => tag.category === 'format').map((tag) => tag.name);

  const primaryColor =
    tagList.find((tag) => tag.color)?.color ??
    '#7CB92C';

  const excerptSource = subtitle ?? description;
  const excerpt =
    excerptSource && excerptSource.length > 200
      ? `${excerptSource.slice(0, 197).trimEnd()}…`
      : excerptSource ?? '';

  return {
    id,
    title,
    subtitle: subtitle ?? '',
    description,
    excerpt,
    eventType,
    eventTypeLabel: eventTypeLabelMap[eventType] ?? eventType,
    startDate,
    endDate,
    startDateObj,
    endDateObj,
    date: startDateObj ? startDateObj.toISOString().split('T')[0] : null,
    timeLabel,
    time,
    location: adaptedLocation,
    organizer: adaptedOrganizer,
    targetTags,
    topicTags,
    formatTags,
    isAccessible: Boolean(isAccessible),
    cost: cost && typeof cost === 'object' ? cost : null,
    costIsFree: Boolean(cost?.isFree),
    registration: registration && typeof registration === 'object' ? registration : null,
    image: adaptedImage,
    colorHex: primaryColor,
    raw: doc,
  };
}

export function buildEventFilterOptions(events) {
  const ageGroupSet = new Set();
  const themeSet = new Set();
  const placeSet = new Set();
  const dateSet = new Set();

  events.forEach((event) => {
    event.targetTags?.forEach((tag) => {
      if (tag) ageGroupSet.add(tag);
    });

    event.topicTags?.forEach((tag) => {
      if (tag) themeSet.add(tag);
    });

    if (event.location?.shortName) {
      placeSet.add(event.location.shortName);
    } else if (event.location?.name) {
      placeSet.add(event.location.name);
    }

    if (event.date) {
      dateSet.add(event.date);
    }
  });

  const sortLocale = (array) =>
    array
      .map((value) => value)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'de-DE'));

  return {
    ageGroups: sortLocale(Array.from(ageGroupSet)),
    themes: sortLocale(Array.from(themeSet)),
    places: sortLocale(Array.from(placeSet)),
    dates: Array.from(dateSet).sort(),
  };
}
