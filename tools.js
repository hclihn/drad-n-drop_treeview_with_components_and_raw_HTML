/*eslint no-unused-vars: ["error", { "vars": "local" }] */
/*global set_style_mixin */
/*exported set_style_mixin */

var set_style_mixin = {
  mounted() {
    if (this.$options.styles) {
      console.log(`Added styles to Component ${this.$options.name}`);
      this.$el.insertAdjacentHTML(
        "afterbegin",
        `<style>${this.$options.styles}</style>`
      );
    }
  }
};

function addRmClass(element, c, isAdd) {
  if (isAdd) {
    element.className += ` ${c}`;
    return;
  }
  const re = new RegExp(String.raw`(^|\s+)${c}(\s+|$)`, "g");
  element.className = element.className.replace(re, "");
}

// RFC 4122 compliant UUID of type 4, variant 1: total "random" bits are 122.
// We are using Performance API to get timestamps guaranteed to increase with time up to at least 1ms resolution
// which is better than Date combined with Window Crypto API random number generation (better entropy compared to
// Math.random) to generate a unique ID within the browser document. The chance of collission is super low.
function uuid() {
  const pad = "0000000000000"; // 13 hex digits
  // The timestamp part (53 bits): ms since the start of epoch. This is roughly equivalent to Date.Now()
  const t = performance.timing.navigationStart + performance.now();
  // need to take the int part since Chrome has the fraction part, but Safari doesn't.
  let t_str = Math.floor(t).toString(16);
  let t_extra = false; // do we have an extra bit (53rd bit)?
  // Javascript number is a 64-bit floating-point number which has 53 bits of mantissa (13 hex digits + 1 bit)
  if (t_str.length > 13) {
    t_extra = true; // record the extra bit
    t_str = t_str.substr(t_str.length - 13, 13); // take the lower 13 hex digits
  } else if (t_str.length < 13) {
    t_str = pad.substr(0, 13 - t_str.length) + t_str; // prepend 0 to form a 13-digit hex string
  }
  // The random number part (69 bits): use 3x 32-bit random ints (a total of 24 hex digits). We only need 17 hex
  // digits + 1 bit.
  let array = new Uint32Array(3); // uint32 is as big as we can get.
  window.crypto.getRandomValues(array); // fill array with random numbers
  let r_str = "";
  for (var i = 0; i < array.length; i++) {
    let s = array[i].toString(16);
    r_str += pad.substr(0, 8 - s.length) + s; // prepend 0's to form an 8-digit hex string
  }
  // format the variant hex digit: t_extra sets bit 1; msb of r_str[17] sets the bit 0; variant is the top 2 bits
  // (0b0100).
  let v_str = r_str[17] < "8" ? (t_extra ? "a" : "8") : t_extra ? "b" : "9";
  // format the uuid. Add the t_extra bit in the variant digit
  return (
    `${t_str.substr(0, 8)}-${t_str.substr(8, 4)}-4${t_str.substr(12, 1)}` +
    `${r_str.substr(0, 2)}-${v_str}${r_str.substr(2, 3)}-${r_str.substr(5, 12)}`
  );
}
