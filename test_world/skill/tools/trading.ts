export async function checkRate(url: string, wallet: string) {
    const res = await fetch(`${url}/api/trading/rate`);
    return await res.json();
}
