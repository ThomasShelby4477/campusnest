'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Sun, Moon, Sunrise, Cigarette, CigaretteOff, Wine, WineOff, Salad, Drumstick, EggFried, Utensils, BookOpen, Volume2, Ear } from 'lucide-react'
import { toast } from 'sonner'

type QuizData = {
  budget_min: number | ''
  budget_max: number | ''
  sleep_schedule: string
  cleanliness: number
  smoking: boolean | null
  drinking: boolean | null
  food_pref: string
  study_env: string
  personality: string
  guests_policy: string
}

export default function RoommateQuizPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [data, setData] = useState<QuizData>({
    budget_min: '',
    budget_max: '',
    sleep_schedule: '',
    cleanliness: 0,
    smoking: null,
    drinking: null,
    food_pref: '',
    study_env: '',
    personality: '',
    guests_policy: '',
  })

  const goToNext = () => {
    if (step === 8) {
      handleSubmit()
      return
    }
    setIsTransitioning(true)
    setTimeout(() => {
      setStep((s) => s + 1)
      setIsTransitioning(false)
    }, 200)
  }

  const goToPrev = () => {
    if (step === 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setStep((s) => s - 1)
      setIsTransitioning(false)
    }, 200)
  }

  const update = (field: keyof QuizData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Session expired')
        router.push('/login')
        return
      }

      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        budget_min: Number(data.budget_min),
        budget_max: Number(data.budget_max),
        sleep_schedule: data.sleep_schedule,
        cleanliness: data.cleanliness,
        smoking: data.smoking,
        drinking: data.drinking,
        food_pref: data.food_pref,
        study_env: data.study_env,
        personality: data.personality,
        guests_policy: data.guests_policy,
        quiz_completed: true,
      })

      if (error) throw error

      toast.success('Preferences saved!')
      router.push('/roommates')
    } catch (err) {
      toast.error('Failed to save preferences')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted-bg flex flex-col items-center pt-8 px-4 sm:px-6">
      <div className="w-full max-w-lg mb-8">
        <div className="flex justify-between text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
          <span>Question {step} of 8</span>
          <span>{Math.round((step / 8) * 100)}%</span>
        </div>
        <div className="h-2 bg-border-light rounded-full overflow-hidden">
          <div 
            className="h-full bg-navy transition-all duration-300 ease-out" 
            style={{ width: `${(step / 8) * 100}%` }}
          />
        </div>
      </div>

      <div className={`w-full max-w-lg transition-all duration-200 ease-out ${isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
        
        {step === 1 && (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold text-navy">What's your monthly budget?</h1>
            <p className="text-text-muted">Set a realistic range for rent and utilities.</p>
            <div className="flex gap-4 items-center">
              <div className="flex-1 space-y-2">
                <Label>Minimum (₹)</Label>
                <Input type="number" placeholder="2000" value={data.budget_min} onChange={(e) => update('budget_min', e.target.value)} />
              </div>
              <span className="mt-8 font-bold text-text-muted">-</span>
              <div className="flex-1 space-y-2">
                <Label>Maximum (₹)</Label>
                <Input type="number" placeholder="15000" value={data.budget_max} onChange={(e) => update('budget_max', e.target.value)} />
              </div>
            </div>
            <Button className="w-full h-12 bg-coral text-white hover:bg-coral-dark mt-4" onClick={goToNext} disabled={!data.budget_min || !data.budget_max}>Next</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-navy">Your sleep schedule</h1>
            <div className="grid gap-4">
              <div onClick={() => { update('sleep_schedule', 'EARLY_BIRD'); goToNext() }} className={`p-6 border-2 rounded-2xl cursor-pointer transition-colors flex items-center gap-4 ${data.sleep_schedule === 'EARLY_BIRD' ? 'border-coral bg-coral/5' : 'border-border-light bg-white hover:border-navy/30'}`}>
                <Sunrise className="w-8 h-8 text-coral" />
                <div>
                  <h3 className="font-bold text-lg text-text-primary">Early Bird</h3>
                  <p className="text-sm text-text-muted">Asleep by 11 PM, awake by 7 AM</p>
                </div>
              </div>
              <div onClick={() => { update('sleep_schedule', 'NIGHT_OWL'); goToNext() }} className={`p-6 border-2 rounded-2xl cursor-pointer transition-colors flex items-center gap-4 ${data.sleep_schedule === 'NIGHT_OWL' ? 'border-coral bg-coral/5' : 'border-border-light bg-white hover:border-navy/30'}`}>
                <Moon className="w-8 h-8 text-navy" />
                <div>
                  <h3 className="font-bold text-lg text-text-primary">Night Owl</h3>
                  <p className="text-sm text-text-muted">Stay up late, sleep in</p>
                </div>
              </div>
              <div onClick={() => { update('sleep_schedule', 'FLEXIBLE'); goToNext() }} className={`p-6 border-2 rounded-2xl cursor-pointer transition-colors flex items-center gap-4 ${data.sleep_schedule === 'FLEXIBLE' ? 'border-coral bg-coral/5' : 'border-border-light bg-white hover:border-navy/30'}`}>
                <Sun className="w-8 h-8 text-warning" />
                <div>
                  <h3 className="font-bold text-lg text-text-primary">Flexible</h3>
                  <p className="text-sm text-text-muted">My schedule varies</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-navy">How clean are you?</h1>
            <p className="text-text-muted mb-8">1 = Organized chaos, 5 = Neat freak</p>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => update('cleanliness', num)}
                  className={`w-14 h-14 rounded-full font-bold text-xl transition-all ${data.cleanliness === num ? 'bg-coral text-white scale-110' : 'bg-white border-2 border-border-light text-text-primary hover:border-coral/50'}`}
                >
                  {num}
                </button>
              ))}
            </div>
            <Button className="w-full h-12 bg-coral text-white mt-8" onClick={goToNext} disabled={!data.cleanliness}>Next</Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-navy">Do you smoke?</h1>
            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => { update('smoking', true); goToNext() }} className={`p-6 text-center border-2 rounded-2xl cursor-pointer transition-colors ${data.smoking === true ? 'border-coral bg-coral/5' : 'border-border-light bg-white'}`}>
                <Cigarette className="w-10 h-10 mx-auto mb-3 text-text-muted" />
                <span className="font-bold">Yes</span>
              </div>
              <div onClick={() => { update('smoking', false); goToNext() }} className={`p-6 text-center border-2 rounded-2xl cursor-pointer transition-colors ${data.smoking === false ? 'border-coral bg-coral/5' : 'border-border-light bg-white'}`}>
                <CigaretteOff className="w-10 h-10 mx-auto mb-3 text-success" />
                <span className="font-bold">No</span>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-navy">Do you drink alcohol?</h1>
            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => { update('drinking', true); goToNext() }} className={`p-6 text-center border-2 rounded-2xl cursor-pointer transition-colors ${data.drinking === true ? 'border-coral bg-coral/5' : 'border-border-light bg-white'}`}>
                <Wine className="w-10 h-10 mx-auto mb-3 text-text-muted" />
                <span className="font-bold">Yes</span>
              </div>
              <div onClick={() => { update('drinking', false); goToNext() }} className={`p-6 text-center border-2 rounded-2xl cursor-pointer transition-colors ${data.drinking === false ? 'border-coral bg-coral/5' : 'border-border-light bg-white'}`}>
                <WineOff className="w-10 h-10 mx-auto mb-3 text-success" />
                <span className="font-bold">No</span>
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-navy">Food preference</h1>
            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => { update('food_pref', 'VEG'); goToNext() }} className={`p-4 text-center border-2 rounded-xl cursor-pointer ${data.food_pref === 'VEG' ? 'border-coral bg-coral/5' : 'border-border-light bg-white'}`}>
                <Salad className="w-8 h-8 mx-auto mb-2 text-success" />
                <span className="font-bold text-sm">Vegetarian</span>
              </div>
              <div onClick={() => { update('food_pref', 'NON_VEG'); goToNext() }} className={`p-4 text-center border-2 rounded-xl cursor-pointer ${data.food_pref === 'NON_VEG' ? 'border-coral bg-coral/5' : 'border-border-light bg-white'}`}>
                <Drumstick className="w-8 h-8 mx-auto mb-2 text-danger" />
                <span className="font-bold text-sm">Non-Veg</span>
              </div>
              <div onClick={() => { update('food_pref', 'EGGETARIAN'); goToNext() }} className={`p-4 text-center border-2 rounded-xl cursor-pointer ${data.food_pref === 'EGGETARIAN' ? 'border-coral bg-coral/5' : 'border-border-light bg-white'}`}>
                <EggFried className="w-8 h-8 mx-auto mb-2 text-warning" />
                <span className="font-bold text-sm">Eggetarian</span>
              </div>
              <div onClick={() => { update('food_pref', 'ANY'); goToNext() }} className={`p-4 text-center border-2 rounded-xl cursor-pointer ${data.food_pref === 'ANY' ? 'border-coral bg-coral/5' : 'border-border-light bg-white'}`}>
                <Utensils className="w-8 h-8 mx-auto mb-2 text-navy" />
                <span className="font-bold text-sm">Any</span>
              </div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-navy">Ideal study environment</h1>
            <div className="grid gap-3">
              <div onClick={() => { update('study_env', 'SILENT'); goToNext() }} className={`p-5 border-2 rounded-xl cursor-pointer flex items-center gap-4 ${data.study_env === 'SILENT' ? 'border-coral bg-coral/5' : 'border-border-light bg-white'}`}>
                <Ear className="w-6 h-6 text-text-muted" />
                <span className="font-bold">Pin-drop silent</span>
              </div>
              <div onClick={() => { update('study_env', 'LIGHT_NOISE'); goToNext() }} className={`p-5 border-2 rounded-xl cursor-pointer flex items-center gap-4 ${data.study_env === 'LIGHT_NOISE' ? 'border-coral bg-coral/5' : 'border-border-light bg-white'}`}>
                <BookOpen className="w-6 h-6 text-text-muted" />
                <span className="font-bold">Light background noise</span>
              </div>
              <div onClick={() => { update('study_env', 'NOISY'); goToNext() }} className={`p-5 border-2 rounded-xl cursor-pointer flex items-center gap-4 ${data.study_env === 'NOISY' ? 'border-coral bg-coral/5' : 'border-border-light bg-white'}`}>
                <Volume2 className="w-6 h-6 text-text-muted" />
                <span className="font-bold">I don't mind noise</span>
              </div>
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold text-navy">Almost done!</h1>
            
            <div className="space-y-3">
              <Label className="text-base">Personality</Label>
              <div className="grid grid-cols-3 gap-2">
                {['INTROVERT', 'AMBIVERT', 'EXTROVERT'].map(p => (
                  <div key={p} onClick={() => update('personality', p)} className={`p-3 text-center border-2 rounded-lg cursor-pointer text-sm font-bold ${data.personality === p ? 'border-coral bg-coral/5 text-coral' : 'border-border-light bg-white'}`}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Guests Policy</Label>
              <div className="grid grid-cols-3 gap-2">
                {['RARELY', 'SOMETIMES', 'OFTEN'].map(g => (
                  <div key={g} onClick={() => update('guests_policy', g)} className={`p-3 text-center border-2 rounded-lg cursor-pointer text-sm font-bold ${data.guests_policy === g ? 'border-coral bg-coral/5 text-coral' : 'border-border-light bg-white'}`}>
                    {g.charAt(0) + g.slice(1).toLowerCase()}
                  </div>
                ))}
              </div>
            </div>

            <Button 
              className="w-full h-12 bg-coral text-white hover:bg-coral-dark" 
              onClick={handleSubmit} 
              disabled={!data.personality || !data.guests_policy || submitting}
            >
              {submitting ? 'Saving...' : 'Finish & Find Roommates'}
            </Button>
          </div>
        )}

        {step > 1 && (
          <Button variant="ghost" onClick={goToPrev} className="mt-8 text-text-muted w-full" disabled={submitting}>
            Go Back
          </Button>
        )}
      </div>
    </div>
  )
}
