import { message } from 'antd';
import URL from 'url';
import _ from 'underscore';
const GenerateSchema = require('generate-schema/src/schemas/json.js');
import { json_parse } from '../../common/utils.js';
import uuid from 'uuid';

function postman(importDataModule) {
  var folders = [];

  function parseUrl(url) {
    return URL.parse(url);
  }

  function checkInterRepeat(interData) {
    let obj = {};
    let arr = [];
    for (let item in interData) {
      // console.log(interData, interData[item].url + "-" + interData[item].method);
      if (!obj[interData[item].url + '-' + interData[item].method + '-' + interData[item].method]) {
        arr.push(interData[item]);
        obj[
          interData[item].url + '-' + interData[item].method + '-' + interData[item].method
        ] = true;
      }
    }
    return arr;
  }
  // for postman v2
  function checkInterRepeatV2(interData) {
    let obj = {};
    let arr = [];
    for (let item in interData) {
      // console.log(interData[item].path + "-" + interData[item].method);
      if (!obj[interData[item].path + '-' + interData[item].method + '-' + interData[item].method]) {
        arr.push(interData[item]);
        obj[
        interData[item].path + '-' + interData[item].method + '-' + interData[item].method
          ] = true;
      }
    }
    return arr;
  }
  function handleReq_query(query) {
    let res = [];
    if (query && query.length) {
      for (let item in query) {
        res.push({
          name: query[item].key,
          desc: query[item].description,
          // example: query[item].value,
          value: query[item].value,
          required: query[item].enabled ? '1' : '0'
        });
      }
    }
    return res;
  }
  function handleReq_headers(headers) {
    let res = [];
    if (headers && headers.length) {
      for (let item in headers) {
        res.push({
          name: headers[item].key,
          desc: headers[item].description,
          value: headers[item].value,
          required: headers[item].enabled ? '1' : '0'
        });
      }
    }
    return res;
  }

  function handleReq_body_form(body_form) {
    let res = [];
    if (body_form && body_form.length) {
      for (let item in body_form) {
        res.push({
          name: body_form[item].key,
          // example: body_form[item].value,
          value: body_form[item].value,
          type: body_form[item].type,
          required: body_form[item].enabled ? '1' : '0',
          desc: body_form[item].description
        });
      }
    }
    return res;
  }

  function handlePath(path) {
    path = parseUrl(path).pathname;
    path = decodeURIComponent(path);
    if (!path) return '';

    path = path.replace(/\{\{.*\}\}/g, '');

    if (path[0] != '/') {
      path = '/' + path;
    }
    return path;
  }

  function run(res) {
    try {
      res = JSON.parse(res);
      let interData = res.requests;
      let interfaceData = { apis: [], cats: [] };
      interData = checkInterRepeat.bind(this)(interData);

      if (res.folders && Array.isArray(res.folders)) {
        res.folders.forEach(tag => {
          interfaceData.cats.push({
            id: tag.id,
            name: tag.name,
            desc: tag.description,
            pid: tag.folder
          });
        });
      }

      if (_.find(res.folders, item => item.collectionId === res.id)) {
        folders = res.folders;
      }
      if (interData && interData.length) {
        for (let item in interData) {
          let data = importPostman.bind(this)(interData[item]);
          data.pid = interData[item].folder;
          interfaceData.apis.push(data);
        }
      }
      return interfaceData;
    } catch (e) {
      message.error('文件格式必须为JSON');
    }
  }

  function importPostman(data, key) {
    let reflect = {
      //数据字段映射关系
      title: 'name',
      path: 'url',
      method: 'method',
      desc: 'description',
      pid: 'folder',
      req_query: 'queryParams',
      req_headers: 'headerData',
      req_params: '',
      req_body_type: 'dataMode',
      req_body_form: 'data',
      req_body_other: 'rawModeData',
      res_body: 'text',
      res_body_type: 'language'
    };
    let allKey = [
      'title',
      'path',
      'catname',
      'method',
      'desc',
      'req_query',
      'req_headers',
      'req_body_type',
      'req_body_form',
      'req_body_other',
      'res'
    ];
    key = key || allKey;
    let res = {};
    // console.log('data', data);
    try {
      for (let item in key) {
        item = key[item];
        if (item === 'req_query') {
          res[item] = handleReq_query.bind(this)(data[reflect[item]]);
        } else if (item === 'req_headers') {
          res[item] = handleReq_headers.bind(this)(data[reflect[item]]);
        } else if (item === 'req_body_form') {
          res[item] = handleReq_body_form.bind(this)(data[reflect[item]]);
        } else if (item === 'req_body_type') {
          if (data[reflect[item]] === 'urlencoded' || data[reflect[item]] === 'params') {
            res[item] = 'form';
          } else {
            if (_.isString(data.headers) && data.headers.indexOf('application/json') > -1) {
              res[item] = 'json';
            } else {
              res[item] = 'raw';
            }
          }
        } else if (item === 'req_body_other') {
          if (_.isString(data.headers) && data.headers.indexOf('application/json') > -1) {
            res.req_body_is_json_schema = true;
            res[item] = transformJsonToSchema(data[reflect[item]]);
          } else {
            res[item] = data[reflect[item]];
          }
        } else if (item === 'path') {
          res[item] = handlePath.bind(this)(data[reflect[item]]);
          if (res[item] && res[item].indexOf('/:') > -1) {
            let params = res[item].substr(res[item].indexOf('/:') + 2).split('/:');
            // res[item] = res[item].substr(0,res[item].indexOf("/:"));
            let arr = [];
            for (let i in params) {
              arr.push({
                name: params[i],
                desc: ''
              });
            }
            res['req_params'] = arr;
          }
        } else if (item === 'title') {
          let path = handlePath.bind(this)(data[reflect['path']]);
          if (data[reflect[item]].indexOf(path) > -1) {
            res[item] = path;
            if (res[item] && res[item].indexOf('/:') > -1) {
              res[item] = res[item].substr(0, res[item].indexOf('/:'));
            }
          } else {
            res[item] = data[reflect[item]];
          }
        } else if (item === 'catname') {
          let found = folders.filter(item => {
            return item.id === data.folder;
          });
          res[item] = found && Array.isArray(found) && found.length > 0 ? found[0].name : null;
        } else if (item === 'res') {
          let response = handleResponses(data['responses']);
          if (response) {
            (res['res_body'] = response['res_body']),
              (res['res_body_type'] = response['res_body_type']);
          }
        } else {
          res[item] = data[reflect[item]];
        }
      }
    } catch (err) {
      console.log(err.message);
      message.error(`${err.message}, 导入的postman格式有误`);
    }
    return res;
  }

  // Postman Collection v2.1 版本支持
  function runV2(res) {
    try {
      let obj = JSON.parse(res);
      let interfaceData = { apis: [], cats: [] };
      const apis = [];
      // console.log('obj', obj);
      const loop = (list, pid) => {
        list.forEach(item => {
          // console.log(item);
          item.id = uuid();
          item.pid = pid || '';
          if(!item.request) {
            interfaceData.cats.push({
              id: item.id,
              name: item.name,
              desc: item.description || '',
              pid: pid || ''
            });
          } else {
            const api = {
              id: item.id,
              title: item.name,
              desc: item.description || '',
              pid: pid || '',
              method: item.request.method,
              path: '/',
              req_headers: item.request.header || [],
              req_body_form: []
            };
            // 兼容2.0
            if(typeof item.request.url === 'string') {
              api.path = item.request.url.replace(/{{[a-z]+}}/gi, '');
            }
            // 2.1
            if(typeof item.request.url === 'object') {
              api.path = '/' + item.request.url.path.join('/');
            }

            if(item.request.url.query && Array.isArray(item.request.url.query)) {
              api.req_query = item.request.url.query.map(mapItem => {
                return {
                  key: mapItem.key,
                  name: mapItem.key,
                  value: mapItem.value,
                  enabled: mapItem.required == 1 || mapItem.required == true,
                  description: mapItem.description || ''
                }
              })
            }

            if(item.request.body && item.request.body.mode) {
              if( item.request.body.mode === 'formdata' || item.request.body.mode === 'urlencoded') {
                api.req_body_type = 'form';
              } else {
                api.req_body_type = item.request.body.mode;
              }
            }

            if(item.request.body && item.request.body[item.request.body.mode] && Array.isArray(item.request.body[item.request.body.mode])) {
              api.req_body_form = item.request.body[item.request.body.mode].map(mapItem => {
                return {
                  key: mapItem.key,
                  // name: mapItem.key,
                  value: mapItem.value,
                  type: mapItem.type,
                  enabled: mapItem.required == 1 || mapItem.required == true,
                  description: mapItem.description || ''
                }
              });
            }
            // interfaceData.apis.push(api);
            apis.push(api);
            // console.log(api);
          }
          if(item.item && Array.isArray(item.item)) {
            loop(item.item, item.id);
          }
        });
      };
      loop(obj.item);
      let interData = apis;
      interData = checkInterRepeatV2.bind(this)(interData);
      // console.log('interData', interData);
      if (interData && interData.length) {
        for (let item in interData) {
          let data = importPostmanV2.bind(this)(interData[item]);
          data.pid = interData[item].pid;
          interfaceData.apis.push(data);
        }
      }
      // console.log('interfaceData', interfaceData);
      return interfaceData;
    } catch (e) {
      message.error(e.toString());
    }
  }
  function importPostmanV2(data, key) {
    let reflect = {
      //数据字段映射关系
      title: 'title',
      path: 'path',
      method: 'method',
      desc: 'description',
      pid: 'pid',
      req_query: 'req_query',
      req_headers: 'req_headers',
      req_params: '',
      req_body_type: 'req_body_type',
      req_body_form: 'req_body_form',
      req_body_other: 'rawModeData',
      res_body: 'text',
      res_body_type: 'language'
    };
    let allKey = [
      'title',
      'path',
      'catname',
      'method',
      'desc',
      'req_query',
      'req_headers',
      'req_body_type',
      'req_body_form',
      'req_body_other',
      'res'
    ];
    key = key || allKey;
    let res = {};
    // console.log('dataV2', data);
    try {
      for (let item in key) {
        item = key[item];
        if (item === 'req_query') {
          res[item] = handleReq_query.bind(this)(data[reflect[item]]);
        } else if (item === 'req_headers') {
          res[item] = handleReq_headers.bind(this)(data[reflect[item]]);
        } else if (item === 'req_body_form') {
          res[item] = handleReq_body_form.bind(this)(data[reflect[item]]);
        } else if (item === 'req_body_other') {
          if (_.isString(data.headers) && data.headers.indexOf('application/json') > -1) {
            res.req_body_is_json_schema = true;
            res[item] = transformJsonToSchema(data[reflect[item]]);
          } else {
            res[item] = data[reflect[item]];
          }
        } else if (item === 'path') {
          res[item] = handlePath.bind(this)(data[reflect[item]]);
          if (res[item] && res[item].indexOf('/:') > -1) {
            let params = res[item].substr(res[item].indexOf('/:') + 2).split('/:');
            // res[item] = res[item].substr(0,res[item].indexOf("/:"));
            let arr = [];
            for (let i in params) {
              arr.push({
                name: params[i],
                desc: ''
              });
            }
            res['req_params'] = arr;
          }
        } else if (item === 'title') {
          let path = handlePath.bind(this)(data[reflect['path']]);
          if (data[reflect[item]].indexOf(path) > -1) {
            res[item] = path;
            if (res[item] && res[item].indexOf('/:') > -1) {
              res[item] = res[item].substr(0, res[item].indexOf('/:'));
            }
          } else {
            res[item] = data[reflect[item]];
          }
        } else if (item === 'catname') {
          let found = folders.filter(item => {
            return item.id === data.folder;
          });
          res[item] = found && Array.isArray(found) && found.length > 0 ? found[0].name : null;
        } else if (item === 'res') {
          let response = handleResponses(data['responses']);
          if (response) {
            (res['res_body'] = response['res_body']),
              (res['res_body_type'] = response['res_body_type']);
          }
        } else {
          res[item] = data[reflect[item]];
        }
      }
    } catch (err) {
      console.log(err.message);
      message.error(`${err.message}, 导入的postman格式有误`);
    }
    return res;
  }

  const handleResponses = data => {
    if (data && data.length) {
      let res = data[0];
      let response = {};
      response['res_body_type'] = res.language === 'json' ? 'json' : 'raw';
      // response['res_body'] = res.language === 'json' ? transformJsonToSchema(res.text): res.text;
      if (res.language === 'json') {
        response['res_body_is_json_schema'] = true;
        response['res_body'] = transformJsonToSchema(res.text);
      } else {
        response['res_body'] = res.text;
      }
      return response;
    }

    return null;
  };

  const transformJsonToSchema = json => {
    json = json || {};
    let jsonData = json_parse(json);

    jsonData = GenerateSchema(jsonData);

    let schemaData = JSON.stringify(jsonData);
    return schemaData;
  };

  if (!importDataModule || typeof importDataModule !== 'object') {
    console.error('obj参数必需是一个对象');
    return null;
  }

  importDataModule.postman = {
    name: 'Postman Collection V1',
    run: run,
    desc: '注意：只支持Collection V1的json格式数据'
  };
  importDataModule.postmanv2 = {
    name: 'Postman Collection V2.1',
    run: runV2,
    desc: '注意：只支持Collection V2.1的json格式数据'
  };
}

module.exports = function() {
  this.bindHook('import_data', postman);
};
