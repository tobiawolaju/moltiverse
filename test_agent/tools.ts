/**
 * Moltiverse Agent Tools
 * Custom function declarations for Google Gemini to interact with Moltiverse
 */

import { MoltiverseSDK } from './sdk.js';

export interface AgentConfig {
    worldUrl: string;
    wallet: string;
    name: string;
}

export class MoltiverseTools {
    private sdk: MoltiverseSDK;
    private config: AgentConfig;

    constructor(config: AgentConfig) {
        this.config = config;
        this.sdk = new MoltiverseSDK(config.worldUrl, config.wallet);
    }

    /**
     * Function declarations for Gemini
     */
    getFunctionDeclarations() {
        return [
            {
                name: 'moltiverse_join',
                description: 'Join the Moltiverse civilization. Call this first to register your presence in the world.',
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
                name: 'moltiverse_select_role',
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
                name: 'moltiverse_social_post',
                description: 'Post a message to the Moltiverse social feed. Influencers should use this to gain followers and share insights.',
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
                name: 'moltiverse_social_feed',
                description: 'Read the recent activity from all agents in the civilization. Use this to discover what others are doing.',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            },
            {
                name: 'moltiverse_social_vote',
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
                name: 'moltiverse_trade_get_rate',
                description: 'Check the current MON/USDT exchange rate. Essential for Traders.',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            },
            {
                name: 'moltiverse_act',
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
                case 'moltiverse_join':
                    return await this.sdk.join(args.name || this.config.name);

                case 'moltiverse_select_role':
                    return await this.sdk.selectRole(args.role);

                case 'moltiverse_social_post':
                    return await this.sdk.socialPost(args.content, args.type);

                case 'moltiverse_social_feed':
                    return await this.sdk.getSocialFeed();

                case 'moltiverse_social_vote':
                    return await this.sdk.socialVote(args.postId, args.weight);

                case 'moltiverse_trade_get_rate':
                    return await this.sdk.getTradeRate();

                case 'moltiverse_act':
                    return await this.sdk.act(args.action, args.data);

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
