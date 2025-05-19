'use client';

import { useState, useEffect } from 'react';
import IdeaBubbleSpace from '@/components/IdeaBubbleSpace';
import IdeaFormDropdown from '@/components/IdeaFormDropdown';

interface Idea {
  id: string;
  text_content: string;
  submitter_name: string | null;
  total_sats_voted: number;
  created_at: string;
}

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const response = await fetch('/api/ideas');
        if (!response.ok) throw new Error('Failed to fetch ideas');
        const data = await response.json();
        console.log('Fetched ideas:', data);
        setIdeas(data.ideas || []);
      } catch (error) {
        console.error('Error fetching ideas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  const handleVoteClick = (ideaId: string) => {
    console.log('Vote clicked for idea:', ideaId);
    // Implement vote functionality
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <main className="flex-grow">
      <IdeaFormDropdown />
      <IdeaBubbleSpace ideas={ideas} onBubbleVoteClick={handleVoteClick} />
    </main>
  );
} 