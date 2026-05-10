'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useListingStore } from '@/stores/listing-store'

interface Props {
  onNext: () => void
}

export function BasicInfoStep({ onNext }: Props) {
  const store = useListingStore()

  const isValid = 
    store.title.length >= 5 &&
    store.rent !== '' && Number(store.rent) > 0 &&
    store.deposit !== '' && Number(store.deposit) >= 0

  return (
    <Card className="border-border-light shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Property Title</Label>
          <Input 
            id="title" 
            placeholder="e.g. Spacious Private Room near NFSU Gate 1" 
            value={store.title}
            onChange={(e) => store.updateField('title', e.target.value)}
            maxLength={200}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="rent">Monthly Rent (₹)</Label>
            <Input 
              id="rent" 
              type="number"
              placeholder="5000" 
              value={store.rent}
              onChange={(e) => store.updateField('rent', e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deposit">Security Deposit (₹)</Label>
            <Input 
              id="deposit" 
              type="number"
              placeholder="10000" 
              value={store.deposit}
              onChange={(e) => store.updateField('deposit', e.target.value ? Number(e.target.value) : '')}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Room Type</Label>
            <Select 
              value={store.room_type} 
              onValueChange={(v) => store.updateField('room_type', v as any)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SINGLE">Single Room</SelectItem>
                <SelectItem value="SHARED">Shared Room</SelectItem>
                <SelectItem value="1BHK">1 BHK</SelectItem>
                <SelectItem value="2BHK">2 BHK</SelectItem>
                <SelectItem value="3BHK">3 BHK</SelectItem>
                <SelectItem value="PG">PG/Hostel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Furnishing</Label>
            <Select 
              value={store.furnished} 
              onValueChange={(v) => store.updateField('furnished', v as any)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FURNISHED">Fully Furnished</SelectItem>
                <SelectItem value="SEMI">Semi Furnished</SelectItem>
                <SelectItem value="UNFURNISHED">Unfurnished</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Gender Allowed</Label>
            <Select 
              value={store.gender_allowed} 
              onValueChange={(v) => store.updateField('gender_allowed', v as any)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Boys Only</SelectItem>
                <SelectItem value="FEMALE">Girls Only</SelectItem>
                <SelectItem value="ANY">Anyone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Roommates Needed</Label>
            <Input 
              type="number" 
              min={1} 
              value={store.roommates_needed}
              onChange={(e) => store.updateField('roommates_needed', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date">Available From (Optional)</Label>
          <Input 
            id="date" 
            type="date"
            value={store.available_from}
            onChange={(e) => store.updateField('available_from', e.target.value)}
          />
        </div>

        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="w-full bg-coral hover:bg-coral-dark text-white mt-4"
        >
          Next Step
        </Button>
      </CardContent>
    </Card>
  )
}
