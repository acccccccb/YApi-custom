## YApi-custom  可视化接口管理平台（多级菜单版）

新特性：
- 开发和生产的配置文件分离

- 支持多级菜单，可拖拽及排序

- 支持postman8.0+的数据导入（postman Collection V2.1）


![预览](https://www.ihtmlcss.com/wp-content/uploads/2020/12/20201204105605.png)

基与YApi修改，YApi项目地址：

[https://github.com/YMFE/yapi](https://github.com/YMFE/yapi)
#### 开始：
> 进入YApi目录
```bash
npm i
```
#### 初始化数据库(开发)
```base
npm run install-server
```
#### 开发：
```bash
npm run dev
```
#### 初始化数据库(生产)
```base
npm run install-server
```
#### 部署：
```bash
npm run build-client
npm run start
```
#### 注意：

> 配置文件config.json位置被移动到了根目录下

> 开发：config_dev.json 生产：config.json

#### 远程开发时无法热更新需要修改：

> YApi/node_modules/ykit/lib/commands/server.js 替换279行的 http://127.0.0.1为实际部署主机的ip

> 需要修改 ./static/dev.html中的ip地址为实际部署主机的ip

#### 报错:
- Error: listen EACCES: permission denied 0.0.0.0:80

> 以root身份运行或将端口号改为1000以上

#### 更新日志：

1.9.5

- 支持postman8.0+的数据导入（postman Collection V2.1）

1.9.4

- 系统信息面板 新增开放注册状态、高级mock状态

- 超管可在用户管理处添加用户，不受开放注册状态限制

1.9.3

- Bug fix: 高级Mock提权（严重）

