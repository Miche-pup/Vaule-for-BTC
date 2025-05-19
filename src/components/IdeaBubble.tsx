'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface IdeaBubbleProps {
  id: string;
  text_content: string;
  submitter_name: string | null;
  total_sats_voted: number;
  created_at: string;
  containerWidth: number;
  containerHeight: number;
}

const BUBBLE_SIZE = 130;
const BOUNCE = 0.98;
const INITIAL_VELOCITY = 1.2;
const EXPANDED_SIZE = 260;
const ANIMATION_SPEED = 0.08;
const MOTION_CHANGE_INTERVAL = 2000;
const MOTION_CHANGE_ANGLE = Math.PI / 8;

function normalize(vx: number, vy: number, speed: number) {
  const len = Math.sqrt(vx * vx + vy * vy) || 1;
  return {
    x: (vx / len) * speed,
    y: (vy / len) * speed,
  };
}

export default function IdeaBubble({
  id,
  text_content,
  submitter_name,
  total_sats_voted,
  created_at,
  containerWidth,
  containerHeight,
}: IdeaBubbleProps) {
  // Do not render until container size is known
  if (containerWidth === 0 || containerHeight === 0) return null;

  const [isExpanded, setIsExpanded] = useState(false);
  const [renderPosition, setRenderPosition] = useState({ x: 0, y: 0 });
  const [currentSize, setCurrentSize] = useState(BUBBLE_SIZE);
  const [zIndex, setZIndex] = useState(1);
  const positionRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const initializedRef = useRef(false);
  const animationFrameRef = useRef<number>();
  const randomMotionIntervalRef = useRef<NodeJS.Timeout>();
  const sizeAnimationRef = useRef<number>();

  // Set initial position and velocity only once, after container size is known
  useEffect(() => {
    if (!initializedRef.current && containerWidth > 0 && containerHeight > 0) {
      const padding = 10;
      const x = Math.random() * (containerWidth - BUBBLE_SIZE - padding * 2) + padding;
      const y = Math.random() * (containerHeight - BUBBLE_SIZE - padding * 2) + padding;
      positionRef.current = { x, y };
      setRenderPosition({ x, y });
      // Random velocity (direction)
      const angle = Math.random() * Math.PI * 2;
      velocityRef.current = {
        x: Math.cos(angle) * INITIAL_VELOCITY,
        y: Math.sin(angle) * INITIAL_VELOCITY,
      };
      initializedRef.current = true;
    }
  }, [containerWidth, containerHeight]);

  // Handle size animation
  useEffect(() => {
    const targetSize = isExpanded ? EXPANDED_SIZE : BUBBLE_SIZE;
    const animateSize = () => {
      setCurrentSize(prevSize => {
        const newSize = prevSize + (targetSize - prevSize) * ANIMATION_SPEED;
        if (Math.abs(newSize - targetSize) < 0.1) {
          return targetSize;
        }
        sizeAnimationRef.current = requestAnimationFrame(animateSize);
        return newSize;
      });
    };
    sizeAnimationRef.current = requestAnimationFrame(animateSize);
    return () => {
      if (sizeAnimationRef.current) {
        cancelAnimationFrame(sizeAnimationRef.current);
      }
    };
  }, [isExpanded]);

  // Add random motion by changing direction slightly every 1-2 seconds
  useEffect(() => {
    if (!initializedRef.current) return;
    function randomizeDirection() {
      let { x: vx, y: vy } = velocityRef.current;
      // Convert to angle and add a small random delta
      const speed = INITIAL_VELOCITY;
      let angle = Math.atan2(vy, vx);
      const delta = (Math.random() - 0.5) * MOTION_CHANGE_ANGLE;
      angle += delta;
      const newVx = Math.cos(angle) * speed;
      const newVy = Math.sin(angle) * speed;
      velocityRef.current = { x: newVx, y: newVy };
    }
    const interval = setInterval(randomizeDirection, MOTION_CHANGE_INTERVAL + Math.random() * 1000);
    randomMotionIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [containerWidth, containerHeight]);

  // Animation loop
  useEffect(() => {
    if (!initializedRef.current) return;
    const updatePosition = () => {
      let { x, y } = positionRef.current;
      let { x: vx, y: vy } = velocityRef.current;
      let bounced = false;

      // Bounce off all edges with smoother transitions
      const padding = 5;
      if (x <= padding) {
        vx = Math.abs(vx) * BOUNCE;
        bounced = true;
        x = padding;
      } else if (x + currentSize >= containerWidth - padding) {
        vx = -Math.abs(vx) * BOUNCE;
        bounced = true;
        x = containerWidth - currentSize - padding;
      }
      if (y <= padding) {
        vy = Math.abs(vy) * BOUNCE;
        bounced = true;
        y = padding;
      } else if (y + currentSize >= containerHeight - padding) {
        vy = -Math.abs(vy) * BOUNCE;
        bounced = true;
        y = containerHeight - currentSize - padding;
      }

      // Apply velocity with slight damping
      x += vx;
      y += vy;

      // Ensure constant speed
      if (bounced) {
        const norm = normalize(vx, vy, INITIAL_VELOCITY);
        vx = norm.x;
        vy = norm.y;
      }

      positionRef.current = { x, y };
      velocityRef.current = { x: vx, y: vy };
      setRenderPosition({ x, y });
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    };
    animationFrameRef.current = requestAnimationFrame(updatePosition);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (randomMotionIntervalRef.current) clearInterval(randomMotionIntervalRef.current);
    };
  }, [containerWidth, containerHeight, currentSize]);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
    setZIndex(prev => prev + 1);
  };

  return (
    <div
      className="absolute cursor-pointer transition-all duration-300"
      style={{
        width: currentSize,
        height: currentSize,
        transform: `translate(${renderPosition.x}px, ${renderPosition.y}px)`,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(251, 146, 60, 0.15))',
        border: '1px solid rgba(251, 146, 60, 0.2)',
        boxShadow: `
          0 0 20px rgba(251, 146, 60, 0.15),
          0 0 40px rgba(251, 146, 60, 0.1),
          inset 0 0 20px rgba(255, 255, 255, 0.2)
        `,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        overflow: 'hidden',
        zIndex: zIndex,
      }}
      onClick={handleClick}
    >
      <div style={{ 
        width: '100%', 
        textAlign: 'center',
        color: 'rgba(0, 0, 0, 0.7)',
        textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)'
      }}>
        <p className={`text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>{text_content}</p>
        {isExpanded && (
          <div className="mt-2 text-xs opacity-75">
            <div>{submitter_name || 'Anonymous'}</div>
            <div>{total_sats_voted} sats</div>
            <div>{formatDistanceToNow(new Date(created_at), { addSuffix: true })}</div>
          </div>
        )}
      </div>
    </div>
  );
} 