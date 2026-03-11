import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PROJECTS: 'sl_projects',
  ACTIVE_PROJECT: 'sl_active_project',
  SETTINGS: 'sl_settings',
  PHOTO_LOG: 'sl_photo_log',
};

// --- Projects ---
export async function getProjects() {
  const raw = await AsyncStorage.getItem(KEYS.PROJECTS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveProject(project) {
  const projects = await getProjects();
  const existing = projects.findIndex((p) => p.id === project.id);
  if (existing >= 0) projects[existing] = project;
  else projects.push(project);
  await AsyncStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
}

export async function deleteProject(id) {
  const projects = await getProjects();
  await AsyncStorage.setItem(
    KEYS.PROJECTS,
    JSON.stringify(projects.filter((p) => p.id !== id))
  );
}

export async function getActiveProject() {
  const raw = await AsyncStorage.getItem(KEYS.ACTIVE_PROJECT);
  return raw ? JSON.parse(raw) : null;
}

export async function setActiveProject(project) {
  await AsyncStorage.setItem(KEYS.ACTIVE_PROJECT, JSON.stringify(project));
}

// --- Settings ---
const DEFAULT_SETTINGS = {
  quality: 'high',           // low | medium | high | raw
  watermarks: {
    gps: true,
    timestamp: true,
    resolution: false,
    fileSize: false,
    projectName: true,
  },
  useCustomDateTime: false,
  customDateTime: null,
  removeAds: false,
};

export async function getSettings() {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

export async function saveSettings(settings) {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// --- Photo Log ---
export async function getPhotoLog() {
  const raw = await AsyncStorage.getItem(KEYS.PHOTO_LOG);
  return raw ? JSON.parse(raw) : [];
}

export async function addPhotoToLog(photo) {
  const log = await getPhotoLog();
  log.unshift(photo); // newest first
  await AsyncStorage.setItem(KEYS.PHOTO_LOG, JSON.stringify(log));
}

export async function deletePhotosFromLog(uris) {
  const log = await getPhotoLog();
  const filtered = log.filter((p) => !uris.includes(p.uri));
  await AsyncStorage.setItem(KEYS.PHOTO_LOG, JSON.stringify(filtered));
}

// Quality to Expo quality number (0–1)
export const QUALITY_MAP = {
  low: 0.3,
  medium: 0.6,
  high: 0.9,
  raw: 1.0,
};

export const QUALITY_LABELS = {
  low: 'Low (~500KB)',
  medium: 'Medium (~1.5MB)',
  high: 'High (~4MB)',
  raw: 'RAW (~8MB+)',
};
