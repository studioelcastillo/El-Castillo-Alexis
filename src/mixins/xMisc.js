import CryptoJS from "crypto-js";
import { xMiscAlert } from "src/mixins/xMiscAlert.js";
import { xMiscDate } from "src/mixins/xMiscDate.js";
import { xMiscEditor } from "src/mixins/xMiscEditor.js";
import { xMiscNotification } from "src/mixins/xMiscNotification.js";
import { xMiscCore } from "src/mixins/xMiscCore.js";
import { xMiscPermission } from "src/mixins/xMiscPermission.js";
import AuthService from "src/services/AuthService";

export const passEncrypt = () => {
  var secret = "Gk-P@ss";
  return secret;
};

export const encryptSession = (key, data) => {
  const hasJsonStructure = (str) => {
    if (typeof str !== "string" && typeof str !== "object") return false;
    try {
      var result = str;
      if (typeof str === "string") {
        result = JSON.parse(str);
      }
      return (
        Object.prototype.toString.call(result) === "[object Object]" ||
        Array.isArray(result)
      );
    } catch (err) {
      return false;
    }
  };
  var d = hasJsonStructure(data) ? JSON.stringify(data) : data;
  localStorage.setItem(key, CryptoJS.AES.encrypt(d, passEncrypt()).toString());
};

export const decryptSession = (key) => {
  var data = localStorage.getItem(key);
  if (data) {
    var bytes = CryptoJS.AES.decrypt(data, passEncrypt());
    if (hasJsonStructure(bytes.toString(CryptoJS.enc.Utf8))) {
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } else {
      return bytes.toString(CryptoJS.enc.Utf8);
    }
  } else {
    return data;
  }
};

const hasJsonStructure = (str) => {
  if (typeof str !== "string" && typeof str !== "object") return false;
  try {
    var result = str;
    if (typeof str === "string") {
      result = JSON.parse(str);
    }
    return (
      Object.prototype.toString.call(result) === "[object Object]" ||
      Array.isArray(result)
    );
  } catch (err) {
    return false;
  }
};

export const xMisc = {
  mixins: [
    xMiscAlert,
    xMiscDate,
    xMiscEditor,
    xMiscNotification,
    xMiscCore,
    xMiscPermission,
  ],
  data() {
    return {};
  },
  methods: {
    // navigation to another page (push history)
    goTo(location, target = "_self") {
      // _blank
      if (target == "_blank") {
        var url = this.getFrontUrl("/" + location);
        var win = window.open(url, "_blank");
        win.focus();

        // _self
      } else {
        this.$router.push("/" + location).catch((err) => {
          if (err._name === "NavigationDuplicated") {
            // console.log('it is in page')
          }
        });
      }
    },
    // get actual URL >> http://localhost:3032/users/edit/1
    getCurrentURL() {
      return window.location.href;
    },
    // ????????
    urlParse(string) {
      var s = string.trim();
      var url = s.replace(/\s+/g, "-").toLowerCase();
      return url;
    },
    // ????????
    vLength(c, string) {
      var response = true;
      if (string.length < c.min) {
        response = false;
        this.alert("danger", "Debes incluir mas de 3 caracteres");
      }
      if (string.length > c.max) {
        response = false;
        this.alert("danger", "No puedes superar mas de 15 caracteres");
      }
      return response;
    },
    // Validate Session (used on login)
    async vSession() {
      location.href = "/dashboard";
      // if (this.decryptSession('user').profile_id === 2) {
      //   location.href = 'requisitions'
      // } else {
      //   location.href = 'admin/home'
      // }
    },
    getUrlSrc(src) {
      // Si ya es una URL completa (Supabase storage o HTTP), retornarla directamente
      if (src && (src.startsWith("http://") || src.startsWith("https://"))) {
        return src;
      }
      // Fallback: intentar construir con API_URL si existe, sino retornar src tal cual
      return process.env.API_URL ? process.env.API_URL + src : src;
    },
    // get frontend url route
    getFrontUrl(route) {
      // window.location.href.replace: http://gk-threshold:3032/users/new >> http://gk-threshold:3032
      // route.replace: /images/users/223 >> images/users/223
      return (
        window.location.href.replace(/:\/\/(.*?)\/.*/, "://$1") +
        "/" +
        route.replace(/^\//, "")
      );
    },
    // get API url route
    getApiUrl(route) {
      // process.env.API_URL.replace: http://gk-threshold-api.bygeckode.com/ >> http://gk-threshold-api.bygeckode.com
      // route.replace: /images/users/223 >> images/users/223
      return (
        process.env.API_URL.replace(/\/$/, "") + "/" + route.replace(/^\//, "")
      );
    },
    // password to encrypt/decrypt session
    passEncrypt() {
      return passEncrypt();
    },
    // encrypt session (use secure local storage)
    encryptSession(key, data) {
      encryptSession(key, data);
    },
    // decrypt session (use secure local storage)
    decryptSession(key) {
      return decryptSession(key);
    },
    // encrypt string
    encrypt(secret) {
      return CryptoJS.AES.encrypt(secret, passEncrypt()).toString();
    },
    // decrypt string
    decrypt(encrypted) {
      encrypted = encrypted.replace(/ /gi, "+");
      var bytes = CryptoJS.AES.decrypt(encrypted, passEncrypt());
      if (hasJsonStructure(bytes.toString(CryptoJS.enc.Utf8))) {
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      } else {
        return bytes.toString(CryptoJS.enc.Utf8);
      }
    },
    // ??????
    hasJsonStructure(str) {
      return hasJsonStructure(str);
    },
    // validar largo minimo de una cadena
    validateMinLength(val, minlength) {
      if (val == "" || !val) {
        return true;
      }
      return val.length >= minlength;
    },
    // validar largo maximo de una cadena
    validateMaxLength(val, maxlength) {
      if (val == "" || !val) {
        return true;
      }
      return val.length <= maxlength;
    },
    // validar solo letras (texto sin numeros)
    validateOnlyLetters(val) {
      if (val == "" || !val) {
        return true;
      }
      var regex = /./;
      // minusculas, mayusculas, acentos, ñ, Ñ, espacio
      regex = /^([a-zA-ZÀ-ÿ\u00f1\u00d1 ])+$/;
      return !!regex.test(val);
    },
    // validar solo numeros (texto sin numeros)
    validateOnlyNumbers(val) {
      if (val == "" || !val) {
        return true;
      }
      var regex = /./;
      // minusculas, mayusculas, acentos, ñ, Ñ, espacio
      regex = /^([0.9])+$/;
      return !!regex.test(val);
    },
    // validar formato de correo en una string
    validarEmail(email) {
      if (email == "" || !email) {
        return true;
      }
      var regex = /./;
      // enable multi-account, example: admin@geckode.la, admin+1@geckode.la, admin+2@geckode.la
      if (process.env.EMAIL_MULTIACCOUNT === "true") {
        regex = /^([a-zA-Z0-9\+_.-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
      } else {
        regex = /^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
      }
      return !!regex.test(email);
    },
    // validar formato de fecha en una string
    validateDateFormat(val) {
      if (val == "" || !val) {
        return true;
      }
      const regex =
        /([1-2][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]|[1-2][0-9][0-9][0-9]\/[0-1][0-9]\/[0-3][0-9])/;
      return !!regex.test(val);
    },
    // remove thousands delimiter/separator
    removeMiles(string = "") {
      const res = string.replace(/,/g, "");
      return res;
    },
    // trim string to (n) characters
    littleText(desc, limite) {
      if (desc.length > limite) {
        return desc.substring(0, limite) + "...";
      }
      return desc;
    },
    // ???????
    noNegative(evt) {
      if (
        evt.key === "-" ||
        evt.key === "+" ||
        evt.key === "." ||
        evt.key === "," ||
        evt.key.toUpperCase() === "E"
      ) {
        evt.preventDefault();
      }
    },
    // transform HEX format to RGB format
    hexToRGB(hex, alpha) {
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);

      if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
      } else {
        return "rgb(" + r + ", " + g + ", " + b + ")";
      }
    },
    // n if its a number
    isNumber(n) {
      return !isNaN(parseFloat(n)) && !isNaN(n - 0);
    },
    // format a number to string format, example milesByInput(123456.25) >> return 123,456.25
    milesByInput(input) {
      if (input !== undefined) {
        var num = input.replace(/,/g, "");
        if (!this.isNumber(num)) {
          num = "";
        } else {
          if (!isNaN(num)) {
            num = num
              .toString()
              .split("")
              .reverse()
              .join("")
              .replace(/(?=\d*,?)(\d{3})/g, "$1,");
            num = num.split("").reverse().join("").replace(/^[,]/, "");
          }
        }
        return num;
      }
    },
    // ??n comvierte campo a formato numero example milesByInput(123456.25) >> return 123,456.25 ???
    miles(input) {
      if (input == null) {
        return "";
      }

      var num = input;
      if (!isNaN(num)) {
        // Example with decimals
        // 491850000
        // ,491,850,000
        // 000,058,194,

        // Example without decimals
        // 35663335.40
        // 04.533,366,53
        // 35,663,335.40

        num = num.toString().replace(/(\...).*/g, "$1");
        num = num
          .toString()
          .split("")
          .reverse()
          .join("")
          .replace(/(?=\d*,?)(\d{3})/g, "$1,");
        num = num.split("").reverse().join("").replace(/^[,]/, "");
        // if dont have dacimals
        if (!/\./gi.exec(num)) {
          // num = num + '.00'
        }
        if (/\.[0-9]$/gi.exec(num)) {
          num = num + "0";
        }
        num = num.toString().replace(/-,/g, "-");
        return num;
      }
    },
    // short name to only 2 characters
    // shortName('Brayan Giron Morales') >> BG
    // shortName('Brayan') >> BR
    // shortName('Brayan', 'Giron Morales') >> BR
    shortName(name, surname = "") {
      var shortName = "";
      name = name + " " + surname;
      name.trim();
      var names = name.split(" ");
      // Recorre los nombres para sacar 2 caracteres
      for (var i = 0; i < names.length; i++) {
        // Si es mayor a 3 (para evitar "de", "el", "los", "del")
        if (names[i].length > 3) {
          shortName += names[i].substring(0, 1);
          if (shortName.length >= 2) {
            break;
          }
        }
      }
      // Si el nombre no ha completado los 2 caracteres >> los construye con el primer nombre
      if (shortName.length < 2) {
        shortName = name.substring(0, 2);
      }
      return shortName.toUpperCase();
    },
    // close session
    async logOut() {
      this.$q
        .dialog({
          title: "Cerrar sesion",
          message: "¿Estás seguro de cerrar sesion?",
          ok: "Si",
          cancel: "No",
          persistent: true,
        })
        .onOk(async (data) => {
          this.activateLoading("Cargando");
          await AuthService.logout({ token: this.decryptSession("token") });
          this.goTo("logout");
          this.disableLoading();
        })
        .onCancel(() => {
          // console.log('>>>> Cancel')
        });
    },
    getRandomColor() {
      const randomColor = Math.floor(Math.random() * 16777215).toString(16);
      return "#" + randomColor;
    },
    // get contrast color based on another color
    // https://24ways.org/2010/calculating-color-contrast
    getContrastYIQ(hexcolor) {
      hexcolor = hexcolor.replace("#", "");
      var r = parseInt(hexcolor.substr(0, 2), 16);
      var g = parseInt(hexcolor.substr(2, 2), 16);
      var b = parseInt(hexcolor.substr(4, 2), 16);
      var yiq = (r * 299 + g * 587 + b * 114) / 1000;
      return yiq >= 128 ? "black" : "white";
    },
    getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min) + min);
    },
    pascalCase(string) {
      string = string.replace(/_/gi, " ", string);
      string = string.replace(/(\w)(\w*)/gi, function (g0, g1, g2) {
        return g1.toUpperCase() + g2.toLowerCase();
      });
      string = string.replace(/ /gi, "", string);
      return string;
    },
    pascalCaseSingular(string) {
      string = string.replace(/(ies_)/gi, "y_", string);
      string = string.replace(/(ies$)/gi, "y", string);
      string = string.replace(/(ies)([0-9])/gi, "y$2", string);
      string = string.replace(/(s_)/gi, "_", string);
      string = string.replace(/(s$)/gi, "", string);
      string = string.replace(/(s)([0-9])/gi, "$2", string);
      string = string.replace(/_/gi, " ", string);
      string = string.replace(/(\w)(\w*)/gi, function (g0, g1, g2) {
        return g1.toUpperCase() + g2.toLowerCase();
      });
      string = string.replace(/ /gi, "", string);
      return string;
    },
    cammelCase(string) {
      string = string.replace(/_/gi, " ", string);
      string = string.replace(/(\w)(\w*)/gi, function (g0, g1, g2) {
        return g1.toUpperCase() + g2.toLowerCase();
      });
      string = string.replace(/ /gi, "", string);
      string = string.replace(/(^.)/, (a) => a.toLowerCase());
      return string;
    },
    cammelCaseSingular(string) {
      string = string.replace(/(ies_)/gi, "y_", string);
      string = string.replace(/(ies$)/gi, "y", string);
      string = string.replace(/(ies)([0-9])/gi, "y$2", string);
      string = string.replace(/(s_)/gi, "_", string);
      string = string.replace(/(s$)/gi, "", string);
      string = string.replace(/(s)([0-9])/gi, "$2", string);
      string = string.replace(/_/gi, " ", string);
      string = string.replace(/(\w)(\w*)/gi, function (g0, g1, g2) {
        return g1.toUpperCase() + g2.toLowerCase();
      });
      string = string.replace(/ /gi, "", string);
      string = string.replace(/(^.)/, (a) => a.toLowerCase());
      return string;
    },
    snakeCase(string) {
      return string;
    },
    snakeCaseSingular(string) {
      string = string.replace(/(ies_)/gi, "y_", string);
      string = string.replace(/(ies$)/gi, "y", string);
      string = string.replace(/(ies)([0-9])/gi, "y$2", string);
      string = string.replace(/(s_)/gi, "_", string);
      string = string.replace(/(s$)/gi, "", string);
      string = string.replace(/(s)([0-9])/gi, "$2", string);
      return string;
    },
    // get relation name based on table and foreign field
    // this is util when a table has more than 1 fields relationated from a same table.
    // for example, having table users:
    // user_id_client >> <$table>_client >> users_client
    // user_id_provider >> <$table>_provider >> users_provider
    // user_id_employee >> <$table>_employee >> users_employee
    getRelName(table, idField) {
      if (idField == "created_by") {
        return idField;
      } else {
        idField = idField.replace(/.*_id/, "");
        return table + idField;
      }
    },
    copyToClipboard(input, msg = null) {
      if (!msg) {
        msg = "Texto copiado";
      }
      const element = this.$refs[input];
      element.select();
      document.execCommand("copy");
      element.blur();
      this.alert("info", msg);
    },
  },
};
