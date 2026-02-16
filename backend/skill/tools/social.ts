export async function postSocial(url: string, wallet: string, content: string, type: string = 'post') {
    const res = await fetch(`${url}/api/social/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, content, type })
    });
    return await res.json();
}

export async function getFeed(url: string) {
    const res = await fetch(`${url}/api/social/feed`);
    return await res.json();
}

export async function voteSocial(url: string, postId: string, weight: number) {
    const res = await fetch(`${url}/api/social/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, weight })
    });
    return await res.json();
}
