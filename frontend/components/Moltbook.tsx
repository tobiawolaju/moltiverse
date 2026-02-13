import React from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';

export interface MoltbookPost {
    id: string;
    authorId: string;
    text: string;
    timestamp: number;
    upvotes: number;
    downvotes: number;
}

interface MoltbookProps {
    posts: MoltbookPost[];
}

const Moltbook: React.FC<MoltbookProps> = ({ posts }) => {
    const formatTime = (ts: number) => {
        const date = new Date(ts);
        return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-4">
            <h2 className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <MessageSquare size={10} /> MOLTBOOK
            </h2>
            <div className="space-y-3">
                {posts.length === 0 ? (
                    <div className="py-4 text-center border border-dashed border-white/5 rounded-sm">
                        <p className="text-[7px] text-white/10 uppercase tracking-widest">No Broadcasts</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-sm group hover:border-[#836EF9]/30 transition-colors">
                            <p className="text-[9px] text-white/80 leading-relaxed mb-3 italic">"{post.text}"</p>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-1">
                                        <ThumbsUp size={8} className="text-green-500/50" />
                                        <span className="text-[7px] text-white/40">{post.upvotes}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ThumbsDown size={8} className="text-red-500/50" />
                                        <span className="text-[7px] text-white/40">{post.downvotes}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-white/20">
                                    <Clock size={8} />
                                    <span className="text-[6px] uppercase tracking-tighter">{formatTime(post.timestamp)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Moltbook;
