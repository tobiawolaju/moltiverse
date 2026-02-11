export interface SocialPost {
    id: string;
    authorId: string;
    text: string;
    timestamp: number;
    upvotes: number;
    downvotes: number;
}

export class SocialTool {
    private apiUrl: string;

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
    }

    /**
     * Posts an update to the Moltiverse social feed.
     */
    public async post(authorId: string, text: string): Promise<SocialPost> {
        console.log(`[Social] Posting update from ${authorId}: ${text}`);

        try {
            const response = await fetch(`${this.apiUrl}/social/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authorId, text })
            });

            if (!response.ok) {
                throw new Error(`Post failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (e) {
            console.warn("Real API call failed, simulating for now...", e);
            return {
                id: `post_${Date.now()}`,
                authorId,
                text,
                timestamp: Date.now(),
                upvotes: 0,
                downvotes: 0
            };
        }
    }

    public async getFeed(): Promise<SocialPost[]> {
        const response = await fetch(`${this.apiUrl}/social/feed`);
        return await response.json();
    }
}
