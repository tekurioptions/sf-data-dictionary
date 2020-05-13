import axios from "axios";
import {saveAs}  from "file-saver";
import fs from "fs";
import moment from "moment";
// import config from '../../../../config';

// axios.defaults.baseURL = config.baseUrl + config.port;
var loc = window.location;
axios.defaults.baseURL = loc.protocol + "//" + loc.host + "/" + loc.pathname.split('/')[1];

export function httpGet(route, opts) {
  return axios.get(route, opts).then(
    result => {
      return result.data;
    },
    err => {
      return Promise.reject(err);
    }
  );
}

export function httpPut(route, opts) {
  return axios.put(route, opts).then(
    result => {
      return result.data;
    },
    err => {
      return Promise.reject(err);
    }
  );
}

export function httpDelete(route, opts) {
  return axios.delete(route, { data: opts }).then(
    result => {
      return result.data;
    },
    err => {
      return Promise.reject(err);
    }
  );
}

export function createNewConnection(url) {
  return axios.get("api/oauth-init", {params: {loginUrl: url}}).then(
    result => {
      window.location.replace(result.data);
    },
    err => {
      return Promise.reject(err);
    }
  );
}

export function updateConnection(props) {
  return axios.put("api/Connections/update", props).then(
    result => {
      return result.data;
    },
    err => {
      return Promise.reject(err);
    }
  );
}

export function getOrgObjects(id) {
  return axios.get("api/getOrgObjects", { params: { id: id } }).then(
    result => {
      return result.data;
    },
    err => {
      return Promise.reject(err);
    }
  );
}

export function generateFieldMap(id) {
  return axios.post("api/Fields/GenerateMap", {id: id}).then(
    result => {
      return result.data;
    },
    err => {
      return Promise.reject(err);
    }
  );
}

export function generateExcel(orgId, orgName) {
  return axios({
    method: "post",
    url: "/api/BuildExcel",
    data: {orgId: orgId},
    responseType: "arraybuffer"
  }).then(
    result => {
      let blob = new Blob([new Uint8Array(result.data)]);
      saveAs(blob, orgName + " Data Dictionary on " + moment().format("ll") + ".xlsx");
    },
    err => {
      return Promise.reject(err);
    }
  );
}
