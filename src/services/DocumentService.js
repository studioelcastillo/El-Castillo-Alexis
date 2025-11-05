import { api } from '../boot/axios'

export default {
  uploadImage (params) {
    return api.post('api/document/image', params.data, { headers: { Authorization: 'Bearer ' + params.token, 'Content-Type': 'multipart/form-data' } })
  }, 
  uploadVideo (params) {
    return api.post('api/document/video', params.data, { headers: { Authorization: 'Bearer ' + params.token, 'Content-Type': 'multipart/form-data' } })
  },
  getUserVideos (params) {
    return api.get('api/document/videos?user_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  deleteDocument (params) {
    return api.delete('api/document/' + params.id + '/' + params.type, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  uploadImageMultimedia (params) {
    return api.post('api/document/image_multimedia', params.data, { headers: { Authorization: 'Bearer ' + params.token, 'Content-Type': 'multipart/form-data' } })
  },
  getUserImagesMultimedia (params) {
    return api.get('api/document/images_multimedia?user_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  },
  getUserProfilePicture (params) {
    return api.get('api/document/profile_picture?user_id=' + params.id, { headers: { Authorization: 'Bearer ' + params.token } })
  }
}