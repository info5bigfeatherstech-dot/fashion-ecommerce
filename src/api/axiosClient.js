import axios from 'axios'
import { apiConfig } from './config'
import { STOREFRONT } from './endpoints'

const axiosClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeoutMs,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-storefront': STOREFRONT,
  },
})

export default axiosClient
