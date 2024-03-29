<template>
  <div>
    <div
      class="
        w-full
        lg:w-2/3
        px-2
        pt-4
        py-2
        pb-4
        border border-gray-400
        rounded-lg
        shadow
        bg-white
      "
    >
      <div class="w-full">
        <div
          class="
            w-full
            bg-gradient-to-br
            from-secondary
            to-primary
            shadow-lg
            flex
            justify-start
            items-center
            h-44
            sm:h-60
            rounded
            py-4
            px-2
          "
        >
          <div
            class="w-full h-full bg-image"
            :style="{ backgroundImage: 'url(' + bgImage + ')' }"
          >
            <div
              class="w-full h-full flex flex-col justify-between items-start"
            >
              <h2 class="text-white font-semibold text-2xl w-full sm:w-1/2">
                Aún no estás creando blogs. Comienza ahora
              </h2>
              <div class="w-full sm:w-1/2 lg:w-33 mt-4">
                <c-button
                  name="Crear blogs"
                  class="bg-primary mb-1"
                  @click="redirectionToCreateBlogs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- VAMOS A PRESENTAR LOS BLOGS -->
    <div
      class="
        bg-white
        h-96
        overflow-y-scroll
        w-full
        lg:w-2/3
        rounded
        py-1
        px-2
        mt-4
      "
    >
      <p class="text-gray-700 text-2xl font-semibold mb-6">
        Aquí damos a conocer cosas increíbles a nuestra comunidad
      </p>
      <div
        v-for="(post, i) in getPosts"
        :key="i"
        class="
          w-full
          flex flex-wrap
          justify-between
          items-end
          shadow-2xl
          rounded
          px-2
          py-3
          mb-4
          border border-gray-200
        "
      >
        <div class="w-full lg:w-1/2">
          <p
            v-if="post.post.published"
            class="text-primary text-base font-medium my-2"
          >
            Publicado
          </p>
          <p v-else class="text-gray-700 text-base font-medium my-2">
            Sin publicar
          </p>
          <p class="text-secondary text-xl font-medium my-2">
            {{ post.post.title }}
          </p>
        </div>
        <div class="w-full lg:w-1/2 mt-4 lg:mt-0 flex flex-wrap">
          <div class="w-full lg:w-1/2 mt-2 lg:mt-0 px-1">
            <c-button
              name="Editar simulador"
              class="bg-yellow-500 text-white"
              @click="editPost(post.post.id)"
            />
          </div>
          <div class="w-full lg:w-1/2 mt-2 lg:mt-0 px-1">
            <c-button
              name="Eliminar simulador"
              class="bg-pink-700 text-white"
              @click="removePost(post.post.id)"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- BOTONES PARA PEDIR NUEVAS PREGUNTAS -->
    <div
      class="
        w-full
        lg:w-8/12
        h-12
        mt-4
        mr-auto
        flex
        justify-center
        items-center
      "
    >
      <div
        class="
          w-40
          flex
          justify-center
          items-center
          bg-white
          mx-auto
          py-2
          rounded-lg
          shadow-lg
        "
      >
        <div class="w-32 flex justify-center items-center">
          <c-button
            name="Cargar más"
            class="bg-secondary"
            @click="fetchPosts"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import {
  getDocs,
  query,
  limit,
  startAfter,
  collection,
} from 'firebase/firestore'
import { fireDataBase } from '~/plugins/firebase/app'
export default {
  layout: 'app',
  data: () => ({
    bgImage: require('@/static/images/svg/newLesson.svg'),
    eof: false,
    lastDoc: null,
    batchSize: 5,
    posts: [],
  }),
  computed: {
    ...mapGetters('fireBlogs', ['getPosts']),
  },
  mounted() {
    this.resetEditingPost()
    this.fetchPosts()
  },
  methods: {
    ...mapActions('fireBlogs', [
      'setPosts',
      'resetEditingPost',
      'erasePost',
      'setData',
    ]),
    redirectionToCreateBlogs() {
      this.$router.push('createPost')
    },
    editPost(id) {
      this.setData(id)
    },
    removePost(id) {
      this.erasePost(id)
    },
    async fetchPosts() {
      try {
        if (this.eof) {
          return
        }
        this.isLoading = true
        let postQuery = query(
          collection(fireDataBase, 'posts'),
          limit(this.batchSize)
        )

        if (this.lastDoc) {
          postQuery = query(
            collection(fireDataBase, 'posts'),
            startAfter(this.lastDoc),
            limit(this.batchSize)
          )
        }

        const postSnapshot = await getDocs(postQuery)
        this.lastDoc = postSnapshot.docs[postSnapshot.docs.length - 1]
        postSnapshot.forEach((doc) => {
          this.posts.push({
            id: doc.id,
            post: doc.data(),
          })
        })
        this.isLoading = false
        this.setPosts(this.posts)
      } catch (error) {
        console.error(error)
      }
    },
  },
}
</script>

<style scoped>
.bg-image {
  background-position: right;
  background-size: contain;
  background-repeat: no-repeat;
}
@media only screen and (max-width: 640px) {
  .bg-image {
    background-size: cover;
    background-position-x: 50rem;
  }
}
</style>
