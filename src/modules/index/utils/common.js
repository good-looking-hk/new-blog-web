/**
 * 解析服务端应答请求，前端封装统一应答格式
 * @param resp
 * @returns {{}}
 */
export function resolveResp(resp) {
  console.error(resp, typeof resp, resp instanceof String)
  const result = {}
  result.isSuccess = false
  result.hasMsg = true
  result.row = resp
  result.msg = resp
  if (typeof resp === 'string') {
    result.isSuccess = true
    result.hasMsg = (resp !== '' && resp !== undefined && resp !== null)
    result.msg = resp
    return result
  } else if (resp instanceof Object) {
    if (resp.hasOwnProperty('code')) {
      if (resp.code === 200 || resp.code === 0) {
        result.isSuccess = true
        result.hasMsg = (resp !== '' && resp !== undefined && resp !== null)
        result.msg = resp.msg
        return result
      } else {
        result.hasMsg = (resp !== '' && resp !== undefined && resp !== null)
        result.msg = resp.msg
      }
    }
  }
  return result
}
