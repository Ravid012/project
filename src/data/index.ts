import { getDataBackend } from '@/src/lib/supabase';
import { localRepository } from '@/src/data/localAdapter';
import { supabaseRepository } from '@/src/data/supabaseAdapter';
import type { TripPotRepository } from '@/src/data/repository';

export type { TripPotRepository } from '@/src/data/repository';
export { localRepository } from '@/src/data/localAdapter';
export { supabaseRepository } from '@/src/data/supabaseAdapter';

/**
 * Adapter selector.
 * Default: local Zustand store when EXPO_PUBLIC_SUPABASE_* keys are missing.
 * Screens continue to call useAppStore for the MVP loop.
 */
export function getRepository(): TripPotRepository {
  return getDataBackend() === 'supabase' ? supabaseRepository : localRepository;
}

export const repository = getRepository();
