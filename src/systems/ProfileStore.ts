export type Profile = {
  id: string
  name: string
  createdAt: number
}

const PROFILES_KEY = 'bubble-type-profiles'
const ACTIVE_PROFILE_KEY = 'bubble-type-active-profile-id'
export const MAX_PROFILES = 6

function createId() {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function normalizeName(input: string) {
  const trimmed = input.trim().replace(/\s+/g, ' ')
  return trimmed.slice(0, 18)
}

export function loadProfiles(): Profile[] {
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    const profiles: Profile[] = []
    parsed.forEach((item) => {
      if (!item || typeof item !== 'object') return
      const record = item as Partial<Profile>
      if (typeof record.id !== 'string' || record.id.length < 3) return
      if (typeof record.name !== 'string') return
      profiles.push({
        id: record.id,
        name: normalizeName(record.name) || 'Profil',
        createdAt: typeof record.createdAt === 'number' ? record.createdAt : Date.now()
      })
    })

    const deduped = new Map<string, Profile>()
    profiles.forEach((p) => {
      if (!deduped.has(p.id)) deduped.set(p.id, p)
    })

    const normalized = Array.from(deduped.values()).sort((a, b) => a.createdAt - b.createdAt)

    if (normalized.length <= MAX_PROFILES) return normalized

    const activeId = getActiveProfileId()
    const head = normalized.slice(0, MAX_PROFILES)
    if (activeId && !head.some((p) => p.id === activeId)) {
      const active = normalized.find((p) => p.id === activeId)
      if (active) {
        head[head.length - 1] = active
      }
    }

    saveProfiles(head)
    if (activeId && !head.some((p) => p.id === activeId)) {
      setActiveProfileId(head[0]!.id)
    }

    return head
  } catch {
    return []
  }
}

export function saveProfiles(profiles: Profile[]) {
  window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

export function addProfile(name: string): Profile | null {
  const existing = loadProfiles()
  if (existing.length >= MAX_PROFILES) {
    return null
  }
  const normalized = normalizeName(name) || 'Profil'
  const profile: Profile = { id: createId(), name: normalized, createdAt: Date.now() }
  saveProfiles([...existing, profile])
  return profile
}

export function renameProfile(profileId: string, name: string): Profile | null {
  const normalized = normalizeName(name)
  if (!normalized) return null

  const profiles = loadProfiles()
  const index = profiles.findIndex((p) => p.id === profileId)
  if (index < 0) return null

  const updated: Profile = { ...profiles[index]!, name: normalized }
  const next = [...profiles]
  next[index] = updated
  saveProfiles(next)
  return updated
}

export function deleteProfile(profileId: string): boolean {
  const profiles = loadProfiles()
  if (profiles.length <= 1) return false
  if (!profiles.some((p) => p.id === profileId)) return false

  const next = profiles.filter((p) => p.id !== profileId)
  saveProfiles(next)

  const activeId = getActiveProfileId()
  if (activeId === profileId) {
    setActiveProfileId(next[0]!.id)
  }

  return true
}

export function ensureDefaultProfile(): Profile {
  const profiles = loadProfiles()
  if (profiles.length > 0) return profiles[0]!
  const created = addProfile('Profil 1')
  if (created) {
    setActiveProfileId(created.id)
    return created
  }
  const fallback: Profile = { id: createId(), name: 'Profil 1', createdAt: Date.now() }
  saveProfiles([fallback])
  setActiveProfileId(fallback.id)
  return fallback
}

export function getActiveProfileId(): string | null {
  const id = window.localStorage.getItem(ACTIVE_PROFILE_KEY)
  return id && id.length > 0 ? id : null
}

export function setActiveProfileId(profileId: string) {
  window.localStorage.setItem(ACTIVE_PROFILE_KEY, profileId)
}

export function getActiveProfile(): Profile | null {
  const id = getActiveProfileId()
  if (!id) return null
  return loadProfiles().find((p) => p.id === id) ?? null
}
