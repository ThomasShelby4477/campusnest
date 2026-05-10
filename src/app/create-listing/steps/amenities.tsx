'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useListingStore } from '@/stores/listing-store'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Wifi, Thermometer, Utensils } from 'lucide-react'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function AmenitiesStep({ onNext, onBack }: Props) {
  const store = useListingStore()

  const isValid = store.description.length <= 1000

  return (
    <Card className="border-border-light shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Amenities & Description</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-3">
          <Label>Provided Amenities</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted-bg">
              <Checkbox 
                checked={store.has_wifi} 
                onCheckedChange={(c) => store.updateField('has_wifi', c as boolean)} 
              />
              <Wifi className="w-4 h-4 text-text-muted" />
              <span className="text-sm font-medium">Wi-Fi</span>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted-bg">
              <Checkbox 
                checked={store.has_ac} 
                onCheckedChange={(c) => store.updateField('has_ac', c as boolean)} 
              />
              <Thermometer className="w-4 h-4 text-text-muted" />
              <span className="text-sm font-medium">AC</span>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted-bg">
              <Checkbox 
                checked={store.food_available} 
                onCheckedChange={(c) => store.updateField('food_available', c as boolean)} 
              />
              <Utensils className="w-4 h-4 text-text-muted" />
              <span className="text-sm font-medium">Food</span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Water Supply</Label>
          <RadioGroup 
            value={store.water_supply} 
            onValueChange={(v) => store.updateField('water_supply', v as '24H' | 'TIMED' | 'BOREWELL')}
            className="flex flex-col space-y-1"
          >
            <label className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem value="24H" />
              <span>24/7 Supply</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem value="TIMED" />
              <span>Specific Timings</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem value="BOREWELL" />
              <span>Borewell Only</span>
            </label>
          </RadioGroup>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="desc">Description</Label>
            <span className={`text-xs ${store.description.length > 1000 ? 'text-danger' : 'text-text-muted'}`}>
              {store.description.length}/1000
            </span>
          </div>
          <Textarea 
            id="desc"
            placeholder="Describe your place, neighborhood, rules, etc."
            value={store.description}
            onChange={(e) => store.updateField('description', e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!isValid}
            className="flex-1 bg-coral hover:bg-coral-dark text-white"
          >
            Next Step
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
