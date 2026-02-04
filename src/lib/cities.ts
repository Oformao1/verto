// MVP City List - Top 15 cities for initial launch
// Do NOT add cities without product approval
export const MVP_CITIES = [
  'New York City',
  'Los Angeles',
  'Miami',
  'Chicago',
  'Atlanta',
  'Phoenix / Scottsdale',
  'Houston',
  'San Francisco (Bay Area)',
  'Austin',
  'Denver',
  'San Diego',
  'Seattle',
  'Washington, DC',
  'Boston',
  'Dallas',
] as const

export type MVPCity = (typeof MVP_CITIES)[number]

// Validate if a city is in the MVP list
export function isValidMVPCity(city: string): city is MVPCity {
  return MVP_CITIES.includes(city as MVPCity)
}

// Get city options for dropdowns
export function getCityOptions() {
  return MVP_CITIES.map((city) => ({
    value: city,
    label: city,
  }))
}
