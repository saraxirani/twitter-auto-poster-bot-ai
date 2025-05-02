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

const REQUIRED_TAGS = "@giverep $REP @ikadotxyz $ikadotxyz";
const TOTAL_TWEETS = 300;

async function generateTweet() {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig,
  });

  const prompt = `
    Generate a unique tweet about Giverep airdrop on Sui network.
    Include information about:
    - Giverep project
    - Sui network benefits
    - Airdrop details
    - Community engagement
    
    The tweet must:
    - Be under 280 characters
    - Be engaging and informative
    - Include emojis
    - End with these tags: ${REQUIRED_TAGS}
    - Be suitable for Twitter
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Ensure the tweet is under 280 characters
  const tweetText = text.length > 280 ? text.substring(0, 270) + "..." : text;
  
  console.log("Generated tweet:", tweetText);
  return tweetText;
}

async function sendTweet(tweetText) {
  try {
    await twitterClient.v2.tweet(tweetText);
    console.log("Tweet sent successfully!");
  } catch (error) {
    console.error("Error sending tweet:", error);
  }
}

async function main() {
  let tweetsSent = 0;
  
  while (tweetsSent < TOTAL_TWEETS) {
    try {
      const tweet = await generateTweet();
      await sendTweet(tweet);
      tweetsSent++;
      console.log(`Tweet ${tweetsSent} of ${TOTAL_TWEETS} sent successfully`);
      
      // Generate random interval between 2-10 minutes
      const randomMinutes = Math.floor(Math.random() * 9) + 2;
      console.log(`Waiting for ${randomMinutes} minutes before next tweet...`);
      await new Promise(resolve => setTimeout(resolve, randomMinutes * 60 * 1000));
    } catch (error) {
      console.error("Error in main loop:", error);
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 60 * 1000));
    }
  }
  console.log("All tweets have been sent!");
}

main();
