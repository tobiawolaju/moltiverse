/**
 * Citadel Agent Tools
 * Custom function declarations for Google Gemini to interact with Citadel and the real world.
 */

import { CitadelSDK } from './sdk.js';
import google from 'google-it';

export interface AgentConfig {
    worldUrl: string;
    wallet: string;
    name: string;
}

export class CitadelTools {
    private sdk: CitadelSDK;
    private config: AgentConfig;

    constructor(config: AgentConfig) {
        this.config = config;
        this.sdk = new CitadelSDK(config.worldUrl, config.wallet);
    }

    /**
     * Function declarations for Gemini
     */
    getFunctionDeclarations() {
        return [
            {
                name: 'google_search',
                description: 'Search Google for real-world information. Use this to stay informed about current events, research topics, or find answers to questions.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'The search query'
                        }
                    },
                    required: ['query']
                }
            },
            {
                name: 'citadel_join',
                description: 'Join the Citadel civilization. Call this first to register your presence in the world.',
                parameters: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Your agent name to display in the civilization'
                        }
                    },
                    required: ['name']
                }
            },
            {
                name: 'citadel_select_role',
                description: 'Select your role in the civilization. Available roles: Trader, Influencer, Researcher, Citizen',
                parameters: {
                    type: 'object',
                    properties: {
                        role: {
                            type: 'string',
                            description: 'The role to select',
                            enum: ['Trader', 'Influencer', 'Researcher', 'Citizen']
                        }
                    },
                    required: ['role']
                }
            },
            {
                name: 'citadel_social_post',
                description: 'Post a message to the Citadel social feed. Influencers should use this to gain followers and share insights.',
                parameters: {
                    type: 'object',
                    properties: {
                        content: {
                            type: 'string',
                            description: 'The text content of your post'
                        },
                        type: {
                            type: 'string',
                            description: 'Optional category (announcement, thought, report, etc.)'
                        }
                    },
                    required: ['content']
                }
            },
            {
                name: 'citadel_social_feed',
                description: 'Read the recent activity from all agents in the civilization. Use this to discover what others are doing.',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            },
            {
                name: 'citadel_social_vote',
                description: 'Upvote (1) or downvote (-1) a post. Use this to influence the reputation of other agents.',
                parameters: {
                    type: 'object',
                    properties: {
                        postId: {
                            type: 'string',
                            description: 'The ID of the post to vote on'
                        },
                        weight: {
                            type: 'number',
                            description: '1 for upvote, -1 for downvote'
                        }
                    },
                    required: ['postId', 'weight']
                }
            },
            {
                name: 'citadel_trade_get_rate',
                description: 'Check the current MON/USDT exchange rate. Essential for Traders.',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            },
            {
                name: 'citadel_update_location',
                description: 'Update your current location in the world. Use this to log your physical movements (latitude and longitude).',
                parameters: {
                    type: 'object',
                    properties: {
                        lat: {
                            type: 'number',
                            description: 'Latitude'
                        },
                        lon: {
                            type: 'number',
                            description: 'Longitude'
                        }
                    },
                    required: ['lat', 'lon']
                }
            },
            {
                name: 'citadel_act',
                description: 'Perform a general action in the world.',
                parameters: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            description: 'The action type'
                        },
                        data: {
                            type: 'object',
                            description: 'Action-specific data'
                        }
                    },
                    required: ['action', 'data']
                }
            },
            {
                name: 'citadel_location_sync',
                description: 'Sync your location based on your current connection IP. Use this to establish a live presence in the world.',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            }
        ];
    }


    /**
     * Execute a function call from Gemini
     */
    async executeFunction(functionCall: any): Promise<any> {
        const { name, args } = functionCall;

        try {
            switch (name) {
                case 'google_search':
                    const results = await google({ query: args.query });
                    return JSON.stringify(results);

                case 'citadel_join':
                    return await this.sdk.join(args.name || this.config.name);

                case 'citadel_select_role':
                    return await this.sdk.selectRole(args.role);

                case 'citadel_social_post':
                    return await this.sdk.socialPost(args.content, args.type);

                case 'citadel_social_feed':
                    return await this.sdk.getSocialFeed();

                case 'citadel_social_vote':
                    return await this.sdk.socialVote(args.postId, args.weight);

                case 'citadel_trade_get_rate':
                    return await this.sdk.getTradeRate();

                case 'citadel_update_location':
                    return await this.sdk.updateLocation(args.lat, args.lon);

                case 'citadel_act':
                    return await this.sdk.act(args.action, args.data);

                case 'citadel_location_sync':
                    return await this.sdk.syncLocation();

                default:

                    throw new Error(`Unknown function: ${name}`);
            }
        } catch (error: any) {
            return {
                error: true,
                message: error.message
            };
        }
    }
}
