// By VishwaGauravIn (https://itsvg.in)

const OpenAI = require("openai");
const { TwitterApi } = require("twitter-api-v2");
const SECRETS = require("./SECRETS");
const fs = require('fs');
const path = require('path');

/**
 * Check if API keys are valid and diagnostics info
 * @param {string} key - API key to check
 * @param {string} serviceName - Name of the service
 * @returns {boolean} - Whether the key appears valid
 */
function isApiKeyValid(key, serviceName) {
  if (!key) {
    console.log(`⚠️ No ${serviceName} API key found.`);
    return false;
  }
  
  // Basic validation - check if it looks like a valid key format
  if (key.length < 10) {
    console.log(`⚠️ ${serviceName} API key seems too short (${key.length} chars).`);
    return false;
  }
  
  return true;
}

/**
 * Read accounts from accounts.txt file
 * @returns {Array} Array of account objects with credentials
 */
function readAccountsFromFile() {
  try {
    const accountsFilePath = path.join(__dirname, 'accounts.txt');
    if (!fs.existsSync(accountsFilePath)) {
      console.log('⚠️ accounts.txt file not found. Creating sample file...');
      const sampleContent = `# Twitter accounts in format: APP_KEY,APP_SECRET,ACCESS_TOKEN,ACCESS_SECRET
# Each line represents one account
${SECRETS.APP_KEY},${SECRETS.APP_SECRET},${SECRETS.ACCESS_TOKEN},${SECRETS.ACCESS_SECRET}
# Add more accounts as needed, one per line in the same format`;
      fs.writeFileSync(accountsFilePath, sampleContent);
      console.log('Sample accounts.txt file created.');
    }

    const fileContent = fs.readFileSync(accountsFilePath, 'utf8');
    const accounts = [];
    let accountCount = 0;
    
    fileContent.split('\n').forEach((line) => {
      // Skip empty lines and comments
      if (line.trim() === '' || line.trim().startsWith('#')) {
        return;
      }
      
      try {
        const parts = line.split(',').map(item => item.trim());
        if (parts.length === 4) {
          const [appKey, appSecret, accessToken, accessSecret] = parts;
          if (appKey && appSecret && accessToken && accessSecret) {
            accountCount++;
            accounts.push({
              appKey,
              appSecret,
              accessToken,
              accessSecret,
              accountNumber: accountCount
            });
          } else {
            console.warn(`⚠️ Line with invalid credentials in accounts.txt. Skipping.`);
          }
        } else {
          console.warn(`⚠️ Invalid format in accounts.txt. Expected 4 comma-separated values.`);
        }
      } catch (error) {
        console.warn(`⚠️ Error parsing line in accounts.txt: ${error.message}`);
      }
    });
    
    if (accounts.length === 0) {
      console.log('⚠️ No valid accounts found in accounts.txt. Using default account from SECRETS.js');
      // Fallback to the default account from SECRETS.js
      accounts.push({
        appKey: SECRETS.APP_KEY,
        appSecret: SECRETS.APP_SECRET,
        accessToken: SECRETS.ACCESS_TOKEN,
        accessSecret: SECRETS.ACCESS_SECRET,
        accountNumber: 1
      });
    }
    
    return accounts;
  } catch (error) {
    console.error('Error reading accounts file:', error);
    // Fallback to the default account from SECRETS.js
    return [{
      appKey: SECRETS.APP_KEY,
      appSecret: SECRETS.APP_SECRET,
      accessToken: SECRETS.ACCESS_TOKEN,
      accessSecret: SECRETS.ACCESS_SECRET,
      accountNumber: 1
    }];
  }
}

// Initialize Twitter clients for all accounts
const twitterAccounts = readAccountsFromFile();
const twitterClients = twitterAccounts.map(account => {
  return {
    client: new TwitterApi({
      appKey: account.appKey,
      appSecret: account.appSecret,
      accessToken: account.accessToken,
      accessSecret: account.accessSecret,
    }),
    accountNumber: account.accountNumber
  };
});

console.log(`🔄 Loaded ${twitterClients.length} Twitter accounts from accounts.txt`);

// Initialize AI API (DeepSeek or OpenAI) with configuration
const aiServices = [
  { name: "DeepSeek", key: SECRETS.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { name: "OpenAI", key: SECRETS.OPENAI_API_KEY, baseURL: undefined, model: "gpt-3.5-turbo" }
];

// Find the first available AI service
const activeAiService = aiServices.find(service => isApiKeyValid(service.key, service.name));

let openai;
if (activeAiService) {
  console.log(`🤖 Using ${activeAiService.name} for AI tweet generation`);
  openai = new OpenAI({
    apiKey: activeAiService.key,
    baseURL: activeAiService.baseURL,
  });
} else {
  console.warn("⚠️ No valid AI API key configured. Will use fallback tweets only.");
  console.log("To fix this, add a valid API key to SECRETS.js for either DeepSeek or OpenAI.");
}

const requiredTags = "@giverep $REP @ikadotxyz";

// Predefined tweets to use as fallbacks
const fallbackTweets = [
  `🚀 Excited about the GiveRep project on Sui network! Earn by engaging with quality content and building your reputation. Join now! ${requiredTags}`,
  `💯 GiveRep is revolutionizing content engagement on Sui. Contribute, earn rewards, and build your reputation in the community! ${requiredTags}`,
  `✨ Looking for the next big thing on Sui? GiveRep rewards quality engagement and helps build meaningful connections in the ecosystem! ${requiredTags}`,
  `🌟 Engage, contribute, earn! GiveRep on Sui network makes your community participation count. Get ready for the airdrop! ${requiredTags}`,
  `🔥 GiveRep: Where quality engagement meets rewards on Sui network. Start building your reputation today! ${requiredTags}`,
  `🎯 GiveRep lets you earn while you learn and engage with quality content on Sui network. Don't miss out! ${requiredTags}`,
  `🌈 Quality engagement deserves rewards! GiveRep on Sui is making this a reality. Join the community! ${requiredTags}`,
  `⚡ Supercharge your Sui experience with GiveRep - earn tokens for meaningful contributions! ${requiredTags}`
];

/**
 * Generates tweet content using AI (OpenAI or DeepSeek)
 * Falls back to a predefined tweet if AI generation fails
 * @returns {Promise<string>} The generated tweet text
 */
async function generateTweet() {
  try {
    if (!activeAiService) {
      // No AI service available, use fallback tweets
      const randomTweet = fallbackTweets[Math.floor(Math.random() * fallbackTweets.length)];
      console.log("\n--- Using Fallback Tweet (No AI API Key) ---");
      console.log(randomTweet);
      console.log("--- End of Tweet ---\n");
      console.log(`Tweet length: ${randomTweet.length} characters (max: 280)`);
      return randomTweet;
    }

    const prompt = `
      Generate a tweet about GiveRep airdrop project on Sui network. 
      Include these tags: ${requiredTags}
      Keep it under 238 characters (excluding tags)
      Make it engaging and informative
      Use emojis where appropriate
      Focus on benefits, features, or community aspects
    `;

    console.log(`Generating tweet with ${activeAiService.name}...`);
    
    // Try to use the AI API for content generation
    try {
      const response = await openai.chat.completions.create({
        model: activeAiService.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      });
      
      // Extract the generated tweet text
      const generatedText = response.choices[0].message.content.trim();
      
      // Remove any tags that might have been generated by the AI
      let cleanedText = generatedText;
      if (generatedText.includes("@giverep") || 
          generatedText.includes("$REP") || 
          generatedText.includes("@ikadotxyz")) {
        // Remove the tags from the generated text
        cleanedText = generatedText
          .replace(/@giverep/gi, "")
          .replace(/\$REP/g, "")
          .replace(/@ikadotxyz/gi, "")
          .trim();
      }
      
      // Combine base text with required tags
      const tweetText = `${cleanedText} ${requiredTags}`;
      
      console.log("\n--- Generated Tweet ---");
      console.log(tweetText);
      console.log("--- End of Tweet ---\n");
      console.log(`Tweet length: ${tweetText.length} characters (max: 280)`);
      
      return tweetText;
    } catch (aiError) {
      console.error(`${activeAiService.name} API Error:`, aiError.message);
      
      if (aiError.message.includes("402") || aiError.message.includes("Insufficient Balance")) {
        console.log(`\n⚠️ Your ${activeAiService.name} account has insufficient balance.`);
        console.log(`To fix this issue:`);
        console.log(`1. Visit the ${activeAiService.name} website and add funds to your account`);
        console.log(`2. Or create a new API key with sufficient balance`);
        console.log(`3. Or use an OpenAI API key instead by adding it to SECRETS.js`);
      }
      
      console.log("Falling back to predefined tweet content...");
      
      // Select a random fallback tweet
      const randomTweet = fallbackTweets[Math.floor(Math.random() * fallbackTweets.length)];
      
      console.log("\n--- Fallback Tweet ---");
      console.log(randomTweet);
      console.log("--- End of Tweet ---\n");
      console.log(`Tweet length: ${randomTweet.length} characters (max: 280)`);
      
      return randomTweet;
    }
    
  } catch (error) {
    console.error("Error in tweet generation process:", error);
    // Final fallback if everything else fails
    return `🚀 Excited about the GiveRep project on Sui network! Join the community today! ${requiredTags}`;
  }
}

/**
 * Sleep function to add delay between API calls
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} - Promise that resolves after the specified time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Saves tweet history to a local file
 * @param {string} tweetText - The text of the tweet
 * @param {object} results - The results of the posting operation
 */
function saveTweetHistory(tweetText, results) {
  try {
    const historyPath = path.join(__dirname, 'tweet_history.json');
    let history = [];
    
    // Read existing history if available
    if (fs.existsSync(historyPath)) {
      const historyData = fs.readFileSync(historyPath, 'utf8');
      try {
        history = JSON.parse(historyData);
      } catch (error) {
        console.warn('⚠️ Error parsing tweet history file. Starting fresh.');
      }
    }
    
    // Add new tweet to history
    const tweetRecord = {
      timestamp: new Date().toISOString(),
      text: tweetText,
      accounts: results.map(result => ({
        accountNumber: result.accountNumber,
        success: result.success,
        simulated: result.simulated || false,
        tweetId: result.success || result.simulated ? 
          (result.response?.data?.id || 'unknown') : null,
        error: result.success ? null : (result.error?.message || 'Unknown error')
      }))
    };
    
    history.push(tweetRecord);
    
    // Save history back to file (keep only last 100 tweets)
    if (history.length > 100) {
      history = history.slice(history.length - 100);
    }
    
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    console.log('📝 Tweet saved to history file.');
  } catch (error) {
    console.error('Error saving tweet history:', error);
  }
}

/**
 * Posts a tweet to Twitter or simulates posting if there are API issues
 * @param {string} tweetText - The text of the tweet to post
 * @param {object} twitterClientObj - Object containing the Twitter client and account number
 * @param {number} retryCount - Number of retry attempts remaining (default: 3)
 * @returns {Promise<object>} - Response from Twitter API
 */
async function postTweetWithClient(tweetText, twitterClientObj, retryCount = 3) {
  const { client: twitterClient, accountNumber } = twitterClientObj;
  
  try {
    console.log(`\nPosting tweet to Twitter account #${accountNumber}...`);
    
    try {
      // Try to post to Twitter
      const response = await twitterClient.v2.tweet(tweetText);
      console.log(`✅ Account #${accountNumber}: Tweet posted successfully!`);
      console.log(`   Tweet ID: ${response.data.id}`);
      console.log(`   Tweet URL: https://twitter.com/user/status/${response.data.id}`);
      return { 
        success: true, 
        response,
        accountNumber
      };
    } catch (twitterError) {
      // Handle Twitter API errors
      console.error(`❌ Account #${accountNumber} Twitter API Error:`, twitterError.message);
      
      // Handle specific error codes
      if (twitterError.code === 403) {
        console.log(`\n⚠️ Twitter account #${accountNumber} doesn't have write permissions.`);
        console.log("To fix this issue:");
        console.log("1. Go to https://developer.twitter.com/en/portal/dashboard");
        console.log("2. Select your app");
        console.log("3. Go to 'User authentication settings'");
        console.log("4. Ensure you have 'Read and write' permissions enabled");
        console.log("5. You may need to reapply for elevated access if your app only has read permissions");
      } else if (twitterError.code === 429) {
        console.log(`\n⚠️ Twitter account #${accountNumber} is rate limited.`);
        
        // Retry logic for rate limits
        if (retryCount > 0) {
          const waitTime = 60000; // 1 minute
          console.log(`Waiting ${waitTime/1000} seconds before retrying...`);
          await sleep(waitTime);
          console.log(`Retrying post for account #${accountNumber} (${retryCount} attempts left)...`);
          return postTweetWithClient(tweetText, twitterClientObj, retryCount - 1);
        }
      } else if (twitterError.code === 401) {
        console.log(`\n⚠️ Twitter account #${accountNumber} has invalid credentials.`);
        console.log("Please check your API keys and tokens in accounts.txt");
      } else if (twitterError.code === 400) {
        console.log(`\n⚠️ Twitter account #${accountNumber} encountered a bad request error.`);
        console.log("This may be due to duplicate content or other Twitter policy violations.");
      } else if (twitterError.code === 503) {
        console.log(`\n⚠️ Twitter API is currently unavailable (service down).`);
        console.log("Please try again later.");
      }
      
      // Check for a duplicate tweet error
      if (twitterError.message && twitterError.message.includes("duplicate")) {
        console.log(`\n⚠️ Twitter account #${accountNumber} tried to post a duplicate tweet.`);
        console.log("To fix this issue, modify the tweet content to make it unique.");
        
        // Add a timestamp to make the tweet unique
        const timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS
        const uniqueTweet = `${tweetText} [${timestamp}]`;
        
        if (retryCount > 0) {
          console.log("Adding timestamp to tweet and retrying...");
          await sleep(2000);
          return postTweetWithClient(uniqueTweet, twitterClientObj, retryCount - 1);
        }
      }
      
      console.log(`\nSimulating successful tweet post for testing with account #${accountNumber}...`);
      console.log("Note: The tweet was NOT actually posted to Twitter.");
      
      // Return a simulated response for testing
      return { 
        success: false, 
        error: twitterError,
        simulated: true,
        accountNumber,
        response: {
          data: {
            id: `simulation-account${accountNumber}-${Date.now()}`,
            text: tweetText
          }
        }
      };
    }
  } catch (error) {
    console.error(`Error in tweet posting process for account #${accountNumber}:`, error);
    return { 
      success: false, 
      error,
      accountNumber
    };
  }
}

/**
 * Posts a tweet to all Twitter accounts with a delay between each
 * @param {string} tweetText - The text of the tweet to post
 * @returns {Promise<Array>} - Array of results from all account posting attempts
 */
async function postTweetToAllAccounts(tweetText) {
  console.log(`\nAttempting to post tweet to ${twitterClients.length} Twitter accounts...`);
  
  const results = [];
  
  // Post to each account sequentially with delays to avoid rate limits
  for (const clientObj of twitterClients) {
    // Post to this account
    const result = await postTweetWithClient(tweetText, clientObj);
    results.push(result);
    
    // Add a delay between requests to avoid rate limits
    if (clientObj !== twitterClients[twitterClients.length - 1]) {
      const delayMs = 2000; // 2 seconds
      console.log(`Waiting ${delayMs/1000} seconds before posting to next account...`);
      await sleep(delayMs);
    }
  }
  
  // Summary of results
  const successCount = results.filter(r => r.success).length;
  const simulatedCount = results.filter(r => r.simulated).length;
  const failedCount = results.filter(r => !r.success && !r.simulated).length;
  
  console.log("\n=== POSTING SUMMARY ===");
  console.log(`Total accounts: ${results.length}`);
  console.log(`✅ Successfully posted: ${successCount}`);
  console.log(`🔄 Simulated posts: ${simulatedCount}`);
  console.log(`❌ Failed posts: ${failedCount}`);
  
  // Save tweet history
  saveTweetHistory(tweetText, results);
  
  return results;
}

/**
 * Print bot status and diagnostic information
 */
function printDiagnostics() {
  console.log("\n=== DIAGNOSTIC INFORMATION ===");
  
  // Check AI services
  let aiStatus = "❌ No valid AI API keys found";
  if (activeAiService) {
    aiStatus = `✅ Using ${activeAiService.name} API`;
  }
  console.log(`AI Generation: ${aiStatus}`);
  
  // Check Twitter accounts
  console.log(`Twitter Accounts: ${twitterClients.length} accounts loaded`);
  
  // Check accounts.txt file
  const accountsPath = path.join(__dirname, 'accounts.txt');
  console.log(`accounts.txt: ${fs.existsSync(accountsPath) ? '✅ Found' : '❌ Not found'}`);
  
  // Check tweet history
  const historyPath = path.join(__dirname, 'tweet_history.json');
  console.log(`Tweet History: ${fs.existsSync(historyPath) ? '✅ Found' : '❌ Not created yet'}`);
  
  console.log("=============================");
}

/**
 * Main function to both generate and post a tweet
 * @param {boolean} diagnosticsOnly - If true, only runs diagnostics without posting
 */
async function run(diagnosticsOnly = false) {
  try {
    console.log("==========================================================");
    console.log("🐦 Twitter Auto Poster Bot (Multi-Account Version)");
    console.log("==========================================================");
    
    // Print diagnostics
    printDiagnostics();
    
    // Exit early if only running diagnostics
    if (diagnosticsOnly) {
      console.log("\n✅ Diagnostics completed. Exiting without posting.");
      return;
    }
    
    // Check if we have any Twitter accounts
    if (twitterClients.length === 0) {
      console.error("⚠️ No Twitter accounts found in accounts.txt or SECRETS.js");
      return;
    }
    
    // Generate the tweet
    const tweet = await generateTweet();
    
    // Ask for confirmation before posting
    console.log("\nWould you like to post this tweet to all accounts? (y/n)");
    // In a real application, you would wait for user input here
    // For now, let's assume "yes" for testing purposes
    const shouldPost = true;
    
    if (shouldPost) {
      await postTweetToAllAccounts(tweet);
    } else {
      console.log("Tweet not posted. Exiting...");
    }
    
    console.log("\n✅ Process completed!");
    console.log("==========================================================");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Process command line arguments
const args = process.argv.slice(2);
const runDiagnosticsOnly = args.includes('--diagnostics');

// Run the program
run(runDiagnosticsOnly);
