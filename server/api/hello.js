import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from "langchain/llms/openai";
import { VectorDBQAChain } from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import {
    ChatPromptTemplate,
  } from 'langchain/prompts';
  import { ConversationChain } from 'langchain/chains';
  import { BufferMemory } from 'langchain/memory';

  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: 'history',
  });
export default defineEventHandler(async (event) => {

    // const query = "when was the paper written?"
    const body = await readBody(event)
    const query = body.prompt
    console.log("---------query")
    console.log(query)
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index("relevance");
    const model = new OpenAI();

      const template = `
      The following is a friendly conversation between a human and an AI. 
      The AI is talkative and provides lots of specific details from its context. 
      If the AI does not know the answer to a question, it truthfully says it does not know.
      Use the "history" to understand what we've already talked about in the conversation.
  
      Use the CONTEXT below to answer the QUESTION asked by the user.
      `
        // const humanTemplate = "{text}";

        const chatPrompt = ChatPromptTemplate.fromMessages([
        ["system", template]
        // ["human", humanTemplate],
        ]);

      const llmChain = new ConversationChain({
        memory,
        prompt: chatPrompt,
        llm: model,
        verbose: true,
      });

    const vectorStore = await PineconeStore.fromExistingIndex(
        new OpenAIEmbeddings(),
        { pineconeIndex }
      );

      const vectorChain = VectorDBQAChain.fromLLM(model, vectorStore, {
        k: 5,
        returnSourceDocuments: true,
      });

      const pineconeResponse = await vectorChain.call({ query });

      try {
        // Create a prompt to inform the LLM how to respond
        // Insert the database results and question to guide the answer
        const prompt = `
              CONTEXT: ${JSON.stringify(pineconeResponse)}
              
              QUESTION: ${query}
              `;
  
        // Await the LLM response
        const response = await llmChain.call({ input: prompt });
        // console.log(response)
        // return response;
        // return response
        // Return the result to requester
        // response.status(200).json({ response });
      } catch (err) {
        console.log(err)
        // response.status(500).json({ error: 'Failed to load data' });
      }

    //   console.log(response);
      return { pineconeResponse };

});