export class Scheduler {
    private shortInterval: number;
    private mediumInterval: number;
    private longInterval: number;

    private shortLoop: () => Promise<void>;
    private mediumLoop: () => Promise<void>;
    private longLoop: () => Promise<void>;

    constructor(
        shortLoop: () => Promise<void>,
        mediumLoop: () => Promise<void>,
        longLoop: () => Promise<void>,
        intervals: { short: number; medium: number; long: number } = {
            short: 30 * 1000, // 30 seconds
            medium: 2 * 60 * 1000, // 2 minutes
            long: 10 * 60 * 1000, // 10 minutes
        }
    ) {
        this.shortLoop = shortLoop;
        this.mediumLoop = mediumLoop;
        this.longLoop = longLoop;
        this.shortInterval = intervals.short;
        this.mediumInterval = intervals.medium;
        this.longInterval = intervals.long;
    }

    public start() {
        console.log('🚀 Scheduler started.');
        console.log(`   → Short loop every ${this.shortInterval / 1000} seconds.`);
        console.log(`   → Medium loop every ${this.mediumInterval / 1000 / 60} minutes.`);
        console.log(`   → Long loop every ${this.longInterval / 1000 / 60} minutes.`);

        // Run the loops immediately at the start
        this.shortLoop();
        this.mediumLoop();
        this.longLoop();

        setInterval(this.shortLoop, this.shortInterval);
        setInterval(this.mediumLoop, this.mediumInterval);
        setInterval(this.longLoop, this.longInterval);
    }
}
