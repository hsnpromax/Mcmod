// Test icin sahte @minecraft/server-ui: formlar "senaryo" dizisinden yanit alir.
export const script = { steps: [], trace: [], strict: true };

function fold(s) {
  return String(s ?? "")
    .replace(/İ/g, "I").replace(/ı/g, "i").replace(/[şŞ]/g, "s").replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c").toLowerCase()
    .replace(/§./g, "");
}

export const FormCancelationReason = { UserBusy: "UserBusy", UserClosed: "UserClosed" };

export class ActionFormData {
  constructor() { this._title = ""; this._body = ""; this._buttons = []; }
  title(t) { this._title = t; return this; }
  body(b) { this._body = b; return this; }
  button(text, icon) { this._buttons.push({ text, icon }); return this; }
  async show() {
    const step = script.steps.shift();
    script.trace.push({ type: "action", title: this._title, body: this._body,
      buttons: this._buttons.map((b) => b.text.split("\n")[0]), step });
    if (step === undefined || step === null || step?.cancel) return { canceled: true, cancelationReason: "UserClosed" };
    if (Array.isArray(step)) throw new Error(`ActionForm "${this._title}" icin dizi yanit verildi`);
    const want = fold(step);
    const idx = this._buttons.findIndex((b) => fold(b.text).includes(want));
    if (idx < 0) {
      throw new Error(`Buton bulunamadi: "${step}" | form: ${this._title} | butonlar: ${this._buttons.map((b) => b.text.split("\n")[0]).join(" | ")}`);
    }
    return { canceled: false, selection: idx };
  }
}

export class ModalFormData {
  constructor() { this._title = ""; this._controls = []; }
  title(t) { this._title = t; return this; }
  header(t) { this._controls.push({ type: "header", t }); return this; }
  divider() { this._controls.push({ type: "divider" }); return this; }
  label(t) { this._controls.push({ type: "label", t }); return this; }
  dropdown(label, items, opts) {
    if (typeof opts === "number") throw new Error("server-ui 2.x dropdown icin nesne bekler");
    this._controls.push({ type: "dropdown", label, items, opts });
    return this;
  }
  slider(label, min, max, opts) {
    if (typeof opts === "number") throw new Error("server-ui 2.x slider icin nesne bekler");
    this._controls.push({ type: "slider", label, min, max, opts });
    return this;
  }
  textField(label, ph, opts) {
    if (typeof opts === "string") throw new Error("server-ui 2.x textField icin nesne bekler");
    this._controls.push({ type: "textField", label, ph, opts });
    return this;
  }
  toggle(label, opts) {
    if (typeof opts === "boolean") throw new Error("server-ui 2.x toggle icin nesne bekler");
    this._controls.push({ type: "toggle", label, opts });
    return this;
  }
  submitButton(t) { this._submit = t; return this; }
  async show() {
    const step = script.steps.shift();
    script.trace.push({ type: "modal", title: this._title,
      controls: this._controls.map((c) => `${c.type}:${(c.label ?? "").split("\n")[0]}`), step });
    if (step === undefined || step === null || step?.cancel) return { canceled: true, cancelationReason: "UserClosed" };
    if (!Array.isArray(step)) throw new Error(`ModalForm "${this._title}" icin dizi yanit gerekli, gelen: ${JSON.stringify(step)}`);
    const inputs = this._controls.filter((c) => !["header", "divider", "label"].includes(c.type));
    if (step.length !== inputs.length) {
      throw new Error(`ModalForm "${this._title}" ${inputs.length} deger bekliyor, ${step.length} verildi (${inputs.map((c) => c.type).join(",")})`);
    }
    return { canceled: false, formValues: step };
  }
}

export class MessageFormData {
  constructor() { this._buttons = []; }
  title(t) { this._title = t; return this; }
  body(b) { this._body = b; return this; }
  button1(t) { this._buttons.push(t); return this; }
  button2(t) { this._buttons.push(t); return this; }
  async show() {
    const step = script.steps.shift();
    return step?.cancel ? { canceled: true } : { canceled: false, selection: step ?? 0 };
  }
}

/* --- Eski surum (server-ui 1.x) taklidi: konumsal parametreler, header/divider yok --- */
if (process.env.UI_V1) {
  delete ModalFormData.prototype.header;
  delete ModalFormData.prototype.divider;
  delete ModalFormData.prototype.label;
  ModalFormData.prototype.dropdown = function (label, items, defIndex) {
    if (typeof defIndex === "object" && defIndex !== null) throw new Error("v1 dropdown sayi bekler");
    this._controls.push({ type: "dropdown", label, items, opts: defIndex });
    return this;
  };
  ModalFormData.prototype.slider = function (label, min, max, step, def) {
    if (typeof step === "object" && step !== null) throw new Error("v1 slider konumsal step bekler");
    this._controls.push({ type: "slider", label, min, max, step, def });
    return this;
  };
  ModalFormData.prototype.textField = function (label, ph, def) {
    if (typeof def === "object" && def !== null) throw new Error("v1 textField metin bekler");
    this._controls.push({ type: "textField", label, ph, def });
    return this;
  };
  ModalFormData.prototype.toggle = function (label, def) {
    if (typeof def === "object" && def !== null) throw new Error("v1 toggle boolean bekler");
    this._controls.push({ type: "toggle", label, def });
    return this;
  };
}

/* --- Karisik durum: surum tespiti yanilirsa (header yok ama imzalar 2.x) --- */
if (process.env.UI_MIXED) {
  delete ModalFormData.prototype.header;
  delete ModalFormData.prototype.divider;
  delete ModalFormData.prototype.label;
}
