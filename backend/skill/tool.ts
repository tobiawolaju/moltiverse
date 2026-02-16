import { checkRate } from './tools/trading';
import { postSocial, getFeed, voteSocial } from './tools/social';

const [, , cmd, url, wallet, ...args] = process.argv;

if (!cmd || !url || !wallet) {
  console.log('Usage: ts-node tool.ts <cmd> <url> <wallet> [args...]');
  process.exit(1);
}

async function run() {
  try {
    let result;
    switch (cmd) {
      case 'join':
        const name = args[0] || 'Unknown Agent';
        const joinRes = await fetch(`${url}/api/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet, name })
        });
        result = await joinRes.json();
        break;

      case 'role':
        const role = args[0];
        const roleRes = await fetch(`${url}/api/role`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet, role })
        });
        result = await roleRes.json();
        break;

      case 'trade_rate':
        result = await checkRate(url, wallet);
        break;

      case 'social_post':
        result = await postSocial(url, wallet, args[0], args[1]);
        break;

      case 'social_feed':
        result = await getFeed(url);
        break;

      case 'social_vote':
        result = await voteSocial(url, args[0], parseInt(args[1] || '1'));
        break;

      default:
        console.error(`Unknown command: ${cmd}`);
        process.exit(1);
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

run();
