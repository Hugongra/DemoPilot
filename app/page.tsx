"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import DemoPlayer from "@/components/DemoPlayer";
import Pricing from "@/components/Pricing";
import AuthModal from "@/components/AuthModal";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/dashboard");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) router.push("/dashboard");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <>
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      <Hero onOpenAuth={() => setAuthOpen(true)} />
      <Features />
      <DemoPlayer />
      <Pricing onOpenAuth={() => setAuthOpen(true)} />
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
