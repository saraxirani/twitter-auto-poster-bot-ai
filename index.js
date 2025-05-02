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

async function run() {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig,
  });

  // Write your prompt here
  const prompt =
    "در مورد توکن های sui بگو همراه با هشتگ ضمنا بیشتر از 280 کاراکتر نشود ضمنا در ده تویت قبلی متن مشابه نباشد" ;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  sendTweet(text);
}

// Function to generate random interval between 3 and 10 minutes
function getRandomInterval() {
  return Math.floor(Math.random() * (10 - 3 + 1) + 3) * 60 * 1000; // Convert minutes to milliseconds
}

// Start the tweet posting loop
async function startTweeting() {
  while (true) {
    await run();
    const nextInterval = getRandomInterval();
    console.log(`Next tweet in ${nextInterval / 60000} minutes`);
    await new Promise(resolve => setTimeout(resolve, nextInterval));
  }
}

startTweeting();

async function sendTweet(tweetText) {
  try {
    await twitterClient.v2.tweet(tweetText);
    console.log("Tweet sent successfully!");
  } catch (error) {
    console.error("Error sending tweet:", error);
  }
}
