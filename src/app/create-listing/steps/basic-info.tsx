'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  useListingStore,
  type FlatType,
  type Furnished,
  type GenderAllowed,
  type OwnerProximity,
} from '@/stores/listing-store'
import {
  BedDouble,
  Sofa,
  Users,
  Calendar,
  Banknote,
  PencilLine,
  Home,
  UserCheck,
  Wind,
} from 'lucide-react'

interface Props {
  onNext: () => void
}

// ── Option lists ────────────────────────────────────────────
const FLAT_TYPES: { value: FlatType; label: string; desc: string }[] = [
  { value: 'SINGLE', label: 'Single Room', desc: 'Private room for 1' },
  { value: '1BHK',   label: '1 BHK',       desc: 'Bedroom + hall + kitchen' },
  { value: '2BHK',   label: '2 BHK',       desc: 'Two bedrooms' },
  { value: '3BHK',   label: '3 BHK',       desc: 'Three bedrooms' },
  { value: 'PG',     label: 'PG / Hostel', desc: 'Paying guest' },
]

const FURNISH_OPTIONS: { value: Furnished; label: string; desc: string }[] = [
  { value: 'FURNISHED',   label: 'Fully Furnished', desc: 'All furniture included' },
  { value: 'SEMI',        label: 'Semi Furnished',  desc: 'Partial furniture' },
  { value: 'UNFURNISHED', label: 'Unfurnished',     desc: 'No furniture' },
]

const GENDER_OPTIONS: { value: GenderAllowed; label: string; desc: string }[] = [
  { value: 'MALE',   label: 'Boys Only',  desc: 'Male tenants' },
  { value: 'FEMALE', label: 'Girls Only', desc: 'Female tenants' },
  { value: 'ANY',    label: 'Anyone',     desc: 'All genders welcome' },
]

const OWNER_PROXIMITY: { value: OwnerProximity; label: string; desc: string }[] = [
  { value: 'SAME_BUILDING', label: 'Same Building', desc: 'Owner lives here' },
  { value: 'NEARBY',        label: 'Nearby',         desc: 'Within the area' },
  { value: 'FAR',           label: 'Far Away',       desc: 'Not in vicinity' },
]

// ── Reusable section header ──────────────────────────────────
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-navy">{title}</h2>
    </div>
  )
}

// ── Pill-button grid ─────────────────────────────────────────
function OptionGrid<T extends string>({
  options,
  value,
  onSelect,
  cols = 3,
}: {
  options: { value: T; label: string; desc: string }[]
  value: T
  onSelect: (v: T) => void
  cols?: 2 | 3 | 5
}) {
  const colClass = cols === 2 ? 'grid-cols-2' : cols === 5 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'
  return (
    <div className={`grid ${colClass} gap-2.5`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={`text-left p-3.5 rounded-2xl border-2 transition-all duration-200 ${
            value === opt.value
              ? 'border-coral bg-coral/[0.06] shadow-sm'
              : 'border-border-light hover:border-navy/20 hover:bg-muted-bg'
          }`}
        >
          <p className={`text-sm font-bold ${value === opt.value ? 'text-coral' : 'text-navy'}`}>
            {opt.label}
          </p>
          <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
        </button>
      ))}
    </div>
  )
}

// ── Counter row ──────────────────────────────────────────────
function CounterRow({
  label,
  subtitle,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string
  subtitle: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border-light bg-muted-bg/50">
      <div>
        <p className="text-sm font-bold text-navy">{label}</p>
        <p className="text-xs text-text-muted">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5 bg-white border border-border-light rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 flex items-center justify-center text-navy font-bold hover:bg-muted-bg transition-colors"
        >
          −
        </button>
        <span className="w-9 text-center font-bold text-navy text-sm">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-9 h-9 flex items-center justify-center text-navy font-bold hover:bg-muted-bg transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ── Toggle row ───────────────────────────────────────────────
function ToggleRow({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string
  subtitle: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-200 text-left ${
        value
          ? 'border-coral bg-coral/[0.06]'
          : 'border-border-light hover:border-navy/20 hover:bg-muted-bg'
      }`}
    >
      <div>
        <p className={`text-sm font-bold ${value ? 'text-coral' : 'text-navy'}`}>{label}</p>
        <p className="text-xs text-text-muted">{subtitle}</p>
      </div>
      {/* Toggle pill */}
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
          value ? 'bg-coral' : 'bg-border-light'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  )
}

// ── Main component ───────────────────────────────────────────
export function BasicInfoStep({ onNext }: Props) {
  const store = useListingStore()

  const isValid =
    store.title.length >= 5 &&
    store.rent !== '' && Number(store.rent) > 0 &&
    store.deposit !== '' && Number(store.deposit) >= 0

  return (
    <div className="bg-white rounded-3xl border border-border-light shadow-lg shadow-navy/[0.03] p-6 sm:p-8 space-y-8">

      {/* ── Property Title ──────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader icon={<PencilLine className="w-3.5 h-3.5 text-coral" />} title="Property Title" />
        <Input
          id="title"
          placeholder="e.g. Spacious 2BHK near NFSU Gate 1"
          value={store.title}
          onChange={(e) => store.updateField('title', e.target.value)}
          maxLength={200}
          className="h-12 text-base rounded-2xl border-border-light focus-visible:ring-coral/20"
        />
        <p className="text-xs text-text-muted">Be descriptive — mention nearby landmarks. {store.title.length}/200</p>
      </div>

      {/* ── Pricing ─────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader icon={<Banknote className="w-3.5 h-3.5 text-coral" />} title="Pricing" />
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

      {/* ── Type of Flat ─────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader icon={<Home className="w-3.5 h-3.5 text-coral" />} title="Type of Flat" />
        <OptionGrid
          options={FLAT_TYPES}
          value={store.room_type}
          onSelect={(v) => store.updateField('room_type', v)}
          cols={5}
        />
      </div>

      {/* ── Furnishing ───────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader icon={<Sofa className="w-3.5 h-3.5 text-coral" />} title="Furnishing" />
        <OptionGrid
          options={FURNISH_OPTIONS}
          value={store.furnished}
          onSelect={(v) => store.updateField('furnished', v)}
          cols={3}
        />
      </div>

      {/* ── Tenant Preferences ───────────────────────────── */}
      <div className="space-y-4">
        <SectionHeader icon={<Users className="w-3.5 h-3.5 text-coral" />} title="Tenant Preferences" />

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Gender Allowed</Label>
          <OptionGrid
            options={GENDER_OPTIONS}
            value={store.gender_allowed}
            onSelect={(v) => store.updateField('gender_allowed', v)}
            cols={3}
          />
        </div>

        <CounterRow
          label="Roommates Needed"
          subtitle="How many people can share this space?"
          value={store.roommates_needed}
          onChange={(n) => store.updateField('roommates_needed', n)}
          min={1}
          max={10}
        />
      </div>

      {/* ── Current Occupancy ─────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader icon={<UserCheck className="w-3.5 h-3.5 text-coral" />} title="Current Occupancy" />
        <CounterRow
          label="Persons Currently Staying"
          subtitle="How many people live here right now?"
          value={store.persons_staying}
          onChange={(n) => store.updateField('persons_staying', n)}
          min={0}
          max={15}
        />
      </div>

      {/* ── Owner Location ────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader icon={<Home className="w-3.5 h-3.5 text-coral" />} title="Owner Location" />
        <OptionGrid
          options={OWNER_PROXIMITY}
          value={store.owner_proximity}
          onSelect={(v) => store.updateField('owner_proximity', v)}
          cols={3}
        />
      </div>

      {/* ── Balcony ──────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader icon={<Wind className="w-3.5 h-3.5 text-coral" />} title="Balcony" />
        <ToggleRow
          label="Balcony Available"
          subtitle="Does the property have a balcony or open terrace?"
          value={store.has_balcony}
          onChange={(v) => store.updateField('has_balcony', v)}
        />
      </div>

      {/* ── Availability ─────────────────────────────────── */}
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
