// /* eslint-disable @typescript-eslint/no-explicit-any */
// type Product = 'product/detail' | 'product/list' | 'product/category'
// type Shop = 'shop/detail'

// type EndPoints = Product | Shop

// type Version = 'v1' | 'v2'

// // Function overloads
// export function useEndPoint(val: EndPoints, ver?: Version): string
// /* eslint-disable-next-line */
// export function useEndPoint(val: string, ver?: Version): string;

// // Implementation
// export function useEndPoint(val: EndPoints | string, ver: Version = 'v1') {
//   return `${ver}/${val}`
// }

// type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

// export const useApi = () => {
//   const apiBaseURL = useRuntimeConfig()
//   const api = $fetch.create({
//     baseURL: apiBaseURL.public.apiURL,
//     onRequest({ options }) {
//       const headers = new Headers(options.headers as HeadersInit)
//       headers.set('Content-Type', 'application/json')
//       options.headers = headers
//     },
//   })

//   const request = (url: string, method: HTTPMethod = 'GET', data?: any, params?: any) => {
//     return api(url, {
//       method,
//       body: data,
//       params,
//     })
//   }
//   return { request }
// }
