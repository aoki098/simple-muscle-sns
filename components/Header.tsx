"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { User } from "lucide-react"; 

export default function Header() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setAvatarUrl(data.avatar_url);
        }
      }
    };
    fetchProfile();
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full p-4 z-50 pointer-events-none">
      <Link 
        href="/profile" 
        className="pointer-events-auto w-10 h-10 rounded-full overflow-hidden border-2 border-gray-600 shadow-lg bg-gray-800 flex items-center justify-center transition-transform active:scale-90 hover:opacity-80 inline-block"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <User className="w-6 h-6 text-gray-400" />
        )}
      </Link>
    </header>
  );
}