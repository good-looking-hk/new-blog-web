<template>
  <div class="app-container">
    <!--工具栏-->
    <div class="head-container">
      <div v-if="crud.props.searchToggle">
        <!-- 搜索 -->
        <label class="el-form-item-label">博客ID</label>
        <el-input v-model="query.id" clearable placeholder="博客ID" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <label class="el-form-item-label">博客目录</label>
        <el-input v-model="query.dir" clearable placeholder="博客目录" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <label class="el-form-item-label">博客标题</label>
        <el-input v-model="query.title" clearable placeholder="博客标题" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <label class="el-form-item-label">博客类型</label>
        <el-input v-model="query.blogType" clearable placeholder="博客类型" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <label class="el-form-item-label">状态</label>
        <el-input v-model="query.status" clearable placeholder="状态" style="width: 185px;" class="filter-item" @keyup.enter.native="crud.toQuery" />
        <rrOperation :crud="crud" />
      </div>
      <!--如果想在工具栏加入更多按钮，可以使用插槽方式， slot = 'left' or 'right'-->
      <crudOperation :permission="permission" />
      <!--表单组件-->
      <el-dialog :close-on-click-modal="false" :before-close="crud.cancelCU" :visible.sync="crud.status.cu > 0" :title="crud.status.title" width="500px">
        <el-form ref="form" :model="form" :rules="rules" size="small" label-width="80px">
          <el-form-item label="博客ID">
            <el-input v-model="form.id" style="width: 370px;" disabled/>
          </el-form-item>
          <el-form-item label="博客目录">
            <el-input v-model="form.dir" style="width: 370px;" />
          </el-form-item>
          <el-form-item label="博客标题">
            <el-input v-model="form.title" style="width: 370px;" />
          </el-form-item>
          <el-form-item label="博客类型">
            <el-select v-model="form.blogType" filterable placeholder="请选择">
              <el-option
                v-for="item in dict.blog_type"
                :key="item.id"
                :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-input v-model="form.createTime" style="width: 370px;" />
          </el-form-item>
          <el-form-item label="排序号">
            <el-input v-model="form.orderNum" style="width: 370px;" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="form.status" filterable placeholder="请选择">
              <el-option
                v-for="item in dict.blog_status"
                :key="item.id"
                :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button type="text" @click="crud.cancelCU">取消</el-button>
          <el-button :loading="crud.cu === 2" type="primary" @click="crud.submitCU">确认</el-button>
        </div>
      </el-dialog>
      <!--表格渲染-->
      <el-table ref="table" v-loading="crud.loading" :data="crud.data" size="small" style="width: 100%;" @selection-change="crud.selectionChangeHandler" border highlight-current-row>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="博客ID" width="80" />
        <el-table-column prop="dir" label="博客目录" width="100" />
        <el-table-column prop="title" label="博客标题" width="230" show-overflow-tooltip />
<!--        <el-table-column prop="fileName" label="博客文件名称" width="250" />-->
        <el-table-column prop="userId" label="创作者ID" />
        <el-table-column prop="blogType" label="博客类型">
          <template slot-scope="scope">
            {{ dict.label.blog_type[scope.row.blogType] }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="90">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime).substring(0, 10) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastUploadTime" label="上次上传时间" width="140">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.lastUploadTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="排序号" />
        <el-table-column prop="viewCount" label="总浏览次数" width="100" />
        <el-table-column prop="yesterdayView" label="昨日访问" />
        <el-table-column prop="characterCount" label="字符数" />
        <el-table-column prop="status" label="状态">
          <template slot-scope="scope">
            {{ dict.label.blog_status[scope.row.status] }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="140">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.updateTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column v-permission="['admin','sysBlog:edit','sysBlog:del']" label="操作" width="150px" align="center">
          <template slot-scope="scope">
            <udOperation
              :data="scope.row"
              :permission="permission"
            />
          </template>
        </el-table-column>
      </el-table>
      <!--分页组件-->
      <pagination />
    </div>
  </div>
</template>

<script>
import crudSysBlog from '@/api/blog'
import CRUD, { presenter, header, form, crud } from '@crud/crud'
import rrOperation from '@crud/RR.operation'
import crudOperation from '@crud/CRUD.operation'
import udOperation from '@crud/UD.operation'
import pagination from '@crud/Pagination'

const defaultForm = { id: null, dir: null, title: null, fileName: null, userId: null, blogType: null, createTime: null, lastUploadTime: null, orderNum: null, viewCount: null, yesterdayView: null, characterCount: null, status: null, updateTime: null }
export default {
  name: 'Blog',
  components: { pagination, crudOperation, rrOperation, udOperation },
  mixins: [presenter(), header(), form(defaultForm), crud()],
  dicts: ['blog_type', 'blog_status'],
  cruds() {
    return CRUD({ title: '博客', url: 'api/blog', idField: 'id', sort: 'id,desc', crudMethod: { ...crudSysBlog }})
  },
  data() {
    return {
      permission: {
        add: ['admin', 'sysBlog:add'],
        edit: ['admin', 'sysBlog:edit'],
        del: ['admin', 'sysBlog:del']
      },
      rules: {
      },
      queryTypeOptions: [
        { key: 'id', display_name: '博客id' },
        { key: 'dir', display_name: '博客目录' },
        { key: 'title', display_name: '博客标题' },
        { key: 'userId', display_name: '拥有者id' },
        { key: 'blogType', display_name: '博客类型' },
        { key: 'status', display_name: '状态' }
      ]
    }
  },
  methods: {
    // 钩子：在获取表格数据之前执行，false 则代表不获取数据
    [CRUD.HOOK.beforeRefresh]() {
      return true
    }
  }
}
</script>

<style scoped>

</style>
