import Link from 'next/link'
import { ArrowRight, Shield, Coins, Users, Home } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Swap stays.
              <br />
              <span className="text-primary">Stop paying rent twice.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Verto connects remote workers and travelers for short-to-medium stays.
              Build trust through vouches, exchange stays with credits, and explore the world.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
              >
                Get started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Browse stays
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How Verto works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-card">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Build trust</h3>
              <p className="text-gray-600">
                Get vouched for by friends, family, or coworkers. The more vouches you have,
                the more trustworthy you appear to hosts and guests.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-card">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Earn credits</h3>
              <p className="text-gray-600">
                Host travelers and earn credits. 1 credit = 1 night in a room.
                Use credits to book stays elsewhere without paying twice.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-card">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Stay anywhere</h3>
              <p className="text-gray-600">
                Browse verified listings, request stays from 1 week to 3 months,
                and experience local living as a remote worker or traveler.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Trust built on real connections
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Unlike anonymous platforms, Verto builds trust through social vouching.
              When someone you know vouches for a user, you can feel confident
              about hosting them or staying at their place.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Vouch verification</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Host tier system</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Two-way reviews</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Referral network</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start swapping?
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Join Verto today and become part of a community of remote workers
            and travelers who help each other explore the world.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Create your profile
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
