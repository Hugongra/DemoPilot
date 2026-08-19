"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import DemoPlayer from "@/components/DemoPlayer";
import Pricing from "@/components/Pricing";
import AuthModal from "@/components/AuthModal";
import Footer from "@/components/Footer";

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);

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
