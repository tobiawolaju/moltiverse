import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

export class WalletTool {
    private wallet: ethers.HDNodeWallet | null = null;
    private walletPath: string;

    constructor(agentFolderPath: string) {
        this.walletPath = path.join(agentFolderPath, 'burnermoltwallet.txt');
    }

    /**
     * Loads an existing wallet or creates a new one.
     */
    public async init(): Promise<void> {
        if (fs.existsSync(this.walletPath)) {
            const mnemonic = fs.readFileSync(this.walletPath, 'utf8').trim();
            this.wallet = ethers.Wallet.fromPhrase(mnemonic);
        } else {
            this.wallet = ethers.Wallet.createRandom();
            fs.writeFileSync(this.walletPath, this.wallet.mnemonic?.phrase || '', 'utf8');
        }
    }

    public getAddress(): string {
        if (!this.wallet) throw new Error("Wallet not initialized");
        return this.wallet.address;
    }

    public getMnemonic(): string {
        if (!this.wallet) throw new Error("Wallet not initialized");
        return this.wallet.mnemonic?.phrase || '';
    }

    public async signMessage(message: string | Uint8Array): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");
        return await this.wallet.signMessage(message);
    }

    public async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
        if (!this.wallet) throw new Error("Wallet not initialized");
        return await this.wallet.signTransaction(tx);
    }
}
