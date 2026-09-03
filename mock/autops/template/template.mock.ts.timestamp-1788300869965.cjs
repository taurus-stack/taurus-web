"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// mock/autops/template/template.mock.ts
var template_mock_exports = {};
__export(template_mock_exports, {
  default: () => template_mock_default
});
module.exports = __toCommonJS(template_mock_exports);
var import_vite_plugin_mock_dev_server = require("vite-plugin-mock-dev-server/helper");

// mock/autops/template/data/data.ts
var import_faker = require("@faker-js/faker");
var import_mockjs2 = __toESM(require("mockjs"));

// mock/utils/tools.ts
var import_mockjs = require("mockjs");
function createPageData(current = 1, size = 10, factory) {
  return {
    code: 2e3,
    data: function() {
      const list = [];
      for (let i = 0; i < size; i++) {
        list.push(factory());
      }
      return list;
    }(),
    currentPage: current,
    pageSize: size,
    total: function() {
      return import_mockjs.Random.natural(size, size * 3 + import_mockjs.Random.natural(1, 10));
    }(),
    msg: "\u83B7\u53D6\u6210\u529F"
  };
}
function SuccessResponse(data, ...args) {
  return {
    code: 2e3,
    data,
    msg: "\u83B7\u53D6\u6210\u529F",
    ...args
  };
}

// mock/autops/template/data/data.ts
var var1 = JSON.stringify([
  { "key": "jwj", "value": 18 },
  { "key": "liliu", "value": 20 },
  { "key": "lill", "value": 23 }
]);
var var2 = JSON.stringify([{ "key": "name", "value": "jwj" }, { "key": "age", "value": 18 }]);
function createRandomTemplate() {
  return import_mockjs2.default.mock({
    id: "@increment(1)",
    share: import_faker.faker.datatype.boolean(),
    template_id: "@increment(1)",
    template_name: import_faker.faker.person.jobTitle(),
    script_type: import_faker.faker.helpers.arrayElement(["sh", "python"]),
    script_content: import_faker.faker.word.words(),
    run_as: import_faker.faker.person.firstName(),
    envs: var1,
    args: var2,
    editor_theme: import_faker.faker.helpers.arrayElement(["github_dark", "github_light_default"]),
    timeout: import_faker.faker.number.int({ min: 1, max: 3600 }),
    status: import_faker.faker.number.int({ min: 0, max: 1 }),
    create_datetime: import_faker.faker.date.past(),
    update_datetime: import_faker.faker.date.past(),
    create_by: import_faker.faker.number.int(),
    update_by: import_faker.faker.number.int()
  });
}
var GetList = function(current = 1, size = 10) {
  return createPageData(current, size, createRandomTemplate);
};
var GetObj = function(id) {
  return createRandomTemplate();
};
var GetMyScriptInfo = function(id) {
  return SuccessResponse({
    shell: import_faker.faker.number.int({ min: 1, max: 100 }),
    python: import_faker.faker.number.int({ min: 1, max: 100 })
  });
};

// mock/autops/template/template.mock.ts
var url_prefix = "/api/taurus/template/";
var template_mock_default = (0, import_vite_plugin_mock_dev_server.defineMock)([
  {
    url: url_prefix,
    method: "GET",
    body: ({ query, params, body, headers }) => {
      const res = GetList();
      return res;
    }
  },
  {
    url: url_prefix + ":id/",
    method: "GET",
    body: ({ query, params, body, headers }) => {
      const res = GetObj(params.id);
      return { data: res, code: 2e3, msg: "success" };
    }
  },
  {
    url: url_prefix,
    method: "POST",
    body: ({ query, params, body, headers }) => {
      console.debug("\u{1F680} ~ file:host.mock.ts method:body line:18 -----", query, params, body, headers);
      return { data: body, code: 2e3, msg: "success" };
    }
  },
  {
    url: url_prefix + ":id/",
    method: "PUT",
    body: ({ query, params, body, headers }) => {
      console.debug("\u{1F680} ~ file:host.mock.ts method:body line:26 -----", params, body, headers);
      return { data: body, code: 2e3, msg: "success" };
    }
  },
  {
    url: url_prefix + ":id/",
    method: "DELETE",
    body: ({ query, params, body, headers }) => {
      console.debug("\u{1F680} ~ file:host.mock.ts method:body line:34 -----", params, body, headers);
      return { data: body, code: 2e3, msg: "success" };
    }
  },
  {
    url: url_prefix + "/:id/",
    method: "PATCH",
    body: ({ query, params, body, headers }) => {
      console.debug("\u{1F680} ~ file:host.mock.ts method:body line:42 -----", params, body, headers);
      return { data: body, code: 2e3, msg: "success" };
    }
  },
  {
    url: url_prefix + "/my_script_info/",
    method: "GET",
    body: ({ query, params, body, headers }) => {
      return GetMyScriptInfo(query);
    }
  }
]);
