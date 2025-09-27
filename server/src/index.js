"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var hono_1 = require("hono");
var node_server_1 = require("@hono/node-server");
var child_process_1 = require("child_process");
var cors_1 = require("hono/cors");
var app = new hono_1.Hono();
app.use((0, cors_1.cors)());
var scriptLines = [
    'tell application "Music"',
    "    set playerState to player state",
    "    set currentTrack to current track",
    "    set trackName to name of currentTrack",
    "    set artistName to artist of currentTrack",
    "    set albumName to album of currentTrack",
    "    set currentTime to player position",
    "    set totalTime to duration of currentTrack",
    '    return trackName & "\n" & artistName & "\n" & albumName & "\n" & currentTime & "\n" & totalTime & "\n" & playerState',
    "end tell",
];
var osascriptArgs = scriptLines.flatMap(function (line) { return ["-e", line]; });
function getSongInfo() {
    return new Promise(function (resolve) {
        (0, child_process_1.execFile)("osascript", osascriptArgs, function (error, stdout, stderr) {
            if (error || stderr) {
                resolve({ error: "Not playing" });
                return;
            }
            var output = stdout.trim();
            console.log(output);
            if (output === "No song playing") {
                resolve({ message: "No song playing" });
                return;
            }
            var _a = output.split("\n"), name = _a[0], artist = _a[1], album = _a[2], currentTime = _a[3], duration = _a[4], playerState = _a[5];
            resolve({
                name: name,
                artist: artist,
                album: album,
                currentTime: currentTime,
                duration: duration,
                playerState: playerState,
            });
        });
    });
}
app.get("/", function (c) { return c.text("Hello World"); });
app.get("/music", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var songInfo;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getSongInfo()];
            case 1:
                songInfo = _a.sent();
                if (songInfo.error) {
                    return [2 /*return*/, c.json(songInfo, 404)];
                }
                return [2 /*return*/, c.json(songInfo)];
        }
    });
}); });
app.post("/music", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var body, commands, playing, currentTime, scriptLines_1, osascriptArgs_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, c.req.json()];
            case 1:
                body = _a.sent();
                commands = [];
                // Handle new action-based format
                if (body.action) {
                    switch (body.action) {
                        case "play":
                            commands.push("play");
                            break;
                        case "pause":
                            commands.push("pause");
                            break;
                        case "seek":
                            if (body.time !== undefined) {
                                commands.push("set player position to ".concat(body.time));
                            }
                            break;
                    }
                }
                // Handle old format for backward compatibility
                else {
                    playing = body.playing, currentTime = body.currentTime;
                    if (playing === true) {
                        commands.push("play");
                    }
                    else if (playing === false) {
                        commands.push("pause");
                    }
                    if (currentTime !== undefined) {
                        commands.push("set player position to ".concat(currentTime));
                    }
                }
                if (commands.length > 0) {
                    scriptLines_1 = __spreadArray(__spreadArray([
                        'tell application "Music"'
                    ], commands.map(function (cmd) { return "    ".concat(cmd); }), true), [
                        "end tell",
                    ], false);
                    osascriptArgs_1 = scriptLines_1.flatMap(function (line) { return ["-e", line]; });
                    (0, child_process_1.execFile)("osascript", osascriptArgs_1, function (error, stdout, stderr) {
                        if (error || stderr) {
                            console.error("Error executing AppleScript: ".concat(error || stderr));
                        }
                        else {
                            console.log("Music app command executed: ".concat(commands.join(", ")));
                        }
                    });
                }
                return [2 /*return*/, c.json({ message: "Music app command received" })];
        }
    });
}); });
(0, node_server_1.serve)({
    fetch: app.fetch,
    port: 4000,
});
