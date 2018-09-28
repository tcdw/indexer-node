#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const http = require('http');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const util = require('util');

const ejsRenderFile = util.promisify(ejs.renderFile);
const templateFile = path.resolve(__dirname, 'template/index.ejs');

if (argv.h || argv.help) {
    console.log('usage: indexer [-h host] [-p port_number] [-t website_title] [directory]');
}
const host = typeof argv.h === 'string' ? argv.h : '127.0.0.1';
const port = typeof argv.p === 'number' ? argv.p : 8888;
const siteTitle = typeof argv.t === 'string' ? argv.t : '文件服务器';
const dir = typeof argv[0] !== 'undefined' ? path.resolve(process.cwd(), argv[0]) : process.cwd();

http.createServer(async (request, response) => {
    const userPath = request.url.slice(1);
    const computedPath = path.resolve(dir, userPath);
    try {
        if (!fs.lstatSync(computedPath).isDirectory()) {
            response.writeHead(400, { 'Content-Type': 'text/plain' });
            response.end('This is a file!');
            return false;
        }
    } catch (e) {
        console.error(e.toString());
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.end('Not found!');
        return false;
    }
    const list = fs.readdirSync(computedPath);
    const fileList = [];
    for (let i = 0; i < list.length; i += 1) {
        try {
            const tempInfo = fs.statSync(path.join(dir, userPath, list[i]));
            fileList[i] = {
                name: list[i],
                size: tempInfo.size,
                url: `${path.join(request.url, list[i])}${tempInfo.isDirectory() ? '/' : ''}`,
            };
        } catch (e) {
            console.error(e.toString());
        }
    }
    const pathInfo = request.url.split('/');
    pathInfo.shift();
    if (pathInfo[pathInfo.length - 1] === '') {
        pathInfo.pop();
    }
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(await ejsRenderFile(templateFile, {
        siteTitle,
        breadCrumb: [],
        fileList,
    }, {}).catch(() => {
        response.end('Internal server error');
    }));
    return true;
}).listen(port);

console.log(`Server running at http://${host}:${port}/`);
