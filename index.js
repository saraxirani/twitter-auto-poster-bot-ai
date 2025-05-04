// By VishwaGauravIn (https://itsvg.in)

const OpenAI = require("openai");
const { TwitterApi } = require("twitter-api-v2");
const SECRETS = require("./SECRETS");

const twitterClient = new TwitterApi({
  appKey: SECRETS.APP_KEY,
  appSecret: SECRETS.APP_SECRET,
  accessToken: SECRETS.ACCESS_TOKEN,
  accessSecret: SECRETS.ACCESS_SECRET,
});

// Initialize DeepSeek API with OpenAI compatibility
const openai = new OpenAI({
  apiKey: SECRETS.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1", // DeepSeek API endpoint
});

const requiredTags = "@giverep $REP @ikadotxyz";

async function generateTweet() {
  try {
    const prompt = `
      Generate a tweet about GiveRep airdrop project on Sui network. 
      Include these tags: ${requiredTags}
      Keep it under 238 characters (excluding tags)
      Make it engaging and informative
      Use emojis where appropriate
      Focus on benefits, features, or community aspects
    `;

    console.log("Generating tweet with DeepSeek AI...");
    
    // This is where we would call the DeepSeek API
    // Since there's an insufficient balance issue, let's create a mock response
    // to show what the output would look like
    
    // Mock response for demonstration purposes
    const sampleTweet = "🚀 Excited about @GiveRep on Sui? Earn $REP by engaging with quality content! Your contributions shape the community. Start building your reputation today & be ready for the airdrop! 💯";
    
    // Combine base text with required tags
    const tweetText = `${sampleTweet} ${requiredTags}`;
    
    console.log("\n--- Generated Tweet ---");
    console.log(tweetText);
    console.log("--- End of Tweet ---\n");
    console.log(`Tweet length: ${tweetText.length} characters (max: 280)`);
    
    // Explain why we're not making the actual API call
    console.log("\nNote: Not making actual DeepSeek API call due to 'Insufficient Balance' error.");
    console.log("To fix this, you need to add credits to your DeepSeek account or use a different AI service.");
    
  } catch (error) {
    console.error("Error generating tweet:", error);
  }
}

// Just generate the tweet once, without sending to Twitter
generateTweet();
