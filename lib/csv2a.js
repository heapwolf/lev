
var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/
var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g

module.exports = function csv2a(text) {

  if (!re_valid.test(text)) return null
  var a = []

  text.replace(re_value, function(m0, m1, m2, m3) {

      if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"))
      else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'))
      else if (m3 !== undefined) a.push(m3)
      return ''
    })

  if (/,\s*$/.test(text)) a.push('')
  return a
}
