import { fireStorage, fireDataBase } from '~/plugins/firebase/app'
import {
  getDocs,
  setDoc,
  doc,
  collection,
  updateDoc,
  query,
  getDoc,
  where,
  limit,
  startAfter,
  deleteDoc,
} from '@firebase/firestore'
import {
  getDownloadURL,
  uploadBytes,
  ref,
  deleteObject,
} from '@firebase/storage'

export const state = () => ({
  posts: [],
  loading: false,
  editingPost: {},
  lastDoc: '',
  publishedPosts: [],
})

export const getters = {
  getPosts(state) {
    return state.posts
  },
  isLoading(state) {
    return state.loading
  },
  getEditingPost(state) {
    return state.editingPost
  },
  getLastDoc(state) {
    return state.lastDoc
  },
  getPublishedPosts(state) {
    return state.publishedPosts
  },
}

export const mutations = {
  // recibimos el post creado
  ADD_POST(state, payload) {
    state.posts.push(payload)
  },
  // recibimos los posts que traemos desde firebase
  ADD_POSTS(state, payload) {
    state.posts = payload
  },
  // recibimos solo los posts publicados
  ADD_PUBLISHED_POSTS(state, payload) {
    state.publishedPosts.push(payload)
  },
  LOADING(state, payload) {
    state.loading = payload
  },
  EDITING_POST(state, payload) {
    // recibimos el id del documento en edicion
    const editingPost = state.posts.filter((post) => post.id === payload)
    state.editingPost = editingPost[0].post
    this.$router.push('createPost')
  },
  ERASE_EDITING_POST(state, payload) {
    state.editingPost = payload
  },
  // recibimos el ultimo documento del fetch previo
  SET_LAST_DOC(state, payload) {
    state.lastDoc = payload
  },
  ERASE_POST(state, payload) {
    const postIndex = state.posts.findIndex((post) => post.id === payload)
    state.posts.splice(postIndex, 1)
  },
  RESET_BLOGS_STORE(state) {
    state.posts = []
    state.loading = false
    state.editingPost = {}
    state.lastDoc = ''
    state.publishedPosts = []
  },
}

export const actions = {
  async savePost({ commit, getters }, payload) {
    commit('LOADING', true)
    try {
      const postEditing = getters.getEditingPost
      // Primero verificamos que no exista el post
      if (postEditing === '') {
        const postRef = doc(collection(fireDataBase, 'posts'))
        const filename = payload.image.name
        const imageNameExt = filename.slice(filename.lastIndexOf('.'))
        const image = payload.image
        const id = postRef.id
        const imageRefs = ref(fireStorage, 'posts/' + id + imageNameExt)
        await uploadBytes(imageRefs, image)
        const url = await getDownloadURL(imageRefs)
        await setDoc(postRef, {
          title: payload.title,
          postData: payload.postData,
          image: url,
          published: false,
          id: id,
        })
        commit('ADD_POST', {
          title: payload.title,
          postData: payload.postData,
          image: url,
          published: false,
          id: id,
        })
        commit('EDITING_POST', id)
        commit('LOADING', false)
      }
      // en caso de que si exista se sobreescriben los datos
      else {
        const docRef = doc(fireDataBase, 'posts', postEditing)
        const filename = payload.image.name
        const imageNameExt = filename.slice(filename.lastIndexOf('.'))
        const image = payload.image
        const id = postEditing
        const imageRefs = ref(fireStorage, 'posts/' + id + imageNameExt)
        await deleteObject(imageRefs)
        await uploadBytes(imageRefs, image)
        const url = await getDownloadURL(imageRefs)
        await updateDoc(docRef, {
          title: payload.title,
          postData: payload.postData,
          image: url,
          published: false,
        })
        commit('LOADING', false)
      }
    } catch (error) {
      console.error(error)
    }
  },
  async publishPost({ commit, getters }) {
    try {
      commit('LOADING', true)
      const postId = getters.getEditingPost
      const docRef = doc(fireDataBase, 'posts', postId)
      await updateDoc(docRef, {
        published: true,
      })
      commit('LOADING', false)
      commit('EDITING_POST', '')
      this.$router.push('blog')
    } catch (error) {
      console.error(error)
    }
  },
  setPosts({ commit }, payload) {
    commit('ADD_POSTS', payload)
  },
  resetEditingPost({ commit, getters }) {
    commit('ERASE_EDITING_POST', {})
  },
  async erasePost({ commit }, payload) {
    await deleteDoc(doc(fireDataBase, 'posts', payload))
    commit('ERASE_POST', payload)
  },
  async fetchPublishedPost({ commit }) {
    const postsRefs = collection(fireDataBase, 'posts')
    const firstQuery = query(
      postsRefs,
      where('published', '==', true),
      limit(5)
    )
    const postsSnapshot = await getDocs(firstQuery)
    postsSnapshot.forEach((doc) => {
      commit('ADD_PUBLISHED_POSTS', doc.data())
    })
  },
  setData({ commit }, payload) {
    commit('EDITING_POST', payload)
  },
  resetBlogsData({ commit }) {
    commit('RESET_BLOGS_STORE')
  }
}
