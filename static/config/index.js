/**
 * 开发环境
 */
;(function () {
    window.SITE_CONFIG = {}

    // api接口请求地址
    // window.SITE_CONFIG['baseUrl'] = 'http://localhost:8080/renren-fast'
    // 这统一给 网关发送请求，让网关决定请求的是哪个服务
    window.SITE_CONFIG['baseUrl'] = 'http://localhost:88/api'

    // cdn地址 = 域名 + 版本号
    window.SITE_CONFIG['domain'] = './' // 域名
    window.SITE_CONFIG['version'] = ''   // 版本号(年月日时分)
    window.SITE_CONFIG['cdnUrl'] = window.SITE_CONFIG.domain + window.SITE_CONFIG.version
})()
