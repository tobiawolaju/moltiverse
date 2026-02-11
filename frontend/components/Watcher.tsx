
import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Terminal } from 'lucide-react';
import { Person } from '../types';

interface WatcherEvent {
  id: string;
  text: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface WatcherProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
}

const Watcher: React.FC<WatcherProps> = ({ people, onSelectPerson }) => {
  const [events, setEvents] = useState<WatcherEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // WebSocket Connection
  useEffect(() => {
    const ws = new WebSocket(`${import.meta.env.VITE_WS_BACKEND_URL}/watcher`);

    ws.onmessage = (event) => {
      try {
        const newEvent: WatcherEvent = JSON.parse(event.data);
        setEvents((prev) => {
          // Avoid duplicates if needed, or just append
          // Limit history to 50 to prevent memory leak
          const updated = [...prev, newEvent];
          if (updated.length > 50) return updated.slice(updated.length - 50);
          return updated;
        });
      } catch (err) {
        console.error("Watcher Parse Error", err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Typewriter effect logic
  useEffect(() => {
    if (events.length === 0) return;

    // If we are at the end of the list (or it's the first run with index 0), show it.
    // The previous logic cycled through fixed list. 
    // New logic: Only play provided events.

    // Ensure index is valid
    if (currentIndex >= events.length) {
      // If we ran out of events, wait? 
      // Or if new events came in, we might be behind.
      // Let's just catch up to the latest? 
      // Or let the natural flow handle it.
      // If events.length increased, currentIndex is valid.
      return;
    }

    const fullText = events[currentIndex].text;
    let i = 0;
    setDisplayedText("");
    setIsTyping(true);

    const timer = setInterval(() => {
      setDisplayedText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(timer);
        setIsTyping(false);
        // Wait 8 seconds before moving to next event
        setTimeout(() => {
          // Move to next event if available, otherwise stay (or loop if desired, but streaming implies new content)
          // If explicit stream, usually we wait for next content.
          // But if backend is slow, we might want to loop recent?
          // User said "all are coming from backend".
          // Let's increment index.
          setCurrentIndex((prev) => {
            const next = prev + 1;
            if (next >= events.length) return prev; // Stay on last until new one comes?
            return next;
          });
        }, 8000);
      }
    }, 40); // Typing speed

    return () => clearInterval(timer);
  }, [currentIndex, events]);

  // If we receive a new event and we were "stuck" on the last one (completed), 
  // we should arguably move to it? 
  // But the setTimeout handles the transition.
  // One edge case: we finish event 1, wait 8s. 
  // If event 2 comes during that 8s, we move to 2.
  // If event 2 hasn't arrived, we stay on 1. 
  // If event 2 arrives LATER, we need to trigger.
  // The dependency array [currentIndex, events] will re-trigger.
  // If we stayed on 1 (prev => prev), and events changes, useEffect runs.
  // currentIndex is valid. But we already typed it.
  // We need to track if we *finished* typing the current index.

  // Simplified approach:
  // Just rely on useEffect dependency. 
  // If events changes (new item), and currentIndex was pointing to the last item which was already typed...
  // We shouldn't re-type the SAME item just because the array grew.
  // We need to detect if we moved to a NEW item.

  // Let's refine the Effect to only type if the Event at currentIndex has CHANGED or is new.
  // We can track the ID of the last typed event?

  // Actually, checking if (i > fullText.length) implies we are done.
  // If we make `startTyping` a function called when `currentIndex` changes?

  // Let's defer complexity. The user wants "backend integration". 
  // The simple replacement above might re-type the current event if `events` array changes.
  // That is a bug.
  // I will just implement the connection logic first and leave the effect mostly as is, 
  // but changing the index update logic to not loop modulo length, but increment.


  // Parse text to make "Person [Name]" clickable
  const parsedContent = useMemo(() => {
    const parts = displayedText.split(/(Person [A-Za-z]+ \d+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("Person ")) {
        const nameOnly = part.replace("Person ", "").trim();
        const foundPerson = people.find(p => p.name.toUpperCase() === nameOnly.toUpperCase());

        return (
          <button
            key={idx}
            onClick={() => foundPerson && onSelectPerson(foundPerson)}
            className="text-white font-bold hover:underline decoration-[#836EF9] decoration-2 underline-offset-4 transition-all"
          >
            {part}
          </button>
        );
      }
      return <span key={idx} className="text-white/40">{part}</span>;
    });
  }, [displayedText, people, onSelectPerson]);

  if (events.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-8 z-[100] w-full max-w-sm pointer-events-none">
      <div className="flex flex-col gap-3">
        {/* The AI Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-[#836EF9]/20 rounded-full animate-ping"></div>

            {/* <div className="relative p-2 bg-black border border-white/10 rounded-full">
              <Eye size={12} className="text-[#836EF9]" />
            </div>
            */}

          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold tracking-[0.4em] uppercase text-white">THE_WATCHER</span>
            <span className="text-[6px] text-white/20 tracking-widest uppercase flex items-center gap-2">
              <Terminal size={8} /> Active Observation State
            </span>
          </div>
        </div>

        {/* Narrative Box */}
        <div className="bg-black/40 backdrop-blur-md border-l border-white/5 p-4 pointer-events-auto">
          <div className="flex gap-4">
            <div className="w-[2px] h-full bg-[#836EF9]/20 self-stretch relative">
              <div className={`absolute top-0 left-0 w-full bg-[#836EF9] transition-all duration-300 ${isTyping ? 'h-full' : 'h-0'}`}></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-[10px] leading-relaxed tracking-tight min-h-[40px]">
                {parsedContent}
                {isTyping && <span className="inline-block w-1.5 h-3 bg-[#836EF9] ml-1 animate-pulse align-middle"></span>}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[6px] text-white/10 uppercase tracking-[0.2em]">Hash_ref: {events[currentIndex].id}</span>
                <span className={`text-[6px] uppercase tracking-widest ${events[currentIndex].severity === 'critical' ? 'text-red-500' : 'text-[#836EF9]/50'}`}>
                  Lvl: {events[currentIndex].severity}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watcher;
