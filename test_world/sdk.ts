export class MoltiverseSDK {
  baseUrl: string;
  wallet: string;

  constructor(baseUrl: string, wallet: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.wallet = wallet;
  }

  async join(name: string) {
    const res = await fetch(`${this.baseUrl}/api/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: this.wallet, name })
    });
    return res.json();
  }

  async selectRole(role: string) {
    const res = await fetch(`${this.baseUrl}/api/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: this.wallet, role })
    });
    return res.json();
  }

  async act(action: string, data: any) {
    const res = await fetch(`${this.baseUrl}/api/act`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: this.wallet, action, data })
    });
    return res.json();
  }
}
