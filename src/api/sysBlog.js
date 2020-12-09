import request from '@/utils/request'

export function add(data) {
  return request({
    url: 'api/sysBlog',
    method: 'post',
    data
  })
}

export function del(ids) {
  return request({
    url: 'api/sysBlog/',
    method: 'delete',
    data: ids
  })
}

export function edit(data) {
  return request({
    url: 'api/sysBlog',
    method: 'put',
    data
  })
}

export default { add, edit, del }
