<template>
    <el-tree :data="data" :props="defaultProps" @node-click="handleNodeClick"></el-tree>
</template>

<script>
export default {
    data () {
        return {
            data: [],
            defaultProps: {
                children: 'children',
                label: 'label'
            }
        }
    },
    created () {    // 生命周期 - 创建完成（可以访问当前this实例）
        this.getMenuListTree()
    },
    methods: {
        handleNodeClick (data) {
            console.log(data)
        },
        getMenuListTree() {
            this.$http({
                url: this.$http.adornUrl('/product/category/list/tree'),
                method: 'get',
            }).then(data => {
                console.log(JSON.stringify(data))
            })
        },
    }
}
</script>

<style>

</style>
