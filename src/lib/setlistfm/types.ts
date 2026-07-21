export interface SetlistArtist {
  mbid: string
  name: string
  sortName: string
  url: string
}

export interface SetlistCountry {
  code: string
  name: string
}

export interface SetlistCity {
  id: string
  name: string
  state?: string
  stateCode?: string
  country: SetlistCountry
}

export interface SetlistVenue {
  id: string
  name: string
  city: SetlistCity
  url: string
}

export interface SetlistSong {
  name: string
  cover?: { name: string }
}

export interface SetlistSet {
  name?: string
  song: SetlistSong[]
}

export interface Setlist {
  id: string
  versionId: string
  eventDate: string  // formato: DD-MM-YYYY
  lastUpdated: string
  artist: SetlistArtist
  venue: SetlistVenue
  sets: { set: SetlistSet[] }
  tour?: { name: string }  // ex: "I Wanna Be Tour 2025" — vira sugestão de festival
  url: string
}

export interface SetlistSearchResponse {
  type: string
  itemsPerPage: number
  page: number
  total: number
  setlist: Setlist[]
}

/** Shape normalizado que retornamos ao front-end */
export interface ShowResult {
  setlistfmId: string
  artist: string
  venue: string
  city: string
  state: string
  country: string
  eventDate: string  // formato: YYYY-MM-DD
  festival: boolean
  tourName: string   // sugestão de nome de festival/turnê (vazio quando não houver)
  setlistfmUrl: string
  songCount: number
}
