// By VishwaGauravIn (https://itsvg.in)

const GenAI = require("@google/generative-ai");
const { TwitterApi } = require("twitter-api-v2");
const SECRETS = require("./SECRETS");

const twitterClient = new TwitterApi({
  appKey: SECRETS.APP_KEY,
  appSecret: SECRETS.APP_SECRET,
  accessToken: SECRETS.ACCESS_TOKEN,
  accessSecret: SECRETS.ACCESS_SECRET,
});

const generationConfig = {
  maxOutputTokens: 400,
};
const genAI = new GenAI.GoogleGenerativeAI(SECRETS.GEMINI_API_KEY);

const requiredTags = "@giverep $REP @ikadotxyz $ikadotxyz";
const minInterval = 2 * 60 * 1000; // 2 minutes in milliseconds
const maxInterval = 10 * 60 * 1000; // 10 minutes in milliseconds

async function generateTweet() {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig,
  });

  const prompt = `
    Generate a tweet about GiveRep airdrop project on Sui network. 
    Include these tags: ${requiredTags}
    Keep it under 238 characters (excluding tags)
    Make it engaging and informative
    Use emojis where appropriate
    Focus on benefits, features, or community aspects
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const baseText = response.text();
  
  // Combine base text with required tags
  const tweetText = `${baseText} ${requiredTags}`;
  
  // Ensure tweet is under 280 characters
  if (tweetText.length > 280) {
    const truncatedText = tweetText.substring(0, 280 - requiredTags.length - 3) + "..." + requiredTags;
    return truncatedText;
  }
  return tweetText;
}

async function sendTweet() {
  try {
    const tweetText = await generateTweet();
    await twitterClient.v2.tweet(tweetText);
    console.log("Tweet sent successfully!", tweetText);
    
    // Generate random interval between 2 and 10 minutes
    const interval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
    console.log(`Next tweet will be sent in ${Math.round(interval / 60000)} minutes`);
    
    // Schedule next tweet
    setTimeout(sendTweet, interval);
  } catch (error) {
    console.error("Error sending tweet:", error);
    // Retry after a minute if there's an error
    setTimeout(sendTweet, 60000);
  }
}

// Start the tweeting process
sendTweet();
