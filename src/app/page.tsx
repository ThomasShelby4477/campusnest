import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, Users, MapPin, MessageCircle, Sparkles, ArrowRight, Star } from 'lucide-react'
import { HeroListingStack } from './hero-listing-stack'

const features = [
  {
    icon: Shield,
    title: 'Verified Students Only',
    description: 'Every user is verified with their NFSU student ID. No scams, no brokers — just real students and landlords.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: Users,
    title: 'Smart Roommate Matching',
    description: 'Our compatibility algorithm matches you with roommates based on lifestyle, budget, sleep schedule, and more.',
    color: 'text-coral',
    bg: 'bg-coral/10',
  },
  {
    icon: MapPin,
    title: 'Map-First Search',
    description: 'Find PGs, shared rooms, and flats on an interactive map. Filter by distance from campus, rent, and amenities.',
    color: 'text-navy',
    bg: 'bg-navy/10',
  },
  {
    icon: MessageCircle,
    title: 'Real-time Chat',
    description: 'Chat instantly with your matched roommates. Typing indicators, read receipts, and push notifications built in.',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
]

const stats = [
  { value: '100%', label: 'Verified Profiles' },
  { value: '0', label: 'Broker Fees' },
  { value: '< 2 min', label: 'To Find a Match' },
  { value: '24/7', label: 'Real-time Chat' },
]

const steps = [
  { num: '01', title: 'Sign Up & Verify', desc: 'Create an account with your @nfsu.ac.in email and upload your student ID for verification.' },
  { num: '02', title: 'Browse or Match', desc: 'Search listings on the map or take the lifestyle quiz to find compatible roommates.' },
  { num: '03', title: 'Connect & Move In', desc: 'Chat with matches and landlords, visit properties, and move into your new home.' },
]

export default function HomePage() {
  return (
    <div className="bg-white">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy min-h-[90vh] flex items-center">
        {/* Animated gradient orbs */}
        <div className="absolute top-[-30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-coral/20 blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-navy-light/40 blur-[100px]" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/90 text-sm font-medium mb-8 border border-white/10">
                <Sparkles className="w-4 h-4 text-coral" />
                Built exclusively for NFSU students
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6">
                Find Your
                <br />
                <span className="text-coral italic">Perfect</span> Home
                <br />
                Near Campus.
              </h1>
              <p className="text-lg sm:text-xl text-white/70 max-w-lg mb-10 leading-relaxed">
                Verified listings, smart roommate matching, and zero broker fees — 
                all designed for the NFSU community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto bg-coral hover:bg-coral-dark text-white text-lg h-14 px-10 rounded-full font-bold shadow-xl shadow-coral/30 transition-all hover:shadow-2xl hover:shadow-coral/40 hover:-translate-y-0.5">
                    Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/search">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 text-lg h-14 px-10 rounded-full font-bold">
                    Browse Listings
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero visual — real animated listing stack */}
            <div className="hidden lg:flex justify-center items-center relative animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <HeroListingStack />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────── */}
      <section className="bg-muted-bg border-y border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-navy">{stat.value}</p>
                <p className="text-sm text-text-muted font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-coral font-bold text-sm tracking-widest uppercase mb-3">Why CampusNest?</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy leading-tight mb-4">
              Everything students need,
              <br />nothing they don&apos;t.
            </h2>
            <p className="text-text-muted text-lg">
              We built CampusNest to solve the exact problems NFSU students face every semester.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="group bg-white border border-border-light rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="font-bold text-navy text-lg mb-2">{f.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-80 h-80 rounded-full bg-coral/20 blur-[80px]" />
          <div className="absolute bottom-10 left-20 w-60 h-60 rounded-full bg-navy-light/40 blur-[60px]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-coral font-bold text-sm tracking-widest uppercase mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              Three steps to your new home.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <div key={i} className="relative group">
                <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                  <span className="text-6xl font-black text-coral/30 group-hover:text-coral/50 transition-colors">{step.num}</span>
                  <h3 className="text-xl font-bold text-white mt-4 mb-3">{step.title}</h3>
                  <p className="text-white/60 leading-relaxed">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-8 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-white/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-coral font-bold text-sm tracking-widest uppercase mb-3">Student Stories</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy leading-tight">
              Loved by NFSU students.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Priya M.', branch: 'Forensic Science', year: '3rd Year', quote: 'Found my roommate in literally 10 minutes. The compatibility quiz is genius — we have the same sleep schedule and food preferences!' },
              { name: 'Arjun K.', branch: 'Cybersecurity', year: '2nd Year', quote: 'No more getting scammed by fake listings. Every property is verified and I can see the exact distance from campus on the map.' },
              { name: 'Sneha R.', branch: 'Digital Forensics', year: '4th Year', quote: 'The buddy system is amazing. I found a house-hunting partner and we split a 2BHK near Gate 3. Zero broker fees!' },
            ].map((t, i) => (
              <div key={i} className="bg-white border border-border-light rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-text-primary leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border-light">
                  <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center font-bold text-navy">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-text-primary text-sm">{t.name}</p>
                    <p className="text-text-muted text-xs">{t.branch} • {t.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-muted-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy leading-tight mb-6">
            Ready to find your
            <span className="text-coral italic"> nest</span>?
          </h2>
          <p className="text-text-muted text-lg mb-10 max-w-xl mx-auto">
            Join hundreds of NFSU students who&apos;ve already found their perfect housing and roommates through CampusNest.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-coral hover:bg-coral-dark text-white text-lg h-14 px-12 rounded-full font-bold shadow-xl shadow-coral/30 transition-all hover:shadow-2xl hover:shadow-coral/40 hover:-translate-y-0.5">
              Create Free Account <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-navy border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-xl font-black text-white italic tracking-tight mb-3">CampusNest.</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Student housing &amp; roommate matching built for the NFSU community.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><Link href="/search" className="text-white/50 hover:text-white text-sm transition-colors">Search Listings</Link></li>
                <li><Link href="/roommates" className="text-white/50 hover:text-white text-sm transition-colors">Find Roommates</Link></li>
                <li><Link href="/create-listing" className="text-white/50 hover:text-white text-sm transition-colors">Post a Listing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-white/50 hover:text-white text-sm transition-colors">About</Link></li>
                <li><Link href="/guidelines" className="text-white/50 hover:text-white text-sm transition-colors">Community Guidelines</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-white/50 hover:text-white text-sm transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link href="/privacy" className="text-white/50 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/30 text-sm">
            © {new Date().getFullYear()} CampusNest. Built with ♥ for NFSU students.
          </div>
        </div>
      </footer>

    </div>
  )
}
