'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useListingStore, type RoomType, type Furnished, type GenderAllowed } from '@/stores/listing-store'
import { BedSingle, Sofa, Users, Calendar, Banknote, PencilLine } from 'lucide-react'

interface Props {
  onNext: () => void
}

const ROOM_TYPES: { value: RoomType; label: string; desc: string }[] = [
  { value: 'SINGLE', label: 'Single Room', desc: 'Private room for 1' },
  { value: 'SHARED', label: 'Shared Room', desc: 'Shared with others' },
  { value: '1BHK', label: '1 BHK', desc: 'Bedroom + hall + kitchen' },
  { value: '2BHK', label: '2 BHK', desc: 'Two bedrooms' },
  { value: '3BHK', label: '3 BHK', desc: 'Three bedrooms' },
  { value: 'PG', label: 'PG / Hostel', desc: 'Paying guest' },
]

const FURNISH_OPTIONS: { value: Furnished; label: string; desc: string }[] = [
  { value: 'FURNISHED', label: 'Fully Furnished', desc: 'All furniture included' },
  { value: 'SEMI', label: 'Semi Furnished', desc: 'Partial furniture' },
  { value: 'UNFURNISHED', label: 'Unfurnished', desc: 'No furniture' },
]

const GENDER_OPTIONS: { value: GenderAllowed; label: string; desc: string }[] = [
  { value: 'MALE', label: 'Boys Only', desc: 'Male tenants' },
  { value: 'FEMALE', label: 'Girls Only', desc: 'Female tenants' },
  { value: 'ANY', label: 'Anyone', desc: 'All genders welcome' },
]

export function BasicInfoStep({ onNext }: Props) {
  const store = useListingStore()

  const isValid = 
    store.title.length >= 5 &&
    store.rent !== '' && Number(store.rent) > 0 &&
    store.deposit !== '' && Number(store.deposit) >= 0

  return (
    <div className="bg-white rounded-3xl border border-border-light shadow-lg shadow-navy/[0.03] p-6 sm:p-8 space-y-8">

      {/* Section: Property Title */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
            <PencilLine className="w-3.5 h-3.5 text-coral" />
          </div>
          <h2 className="text-lg font-bold text-navy">Property Title</h2>
        </div>
        <Input 
          id="title" 
          placeholder="e.g. Spacious Private Room near NFSU Gate 1" 
          value={store.title}
          onChange={(e) => store.updateField('title', e.target.value)}
          maxLength={200}
          className="h-12 text-base rounded-2xl border-border-light focus-visible:ring-coral/20"
        />
        <p className="text-xs text-text-muted">Be descriptive — mention nearby landmarks. {store.title.length}/200</p>
      </div>

      {/* Section: Pricing */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
            <Banknote className="w-3.5 h-3.5 text-coral" />
          </div>
          <h2 className="text-lg font-bold text-navy">Pricing</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="rent" className="text-xs font-semibold text-text-muted uppercase tracking-wide">Monthly Rent</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">₹</span>
              <Input 
                id="rent" 
                type="number"
                placeholder="5000" 
                value={store.rent}
                onChange={(e) => store.updateField('rent', e.target.value ? Number(e.target.value) : '')}
                className="h-12 pl-8 rounded-2xl border-border-light focus-visible:ring-coral/20"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deposit" className="text-xs font-semibold text-text-muted uppercase tracking-wide">Security Deposit</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">₹</span>
              <Input 
                id="deposit" 
                type="number"
                placeholder="10000" 
                value={store.deposit}
                onChange={(e) => store.updateField('deposit', e.target.value ? Number(e.target.value) : '')}
                className="h-12 pl-8 rounded-2xl border-border-light focus-visible:ring-coral/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Room Type */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
            <BedSingle className="w-3.5 h-3.5 text-coral" />
          </div>
          <h2 className="text-lg font-bold text-navy">Room Type</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {ROOM_TYPES.map((rt) => (
            <button
              key={rt.value}
              type="button"
              onClick={() => store.updateField('room_type', rt.value)}
              className={`text-left p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                store.room_type === rt.value
                  ? 'border-coral bg-coral/[0.06] shadow-sm'
                  : 'border-border-light hover:border-navy/20 hover:bg-muted-bg'
              }`}
            >
              <p className={`text-sm font-bold ${store.room_type === rt.value ? 'text-coral' : 'text-navy'}`}>{rt.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{rt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Section: Furnishing */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
            <Sofa className="w-3.5 h-3.5 text-coral" />
          </div>
          <h2 className="text-lg font-bold text-navy">Furnishing</h2>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {FURNISH_OPTIONS.map((fo) => (
            <button
              key={fo.value}
              type="button"
              onClick={() => store.updateField('furnished', fo.value)}
              className={`text-left p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                store.furnished === fo.value
                  ? 'border-coral bg-coral/[0.06] shadow-sm'
                  : 'border-border-light hover:border-navy/20 hover:bg-muted-bg'
              }`}
            >
              <p className={`text-sm font-bold ${store.furnished === fo.value ? 'text-coral' : 'text-navy'}`}>{fo.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{fo.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Section: Preferences */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-coral" />
          </div>
          <h2 className="text-lg font-bold text-navy">Tenant Preferences</h2>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Gender Allowed</Label>
          <div className="grid grid-cols-3 gap-2.5">
            {GENDER_OPTIONS.map((go) => (
              <button
                key={go.value}
                type="button"
                onClick={() => store.updateField('gender_allowed', go.value)}
                className={`text-left p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                  store.gender_allowed === go.value
                    ? 'border-coral bg-coral/[0.06] shadow-sm'
                    : 'border-border-light hover:border-navy/20 hover:bg-muted-bg'
                }`}
              >
                <p className={`text-sm font-bold ${store.gender_allowed === go.value ? 'text-coral' : 'text-navy'}`}>{go.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{go.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border-light bg-muted-bg/50">
          <div>
            <p className="text-sm font-bold text-navy">Roommates Needed</p>
            <p className="text-xs text-text-muted">How many people can share this space?</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-border-light rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => store.updateField('roommates_needed', Math.max(1, store.roommates_needed - 1))}
              className="w-9 h-9 flex items-center justify-center text-navy font-bold hover:bg-muted-bg transition-colors"
            >−</button>
            <span className="w-9 text-center font-bold text-navy text-sm">{store.roommates_needed}</span>
            <button
              type="button"
              onClick={() => store.updateField('roommates_needed', store.roommates_needed + 1)}
              className="w-9 h-9 flex items-center justify-center text-navy font-bold hover:bg-muted-bg transition-colors"
            >+</button>
          </div>
        </div>
      </div>

      {/* Section: Availability */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-coral" />
          </div>
          <h2 className="text-lg font-bold text-navy">Available From</h2>
          <span className="text-xs text-text-muted ml-auto">Optional</span>
        </div>
        <Input 
          id="date" 
          type="date"
          value={store.available_from}
          onChange={(e) => store.updateField('available_from', e.target.value)}
          className="h-12 rounded-2xl border-border-light focus-visible:ring-coral/20"
        />
      </div>

      <div className="pt-2">
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="w-full h-12 bg-coral hover:bg-coral-dark text-white font-semibold text-base rounded-2xl shadow-md shadow-coral/20 transition-all hover:shadow-lg hover:shadow-coral/25 active:scale-[0.98]"
        >
          Continue to Amenities →
        </Button>
      </div>
    </div>
  )
}
