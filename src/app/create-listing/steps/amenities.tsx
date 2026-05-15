'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useListingStore, type WaterSupply } from '@/stores/listing-store'
import { Wifi, Wind, UtensilsCrossed, Droplets, Clock, Wrench } from 'lucide-react'

interface Props {
  onNext: () => void
  onBack: () => void
}

const WATER_OPTIONS: { value: WaterSupply; label: string; desc: string; Icon: typeof Droplets }[] = [
  { value: '24H', label: '24/7 Supply', desc: 'Round-the-clock water', Icon: Droplets },
  { value: 'TIMED', label: 'Specific Timings', desc: 'Fixed schedule', Icon: Clock },
  { value: 'BOREWELL', label: 'Borewell Only', desc: 'Groundwater source', Icon: Wrench },
]

export function AmenitiesStep({ onNext, onBack }: Props) {
  const store = useListingStore()

  const isValid = store.description.length <= 1000

  return (
    <div className="bg-white rounded-3xl border border-border-light shadow-lg shadow-navy/[0.03] p-6 sm:p-8 space-y-8">

      {/* Section: Amenities */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
            <Wifi className="w-3.5 h-3.5 text-coral" />
          </div>
          <h2 className="text-lg font-bold text-navy">Provided Amenities</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: 'has_wifi' as const, label: 'Wi-Fi', desc: 'High-speed internet', Icon: Wifi },
            { key: 'has_ac' as const, label: 'Air Conditioning', desc: 'Cool comfort', Icon: Wind },
            { key: 'food_available' as const, label: 'Food Available', desc: 'Meals included', Icon: UtensilsCrossed },
          ].map(({ key, label, desc, Icon }) => {
            const isActive = store[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => store.updateField(key, !isActive)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isActive
                    ? 'border-coral bg-coral/[0.06] shadow-sm'
                    : 'border-border-light hover:border-navy/20 hover:bg-muted-bg'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-coral/10' : 'bg-muted-bg'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-coral' : 'text-text-muted'}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${isActive ? 'text-coral' : 'text-navy'}`}>{label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
                {isActive && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-coral flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Section: Water Supply */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
            <Droplets className="w-3.5 h-3.5 text-coral" />
          </div>
          <h2 className="text-lg font-bold text-navy">Water Supply</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {WATER_OPTIONS.map(({ value, label, desc, Icon }) => {
            const isActive = store.water_supply === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => store.updateField('water_supply', value)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isActive
                    ? 'border-coral bg-coral/[0.06] shadow-sm'
                    : 'border-border-light hover:border-navy/20 hover:bg-muted-bg'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-coral/10' : 'bg-muted-bg'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-coral' : 'text-text-muted'}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${isActive ? 'text-coral' : 'text-navy'}`}>{label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
                {isActive && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-coral flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Section: Description */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-coral"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <h2 className="text-lg font-bold text-navy">Description</h2>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            store.description.length > 1000 
              ? 'bg-danger/10 text-danger' 
              : 'bg-muted-bg text-text-muted'
          }`}>
            {store.description.length}/1000
          </span>
        </div>
        <Textarea 
          id="desc"
          placeholder="Describe your property — what makes it great? Mention the neighborhood, nearby shops, house rules, and anything else tenants should know."
          value={store.description}
          onChange={(e) => store.updateField('description', e.target.value)}
          className="min-h-[140px] rounded-2xl border-border-light focus-visible:ring-coral/20 text-sm leading-relaxed resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-text-muted hover:text-navy transition-colors px-2"
        >
          ← Back
        </button>
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="flex-1 h-12 bg-coral hover:bg-coral-dark text-white font-semibold text-base rounded-2xl shadow-md shadow-coral/20 transition-all hover:shadow-lg hover:shadow-coral/25 active:scale-[0.98]"
        >
          Continue to Location →
        </Button>
      </div>
    </div>
  )
}
