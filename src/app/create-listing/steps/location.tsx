'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useListingStore } from '@/stores/listing-store'
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import { MapPin } from 'lucide-react'

const CAMPUS_LAT = Number(process.env.NEXT_PUBLIC_NFSU_CAMPUS_LAT) || 28.696385
const CAMPUS_LNG = Number(process.env.NEXT_PUBLIC_NFSU_CAMPUS_LNG) || 77.109666

interface Props {
  onNext: () => void
  onBack: () => void
}

export function LocationStep({ onNext, onBack }: Props) {
  const store = useListingStore()
  const [geocoding, setGeocoding] = useState(false)
  const [distanceInfo, setDistanceInfo] = useState<string | null>(null)

  // Haversine distance calc for instant client-side preview
  const calcDistance = (lat: number, lng: number) => {
    const R = 6371
    const dLat = ((lat - CAMPUS_LAT) * Math.PI) / 180
    const dLng = ((lng - CAMPUS_LNG) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((CAMPUS_LAT * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c
    setDistanceInfo(`~${d.toFixed(1)} km from NFSU Campus`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMapClick = async (e: any) => {
    if (!e.detail.latLng) return
    const lat = e.detail.latLng.lat
    const lng = e.detail.latLng.lng
    
    store.updateField('latitude', lat)
    store.updateField('longitude', lng)
    calcDistance(lat, lng)

    // Reverse geocode
    setGeocoding(true)
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      )
      const data = await response.json()
      if (data.results && data.results[0]) {
        store.updateField('address', data.results[0].formatted_address)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    } finally {
      setGeocoding(false)
    }
  }

  const isValid = store.latitude !== null && store.longitude !== null && store.address.length >= 5

  return (
    <Card className="border-border-light shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Location</CardTitle>
        <CardDescription>Pin your property on the map</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="h-[300px] rounded-xl overflow-hidden border border-border-light relative">
          {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <div className="w-full h-full flex items-center justify-center bg-muted-bg text-text-muted text-sm text-center p-4">
              Google Maps API Key missing in environment variables.
            </div>
          ) : (
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
              <Map
                mapId="campusnest-location-picker"
                defaultCenter={{ lat: CAMPUS_LAT, lng: CAMPUS_LNG }}
                defaultZoom={13}
                onClick={handleMapClick}
                gestureHandling="greedy"
                disableDefaultUI={true}
              >
                {/* Selected location marker */}
                {store.latitude != null && store.longitude != null && (
                  <AdvancedMarker position={{ lat: store.latitude, lng: store.longitude }}>
                    <Pin background="#E8593C" borderColor="#E8593C" glyphColor="white" />
                  </AdvancedMarker>
                )}
                {/* Campus reference marker */}
                <AdvancedMarker position={{ lat: CAMPUS_LAT, lng: CAMPUS_LNG }}>
                  <Pin background="#1E3A5F" borderColor="#1E3A5F" glyphColor="white" />
                </AdvancedMarker>
              </Map>
            </APIProvider>
          )}
        </div>

        {distanceInfo && (
          <div className="flex items-center gap-2 text-sm text-navy bg-navy/5 p-3 rounded-lg font-medium">
            <MapPin className="w-4 h-4 text-navy" />
            {distanceInfo}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="address">Full Address</Label>
          <Input 
            id="address"
            placeholder={geocoding ? 'Loading address...' : 'Enter precise location address'}
            value={store.address}
            onChange={(e) => store.updateField('address', e.target.value)}
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
