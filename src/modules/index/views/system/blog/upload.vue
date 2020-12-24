<template>
  <div class="app-container">
    <!--工具栏-->
    <div class="head-container">
      <aside>
        1 强烈建议新手初次使用时，查看 <a href="#">帮助文档</a>，了解一些细节上的约定，以方便您更好的使用<br>
        2 .md文件命名形如 Spring源码:架构概览-1-20201122，即格式形为 目录:标题-序号-创建日期 <br>
        3 为保证.md文件的一致性，暂不开放在线编辑，以本地为准，推荐将文档保存到svn/git中，便于管理与追踪 <br>
        4 文章有效字数 = 中文字数 + 英文单词数
      </aside>
      <el-upload
        ref="upload"
        action="/api/blog/upload"
        :on-change="fileChange"
        :before-upload="beforeUpload"
        :on-success="uploadSuccess"
        :on-error="uploadError"
        :on-preview="handlePreview"
        :before-remove="beforeRemove"
        multiple
        :headers="uploadHeader"
        :limit="100"
        :on-exceed="handleExceed"
        :auto-upload="false"
        :file-list="fileList"
      >
        <el-button size="small" type="primary">多文件选择</el-button>
      </el-upload>
    </div>
    <!--表格渲染-->
    <el-table
      ref="table"
      lazy
      :data="fileList"
      size="small"
      style="width: 100%;"
      border
      highlight-current-row
    >
      <el-table-column :show-overflow-tooltip="true" label="文件名" width="385px" prop="name" />
      <el-table-column :show-overflow-tooltip="true" label="大小" prop="size">
        <template slot-scope="scope">
          {{ (scope.row.size / 1024).toFixed(2) + 'kb' }}
        </template>
      </el-table-column>
      <el-table-column :show-overflow-tooltip="true" label="目录" prop="response.dir" />
      <el-table-column :show-overflow-tooltip="true" label="标题" width="225px" prop="response.name" />
      <el-table-column :show-overflow-tooltip="true" label="排序" prop="response.orderNum" />
      <el-table-column :show-overflow-tooltip="true" label="创建日期" prop="response.createDate" />
      <el-table-column :show-overflow-tooltip="true" label="中文字数" prop="response.wordCounter.chineseCount" />
      <el-table-column :show-overflow-tooltip="true" label="英文单词数" prop="response.wordCounter.englishCount" width="85" />
      <el-table-column :show-overflow-tooltip="true" label="纯数字" prop="response.wordCounter.numberCount" />
      <el-table-column :show-overflow-tooltip="true" label="其他字符" prop="response.wordCounter.otherCount" />
      <el-table-column :show-overflow-tooltip="true" label="上传状态" prop="status" />
      <el-table-column :show-overflow-tooltip="true" label="保存状态" prop="save_status" />
      <el-table-column label="操作" width="130px" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button v-show="scope.row.status === 'success' && scope.row.save_status" type="text" @click="_pre_view(scope.row)">预览</el-button>
          <el-button v-show="!(scope.row.status === 'success' && scope.row.save_status)" type="text" @click="_delete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-row style="margin-top: 20px">
      <el-button type="success" @click="_upload()">开始上传</el-button>
      <el-button type="success" @click="_save()">确认保存</el-button>
      <el-button size="small" type="warning" @click="_clear()">清除所有</el-button>
    </el-row>
  </div>
</template>

<script>
import { resolveResp } from '@/utils/common'
import crudBlog from '@/api/blog'
import { getToken } from '@/utils/auth'

// crud交由presenter持有
export default {
  name: 'Upload',
  data() {
    return {
      menus: [],
      permission: {
        add: ['admin', 'menu:add'],
        edit: ['admin', 'menu:edit'],
        del: ['admin', 'menu:del']
      },
      rules: {
        title: [
          { required: true, message: '请输入标题', trigger: 'blur' }
        ],
        path: [
          { required: true, message: '请输入地址', trigger: 'blur' }
        ]
      },
      fileList: [],
      uploadHeader: {
        Authorization: getToken()
      }
    }
  },
  methods: {
    beforeUpload(file) {
      if (!file.name.endsWith('md')) {
        this.$message.error('只能是.md文件')
        return false
      }
      if (file.size / 1024 / 1024 > 10) {
        this.$message.error('文件大小不能超过10M')
        return false
      }
      return true
    },
    uploadSuccess(res, file) {
    },
    uploadError(err, file, fileList) {
      this.$message.error(JSON.parse(err.message).message)
    },
    fileChange(file, fileList) {
      this.fileList = Object.assign([], fileList)
    },
    _pre_view(row) {
      const resp = row.response
      window.open('/blog/' + resp.blogSpace + '/' + resp.dir + '/' + resp.name)
    },
    _delete(row) {
      this.fileList.map((e, i) => {
        if (e.uid === row.uid) {
          this.$delete(this.fileList, i)
          return
        }
      })
    },
    _clear() {
      this.fileList = []
    },
    _upload() {
      this.$refs.upload.submit()
    },
    _save() {
      console.error(this.fileList, typeof this.fileList, Array.isArray(this.fileList))
      function _assemble(e) {
        const obj = {}
        obj.dir = e.dir
        obj.name = e.name
        obj.orderNum = e.orderNum
        obj.createDate = e.createDate
        obj.chineseCount = e.wordCounter.chineseCount
        obj.englishCount = e.wordCounter.englishCount
        obj.numberCount = e.wordCounter.numberCount
        obj.otherCount = e.wordCounter.otherCount
        return obj
      }
      if (Array.isArray(this.fileList)) {
        this.fileList.map(e => {
          if (e.status === 'success') {
            const data = _assemble(e.response)
            crudBlog.add(data).then(resp => {
              console.error(resp)
              const result = resolveResp(resp)
              if (result.isSuccess) {
                if (result.hasMsg) {
                  this.$set(e, 'save_status', result.msg)
                  this.$message.success(result.msg)
                } else {
                  this.$message.success('上传成功')
                }
              } else {
                this.$message.error(result.msg)
              }
            })
          }
        })
      }
    },
    handlePreview(file) {
      console.error(file)
    },
    handleExceed(files, fileList) {
      this.$message.warning(`当前限制选择 3 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + fileList.length} 个文件`)
    },
    beforeRemove(file, fileList) {
      // return this.$confirm(`确定移除 ${file.name}？`)
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
  ::v-deep .el-upload-list {
    display: none;
  }
</style>
