'use client'

import { useState } from 'react'
import {
  Shield, Check, FileText, Cloud, Camera, BarChart3,
  ChevronRight, Smartphone, Lock, Heart, Download, Star, Ticket, Users, Copy
} from 'lucide-react'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.aicashkick.reunify'

const FEATURES = [
  {
    icon: Shield,
    title: 'Case Plan Tracking',
    desc: 'Track every requirement — drug tests, counseling, visits, court dates — in one place.',
  },
  {
    icon: Camera,
    title: 'AI Scan Case Plan',
    desc: 'Snap a photo of your case plan and the AI extracts every requirement automatically.',
  },
  {
    icon: BarChart3,
    title: 'Progress Dashboard',
    desc: 'See your compliance rate, streaks, and what\'s next at a glance.',
  },
  {
    icon: FileText,
    title: 'Court-Ready Reports',
    desc: 'Generate professional reports with compliance narrative and case strength score.',
  },
  {
    icon: Cloud,
    title: 'Cloud Backup',
    desc: 'Encrypted cloud backup so your records are never lost, even if your phone is.',
  },
  {
    icon: Lock,
    title: 'Private & Secure',
    desc: 'Data stays on your phone. Biometric lock. No one sees your info but you.',
  },
]

const TESTIMONIALS = [
  {
    text: 'I was drowning in court dates and drug test schedules. This app keeps me on track.',
    who: 'Parent, California',
  },
  {
    text: 'The court-ready report impressed my judge. She asked where I got it.',
    who: 'Parent, Texas',
  },
  {
    text: 'I recommend this to every family on my caseload. It helps them stay compliant.',
    who: 'Social Worker, Ohio',
  },
]

export function LandingPage() {
  const [ref] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('ref') || 'direct'
    }
    return 'direct'
  })

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-amber-50" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20">
                <Heart className="size-6 sm:size-7 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Reunify
              </h1>
            </div>

            <h2 className="text-xl sm:text-3xl font-bold max-w-3xl mx-auto leading-tight">
              Track your CPS case plan.{' '}
              <span className="text-emerald-600">Bring your kids home.</span>
            </h2>

            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              The free app that helps parents track drug tests, counseling, visits, and court dates.
              Stay organized. Stay compliant. Show the judge you&apos;re doing the work.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`${PLAY_STORE_URL}&referrer=${ref}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-xl text-base font-semibold hover:bg-gray-800 transition-colors shadow-lg"
              >
                <Download className="size-5" />
                Get it on Google Play
              </a>
              <span className="text-sm text-gray-500">Free — no account needed</span>
            </div>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 pt-1">
              <span className="flex items-center gap-1">
                <Lock className="size-3.5" /> Private
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Smartphone className="size-3.5" /> Works offline
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Shield className="size-3.5" /> No ads
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h3 className="text-center text-xl sm:text-2xl font-bold mb-8 sm:mb-12">
            Everything you need to stay on track
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 mb-3">
                  <f.icon className="size-5 text-emerald-600" />
                </div>
                <h4 className="font-semibold mb-1">{f.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it helps */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h3 className="text-center text-xl sm:text-2xl font-bold mb-8">
            How Reunify helps you
          </h3>
          <div className="space-y-4">
            {[
              'Log every drug test, counseling session, and supervised visit as it happens',
              'See your compliance rate and what requirements are coming up next',
              'Generate a professional report to bring to court — judges notice',
              'Never miss a court date or deadline with built-in reminders',
              'Your data stays on your phone — private, encrypted, yours',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold mt-0.5">
                  {i + 1}
                </div>
                <p className="text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 bg-emerald-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h3 className="text-center text-xl sm:text-2xl font-bold mb-8">
            What people are saying
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="size-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <p className="text-xs text-gray-500 mt-3 font-medium">— {t.who}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pro */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span className="text-base">👑</span> Pro
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mb-3">
            Free app, every essential feature. Pro adds the extras.
          </h3>
          <p className="text-gray-600 mb-6">
            The free app tracks everything with no limits. Pro adds court-ready PDF reports with compliance narrative,
            cloud backup &amp; restore, and AI case plan scanning.{' '}
            <strong>7-day free trial</strong>, then $4.99/mo or $39.99/yr.
          </p>
        </div>
      </section>

      {/* For Professionals — Promo Code */}
      <section className="py-12 sm:py-16 bg-amber-50/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Users className="size-4" /> For Professionals
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mb-3">
            Social workers, attorneys &amp; CASA volunteers
          </h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Help the families on your caseload stay compliant. Share Reunify with them — and use this
            promo code to get <strong>90 days of Pro features free</strong> (court-ready reports, cloud backup, AI scanning).
          </p>
          <div className="inline-flex items-center gap-3 bg-white border-2 border-amber-300 rounded-xl px-5 py-3 shadow-sm">
            <Ticket className="size-5 text-amber-500" />
            <span className="text-lg font-mono font-bold text-gray-900 tracking-wider">reunify-review</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText('reunify-review')
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Copy promo code"
            >
              <Copy className="size-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Enter in app under Go Pro → Have a promo code?
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <a
              href={`${PLAY_STORE_URL}&referrer=${ref}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800 transition-colors"
            >
              <Download className="size-4" /> Download for your families
            </a>
            <span className="hidden sm:inline text-gray-300">|</span>
            <a
              href={`https://reunify-six.vercel.app/?landing&ref=socialworker`}
              className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800 transition-colors"
            >
              <ChevronRight className="size-4" /> Share landing page
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <h3 className="text-2xl sm:text-3xl font-bold">
            Every step brings you closer to your kids.
          </h3>
          <p className="text-emerald-100 text-base sm:text-lg">
            Download Reunify today. It&apos;s free, private, and works offline.
          </p>
          <a
            href={`${PLAY_STORE_URL}&referrer=${ref}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3.5 rounded-xl text-base font-semibold hover:bg-emerald-50 transition-colors shadow-lg"
          >
            <Download className="size-5" />
            Download on Google Play
          </a>
          <p className="text-sm text-emerald-200">
            Available on Android · No account needed · Your data stays on your phone
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-gray-900 text-gray-400 text-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} AICashKick — Reunify</p>
          <p>Built by a parent who&apos;s been there.</p>
        </div>
      </footer>
    </div>
  )
}
