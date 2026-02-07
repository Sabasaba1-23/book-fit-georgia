import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface PartnerProfile {
  id: string;
  display_name: string;
  logo_url: string | null;
  partner_type: string;
  approved: boolean;
  bio: string | null;
  sports: string[] | null;
  location: string | null;
  languages: string[] | null;
}

export function usePartnerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("partner_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setProfile(data as PartnerProfile | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return { profile, loading, refetch: fetchProfile };
}
