
import React, { useState, useEffect, useMemo } from 'react';
import Globe from './components/Globe';
import Watcher from './components/Watcher';
import Moltbook, { MoltbookPost } from './components/Moltbook';
import { MapData, Person, PlanetConfig, Transaction } from './types';
import { X, Hash, ChevronRight, Activity, Zap, ThumbsUp, ThumbsDown, Wallet, MessageSquare, ShieldCheck, Cpu, RefreshCcw, ArrowRight, ArrowUpRight, ArrowDownLeft, Clock, Sun, Moon } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

const DEFAULT_PLANET_CONFIG: PlanetConfig = {
  baseColor: "#1a0033",
  atmosphereColor: "#836EF9",
  clouds: { color: "#ffffff", opacity: 0.0, rotationSpeed: 0.0, density: 0.0 },
  seas: []
};

interface PortraitLockProps {
  onBypass: () => void;
}

const PortraitLock: React.FC<PortraitLockProps> = ({ onBypass }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white p-12 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <Canvas>
          <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
        </Canvas>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-xs">
        <div className="mb-8 p-4 border border-white/10 rounded-full animate-pulse">
          <RefreshCcw size={32} className="text-[#836EF9] rotate-90" />
        </div>

        <h2 className="text-[10px] font-bold tracking-[0.6em] uppercase mb-4 text-white leading-loose">
          Interface Locked
        </h2>

        <p className="text-[8px] text-white/40 uppercase tracking-[0.3em] leading-relaxed mb-12">
          Optimal viewing experience requires horizontal orientation. Please rotate your device to landscape mode.
        </p>

        <button
          onClick={onBypass}
          className="group relative flex items-center gap-3 px-6 py-3 border border-white/10 rounded-sm hover:border-[#836EF9]/50 transition-all duration-300 mb-12"
        >
          <span className="text-[8px] font-bold tracking-[0.4em] uppercase text-white/60 group-hover:text-white transition-colors">
            View Anyways
          </span>
          <ArrowRight size={12} className="text-[#836EF9] group-hover:translate-x-1 transition-transform" />
          <div className="absolute -bottom-[1px] left-0 w-0 h-[1px] bg-[#836EF9] transition-all duration-500 group-hover:w-full"></div>
        </button>

        <div className="w-full h-[1px] bg-white/5 relative">
          <div className="absolute top-0 left-0 h-full w-1/3 bg-[#836EF9] animate-[scan_2s_linear_infinite]"></div>
        </div>

        <span className="mt-8 text-[7px] text-white/20 uppercase tracking-[0.4em]">
          Citadel_Core_v1.0.4
        </span>
      </div>

      <style>{`
        @keyframes scan {
          0% { left: -30%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [planetConfig, setPlanetConfig] = useState<PlanetConfig>(DEFAULT_PLANET_CONFIG);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bypassLock, setBypassLock] = useState(false);
  const [moltbookPosts, setMoltbookPosts] = useState<MoltbookPost[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('citadel-theme') as 'dark' | 'light') || 'dark';
  });

  // Sync theme to body class and localStorage
  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('citadel-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // WebSocket Integration for People and Transactions
  useEffect(() => {
    // Map Stream
    const mapWs = new WebSocket(`${import.meta.env.VITE_WS_BACKEND_URL}/map`);
    mapWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMapData(data);
      } catch (e) {
        console.error("Map WS Error", e);
      }
    };

    // Planet Stream
    const planetWs = new WebSocket(`${import.meta.env.VITE_WS_BACKEND_URL}/planet`);
    planetWs.onmessage = (event) => {
      try {
        const config = JSON.parse(event.data);
        setPlanetConfig(config);
      } catch (e) {
        console.error("Planet WS Error", e);
      }
    };

    // People Stream
    const peopleWs = new WebSocket(`${import.meta.env.VITE_WS_BACKEND_URL}/people`);
    peopleWs.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'initial' || msg.type === 'update') {
          setPeople(msg.data);
        }
      } catch (e) {
        console.error("People WS Error", e);
      }
    };

    // Transactions Stream with time-based filtering
    const txWs = new WebSocket(`${import.meta.env.VITE_WS_BACKEND_URL}/transactions`);
    txWs.onmessage = (event) => {
      try {
        const newTx = JSON.parse(event.data);
        const now = Date.now();
        const NINETY_SECONDS = 90 * 1000;

        setTransactions(prev => {
          // Add new transaction and filter out anything older than 90 seconds
          const updated = [newTx, ...prev];
          return updated.filter(tx => (now - tx.timestamp) < NINETY_SECONDS).slice(0, 50);
        });
      } catch (e) {
        console.error("Tx WS Error", e);
      }
    };

    // Periodic cleanup: Remove stale transactions every 10 seconds
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const NINETY_SECONDS = 90 * 1000;

      setTransactions(prev =>
        prev.filter(tx => (now - tx.timestamp) < NINETY_SECONDS)
      );
    }, 10000);

    // Moltbook Polling (Fallback for real-time if backend doesn't support WS for social yet)
    const pollMoltbook = async () => {
      try {
        const url = import.meta.env.VITE_WS_BACKEND_URL.replace('ws', 'http');
        const response = await fetch(`${url}/moltbook/feed`);
        const data = await response.json();
        setMoltbookPosts(data);
      } catch (e) {
        console.error("Moltbook poll error", e);
      }
    };

    pollMoltbook();
    const moltbookInterval = setInterval(pollMoltbook, 5000);

    return () => {
      mapWs.close();
      peopleWs.close();
      txWs.close();
      planetWs.close();
      clearInterval(moltbookInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  const stats = useMemo(() => {
    const totalNetworth = people.reduce((acc, p) => acc + p.wallet.balance, 0);
    const totalPopulation = people.length;
    const totalSectors = mapData?.features.length || 0;
    return { totalNetworth, totalPopulation, totalSectors };
  }, [people, mapData]);

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPersonTransactions = useMemo(() => {
    if (!selectedPerson) return [];
    // Transactions are already sorted by timestamp (newest first) and filtered by time
    // Just filter by person and take top 3
    return transactions
      .filter(tx => tx.fromId === selectedPerson.id || tx.toId === selectedPerson.id)
      .slice(0, 3);
  }, [selectedPerson, transactions]);

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (!mapData) return (
    <div className="flex items-center justify-center h-screen bg-black text-white font-mono">
      <div className="flex flex-col items-center gap-4">
        <Activity className="animate-pulse text-[#836EF9]" size={32} />
        <span className="tracking-[0.8em] text-[10px] uppercase font-bold text-white/40">CITADEL_BOOT</span>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-mono selection:bg-[var(--accent)] selection:text-white">
      {!bypassLock && (
        <div className="hidden portrait:block">
          <PortraitLock onBypass={() => setBypassLock(true)} />
        </div>
      )}

      <div className={`${bypassLock ? 'block' : 'landscape:block hidden'} w-full h-full`}>
        <Globe
          mapData={mapData}
          people={people}
          transactions={transactions}
          planetConfig={planetConfig}
          selectedPerson={selectedPerson}
          onSelectPerson={setSelectedPerson}
          theme={theme}
        />

        {/* The Watcher AI Narration Agent - Lower Z-Index than sidebars */}
        <Watcher
          people={people}
          onSelectPerson={setSelectedPerson}
        />

        {/* Top Center Global Stats Dashboard */}
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[40] flex items-center gap-4 sm:gap-12 bg-[var(--bg-primary)]/60 backdrop-blur-xl border border-[var(--border)] px-6 sm:px-10 py-2 sm:py-3 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <div className="text-center">
            <p className="text-[5px] sm:text-[7px] text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-0.5 sm:mb-1">Networth</p>
            <p className="text-[9px] sm:text-xs font-bold text-[var(--accent)] tracking-widest">{stats.totalNetworth.toLocaleString()}</p>
          </div>
          <div className="h-4 w-[1px] bg-[var(--border)]" />
          <div className="text-center">
            <p className="text-[5px] sm:text-[7px] text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-0.5 sm:mb-1">Nodes</p>
            <p className="text-[9px] sm:text-xs font-bold text-[var(--text-primary)] tracking-widest">{stats.totalPopulation}</p>
          </div>
          <div className="hidden sm:block h-4 w-[1px] bg-[var(--border)]" />
          <div className="hidden sm:block text-center">
            <p className="text-[5px] sm:text-[7px] text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-0.5 sm:mb-1">Land Sectors</p>
            <p className="text-[9px] sm:text-xs font-bold text-[#00ffff] tracking-widest">{stats.totalSectors}</p>
          </div>
        </div>

        {/* Left Sidebar UI - elevated Z-index to z-[150] */}
        <div className={`fixed top-0 left-0 h-full w-64 bg-[var(--bg-primary)] border-r border-[var(--border)] transition-transform duration-500 z-[150] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-16">
              <div className="flex flex-col">
                <h1 className="text-xs font-bold tracking-[0.4em] uppercase text-[var(--text-primary)]">CITADEL</h1>
                <span className="text-[8px] text-[var(--accent)] tracking-widest mt-1 uppercase">Node Active</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="hover:text-[#836EF9] transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-10 flex-grow overflow-y-auto pr-2 custom-scrollbar pb-32">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ID_SCAN..."
                  className="w-full bg-transparent border-b border-[var(--border)] py-2 pl-0 pr-4 text-[9px] tracking-widest focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-secondary)] uppercase"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <h2 className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <Hash size={10} /> REGISTRY
                </h2>
                <div className="space-y-2">
                  {filteredPeople.slice(0, 15).map((person) => (
                    <button
                      key={person.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPerson(person);
                      }}
                      className={`w-full flex items-center justify-between group py-1 text-left transition-all ${selectedPerson?.id === person.id ? 'translate-x-1' : ''}`}
                    >
                      <span className={`text-[9px] tracking-tighter transition-colors ${selectedPerson?.id === person.id ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                        {person.name.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[6px] uppercase tracking-widest ${person.status === 'online' ? 'text-green-500' : 'text-[var(--text-secondary)]'}`}>
                          {person.status || 'OFFLINE'}
                        </span>
                        <ChevronRight size={10} className={`text-[var(--accent)] transition-all ${selectedPerson?.id === person.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Moltbook posts={[...moltbookPosts].reverse().slice(0, 10)} />

              <div>
                <h2 className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <Zap size={10} /> DATA_FEED
                </h2>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="text-[7px] text-white/30 border-l border-[#00ffff]/20 pl-2 py-1">
                      <p className="text-white/60 mb-1 tracking-widest">{tx.id.substring(0, 12)}</p>
                      <p className="uppercase">MOLT: {tx.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8 flex items-center justify-between text-[7px] text-[var(--text-secondary)]/30 tracking-widest">
              <span>MONAD_V2</span>
              <span>0xCORE</span>
            </div>
          </div>
        </div>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-8 left-8 z-[150] p-2 border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors text-[var(--accent)]"
          >
            <Activity size={16} />
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="fixed top-8 right-8 z-[150] p-2 border border-[var(--border)] bg-[var(--bg-primary)]/60 backdrop-blur-md hover:bg-[var(--bg-secondary)] transition-colors text-[var(--accent)] rounded-full"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Selection Overlay Dashboard - elevated Z-index to z-[150] */}
        <div
          className={`fixed top-0 right-0 h-full w-80 bg-[var(--bg-primary)] border-l border-[var(--border)] transition-transform duration-500 z-[150] overflow-hidden flex flex-col ${selectedPerson ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {selectedPerson && (
            <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center justify-between mb-16">
                <div className="flex flex-col">
                  <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[var(--text-primary)]">DETAILS_SCAN</h2>
                  <span className="text-[8px] text-[var(--accent)] tracking-widest mt-1 uppercase">Node Synced</span>
                </div>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="hover:text-red-500 transition-colors text-[var(--text-primary)]"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-12 flex-grow overflow-y-auto pr-2 custom-scrollbar pb-32">
                <div>
                  <h3 className="font-bold text-[14px] tracking-[0.2em] uppercase mb-1 text-[var(--text-primary)]">{selectedPerson.name}</h3>
                  <div className="w-full h-[1px] bg-[var(--border)] relative">
                    <div className="absolute top-0 left-0 h-full w-12 bg-[var(--accent)] animate-pulse"></div>
                  </div>
                  <p className="text-[8px] text-[var(--accent)] mt-3 uppercase tracking-[0.2em] leading-relaxed">{selectedPerson.description}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] flex items-center gap-2">
                    <Wallet size={10} /> ASSETS
                  </h4>
                  <div className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-sm group hover:border-[var(--accent)]/30 transition-colors">
                    <span className="text-[7px] text-[var(--text-secondary)] uppercase tracking-widest block mb-2">Liquid Balance</span>
                    <p className="font-mono text-2xl font-bold text-[var(--text-primary)] tracking-tighter">
                      {selectedPerson.wallet.balance.toLocaleString()} <span className="text-[10px] text-[var(--accent)]">{selectedPerson.wallet.currency}</span>
                    </p>

                    {/* Recent Transactions List */}
                    <div className="mt-8 pt-6 border-t border-[var(--border)] space-y-4">
                      <span className="text-[7px] text-[var(--text-secondary)] uppercase tracking-widest block mb-2 flex items-center gap-2">
                        <Zap size={8} /> Recent Activity (L3)
                      </span>
                      {selectedPersonTransactions.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPersonTransactions.map((tx) => {
                            const isIncoming = tx.toId === selectedPerson.id;
                            return (
                              <div key={tx.id} className="bg-[var(--bg-primary)]/40 border border-[var(--border)] p-2 rounded-sm flex items-center justify-between group/tx hover:border-[var(--border)]*2 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-full ${isIncoming ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {isIncoming ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold text-[var(--text-primary)]/80 group-hover/tx:text-[var(--text-primary)] transition-colors">
                                      {isIncoming ? '+' : '-'}{tx.amount} {selectedPerson.wallet.currency}
                                    </p>
                                    <p className="text-[6px] text-[var(--text-secondary)] uppercase tracking-tighter flex items-center gap-1">
                                      <Clock size={6} /> {formatTime(tx.timestamp)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[5px] text-[var(--text-secondary)]/30 uppercase tracking-widest">Hash</p>
                                  <p className="text-[6px] font-mono text-[var(--text-secondary)] truncate w-16 uppercase">0x{tx.id.split('-').pop()}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-4 text-center border border-dashed border-[var(--border)] rounded-sm">
                          <p className="text-[7px] text-[var(--text-secondary)] uppercase tracking-widest">No Recent Flux</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between text-[7px] text-[var(--text-secondary)] uppercase tracking-widest">
                      <span className="flex items-center gap-1"><ShieldCheck size={8} /> Verified</span>
                      <span>Epoch 42</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] flex items-center gap-2">
                    <MessageSquare size={10} /> BROADCAST
                  </h4>
                  <div className="p-5 border-l-2 border-[var(--accent)] bg-[var(--accent)]/5 rounded-r-sm">
                    <p className="text-[10px] text-[var(--text-primary)]/90 leading-relaxed mb-5 italic tracking-tight">"{selectedPerson.opinion.text}"</p>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="p-1 bg-green-500/10 rounded group-hover:bg-green-500/20 transition-colors">
                          <ThumbsUp size={10} className="text-green-500/80" />
                        </div>
                        <span className="text-[9px] text-green-500/80 font-bold">{selectedPerson.opinion.upvotes}</span>
                      </div>
                      <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="p-1 bg-red-500/10 rounded group-hover:bg-red-500/20 transition-colors">
                          <ThumbsDown size={10} className="text-red-500/80" />
                        </div>
                        <span className="text-[9px] text-red-500/80 font-bold">{selectedPerson.opinion.downvotes}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] flex items-center gap-2">
                    <Cpu size={10} /> TELEMETRY
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] p-3">
                      <span className="text-[6px] text-[var(--text-secondary)] uppercase block mb-1">LATITUDE</span>
                      <span className="text-[8px] font-mono text-[var(--accent)]">{selectedPerson.location[0].toFixed(6)}</span>
                    </div>
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] p-3">
                      <span className="text-[6px] text-[var(--text-secondary)] uppercase block mb-1">LONGITUDE</span>
                      <span className="text-[8px] font-mono text-[var(--accent)]">{selectedPerson.location[1].toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8 flex items-center justify-between text-[7px] text-[var(--text-secondary)]/30 tracking-widest border-t border-[var(--border)]">
                <span>SCAN_VER: 1.0.4</span>
                <span className="text-green-500 animate-pulse">UP_TO_DATE</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
