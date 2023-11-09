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

    const body = await readBody(event)
    const query = body.prompt
    console.log("---------query")
    console.log(query)
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index("relevance");
    const model = new OpenAI();

      const template = `
      If the AI does not know the answer to a question, it truthfully says it does not know.
  
      Use the CONTEXT below to answer the QUESTION asked by the user.
      `

        const chatPrompt = ChatPromptTemplate.fromMessages([
        ["system", template]
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
        const prompt = `
              CONTEXT: ${JSON.stringify(pineconeResponse)}
              
              QUESTION: ${query}
              `;
  

        const response = await llmChain.call({ input: prompt });
        // return response;

      } catch (err) {
        console.log(err)
      }

      return { pineconeResponse };

});