<template>
    <div>
        <el-tree :data="menus"
                 :default-expanded-keys="expandedNode"
                 :expand-on-click-node="false"
                 :props="defaultProps"
                 node-key="catId"
                 show-checkbox>
        <span slot-scope="{ node, data }" class="custom-tree-node">
            <span>{{ node.label }}</span>
            <el-button v-if="node.level <= 2" size="mini" type="text" @click="() => showAppend(data)">
                Append
            </el-button>

            <el-button v-if="node.childNodes.length === 0" size="mini" type="text" @click="() => remove(node, data)"
                       style="color: red">
                Delete
            </el-button>

            <el-button size="mini" type="text" @click="() => showEdit(node, data)">
                Edit
            </el-button>
        </span>
        </el-tree>

        <el-dialog :visible.sync="dialogFormVisible" :title="dialogTitle">
            <el-form :model="form">
                <el-form-item :label-width="formLabelWidth" label="分类名称">
                    <el-input v-model="form.name" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item :label-width="formLabelWidth" label="图标">
                    <el-input v-model="form.icon" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item :label-width="formLabelWidth" label="计量单位">
                    <el-input v-model="form.productUnit" autocomplete="off"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="cancelDialog">取 消</el-button>
                <el-button type="primary" @click="submitDialog">确 定</el-button>
            </div>
        </el-dialog>

    </div>
</template>

<script>

export default {
    data () {
        return {
            menus: [],
            expandedNode: [],   // 当前要展开的节点
            defaultProps: {
                children: 'children',
                label: 'name'
            },
            form: {
                name: '',
                parentCid: 0,
                catLevel: 0,
                showStatus: 1,  // 默认不删除
                sort: 0,
                productUnit: '',
                icon: '',
                catId: null
            },
            formLabelWidth: '120px',
            dialogTitle: '',
            dialogType: '', // edit, add
            dialogFormVisible: false, // 设置对话框的可见性
        }
    },
    // 计算属性：类似于data概念
    computed: {},
    // 监控data中的数据变化
    watch: {},
    created () {    // 生命周期 - 创建完成（可以访问当前this实例）
        this.getMenuListTree()
    },
    // 方法集合
    methods: {
        getMenuListTree () {
            this.$http({
                url: this.$http.adornUrl('/product/category/list/tree'),
                method: 'get',
            }).then(({data}) => {   // 使用 解构赋值 方式直接获取 data 属性，否则你需要写 data.data.data 才可以取到值
                // console.log(data)
                this.menus = data.data
            })
        },
        showAppend (data) { // 显示-添加分类
            console.log('append', data)
            this.dialogType = 'add'
            // 设置对话框的title
            this.dialogTitle = '添加分类'
            // 设置对话框的可见性
            this.dialogFormVisible = true
            this.form.name = ''
            this.form.parentCid = data.catId
            this.form.catLevel = data.catLevel * 1 + 1
        },
        showEdit (data) {   // 显示-编辑分类
            console.log('要修改的数据: ', data)
            this.dialogType = 'edit'
            this.dialogTitle = '修改分类'
            this.dialogFormVisible = true
            // 发送请求获取当前节点最新的数据
            this.$http({
                url: this.$http.adornUrl(`/product/category/info/${data.data.catId}`),
                method: 'get',
                params: this.$http.adornParams({})
            }).then(
                ({data}) => {   // 解构赋值取值
                    // 回显值
                    this.form.name = data.data.name
                    this.form.catId = data.data.catId
                    this.form.icon = data.data.icon
                    this.form.productUnit = data.data.productUnit
                    // 回显父菜单的id
                    this.form.parentCid = data.data.parentCid
                    // 如果想在发送修改分类的接口时，直接传递整个form参数，则下面的值必须不回显，否则会被默认值给覆盖掉 -- 不推荐
                    // this.form.catLevel = data.data.catLevel
                    // this.form.showStatus = data.data.showStatus
                    // this.form.sort = data.data.sort
                }
            )
        },
        cancelDialog () {
            // 设置对话框不可见
            this.dialogFormVisible = false
        },
        submitDialog () {
            if (this.dialogType === 'add') {
                this.addCategory()
            }
            if (this.dialogType === 'edit') {
                this.editCategory()
            }
        },
        remove (node, data) {   // 显示-移除分类-直接请求删除分类接口
            console.log('remove', node, data)
            let ids = [node.data.catId]
            // console.log('ids: ', ids)

            this.$confirm(`是否要删除掉【${node.data.name}】菜单?`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.$http({
                    url: this.$http.adornUrl('/product/category/delete'),
                    method: 'post',
                    data: this.$http.adornData(ids, false)
                }).then(({data}) => {
                    if (data && data.code === 0) {
                        this.$message({
                            message: '删除成功!',
                            type: 'success',
                            duration: 1500,
                            onClose: () => {    // 提示框关闭后回调
                                // 重新请求数据
                                this.getMenuListTree()
                                // 设置当前展开的节点
                                this.expandedNode = [node.data.parentCid]
                            }
                        })
                    } else {
                        this.$message.error(data.msg)
                    }
                })
            }).catch(() => {
                this.$message({
                    type: 'info',
                    message: '已取消删除'
                })
            })

        },
        editCategory () {    // 修改是哪级分类数据
            let {catId, name, icon, productUnit} = this.form    // MP 会对于属性值为null的属性不更新
            let data = {catId: catId, name: name, icon: icon, productUnit: productUnit}
            this.$http({
                url: this.$http.adornUrl('/product/category/update'),
                method: 'post',
                data: this.$http.adornData(data, false)
            }).then(
                ({data}) => {
                    this.$message({
                        message: '修改成功!',
                        type: 'success',
                        duration: 1500,
                        onClose: () => {    // 提示框关闭后回调
                            // 关闭对话框
                            this.dialogFormVisible = false
                            // 刷新出新的数据
                            this.getMenuListTree()
                            // 设置需要默认展开的菜单
                            this.expandedNode = [this.form.parentCid]
                        }
                    })
                }
            )
        },
        addCategory () { // 添加三级分类
            console.log('提交的三级分类: ', this.form)
            this.$http({
                url: this.$http.adornUrl('/product/category/save'),
                method: 'post',
                data: this.$http.adornData(this.form, false)
            }).then(
                ({data}) => {
                    this.$message({
                        message: '菜单保存成功',
                        type: 'success'
                    })
                    // 关闭对话框
                    this.dialogFormVisible = false
                    // 刷新出新的数据
                    this.getMenuListTree()
                    // 设置需要默认展开的菜单
                    this.expandedNode = [this.form.parentCid]
                }
            )
        },
    }
}
</script>

<style>

</style>
