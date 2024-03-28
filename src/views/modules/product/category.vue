<template>
    <div>
        <el-switch
            v-model="draggable"

            active-text="开启菜单拖拽"></el-switch>

        <el-button type="success" plain size="mini" round @click="batchSave" v-if="draggable">保存批量拖拽</el-button>
        <el-button type="info" plain size="mini" round @click="cancelBatchDrag" v-if="draggable">取消批量拖拽
        </el-button>

        <el-tree :data="menus"
                 :default-expanded-keys="expandedNode"
                 :expand-on-click-node="false"
                 :props="defaultProps"
                 node-key="catId"
                 show-checkbox
                 :draggable="draggable"
                 :allow-drop="allowDrop"
                 @node-drop="handleDrop"
        >
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

        <el-dialog :visible.sync="dialogFormVisible" :title="dialogTitle" :close-on-click-modal="false">
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
            maxLevel: 0,    // 菜单拖拽功能判断当前节点的子节点的最大深度
            updateNodes: [],    // 菜单拖拽后封装新的节点信息
            draggable: false, // 菜单拖拽开启标记，默认不开启
            pCid: [],   // pCid用于批量拖拽后向后台传递最新节点信息后保持之前结构用，由于可能需要展开多个菜单所以用数组接收
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
            this.form.catLevel = data.catLevel * 1 + 1  // 字符串转数字 字符串 * 1
            this.form.catId = null
            this.form.icon = ''
            this.form.productUnit = ''
            this.form.showStatus = 1
            this.form.sort = 0
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
                type: 'warning',
                closeOnClickModal: false
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
                            duration: 1000,
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
                        duration: 1000,
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
        allowDrop (draggingNode, dropNode, type) {  // 判断 拖拽时判定目标节点能否被放置 https://element.eleme.cn/#/zh-CN/component/tree
            // draggingNode 被拖拽的节点 | dropNode 准备放入的节点 | type prev,inner,next分别表示放置在目标节点前、插入至目标节点和放置在目标节点后
            // 判断依据：当前被拖动的节点的深度 + 目标节点层级不能大于3
            // 当前节点的深度（被拖动节点+子节点有几层） = 当前节点的子节点的最大层级maxLevel - 当前节点所处层级catLevel + 1
            console.log('allowDrop: ', draggingNode, dropNode, type)
            this.countNodeLevel(draggingNode)
            // 计算深度
            let deep = this.maxLevel - draggingNode.level + 1
            console.log('深度: ', deep)
            if (type === 'inner') {
                // 拖动到目标节点内，只需要当前节点深度+目标节点层级 不大于3 即可
                let isDrag = deep + dropNode.level <= 3
                // 判断完毕给 maxLevel 赋初值
                this.maxLevel = 0
                return isDrag
            } else {
                // 拖动到目标节点前或后，只需要判断当前节点深度 + 目标节点父节点层级 <= 3 即可
                let isDrag = deep + dropNode.parent.level <= 3
                this.maxLevel = 0
                return isDrag
            }
        },
        countNodeLevel (node) {  // 计算当前节点的子节点的最大层数
            console.log('当前节点信息: ', node)
            // 找出所有子节点，求出子节点最大层级
            if (node.childNodes != null && node.childNodes.length > 0) {
                // 遍历所有子节点
                for (let i = 0; i < node.childNodes.length; i++) {
                    if (node.childNodes[i].level > this.maxLevel) {
                        // 交换值，更新当前节点的子节点最大层级
                        this.maxLevel = node.childNodes[i].level
                    }
                    // 递归调用，查看当前节点的子节点是否有子节点，若有，继续求出其子节点最大层级
                    this.countNodeLevel(node.childNodes[i])
                }
            } else {
                // 没有子节点，将maxLevel设置为当前节点层级，为了正确计算当前节点的深度
                console.log('无子节点的maxLevel设置', node.level)
                this.maxLevel = node.level
            }
        },
        batchSave () {  // 批量拖拽后向后台提交最新节点西i逆袭，减少与db的交互次数
            this.$http({
                url: this.$http.adornUrl('/product/category/update/sort'),
                method: 'post',
                data: this.$http.adornData(this.updateNodes, false)
            }).then(
                ({data}) => {
                    // 响应成功后发送友好提示信息
                    this.$message({
                        message: '菜单结构已修改',
                        type: 'success'
                    })
                    // 刷新菜单
                    this.getMenuListTree()
                    // 设置默认展开的菜单
                    this.expandedNode = this.pCid
                    // 置为初值
                    this.updateNodes = []
                }
            )
        },
        cancelBatchDrag () {    // 取消批量拖拽
            // 刷新菜单
            this.getMenuListTree()
            // 设置默认展开的菜单
            this.expandedNode = this.pCid
            // 置为初值
            this.updateNodes = []
            this.pCid = []
        },
        handleDrop (draggingNode, dropNode, dropType, ev) { // 拖拽菜单成功后触发的事件函数
            // draggingNode 当前正拖拽的节点 dropNode 目标节点|参考节点
            // dropType 拖拽到参考节点的哪个位置 ev事件对象
            // 更新思想：当前拖拽节点最新的父节点id | 当前拖拽节点最新的顺序 - 遍历兄弟节点数组 | 当前拖拽节点最新的层级
            console.log('tree drop: ', draggingNode, dropNode, dropType)
            // 1. 当前拖拽节点最新的父节点id 根据方式判断
            let pCid = 0
            let siblings = null
            if (dropType === 'before' || dropType === 'after') {
                // 父id应该就是兄弟节点|目标节点的父id
                // pCid = dropNode.parent.data.catId
                // 这里避免一个小bug，如果移动到第一个一级菜单之前，由于之前一级菜单的父节点没有数据，所以移动后 pCid 会变成
                // undefined 这里加个三元判断
                pCid = dropNode.parent.data.catId === undefined ? 0 : dropNode.parent.data.catId
                // 当前拖拽节点的兄弟节点就是目标节点的父节点的子节点 - 注意childNodes是拖拽后自动改变后的新值
                // 不同于data中后台获取到的children静态值
                siblings = dropNode.parent.childNodes
            } else {
                // 移动到目标节点的内部 inner，此时父id就是目标节点的id
                pCid = dropNode.data.catId
                // 当前拖拽节点的兄弟节点就是目标节点的子节点
                siblings = dropNode.childNodes
            }
            // 给全局pCid赋值
            this.pCid.push(pCid)

            // 2. 当前节点最新的顺序 - 遍历兄弟节点数组
            // 3. 当前拖拽节点最新的层级
            for (let i = 0; i < siblings.length; i++) {
                // 遍历当前拖拽节点
                if (siblings[i].data.catId === draggingNode.data.catId) {
                    // 将节点信息push到updateNodes中，除了排序改变还要将父id以及层级（视情况而定）
                    // 判断层级关系是否发生改变，这里判断使用的siblings[i].level是会随着拖拽后自动变化的 - 也就是目标值|正确值
                    // 而draggingNode.data.catLevel是数据库中存的静态数据，如果二者不相等则需要封装
                    let catLevel = draggingNode.data.catLevel
                    if (siblings[i].level !== catLevel) {
                        // 当前拖拽节点层级改变
                        catLevel = siblings[i].level
                        // 当前节点子节点层级改变，将当前遍历到的拖拽节点传入参数，其childNodes是子节点，抽成一个方法
                        this.updateChildrenNodeLevel(siblings[i])
                    }
                    this.updateNodes.push({
                        catId: siblings[i].data.catId,
                        sort: i,
                        parentCid: pCid,
                        catLevel: catLevel
                    })
                } else {
                    // 遍历到其它节点
                    this.updateNodes.push({
                        catId: siblings[i].data.catId,
                        sort: i
                    })
                }
            }

            // 打印最新整理好的updateNodes
            console.log('updateNodes: ', this.updateNodes)
        },
        updateChildrenNodeLevel (node) { // 拖拽后层级改变，当前拖拽节点的子节点层级改变
            // 遍历
            for (let i = 0; i < node.childNodes.length; i++) {
                // 遍历当前子节点存储的的后端节点数据
                // let cNode = node.childNodes[i].data
                // 待更新的id
                // cNode.catId = cNode.catId
                // 待更新的后端catLevel层数
                // cNode.catLevel = node.childNodes[i].level
                console.log('待更新的子节点id: ', node.childNodes[i].data.catId)
                console.log('待更新的子节点后端catLevel层级: ', node.childNodes[i].level)
                this.updateNodes.push({
                    catId: node.childNodes[i].data.catId,
                    catLevel: node.childNodes[i].level
                })
                // 递归调用
                this.updateChildrenNodeLevel(node.childNodes[i])
            }
        },
    }
}
</script>

<style>

</style>
