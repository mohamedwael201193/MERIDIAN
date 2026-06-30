'use client'

import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import TrustedBy from '@/components/TrustedBy'
import Features from '@/components/Features'
import UseCases from '@/components/UseCases'
import Pricing from '@/components/Pricing'
import Testimonials from '@/components/Testimonials'
import FAQ from '@/components/FAQ'
import CtaBanner from '@/components/CtaBanner'
import Footer from '@/components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main>
        <Hero />
        <TrustedBy />
        <Features />
        <UseCases />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  )
}
