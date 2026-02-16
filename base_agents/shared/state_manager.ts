import * as fs from 'fs/promises';
import * as path from 'path';

export class StateManager<T> {
    private stateFilePath: string;

    constructor(agentName: string) {
        this.stateFilePath = path.join(process.cwd(), 'shared', `${agentName}_state.json`);
    }

    async loadState(defaultState: T): Promise<T> {
        try {
            const data = await fs.readFile(this.stateFilePath, 'utf-8');
            return JSON.parse(data) as T;
        } catch (error) {
            // If the file doesn't exist, return the default state
            // @ts-ignore
            if (error.code === 'ENOENT') {
                return defaultState;
            }
            throw error;
        }
    }

    async saveState(state: T): Promise<void> {
        await fs.writeFile(this.stateFilePath, JSON.stringify(state, null, 2));
    }
}
