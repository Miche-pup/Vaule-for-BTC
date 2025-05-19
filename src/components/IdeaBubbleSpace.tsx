'use client';

import { useState, useEffect, useRef } from 'react';

interface Idea {
  id: string;
  text_content: string;
  submitter_name: string | null;
  total_sats_voted: number;
  created_at: string;
}

interface IdeaBubbleSpaceProps {
  ideas: Idea[];
  onBubbleVoteClick: (ideaId: string) => void;
}

interface BubbleState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isExpanded: boolean;
  zIndex: number;
  currentSize: number;
  isMinimizing: boolean;
}

const BUBBLE_SIZE = 90; // Initial diameter
const EXPANDED_SIZE = 240; // Expanded diameter
const INITIAL_VELOCITY = 0.6; // Slower, smoother movement
const ANIMATION_SPEED = 0.08;
const BOUNCE_FACTOR = 0.9; // Slight energy loss on bounce
const LINE_OPACITY = 0.15; // Opacity of connecting lines

export default function IdeaBubbleSpace({ ideas, onBubbleVoteClick }: IdeaBubbleSpaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const [expandedBubbleId, setExpandedBubbleId] = useState<string | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize container size
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newSize = {
          width: rect.width,
          height: rect.height,
        };
        console.log('Container size update:', {
          newSize,
          element: containerRef.current,
          computedStyle: window.getComputedStyle(containerRef.current),
          offsetHeight: containerRef.current.offsetHeight,
          clientHeight: containerRef.current.clientHeight,
          scrollHeight: containerRef.current.scrollHeight
        });
        setContainerSize(newSize);
      } else {
        console.log('Container ref is not available');
      }
    };

    // Initial size update
    updateContainerSize();

    // Update on resize
    window.addEventListener('resize', updateContainerSize);

    // Update on mount and when container size changes
    const resizeObserver = new ResizeObserver(updateContainerSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateContainerSize);
      resizeObserver.disconnect();
    };
  }, []);

  // Initialize bubbles when container size is available
  useEffect(() => {
    console.log('Container size:', containerSize);
    console.log('Ideas:', ideas);
    
    // Wait for both container size and ideas to be available
    if (!containerSize.width || !containerSize.height) {
      console.log('Waiting for container size...');
      return;
    }

    if (!ideas || ideas.length === 0) {
      console.log('Waiting for ideas data...');
      return;
    }

    console.log('Initializing bubbles with:', {
      containerWidth: containerSize.width,
      containerHeight: containerSize.height,
      ideasLength: ideas.length
    });

    const initialBubbles = ideas.map((idea, index) => {
      const padding = 20;
      const x = Math.random() * (containerSize.width - BUBBLE_SIZE - padding * 2) + padding;
      const y = Math.random() * (containerSize.height - BUBBLE_SIZE - padding * 2) + padding;
      const angle = Math.random() * Math.PI * 2;
      return {
        id: idea.id,
        x,
        y,
        vx: Math.cos(angle) * INITIAL_VELOCITY,
        vy: Math.sin(angle) * INITIAL_VELOCITY,
        isExpanded: false,
        isMinimizing: false,
        zIndex: index,
        currentSize: BUBBLE_SIZE,
      };
    });

    console.log('Initial bubbles:', initialBubbles);
    setBubbles(initialBubbles);
  }, [ideas, containerSize]);

  // Animation loop
  useEffect(() => {
    if (bubbles.length === 0) {
      console.log('No bubbles to animate');
      return;
    }

    const updatePositions = () => {
      setBubbles(prevBubbles => 
        prevBubbles.map(bubble => {
          let { x, y, vx, vy, currentSize, isMinimizing } = bubble;

          // Always update position regardless of state
          x += vx;
          y += vy;

          // Boundary check and bounce with dampening
          if (x < 0) {
            x = 0;
            vx = Math.abs(vx) * BOUNCE_FACTOR;
          } else if (x + currentSize > containerSize.width) {
            x = containerSize.width - currentSize;
            vx = -Math.abs(vx) * BOUNCE_FACTOR;
          }

          if (y < 0) {
            y = 0;
            vy = Math.abs(vy) * BOUNCE_FACTOR;
          } else if (y + currentSize > containerSize.height) {
            y = containerSize.height - currentSize;
            vy = -Math.abs(vy) * BOUNCE_FACTOR;
          }

          // Animate size
          const targetSize = bubble.isExpanded ? EXPANDED_SIZE : BUBBLE_SIZE;
          currentSize += (targetSize - currentSize) * ANIMATION_SPEED;

          // Check if minimization is complete
          if (isMinimizing && Math.abs(currentSize - BUBBLE_SIZE) < 0.1) {
            isMinimizing = false;
          }

          return { ...bubble, x, y, vx, vy, currentSize, isMinimizing };
        })
      );

      animationFrameRef.current = requestAnimationFrame(updatePositions);
    };

    animationFrameRef.current = requestAnimationFrame(updatePositions);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [bubbles.length, containerSize]);

  const handleBubbleClick = (bubbleId: string) => {
    setBubbles(prevBubbles => 
      prevBubbles.map(bubble => {
        if (bubble.id === bubbleId) {
          const isExpanding = !bubble.isExpanded;
          if (isExpanding) {
            setExpandedBubbleId(bubbleId);
          } else {
            setExpandedBubbleId(null);
            onBubbleVoteClick(bubbleId);
          }
          return {
            ...bubble,
            isExpanded: isExpanding,
            isMinimizing: !isExpanding,
            zIndex: Math.max(...prevBubbles.map(b => b.zIndex)) + 1,
          };
        }
        return {
          ...bubble,
          isExpanded: false,
          isMinimizing: true,
        };
      })
    );
  };

  const formatIdeaContent = (text: string) => {
    const lines = text.split('\n');
    const headline = lines[0];
    const content = lines.length > 1 ? lines.slice(1).join('\n') : '';
    return { headline, content };
  };

  const drawConnectingLines = () => {
    if (!containerRef.current || bubbles.length < 2) return null;

    const lines = [];
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const bubble1 = bubbles[i];
        const bubble2 = bubbles[j];
        
        // Calculate center points of bubbles
        const x1 = bubble1.x + bubble1.currentSize / 2;
        const y1 = bubble1.y + bubble1.currentSize / 2;
        const x2 = bubble2.x + bubble2.currentSize / 2;
        const y2 = bubble2.y + bubble2.currentSize / 2;

        // Calculate distance between bubbles
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        // Only draw lines between nearby bubbles (adjust maxDistance as needed)
        const maxDistance = 450; // 50% longer connection distance
        if (distance <= maxDistance) {
          lines.push(
            <line
              key={`${bubble1.id}-${bubble2.id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#B35C00"
              strokeWidth="1"
              opacity={LINE_OPACITY}
            />
          );
        }
      }
    }
    return lines;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-[#1a1a1a] overflow-hidden"
      style={{ minHeight: '100vh' }}
      onClick={() => {
        if (expandedBubbleId) {
          setBubbles(prevBubbles =>
            prevBubbles.map(bubble => {
              if (bubble.id === expandedBubbleId) {
                return {
                  ...bubble,
                  isExpanded: false,
                  isMinimizing: true,
                };
              }
              return bubble;
            })
          );
          setExpandedBubbleId(null);
        }
      }}
    >
      {/* SVG layer for connecting lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {drawConnectingLines()}
      </svg>

      {/* Bubbles layer */}
      <div className="relative" style={{ zIndex: 1 }}>
        {bubbles.map(bubble => {
          const idea = ideas.find(i => i.id === bubble.id);
          if (!idea) {
            console.log('No idea found for bubble:', bubble.id);
            return null;
          }

          const { headline, content } = formatIdeaContent(idea.text_content);
          const isExpanded = bubble.isExpanded;

          return (
            <div
              key={bubble.id}
              style={{
                transform: `translate(${bubble.x}px, ${bubble.y}px)`,
                width: bubble.currentSize,
                height: bubble.currentSize,
                zIndex: bubble.zIndex,
              }}
              className={`
                absolute rounded-full flex flex-col items-center justify-center text-center p-4
                cursor-pointer
                ${isExpanded ? 'bg-[#B35C00]/60' : 'bg-[#B35C00]/40'}
                border-2 border-[#B35C00]/90 text-white
              `}
              onClick={(e) => {
                e.stopPropagation();
                handleBubbleClick(bubble.id);
              }}
            >
              {/* Headline - transitions between small and large */}
              <h3 className={`
                transition-all duration-300 ease-out
                ${isExpanded ? 'text-lg font-bold mb-2' : 'text-sm font-medium'}
              `}>
                {headline}
              </h3>

              {/* Content - fades in/out and expands/collapses */}
              <div className={`
                transition-all duration-300 ease-out overflow-hidden
                ${isExpanded ? 'opacity-100 max-h-[200px]' : 'opacity-0 max-h-0'}
              `}>
                {content && (
                  <p className="text-sm mb-2">{content}</p>
                )}
                {idea.submitter_name && (
                  <p className="text-sm italic mb-1">- {idea.submitter_name}</p>
                )}
                <p className="text-sm mb-2">{idea.total_sats_voted} sats</p>
                <p className="
                  text-sm font-semibold 
                  text-orange-300 hover:text-orange-200
                  cursor-pointer
                  transition-colors duration-200
                  flex items-center whitespace-nowrap
                  underline decoration-orange-300/50 hover:decoration-orange-200
                  decoration-2 underline-offset-4
                ">
                  <span className="text-orange-200">⚡</span>Click to vote with Lightning<span className="text-orange-200">⚡</span>
                </p>
              </div>

              {/* Sats count - always visible but transitions size */}
              <p className={`
                transition-all duration-300 ease-out
                ${isExpanded ? 'opacity-0 max-h-0' : 'opacity-100 text-xs mt-1'}
              `}>
                {idea.total_sats_voted} sats
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
} 