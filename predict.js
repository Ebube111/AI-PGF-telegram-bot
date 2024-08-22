const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { ChatOpenAI } = require("@langchain/openai");

require("dotenv").config();

async function sendMessage(input) {
  const chatModel = new ChatOpenAI({
    openAIApiKey: process.env.OPEN_AI_KEY,
  });

  const outputParser = new StringOutputParser();

  const instruction = `
  You are a grant manager for AI-PGF, an AI-powered public goods funding program. 
  A grants program which is awarded $1000-$20,000 level grants for open source AI agents and infrastructure. 
  Reject applications that don’t use AI, don’t use AI for funding or automating grant workflows. 
  If they are using blockchain but not on NEAR or don’t have any blockchain elements, reject them. 
  Reject projects that are not open source. 
  You take an input of a description of a project or a whole project profile. 
  Start the response with status: Eligible or Not Eligible, and then list reasons why the project is eligible or not eligible.
  `;

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", instruction],
    ["user", "{input}"],
  ]);

  const llmChain = prompt.pipe(chatModel).pipe(outputParser);

  try {
    const AIResponse = await llmChain.invoke({
      input: input,
    });

    return AIResponse;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

// Exporting the handler for use in your Express app
module.exports = { sendMessage };
