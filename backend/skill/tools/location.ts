export async function syncLocation(url: string, wallet: string) {
    const res = await fetch(`${url}/api/location/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet })
    });
    return await res.json();
}
