var request = require('request');
var Sitemapper = require('sitemapper');
var cheerio = require('cheerio');
var crypto = require('crypto');
const { finished } = require('stream');
const path = require("path");

// 配置信息
const username = "lizhecao" //github账号，对应Gitalk配置中的owner
const repo_name = "lizhecao.github.io" //用于存储Issue的仓库名，对应Gitalk配置中的repo
const token = "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"   //前面申请的personal access token
const sitemap_url = "https://lizhecao.github.io/sitemap.xml"  // 自己站点的sitemap地址

var base_url = "https://api.github.com/repos/"+ username + "/" + repo_name + "/issues"

var sitemap = new Sitemapper();

sitemap.fetch(sitemap_url)
    .then(function (sites) {
        sites.sites.forEach(function (site, index) {
            if (site.endsWith('404.html')) {
                console.log('跳过404')
                return
            }
            request({
                url: site,
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8'
                }
            }, function (err, resp, bd) {
                if (err || resp.statusCode != 200)
                    return
                const $ = cheerio.load(bd);
                var title = $('title').text();
                var desc = site + "\n\n" + $("meta[name='description']").attr("content");
                var path = site.split(".com")[1]
                // var md5 = crypto.createHash('md5');
                // var label = md5.update(path).digest('hex')
                
                // ============ Customize your own label ============
                var idx = title.indexOf(".")
                var label;
                if (idx == -1) {
                    label = '/';
                } else {
                    label = '/leetcode/' + title.substring(0, idx) + '/';
                }
                
                var options = {
                    headers: {
                        'Authorization': 'token '+token,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
                        'Accept': 'application/json'
                    },
                    url: base_url+ "?labels="+"Gitalk," + label,
                    method: 'GET'
                }
                // 检查issue是否被初始化过
                request(options, function (error, response, body) {
                    if (error || response.statusCode != 200) {
                        console.log('检查['+site+']对应评论异常')
                        return
                    }
                    var jbody = JSON.parse(body)
                    if(jbody.length>0)
                        return
                    //创建issue
                    var request_body = {"title": title, "labels": ["Gitalk", label], "body": desc}
                    //console.log("创建内容： "+JSON.stringify(request_body));
                    var create_options = {
                        headers: {
                        'Authorization': 'token '+token,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
                        'Accept': 'application/json',
                        'Content-Type': 'application/json;charset=UTF-8'
                        },
                        url: base_url,
                        body: JSON.stringify(request_body),
                        method: 'POST'
                    }
                    request(create_options, function(error, response, body){
                        if (!error && response.statusCode == 201) 
                            console.log("地址: ["+site+"] Gitalk初始化成功")
                    })
                });
            });
        });
    })
    .catch(function (err) {
        console.log(err);
    });
