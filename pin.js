"use strict";

const utils = require("../../../utils");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const deepdash = require("deepdash");
const { JSONPath } = require("jsonpath-plus");

// nạp deepdash cho lodash (nếu cần dùng thêm sau)
deepdash(_);

// =============== Tìm nhanh lightspeed_web_request (không đệ quy) ===============
var LSFinder = (function () {
  function isObj(x) { return x && typeof x === "object"; }

  function findFirst(root) {
    if (!isObj(root)) return null;
    var stack = [root];
    while (stack.length) {
      var cur = stack.pop();
      if (!isObj(cur)) continue;

      // 1) match trực tiếp
      if (Object.prototype.hasOwnProperty.call(cur, "lightspeed_web_request"))
        return cur.lightspeed_web_request;

      // 2) fast-path cho viewer.*
      if (cur.viewer && cur.viewer.lightspeed_web_request)
        return cur.viewer.lightspeed_web_request;

      // 3) duyệt con
      for (var k in cur) if (Object.prototype.hasOwnProperty.call(cur, k)) {
        var v = cur[k];
        if (isObj(v)) stack.push(v);
      }
    }
    return null;
  }

  function getPayload(lswr) {
    if (!lswr) return null;
    var p = lswr.payload;
    if (typeof p === "string") {
      try { return JSON.parse(p); } catch (e) { /* giữ nguyên string nếu không phải JSON */ }
    }
    return p || null;
  }

  return { findFirst: findFirst, getPayload: getPayload };
})();

// =============== Utils file ===============
function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) { }
}

function safeWriteJSON(file, obj) {
  try {
    fs.writeFileSync(file, JSON.stringify(obj, null, 2), "utf8");
    return true;
  } catch (err) {
    utils?.error && utils.error(`pin.js: Failed to write ${file}`, err);
    return false;
  }
}

// =============== Trích xuất + tìm kiếm lệnh trong lightspeed ===============
/**
 * Extract, save, and search the full lightspeed_web_request object.
 * @param {Object} allJsonData - Raw JSON (toàn bộ response).
 * @param {Object} [opts]
 * @param {string} [opts.debugDir] - Thư mục để lưu debug (mặc định: ./debug_pin)
 * @returns {Object|null} the lightspeed_web_request object or null
 */
function extractAndSearchLightspeedRequest(allJsonData, opts) {
  var debugDir = (opts && opts.debugDir) || path.join(__dirname, "debug_pin");
  ensureDir(debugDir);

  // Thử path trực tiếp trước cho nhanh:
  var lightReq =
    _.get(allJsonData, "__bbox.result.data.viewer.lightspeed_web_request") ||
    LSFinder.findFirst(allJsonData);

  if (!lightReq) {
    utils?.warn && utils.warn("pin.js: lightspeed_web_request not found.");
    return null;
  }

  // Lưu full object & payload đã parse (nếu parse được)
  safeWriteJSON(path.join(debugDir, "lightspeed_web_request.json"), lightReq);

  var payloadObj = LSFinder.getPayload(lightReq);
  if (payloadObj) {
    safeWriteJSON(path.join(debugDir, "lightspeed_payload.json"), payloadObj);
  }

  // 🔍 JSONPath: tìm các lệnh quan tâm (tên bước)
  try {
    // Lấy cả path để dễ debug ngữ cảnh
    var matches = JSONPath({
      path: `$..[?(@ === "setPinnedMessage" || @ === "deleteThenInsertMessage")]`,
      json: lightReq,
      resultType: "all"
    });

    var count = matches ? matches.length : 0;
    utils?.log && utils.log(`pin.js: Found ${count} matching command name(s).`);
    // Lưu kết quả match (value + path) để đối chiếu
    safeWriteJSON(path.join(debugDir, "command_matches.json"), matches);
  } catch (err) {
    utils?.error && utils.error("pin.js: JSONPath search failed.", err);
  }

  return lightReq;
}

// =============== Module export ===============
module.exports = function (defaultFuncs, api, ctx) {
  /**
   * Pin helpers
   */
  function nextReqId() {
    ctx.wsReqNumber = (ctx.wsReqNumber || 0) + 1;
    return ctx.wsReqNumber;
  }
  function nextTaskId() {
    ctx.wsTaskNumber = (ctx.wsTaskNumber || 0) + 1;
    return ctx.wsTaskNumber;
  }

  function createMqttRequest(tasks, epochBase, increment) {
    var app_id = "2220391788200892";
    var version_id = "9523201934447612";
    var payload = {
      epoch_id: epochBase + (increment || 0),
      tasks: tasks,
      version_id: version_id
    };
    return {
      app_id: app_id,
      payload: JSON.stringify(payload),
      request_id: nextReqId(),
      type: 3
    };
  }

  function publishMqtt(content) {
    return new Promise(function (resolve, reject) {
      if (!ctx.mqttClient) return reject(new Error("MQTT not connected."));
      ctx.mqttClient.publish(
        "/ls_req",
        JSON.stringify(content),
        { qos: 1, retain: false },
        function (err) {
          if (err) reject(err);
          else resolve({ success: true, request_id: content.request_id });
        }
      );
    });
  }

  /**
   * Main command
   * @param {"list"|"pin"|"unpin"} action
   * @param {string|number} threadID
   * @param {string} [messageID] - required for pin/unpin
   * @param {Object} [options] - e.g. { debugDir: "..." }
   */
  return async function pin(action, threadID, messageID, options) {
    // Chuẩn hoá threadID thành string
    if (threadID != null) threadID = String(threadID);

    if (action === "list") {
      if (!threadID) throw new Error('Action "list" requires threadID.');

      try {
        var url = "https://www.facebook.com/messages/t/" + threadID + "/";
        var allJsonData = await utils.json(url, ctx.jar, null, ctx.globalOptions, ctx);

        // Tìm nhanh lightspeed_web_request
        var lswr = LSFinder.findFirst(allJsonData) ||
          _.get(allJsonData, "__bbox.result.data.viewer.lightspeed_web_request");

        // Lưu payload đã parse nếu có (phục vụ debug nhanh)
        var payloadObj = LSFinder.getPayload(lswr);
        if (payloadObj) {
          ensureDir(path.join(__dirname, "debug_pin"));
          safeWriteJSON(path.join(__dirname, "debug_pin", "a.payload.json"), payloadObj);
        }

        // Trích xuất + quét lệnh
        var lightReq = extractAndSearchLightspeedRequest(allJsonData, { debugDir: options && options.debugDir });

        return lightReq; // giữ API cũ: trả về toàn bộ lightspeed_web_request
      } catch (err) {
        utils?.error && utils.error(`pin.js: Failed to process "list" for thread ${threadID}`, err);
        throw err;
      }
    }

    // Các action còn lại cần MQTT + messageID
    if (!ctx.mqttClient) throw new Error("MQTT not connected.");
    if (!threadID || !messageID) throw new Error('Action requires "threadID" and "messageID".');

    // epoch / version / app
    var epoch_id = parseInt(utils.generateOfflineThreadingID(), 10);
    if (!Number.isFinite(epoch_id)) epoch_id = Date.now();

    if (action === "pin") {
      // Nhiệm vụ pin
      var pinTask = {
        label: "430",
        payload: JSON.stringify({
          thread_key: threadID,
          message_id: messageID,
          timestamp_ms: Date.now()
        }),
        queue_name: "pin_msg_v2_" + threadID,
        task_id: nextTaskId()
      };
      // Đồng bộ search index pin
      var setSearchTask = {
        label: "751",
        payload: JSON.stringify({
          thread_key: threadID,
          message_id: messageID,
          pinned_message_state: 1
        }),
        queue_name: "set_pinned_message_search",
        task_id: nextTaskId()
      };

      var req1 = createMqttRequest([pinTask], epoch_id, 0);
      var req2 = createMqttRequest([setSearchTask], epoch_id, 1);
      return Promise.all([publishMqtt(req1), publishMqtt(req2)]);
    }

    if (action === "unpin") {
      // Cập nhật search (clear)
      var setSearchTask1 = {
        label: "751",
        payload: JSON.stringify({
          thread_key: threadID,
          message_id: messageID,
          pinned_message_state: 0
        }),
        queue_name: "set_pinned_message_search",
        task_id: nextTaskId()
      };
      // Tháo pin
      var unpinTask = {
        label: "431",
        payload: JSON.stringify({
          thread_key: threadID,
          message_id: messageID,
          timestamp_ms: Date.now()
        }),
        queue_name: "unpin_msg_v2_" + threadID,
        task_id: nextTaskId()
      };
      // Đồng bộ search lần nữa (nếu backend yêu cầu)
      var setSearchTask2 = {
        label: "751",
        payload: JSON.stringify({
          thread_key: threadID,
          message_id: messageID,
          pinned_message_state: 0
        }),
        queue_name: "set_pinned_message_search",
        task_id: nextTaskId()
      };

      await publishMqtt(createMqttRequest([setSearchTask1], epoch_id, 0));
      await publishMqtt(createMqttRequest([unpinTask], epoch_id, 1));
      return publishMqtt(createMqttRequest([setSearchTask2], epoch_id, 2));
    }

    throw new Error('Invalid action. Use "pin", "unpin", or "list".');
  };
};
