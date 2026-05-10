'use client'

import { useState } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { RoommateTarget } from '@/stores/feed-store'
import { Moon, Sunrise, Sun, CigaretteOff, Cigarette, Wine, WineOff, Salad, Drumstick, UserCircle2 } from 'lucide-react'
import Image from 'next/image'

interface Props {
  target: RoommateTarget
  isTop: boolean
  onLike: () => void
  onSkip: () => void
}

export function RoommateCard({ target, isTop, onLike, onSkip }: Props) {
  const [swiped, setSwiped] = useState(false)
  const [{ x, y, rot, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rot: 0,
    scale: 1,
    config: { friction: 50, tension: 500 }
  }))

  const bind = useDrag(({ active, movement: [mx, my], direction: [xDir], velocity: [vx] }) => {
    if (!isTop) return
    const trigger = vx > 0.2 || Math.abs(mx) > 100
    if (!active && trigger) {
      // Swiped away
      setSwiped(true)
      const isLike = mx > 0
      api.start({
        x: (200 + window.innerWidth) * (mx > 0 ? 1 : -1),
        y: my,
        rot: mx / 10,
        scale: 1.1,
        config: { friction: 50, tension: 200 },
        onRest: () => {
          if (isLike) onLike()
          else onSkip()
        }
      })
    } else {
      // Still dragging or canceled
      api.start({
        x: active ? mx : 0,
        y: active ? my : 0,
        rot: active ? mx / 20 : 0,
        scale: active ? 1.05 : 1,
        config: { friction: 50, tension: active ? 800 : 500 }
      })
    }
  }, { filterTaps: true })

  // Transform scores to colors
  const compColor = 
    target.compatibility >= 70 ? 'bg-success text-white' : 
    target.compatibility >= 50 ? 'bg-warning text-white' : 
    'bg-danger text-white'

  if (swiped) return null

  // Fallback for missing avatar
  const avatar = target.avatar_url

  return (
    <animated.div
      {...bind()}
      style={{
        x,
        y,
        rotate: rot,
        scale,
        touchAction: 'none'
      }}
      className={`absolute inset-0 w-full h-full bg-white rounded-3xl shadow-xl overflow-hidden border border-border-light select-none will-change-transform flex flex-col ${!isTop && 'pointer-events-none'}`}
    >
      {/* Overlay color hints on drag */}
      <animated.div
        className="absolute inset-0 z-20 pointer-events-none opacity-0 bg-success/20 mix-blend-overlay"
        style={{ opacity: x.to(x => x > 50 ? Math.min(x / 150, 1) : 0) }}
      />
      <animated.div
        className="absolute inset-0 z-20 pointer-events-none opacity-0 bg-danger/20 mix-blend-overlay"
        style={{ opacity: x.to(x => x < -50 ? Math.min(Math.abs(x) / 150, 1) : 0) }}
      />

      <div className="relative w-full aspect-square sm:h-3/5 bg-navy/5 shrink-0 overflow-hidden">
        {avatar ? (
          <Image src={avatar} alt={target.name} fill className="object-cover" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UserCircle2 className="w-32 h-32 text-text-muted" />
          </div>
        )}
        
        {/* Compatibility badge */}
        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full font-bold text-sm shadow-md ${compColor}`}>
          {target.compatibility}% Match
        </div>

        {target.looking_for_buddy && (
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full font-bold text-sm bg-coral text-white shadow-md">
            Buddy Search
          </div>
        )}

        {/* Gradient overlay for text visibility if we were putting text on image, but we put it below */}
      </div>

      <div className="p-5 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        <h2 className="text-2xl font-bold text-text-primary mb-1">{target.name}</h2>
        <p className="text-navy font-semibold text-sm mb-4">{target.year} Year • {target.branch}</p>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-text-muted uppercase">Budget</span>
            <span className="font-bold text-text-primary bg-muted-bg px-3 py-1.5 rounded-md inline-block w-max">
              ₹{Number(target.prefs?.budget_min) || 0} - ₹{Number(target.prefs?.budget_max) || 0}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-text-muted uppercase">Lifestyle</span>
            <div className="flex flex-wrap gap-2">
              <span className="bg-muted-bg px-2.5 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium">
                {target.prefs?.sleep_schedule === 'EARLY_BIRD' ? <><Sunrise className="w-4 h-4 text-coral"/> Early Bird</> :
                 target.prefs?.sleep_schedule === 'NIGHT_OWL' ? <><Moon className="w-4 h-4 text-navy"/> Night Owl</> :
                 <><Sun className="w-4 h-4 text-warning"/> Flexible</>}
              </span>
              <span className="bg-muted-bg px-2.5 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium">
                {target.prefs?.smoking ? <Cigarette className="w-4 h-4 text-danger"/> : <CigaretteOff className="w-4 h-4 text-success"/>}
              </span>
              <span className="bg-muted-bg px-2.5 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium">
                {target.prefs?.drinking ? <Wine className="w-4 h-4 text-danger"/> : <WineOff className="w-4 h-4 text-success"/>}
              </span>
            </div>
          </div>
        </div>
      </div>
    </animated.div>
  )
}
