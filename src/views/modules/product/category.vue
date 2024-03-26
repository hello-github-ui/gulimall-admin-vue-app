<template>
    <el-tree :data="menus"
             :expand-on-click-node="false"
             :props="defaultProps"
             node-key="catId"
             show-checkbox
             :default-expanded-keys="expandedNode">
        <span slot-scope="{ node, data }" class="custom-tree-node">
            <span>{{ node.label }}</span>
                <span>
                  <el-button
                      v-if="node.level <= 2"
                      size="mini"
                      type="text"
                      @click="() => append(data)">
                    Append
                  </el-button>
                  <el-button
                      v-if="node.childNodes.length == 0"
                      size="mini"
                      type="text"
                      @click="() => remove(node, data)">
                    Delete
                  </el-button>
                </span>
        </span>
    </el-tree>
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
            }
        }
    },
    created () {    // 生命周期 - 创建完成（可以访问当前this实例）
        this.getMenuListTree()
    },
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
        append (data) {
            console.log('append', data)
        },

        remove (node, data) {
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
    }
}
</script>

<style>

</style>
