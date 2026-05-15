'use client'

import { useState } from 'react'
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
    <div className="bg-white rounded-3xl border border-border-light shadow-lg shadow-navy/[0.03] p-6 sm:p-8 space-y-8">

      {/* Section: Map */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-coral" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">Pin Your Property</h2>
            <p className="text-xs text-text-muted">Click anywhere on the map to set the location</p>
          </div>
        </div>

        {/* Map with soft frame */}
        <div className="relative h-[340px] rounded-2xl overflow-hidden shadow-inner border-2 border-border-light">
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
                style={{ width: '100%', height: '100%' }}
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

          {/* Distance overlay badge */}
          {distanceInfo && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/60 text-sm font-semibold text-navy z-10">
              <MapPin className="w-4 h-4 text-coral" />
              {distanceInfo}
            </div>
          )}
        </div>

        {/* Map legend */}
        {store.latitude == null && (
          <div className="flex items-center gap-4 justify-center text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-coral" /> Your property
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-navy" /> NFSU Campus
            </div>
          </div>
        )}
      </div>

      {/* Section: Address */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-coral" />
          </div>
          <h2 className="text-lg font-bold text-navy">Full Address</h2>
        </div>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted shrink-0" />
          <Input 
            id="address"
            placeholder={geocoding ? 'Loading address...' : 'Enter the full address of the property'}
            value={store.address}
            onChange={(e) => store.updateField('address', e.target.value)}
            className="h-12 pl-10 rounded-2xl border-border-light focus-visible:ring-coral/20"
          />
        </div>
        {geocoding && (
          <p className="text-xs text-text-muted flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
            Looking up address...
          </p>
        )}
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
          Continue to Photos →
        </Button>
      </div>
    </div>
  )
}
