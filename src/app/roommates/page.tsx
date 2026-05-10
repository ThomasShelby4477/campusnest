'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoommateFeed } from '@/components/roommate-feed'
import { MatchesList } from '@/components/matches-list'
import { Users, UserPlus, MessageCircleHeart } from 'lucide-react'

export default function RoommatesPage() {
  const [tab, setTab] = useState('find')

  return (
    <div className="min-h-[calc(100vh-64px)] bg-muted-bg flex flex-col">
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col pt-6 px-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v ?? 'find')} className="w-full flex flex-col flex-1">
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="find" className="flex gap-2">
                <Users className="w-4 h-4" /> <span className="hidden sm:inline">Roommates</span>
              </TabsTrigger>
              <TabsTrigger value="buddies" className="flex gap-2">
                <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Buddies</span>
              </TabsTrigger>
              <TabsTrigger value="matches" className="flex gap-2">
                <MessageCircleHeart className="w-4 h-4" /> <span className="hidden sm:inline">Matches</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="find" className="flex-1 mt-0 outline-none">
            <RoommateFeed mode="roommate" />
          </TabsContent>
          <TabsContent value="buddies" className="flex-1 mt-0 outline-none">
            <RoommateFeed mode="buddy" />
          </TabsContent>
          <TabsContent value="matches" className="flex-1 mt-0 outline-none">
            <MatchesList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
