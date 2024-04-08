// ==UserScript==
// @name             国开自动刷课（不答题考试）
// @namespace        http://ibaiyu.top/
// @version          1.0.0
// @description      国开（国家开放大学）自动刷课（不答题考试） 支持自动访问线上链接、查看资料附件、观看视频、自动查看页面。
// @author           南风依旧
// @match          *://lms.ouchn.cn/course/*
// @original-author  南风依旧
// @original-license GPL-3.0
// @license          GPL-3.0
// ==/UserScript==

// 设置视频播放速度 建议最大4-8倍速 不然可能会卡 没有最大值
// 并且直接挂载到window上
window.playbackRate = 4

// 设置各种不同类型的课程任务之间的时间延迟，以便脚本在进行自动化学习时可以更好地模拟人类操作。
const interval = {
    loadCourse: 3000, // 加载课程列表的延迟时间
    viewPage: 3000, // 查看页面类型课程的延迟时间
    onlineVideo: 3000, // 播放在线视频课程的延迟时间
    webLink: 3000, // 点击线上链接类型课程的延迟时间
    forum: 3000, // 发帖子给论坛课程的延迟时间
    material: 3000, // 查看附件类型课程的延迟时间
    other: 3000 // 处理其他未知类型课程的延迟时间
};

(async function (window, document) {

    // 使用正则表达式从当前 URL 中提取出课程 ID。
    const courseId = (await waitForElement('#courseId', interval.loadCourse)).value

    // 运行
    main()

    // 保存值到本地存储
    function GM_setValue (name, value) {
        localStorage.setItem(name, JSON.stringify(value))
    }

    //从本地存储获取值
    function GM_getValue (name, defaultValue) {
        const value = localStorage.getItem(name)
        if (value === null) {
            return defaultValue
        }
        try {
            return JSON.parse(value)
        } catch (e) {
            console.error(`Error parsing stored value for ${name}:`, e)
            return defaultValue
        }
    }

    // 创建返回到课程列表页面的函数。
    async function returnCoursePage (waitTime = 500) {
        const backElement = await waitForElement('a.full-screen-mode-back', waitTime)
        if (backElement) {
            backElement?.click()
        } else {
            throw new Error('异常 无法获取到返回课程列表页面的元素！')
        }
    }

    // 将中文类型名称转换为英文枚举值。
    function getTypeEum (type) {
        switch (type) {
            case '页面':
                return 'page'
            case '音视频教材':
                return 'online_video'
            case '线上链接':
                return 'web_link'
            case '讨论':
                return 'forum'
            case '参考资料':
                return 'material'
            default:
                return null
        }
    }

    /**
     * 等待指定元素出现
     * 返回一个Promise对象，对document.querySelector封装了一下
     * @param selector dom选择器,像document.querySelector一样
     * @param waitTime 等待时间 单位: ms
     */
    async function waitForElement (selector, waitTime = 1000, maxCount = 10) {
        let count = 0
        return new Promise(resolve => {
            let timeId = setInterval(() => {
                const element = document.querySelector(selector)
                if (element || count >= maxCount) {
                    clearInterval(timeId)
                    resolve(element || null)
                }
                count++
            }, waitTime)
        })
    }

    /**
     * 等待多个指定元素出现
     * 返回一个Promise对象，对document.querySelectorAll封装了一下
     * @param selector dom选择器,像document.querySelectorAll一样
     * @param waitTime 等待时间 单位: ms
     */
    async function waitForElements (selector, waitTime = 1000, maxCount = 10) {
        let count = 0
        return new Promise(resolve => {
            let timeId = setInterval(() => {
                const element = document.querySelectorAll(selector)
                if (element || count >= maxCount) {
                    clearInterval(timeId)
                    resolve(element || null)
                }
                count++
            }, waitTime)
        })
    }

    // 等待指定时间
    function wait (ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }

    /**
     * 该函数用于添加学习行为时长
     */
    function addLearningBehavior (activity_id, activity_type) {
        const duration = Math.ceil(Math.random() * 300 + 40)
        const data = JSON.stringify({
            activity_id,
            activity_type,
            browser: 'chrome',
            course_id: globalData.course.id,
            course_code: globalData.course.courseCode,
            course_name: globalData.course.name,
            org_id: globalData.course.orgId,
            org_name: globalData.user.orgName,
            org_code: globalData.user.orgCode,
            dep_id: globalData.dept.id,
            dep_name: globalData.dept.name,
            dep_code: globalData.dept.code,
            user_agent: window.navigator.userAgent,
            user_id: globalData.user.id,
            user_name: globalData.user.name,
            user_no: globalData.user.userNo,
            visit_duration: duration
        })
        const url = 'https://lms.ouchn.cn/statistics/api/user-visits'
        return new Promise((resolve, reject) => {
            $.ajax({
                url,
                data,
                type: 'POST',
                cache: false,
                contentType: 'text/plain;charset=UTF-8',
                complete: resolve
            })
        })
    }

    // 打开并播放在线视频课程。
    async function openOnlineVideo () {
        // 等待 video 或 audio 元素加载完成
        const videoElem = await waitForElement('video')
        let audioElem = null

        if (!videoElem) {
            audioElem = await waitForElement('audio')
        }

        if (videoElem) {
            // 处理视频元素
            console.log('正在播放视频中...')

            // 设置播放速率
            videoElem.playbackRate = playbackRate

            // 监听播放速率变化事件并重新设置播放速率
            videoElem.addEventListener('ratechange', function () {
                videoElem.playbackRate = playbackRate
            })

            // 监听视频播放结束事件
            videoElem.addEventListener('ended', returnCoursePage)

            // 延迟一会儿以等待视频加载
            await wait(interval.onlineVideo)

            // // 每隔一段时间检查是否暂停，并模拟点击继续播放并设置声音音量为0
            setInterval(() => {
                videoElem.volume = 0
                if (document.querySelector('i.mvp-fonts.mvp-fonts-play')) {
                    document.querySelector('i.mvp-fonts.mvp-fonts-play').click()
                }
            }, interval.onlineVideo)

        } else if (audioElem) {
            // 处理音频元素
            console.log('正在播放音频中...')

            // 监听音频播放结束事件
            audioElem.addEventListener('ended', returnCoursePage)

            // 延迟一会儿以等待音频加载
            await wait(interval.onlineVideo)

            // 每隔一段时间检查是否暂停，并模拟点击继续播放
            setInterval(() => {
                audioElem.volume = 0
                if (document.querySelector('i.font.font-audio-play')) {
                    document.querySelector('i.font.font-audio-play').click()
                }
            }, interval.onlineVideo)
        }
    }

    // 打开并查看页面类型课程。
    function openViewPage () {
        // 当页面被加载完毕后延迟一会直接返回课程首页
        setTimeout(returnCoursePage, interval.viewPage)
    }

    // 打开并点击线上链接类型课程。
    async function openWebLink () {
        // 等待获取open-link-button元素
        const ElementOpenLinkButton = await waitForElement('.open-link-button', interval.webLink)

        // 设置元素属性让它不会弹出新标签并设置href为空并模拟点击
        ElementOpenLinkButton.target = '_self'
        ElementOpenLinkButton.href = 'javascript:void(0);'
        ElementOpenLinkButton.click()

        // 等待一段时间后执行returnCoursePage函数
        setTimeout(returnCoursePage, interval.webLink)
    }

    function openApiMaterial () { // 用API去完成查看附件
        const id = document.URL.match(/.*\/\/lms.ouchn.cn\/course\/[0-9]+\/learning-activity\/full-screen.+\/([0-9]+)/)[1]
        const res = new Promise((resolve, reject) => {
            $.ajax({
                url: `https://lms.ouchn.cn/api/activities/${id}`,
                type: 'GET',
                success: resolve,
                error: reject
            })
        })
        res.then(async ({uploads: uploadsModels}) => {
            uploadsModels.forEach(async ({id: uploadId}) => {
                await wait(interval.material)
                await new Promise(resolve => $.ajax({
                    url: `https://lms.ouchn.cn/api/course/activities-read/${id}`,
                    type: 'POST',
                    data: JSON.stringify({upload_id: uploadId}),
                    contentType: 'application/json',
                    dataType: 'JSON',
                    success: resolve,
                    error: resolve
                }))
            })

            await wait(interval.material)
            returnCoursePage()
        })
        res.catch((xhr, status, error) => {
            console.log(`这里出现了一个异常 | status: ${status}`)
            console.dir(error, xhr, status)
        })

    }

    // 打开课程任务并发布帖子。
    async function openForum () {
        // 使用 waitForElement 函数等待 .embeded-new-topic>i 元素出现，并赋值给 topicElement 变量
        const topicElement = await waitForElement('button.ivu-btn.ivu-btn-primary i', interval.forum)

        if (!topicElement) {
            throw new Error('无法找到发帖按钮的元素。')
        }

        // 点击话题元素并等待一段时间
        topicElement.click()
        await wait(interval.forum)

        // 获取标题、内容和提交按钮元素
        const titleElem = $('#add-topic-popup > div > div.topic-form-section.main-area > form > div:nth-child(1) > div.field > input')
        const contentElem = document.querySelector('#add-topic-popup > div > div.topic-form-section.main-area .simditor-body.needsclick[contenteditable]')
        const submitElem = document.querySelector('#add-topic-popup > div > div.popup-footer > div > button.button.button-green.medium')

        // 设置标题和内容
        titleElem.val(`好好学习${Date.now()}`).trigger('change')

        // 点击提交按钮并延迟一段时间后返回课程页面
        contentElem.innerHTML = `<p>好好学习，天天向上。${Date.now()}</p>`
        submitElem.click()

        // 等待一段时间后执行returnCoursePage函数
        setTimeout(returnCoursePage, interval.forum)
    }

    // 课程首页处理
    async function courseIndex () {
        await new Promise(resolve => {
            console.log('正在展开所有课程任务')
            let timeId = setInterval(() => {
                const allCollapsedElement = document.querySelector('i.icon.font.font-toggle-all-collapsed')
                const allExpandedElement = document.querySelector('i.icon.font.font-toggle-all-expanded')
                if (!allExpandedElement) {
                    if (allCollapsedElement) {
                        allCollapsedElement.click()
                    }
                }
                if (!allCollapsedElement && !allExpandedElement) {
                    throw new Error('无法展开所有课程 可能是元素已更改，请联系作者更新。')
                }
                {
                    console.log('课程展开完成。')
                    clearInterval(timeId)
                    resolve()
                }
            }, interval.loadCourse)
        })

        console.log('正在获取加载的课程任务')
        const courseElements = await waitForElements('.learning-activity .clickable-area', interval.loadCourse)

        const courseElement = Array.from(courseElements).find(elem => {
            const type = $(elem.querySelector('i.font[original-title]')).attr('original-title') // 获取该课程任务的类型
            // const status = $(elem.querySelector('span.item-status')).text(); // 获取该课程任务是否进行中
            // 👆上行代码由于无法获取到课程任务是否已关闭，目前暂时注释掉

            if (type == '讨论') {
                return false
            }
            const typeEum = getTypeEum(type)

            if (!typeEum) {
                return false
            }

            const completes = elem.querySelector('.ivu-tooltip-inner b').textContent === '已完成' ? true : false

            // const result = status === "进行中" && typeEum != null && completes === false;
            const result = typeEum != null && completes === false
            if (result) {
                GM_setValue(`typeEum-${courseId}`, typeEum)
            }
            return result
        })

        console.log(courseElement)
        if (courseElement) {
            console.log('发现未完成的课程')
            $(courseElement).click()
        } else {
            console.log('课程可能全部完成了')
        }

    }

    function main () {
        if (/https:\/\/lms.ouchn.cn\/course\/\d+\/ng.*#\//m.test(document.URL)) {
            // 判断是否在课程首页
            courseIndex()
        } else if (/http[s]?:\/\/lms.ouchn.cn\/course\/\d+\/learning-activity\/full-screen[#]?\//.test(window.location.href)) {
            let timeId = 0
            const activity_id = /http[s]?:\/\/lms.ouchn.cn\/course\/\d+\/learning-activity\/full-screen[#]?\/(\d+)/.exec(window.location.href)[1]
            const typeEum = GM_getValue(`typeEum-${courseId}`, null)
            addLearningBehavior(activity_id, typeEum)
            switch (typeEum) {
                case 'page':
                    console.log('正在查看页面。')
                    openViewPage()
                    return
                case 'online_video':
                    openOnlineVideo()
                    return
                case 'web_link':
                    console.log('正在点击外部链接~')
                    openWebLink()
                    return
                case 'forum':
                    console.log('发帖中！')
                    returnCoursePage()
                    //openForum();
                    return
                case 'material':
                    console.log('正在给课件发送已阅读状态')
                    openApiMaterial()
                    return
                default:
                    setTimeout(returnCoursePage, interval.other)
                    return
            }
        }
    }
})(window, document)
