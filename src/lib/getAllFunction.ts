import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { generateUUIDFromString } from '../utils/generateUUID';

interface UserProfile {
  id: number;
  email?: string;
  phone_no?: string;
  role: 'admin' | 'user';
  first_name?: string;
  last_name?: string;
  userId?: string;
}

interface Asset {
  id?: string;
  asset_name: string;
  color: string;
  vin: string;
  make: string;
  model: string;
  year: number | null;
  odometer: number | null;
  mileage: number | null;
  user_id: string;
  photo?: string | null;
  photos?: string[] | null;
  state?: string | null;
}

export const fetchAssets = async (
  session: Session | null,
  userProfile: UserProfile | null,
  setLoading: (loading: boolean) => void,
  setAssets: (assets: Asset[]) => void,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
) => {
    if (!session?.user?.id || userProfile?.role !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let filterUserId = session?.user?.id;
      
      if (!filterUserId && userProfile) {
        const identifier = userProfile.phone_no || `user_${userProfile.id}`;
        filterUserId = generateUUIDFromString(identifier);
      }

      if (!filterUserId) {
        setAssets([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', filterUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
      showToast(err.message || 'Failed to fetch assets', 'error');
    } finally {
      setLoading(false);
    }
  };