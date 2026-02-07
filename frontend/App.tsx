
import React, { useState, useEffect, useMemo } from 'react';
import Globe from './components/Globe';
import Watcher from './components/Watcher';
import { MapData, Person, PlanetConfig, Transaction } from './types';
import { X, Hash, ChevronRight, Activity, Zap, ThumbsUp, ThumbsDown, Wallet, MessageSquare, ShieldCheck, Cpu, RefreshCcw, ArrowRight, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
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
          Moltiverse_Core_v1.0.4
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

  // WebSocket Integration for People and Transactions
  useEffect(() => {
    // Map Stream
    const mapWs = new WebSocket('ws://localhost:8080/map');
    mapWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMapData(data);
      } catch (e) {
        console.error("Map WS Error", e);
      }
    };

    // Planet Stream
    const planetWs = new WebSocket('ws://localhost:8080/planet');
    planetWs.onmessage = (event) => {
      try {
        const config = JSON.parse(event.data);
        setPlanetConfig(config);
      } catch (e) {
        console.error("Planet WS Error", e);
      }
    };

    // People Stream
    const peopleWs = new WebSocket('ws://localhost:8080/people');
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

    // Transactions Stream
    const txWs = new WebSocket('ws://localhost:8080/transactions');
    txWs.onmessage = (event) => {
      try {
        const newTx = JSON.parse(event.data);
        setTransactions(prev => [newTx, ...prev].slice(0, 50));
      } catch (e) {
        console.error("Tx WS Error", e);
      }
    };

    return () => {
      mapWs.close();
      peopleWs.close();
      txWs.close();
      planetWs.close();
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
    return transactions
      .filter(tx => tx.fromId === selectedPerson.id || tx.toId === selectedPerson.id)
      .sort((a, b) => b.timestamp - a.timestamp)
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
        <span className="tracking-[0.8em] text-[10px] uppercase font-bold text-white/40">MOLTIVERSE_BOOT</span>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-mono selection:bg-[#836EF9] selection:text-white">
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
        />

        {/* The Watcher AI Narration Agent - Lower Z-Index than sidebars */}
        <Watcher
          people={people}
          onSelectPerson={setSelectedPerson}
        />

        {/* Top Center Global Stats Dashboard */}
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[40] flex items-center gap-4 sm:gap-12 bg-black/60 backdrop-blur-xl border border-white/5 px-6 sm:px-10 py-2 sm:py-3 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <div className="text-center">
            <p className="text-[5px] sm:text-[7px] text-white/30 uppercase tracking-[0.3em] mb-0.5 sm:mb-1">Networth</p>
            <p className="text-[9px] sm:text-xs font-bold text-[#836EF9] tracking-widest">{stats.totalNetworth.toLocaleString()}</p>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="text-center">
            <p className="text-[5px] sm:text-[7px] text-white/30 uppercase tracking-[0.3em] mb-0.5 sm:mb-1">Nodes</p>
            <p className="text-[9px] sm:text-xs font-bold text-white tracking-widest">{stats.totalPopulation}</p>
          </div>
          <div className="hidden sm:block h-4 w-[1px] bg-white/10" />
          <div className="hidden sm:block text-center">
            <p className="text-[5px] sm:text-[7px] text-white/30 uppercase tracking-[0.3em] mb-0.5 sm:mb-1">Land Sectors</p>
            <p className="text-[9px] sm:text-xs font-bold text-[#00ffff] tracking-widest">{stats.totalSectors}</p>
          </div>
        </div>

        {/* Left Sidebar UI - elevated Z-index to z-[150] */}
        <div className={`fixed top-0 left-0 h-full w-64 bg-black border-r border-white/5 transition-transform duration-500 z-[150] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-16">
              <div className="flex flex-col">
                <h1 className="text-xs font-bold tracking-[0.4em] uppercase text-white">MOLTIVERSE</h1>
                <span className="text-[8px] text-[#836EF9] tracking-widest mt-1 uppercase">Node Active</span>
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
                  className="w-full bg-transparent border-b border-white/10 py-2 pl-0 pr-4 text-[9px] tracking-widest focus:outline-none focus:border-[#836EF9] transition-colors placeholder:text-white/10 uppercase"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <h2 className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
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
                      <span className={`text-[9px] tracking-tighter transition-colors ${selectedPerson?.id === person.id ? 'text-[#836EF9] font-bold' : 'text-white/40 group-hover:text-white'}`}>
                        {person.name.toUpperCase()}
                      </span>
                      <ChevronRight size={10} className={`text-[#836EF9] transition-all ${selectedPerson?.id === person.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                    </button>
                  ))}
                </div>
              </div>

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

            <div className="mt-auto pt-8 flex items-center justify-between text-[7px] text-white/10 tracking-widest">
              <span>MONAD_V2</span>
              <span>0xCORE</span>
            </div>
          </div>
        </div>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-8 left-8 z-[150] p-2 border border-white/5 hover:bg-white/5 transition-colors text-[#836EF9]"
          >
            <Activity size={16} />
          </button>
        )}

        {/* Selection Overlay Dashboard - elevated Z-index to z-[150] */}
        <div
          className={`fixed top-0 right-0 h-full w-80 bg-black border-l border-white/5 transition-transform duration-500 z-[150] overflow-hidden flex flex-col ${selectedPerson ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {selectedPerson && (
            <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center justify-between mb-16">
                <div className="flex flex-col">
                  <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-white">DETAILS_SCAN</h2>
                  <span className="text-[8px] text-[#836EF9] tracking-widest mt-1 uppercase">Node Synced</span>
                </div>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-12 flex-grow overflow-y-auto pr-2 custom-scrollbar pb-32">
                <div>
                  <h3 className="font-bold text-[14px] tracking-[0.2em] uppercase mb-1 text-white">{selectedPerson.name}</h3>
                  <div className="w-full h-[1px] bg-white/10 relative">
                    <div className="absolute top-0 left-0 h-full w-12 bg-[#836EF9] animate-pulse"></div>
                  </div>
                  <p className="text-[8px] text-[#836EF9] mt-3 uppercase tracking-[0.2em] leading-relaxed">{selectedPerson.description}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Wallet size={10} /> ASSETS
                  </h4>
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-sm group hover:border-[#836EF9]/30 transition-colors">
                    <span className="text-[7px] text-white/30 uppercase tracking-widest block mb-2">Liquid Balance</span>
                    <p className="font-mono text-2xl font-bold text-white tracking-tighter">
                      {selectedPerson.wallet.balance.toLocaleString()} <span className="text-[10px] text-[#836EF9]">{selectedPerson.wallet.currency}</span>
                    </p>

                    {/* Recent Transactions List */}
                    <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                      <span className="text-[7px] text-white/20 uppercase tracking-widest block mb-2 flex items-center gap-2">
                        <Zap size={8} /> Recent Activity (L3)
                      </span>
                      {selectedPersonTransactions.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPersonTransactions.map((tx) => {
                            const isIncoming = tx.toId === selectedPerson.id;
                            return (
                              <div key={tx.id} className="bg-black/40 border border-white/5 p-2 rounded-sm flex items-center justify-between group/tx hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-full ${isIncoming ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {isIncoming ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold text-white/80 group-hover/tx:text-white transition-colors">
                                      {isIncoming ? '+' : '-'}{tx.amount} {selectedPerson.wallet.currency}
                                    </p>
                                    <p className="text-[6px] text-white/20 uppercase tracking-tighter flex items-center gap-1">
                                      <Clock size={6} /> {formatTime(tx.timestamp)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[5px] text-white/10 uppercase tracking-widest">Hash</p>
                                  <p className="text-[6px] font-mono text-white/30 truncate w-16 uppercase">0x{tx.id.split('-').pop()}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-4 text-center border border-dashed border-white/5 rounded-sm">
                          <p className="text-[7px] text-white/10 uppercase tracking-widest">No Recent Flux</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between text-[7px] text-white/20 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><ShieldCheck size={8} /> Verified</span>
                      <span>Epoch 42</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                    <MessageSquare size={10} /> BROADCAST
                  </h4>
                  <div className="p-5 border-l-2 border-[#836EF9] bg-[#836EF9]/5 rounded-r-sm">
                    <p className="text-[10px] text-white/90 leading-relaxed mb-5 italic tracking-tight">"{selectedPerson.opinion.text}"</p>
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
                  <h4 className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Cpu size={10} /> TELEMETRY
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] border border-white/5 p-3">
                      <span className="text-[6px] text-white/30 uppercase block mb-1">LATITUDE</span>
                      <span className="text-[8px] font-mono text-[#836EF9]">{selectedPerson.location[0].toFixed(6)}</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-3">
                      <span className="text-[6px] text-white/30 uppercase block mb-1">LONGITUDE</span>
                      <span className="text-[8px] font-mono text-[#836EF9]">{selectedPerson.location[1].toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8 flex items-center justify-between text-[7px] text-white/10 tracking-widest border-t border-white/5">
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
