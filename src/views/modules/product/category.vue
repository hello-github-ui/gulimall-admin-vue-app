<template>
    <el-tree :data="menus" :props="defaultProps" @node-click="handleNodeClick"></el-tree>
</template>

<script>
export default {
    data () {
        return {
            menus: [],
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
        handleNodeClick (data) {
            console.log(data)
        },
        getMenuListTree() {
            this.$http({
                url: this.$http.adornUrl('/product/category/list/tree'),
                method: 'get',
            }).then(({data}) => {   // 使用 解构赋值 方式直接获取 data 属性，否则你需要写 data.data.data 才可以取到值
                // console.log(data)
                this.menus = data.data
            })
        },
    }
}
</script>

<style>

</style>
