"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Try DemoPilot with basic features",
    features: [
      "3 demos per month",
      "720p video quality",
      "AI voiceover",
      "Basic branding",
      "Shareable links",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For teams shipping demos weekly",
    features: [
      "Unlimited demos",
      "1080p video quality",
      "AI voiceover & captions",
      "Full brand customization",
      "Analytics dashboard",
      "Custom domains",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored for large organizations",
    features: [
      "Everything in Pro",
      "4K video quality",
      "SSO / SAML",
      "Dedicated agent pool",
      "API access",
      "SLA guarantee",
      "Dedicated CSM",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function Pricing({ onOpenAuth }: { onOpenAuth: () => void }) {
  return (
    <section id="pricing" className="relative py-32 px-6">
      <div className="pointer-events-none absolute inset-0 warm-gradient-bg opacity-40" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-warm"
          >
            Pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl"
          >
            Simple, transparent pricing
          </motion.h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all ${
                plan.highlighted
                  ? "border-foreground bg-white shadow-xl"
                  : "border-border bg-white hover:shadow-lg"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-warm px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-1 text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="font-serif text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onOpenAuth}
                className={`h-12 rounded-xl font-medium transition-all ${
                  plan.highlighted
                    ? "bg-foreground text-white hover:opacity-80"
                    : "border border-border bg-white text-foreground hover:bg-stone-50"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
