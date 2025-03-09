<template>
  <div>
    <h1 v-if="user">Welcome, {{ user.name }}</h1>
    <a v-if="!user" :href="loginUrl">Authenticate with Google</a>
    <v-btn v-if="user" style="text-align: right; justify-content: right;" @click="logout">Logout</v-btn>
  </div>
 
    <v-container >
    
    <!-- Button to trigger the modal -->
   
    <!-- Modal Overlay -->
    
    <!-- Add Book Button -->
     <div>
    <v-btn color="primary" @click="showModal = true">Add Book</v-btn>

    <!-- Modal Dialog -->
    <v-dialog v-model="showModal" persistent max-width="400px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Add a New Book</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="bookForm" v-model="valid">
            <v-text-field v-model="title" label="Title" required :rules="[rules.required]"></v-text-field>
            <v-text-field v-model="category" label="Category" required :rules="[rules.required]"></v-text-field>
            <v-text-field v-model="year" label="Year" type="number" required :rules="[rules.required, rules.year]"></v-text-field>
            <v-text-field v-model="author" label="Author" required :rules="[rules.required]"></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-btn color="blue darken-1" text @click="closeModal">Cancel</v-btn>
          <v-btn color="blue darken-1" text :disabled="!valid" @click="submitForm">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </div>

      
      <h1 style="justify-content: center; text-align: center; margin-top: 50px;">Library!!</h1>
      <v-select style="margin-top: 50px;"
      v-model="selectedCategory"
      :items="categories"
      label="Filter by category"
      @change="fetchBooks"
    ></v-select>

    <v-row>

      <v-col v-for="book in filteredBooks" :key="book.id">
        <v-card>
          <v-card-title>{{ book.title }}</v-card-title>
          <v-card-subtitle>{{ book.category }}</v-card-subtitle>

          <v-card-actions>
            <v-btn
              :color="isLiked(book.id) ? 'red' : 'grey'"
              @click="toggleLike(book.id)"
            >
              <v-icon>{{ isLiked(book.id) ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
              {{ isLiked(book.id) ? 'Unlike' : 'Like' }}
            </v-btn>
            
          <v-btn icon color="red" @click="deleteBook(book.id)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
      
          </v-card-actions>
          </v-card>




      </v-col>
    </v-row>

    <h2 style="margin-top: 60px;margin-bottom: 15px;">❤️ Liked Books</h2>
    <v-row>
      <v-col v-for="book in likedBooks" :key="book.id" cols="12" sm="6" md="4">
        <v-card>
          <v-card-title>{{ book.title }}</v-card-title>
          <v-card-subtitle>{{ book.author }} - {{ book.year }}</v-card-subtitle>
          <v-card-text>Category: {{ book.category }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    
  </v-container>

</template>

<script>
  import axios from "axios";


export default {
  data() {
    return {
      books: [],
      categories:['All','Fantasy','Sci-Fi','Fiction','Non-fiction'],
      selectedCategory:'All',
      user: null,
      loginUrl: "http://localhost:5000/auth/google", // Redirect link
      likedBooks: [],

      userId:0,
      showModal: false,
      title: "",
      category: "",
      year: "",
      author: "",
      valid:false,
      rules: {
        required: (value) => !!value || "Required.",
        year: (value) => (value >= 1000 && value <= new Date().getFullYear()) || "Enter a valid year",
      },

    };
  },
  computed:{
    filteredBooks(){

      if(this.selectedCategory=='All'){
        return this.books
      }
      else{
        return this.books.filter((book)=> book.category==this.selectedCategory)
      }
    }

  },
  methods:{
  async fetchBooks() {
    try {
      const response = await axios.get("http://localhost:5000/api/books",{
        params: { user_id: this.userId } 


      });
      this.books = response.data;
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  },
  async submitForm(){
    if (!this.valid) return; // Prevent submission if the form is invalid
    try{

      const response=await axios.post("http://localhost:5000/api/books",{

        user_id: this.userId, // Ensure user_id is available in the component
        title: this.title,
        category: this.category,
        year: this.year,
        author: this.author
      })

      this.closeModal();
      this.fetchBooks();
    }
    catch (error) {
      console.error("Error adding book:", error);
    }

  },
  closeModal() {
      this.showModal = false;
      this.title = "";
      this.category = "";
      this.year = "";
      this.author = "";
    },
  async fetchUser() {
      try {
        const response = await axios.get('http://localhost:5000/user', { withCredentials: true });
        console.log('user ',response.data)
        this.user = response.data;
        this.userId=response.data.id
        console.log('actual id ',this.userId)
      } catch (error) {
        console.error("Error fetching user", error);
      }
    },
    async toggleLike(bookId) {
      if (this.isLiked(bookId)) {
        await this.unlikeBook(bookId);
      } else {
        await this.likeBook(bookId);
      }
    },

    async fetchLikedBooks() {
      console.log('like id', this.userId)
      try {
        const response = await axios.get(
          `http://localhost:5000/api/liked-books/${this.userId}`
        );
        this.likedBooks = response.data;
      } catch (error) {
        console.error("Error fetching liked books:", error);
      }
    },
    isLiked(bookId) {
      return this.likedBooks.some((book) => book.id === bookId);
    },

    async likeBook(bookId) {
      try {
        await axios.post("http://localhost:5000/api/like", {
          user_id: this.userId,
          book_id: bookId,
        });
        this.fetchLikedBooks(); // Refresh liked books
      } catch (error) {
        console.error("Error liking book:", error);
      }
    },

    async unlikeBook(bookId){
      try{
        await axios.delete("http://localhost:5000/api/unlike",{
          data: { user_id: this.userId, book_id: bookId },

        })
        this.fetchLikedBooks();
      }
      catch (error) {
        console.error("Error unliking book:", error);
      }
    },
    async deleteBook(bookId) {
      try {
        await axios.delete(`http://localhost:5000/api/books/${bookId}`,{
          params: { user_id: this.userId } // Pass user_id in query

        });
      
      } catch (error) {
        console.error("Error deleting book:", error);
      }
      this.fetchBooks()
    },




    loginWithGoogle() {
      window.location.href = "http://localhost:5000/auth/google";
    },

    
    async logout() {
      try{
      await axios.get('http://localhost:5000/logout', { withCredentials: true });
      this.user = null;
      window.location.reload(); // 👈 Ensures session is cleared fully

    }catch(error){
      console.error('logout error:',error)
    }
  }

},
async mounted(){
  await this.fetchUser()
  await this.fetchBooks()
  this.fetchLikedBooks()
  
}
}
</script>

<style scoped>

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

</style>
