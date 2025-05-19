'use client';

import { useEffect, useState, useRef } from 'react';
import IdeaBubble from './IdeaBubble';

interface Idea {
  id: string;
  text_content: string;
  submitter_name: string | null;
  submitter_ln_address: string | null;
  submitter_contact_info: string | null;
  total_sats_voted: number;
  created_at: string;
}

interface BubblePosition {
  id: string;
  x: number;
  y: number;
}

export default function IdeaGrid() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [bubblePositions, setBubblePositions] = useState<BubblePosition[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch ideas
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const response = await fetch('/api/ideas');
        if (!response.ok) {
          throw new Error('Failed to fetch ideas');
        }
        const data = await response.json();
        setIdeas(data.ideas);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ideas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      setContainerSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Update bubble positions
  useEffect(() => {
    const updatePositions = () => {
      const positions = ideas.map((idea, index) => {
        // Calculate grid-like positions
        const cols = Math.ceil(Math.sqrt(ideas.length));
        const rows = Math.ceil(ideas.length / cols);
        
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const cellWidth = containerSize.width / cols;
        const cellHeight = containerSize.height / rows;
        
        // Add some randomness to prevent perfect grid alignment
        const randomOffset = 50;
        const x = col * cellWidth + (Math.random() - 0.5) * randomOffset;
        const y = row * cellHeight + (Math.random() - 0.5) * randomOffset;
        
        return {
          id: idea.id,
          x: Math.max(0, Math.min(containerSize.width - 200, x)),
          y: Math.max(0, Math.min(containerSize.height - 200, y)),
        };
      });
      setBubblePositions(positions);
    };

    if (ideas.length > 0 && containerSize.width > 0 && containerSize.height > 0) {
      updatePositions();
    }
  }, [ideas, containerSize]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4 min-h-screen flex items-center justify-center">
        <p>{error}</p>
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4 min-h-screen flex items-center justify-center">
        <p>No ideas have been submitted yet. Be the first to share your idea!</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-black"
    >
      {ideas.map((idea, index) => (
        <IdeaBubble
          key={idea.id}
          id={idea.id}
          text_content={idea.text_content}
          submitter_name={idea.submitter_name}
          submitter_ln_address={idea.submitter_ln_address}
          submitter_contact_info={idea.submitter_contact_info}
          total_sats_voted={idea.total_sats_voted}
          created_at={idea.created_at}
          index={index}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          allPositions={bubblePositions}
        />
      ))}
    </div>
  );
} 