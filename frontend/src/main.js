const API = "http://localhost:3000";
const LS_TOKEN_KEY = "prezenta_token";

const $ = (id) => document.getElementById(id);

function setToast(type, text) {
  const el = $("toast");
  el.className = `toast ${type}`;
  el.textContent = text;
  el.style.display = "block";
}

function clearToast() {
  const el = $("toast");
  el.style.display = "none";
  el.textContent = "";
}

function setResult(obj) {
  $("result").textContent = JSON.stringify(obj, null, 2);
}

function getToken() {
  return localStorage.getItem(LS_TOKEN_KEY) || "";
}

function setToken(token) {
  localStorage.setItem(LS_TOKEN_KEY, token);
  render();
}

function clearToken() {
  localStorage.removeItem(LS_TOKEN_KEY);
  render();
}

// fetch wrapper（⑤ エラー統一）
async function apiFetch(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body != null) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (!token) throw new Error("未ログインです");
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json() : { message: await res.text() };

  if (!res.ok) {
    // backendが {error} でも {message} でも拾えるように
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ② 画面分岐
function render() {
  clearToast();
  const token = getToken();
  const loggedIn = !!token;

  $("loginView").style.display = loggedIn ? "none" : "block";
  $("appView").style.display = loggedIn ? "block" : "none";
  $("status").textContent = loggedIn ? "ログイン中" : "未ログイン";
  $("logoutBtn").disabled = !loggedIn;

  if (loggedIn) {
    // ④ 今日の勤怠を自動表示
    refreshToday().catch((e) => {
      setToast("err", e.message);
    });
  } else {
    setResult({ info: "ログインすると今日の勤怠を表示します" });
  }
}

// ① ログイン（token保存）
async function login() {
  clearToast();
  try {
    const email = $("email").value.trim();
    const password = $("password").value;

    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });

    if (!data.token) throw new Error("tokenが返ってきません（ログインAPIの実装を確認して）");

    setToken(data.token);
    setResult(data);
    setToast("ok", "ログイン成功");
  } catch (e) {
    setResult({ error: e.message, detail: e.data || null });
    setToast("err", e.message);
  }
}

async function logout() {
  clearToken();
  setToast("ok", "ログアウトしました");
}

// 出勤
async function start() {
  clearToast();
  try {
    // あなたの実装が date 必須なので送る（後でサーバ側で自動生成にしてもOK）
    const today = new Date().toISOString().split("T")[0];

    const data = await apiFetch("/attendances/start", {
      method: "POST",
      body: { date: today },
      auth: true,
    });

    setResult(data);
    setToast("ok", "出勤しました");
    await refreshToday();
  } catch (e) {
    setResult({ error: e.message, detail: e.data || null });
    setToast("err", e.message);
  }
}

// ③ 退勤
async function end() {
  clearToast();
  try {
    const today = new Date().toISOString().split("T")[0];

    const data = await apiFetch("/attendances/end", {
      method: "POST",
      body: { date: today },
      auth: true,
    });

    setResult(data);
    setToast("ok", "退勤しました");
    await refreshToday();
  } catch (e) {
    setResult({ error: e.message, detail: e.data || null });
    setToast("err", e.message);
  }
}

// ④ 今日の勤怠表示
async function refreshToday() {
  const data = await apiFetch("/attendances/today", { method: "GET", auth: true });
  $("today").textContent = JSON.stringify(data, null, 2);
}

// expose
window.login = login;
window.logout = logout;
window.start = start;
window.end = end;
window.refreshToday = refreshToday;

// init
render();