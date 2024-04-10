<!--
  文件描述：抽取公共的三级菜单显示列表，只显示，去掉拖拽，移动等无关效果
  创建时间：2024/4/10 13:34
  创建人：qiyue
-->
<template>
    <el-tree :data="menus" :props="defaultProps" node-key="catId" ref="menuTree"></el-tree>
</template>

<script>
// 这里可以导入其他文件（比如：组件，工具js，第三方插件js，json文件，图片文件等等）
// 例如：import 《组件名称》 from '《组件路径》';
// 例如：import uploadFile from '@/components/uploadFile/uploadFile'

export default {
    name: '',
    // import引入的组件需要注入到对象中才能使用
    components: {},
    props: {
        // patientIn: {
        //   type: Object,
        //   default () {
        //     return {}
        //   }
        // }
    },
    data () {
        // 这里存放数据
        return {
            menus: [],
            defaultProps: {
                children: 'children',
                label: 'name'
            }
        }
    },
    // 监听属性 类似于data概念
    computed: {},
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
    },
    // 监控data中的数据变化
    watch: {},
    // 生命周期 - 创建完成（可以访问当前this实例）
    created () {
        this.getMenuListTree()
    },
    // 生命周期 - 挂载完成（可以访问DOM元素）
    mounted () {

    },
    beforeCreate () {
    }, // 生命周期 - 创建之前
    beforeMount () {
    }, // 生命周期 - 挂载之前
    beforeUpdate () {
    }, // 生命周期 - 更新之前
    updated () {
    }, // 生命周期 - 更新之后
    beforeDestroy () {
    }, // 生命周期 - 销毁之前
    destroyed () {
    }, // 生命周期 - 销毁完成
    activated () {
    } // 如果页面有keep-alive缓存功能，这个函数会触发
}
</script>

<style>

</style>
