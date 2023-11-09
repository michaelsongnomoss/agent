<template>  
    <!-- <button @click="submit"></button> -->
 
    <div class="chat-bot">
       <div class="chat-box">
         <div v-for="(message, index) in chatMessages" :key="index" :class="message.sender">
           {{ message.text }}
         </div>
       </div>
       <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type a message..." />
     </div>

     <div v-for="(relevant) in relevanceSections" class="relevance-section">
        {{ relevant.pageContent }}

     </div>
</template>

<script>
export default {
    data() {
        return {
            chatMessages: [],
            newMessage: '',
            relevanceSections: ''
        }
    },
    methods: {
        async sendMessage() {
            if (this.newMessage) {
                this.chatMessages.push({ text: this.newMessage, sender: 'user' });
            try {
                const newResponse = await $fetch('/api/hello', {
                    method: 'post',
                    body: { prompt: this.newMessage}
                })
                this.chatMessages.push({ text: newResponse.pineconeResponse.text, sender: 'bot' });
                this.relevanceSections = newResponse.pineconeResponse.sourceDocuments;
            } catch(err){
                console.log(err)
            }
            console.log("-------------chat")
            console.log(this.chatMessages)
            this.newMessage = '';
            // this.relevanceSections = [];
        }
      },
    },
}
</script>


